from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from files.serializers import FileSerializer
from files.utils import generate_presigned_url
from tags.serializers import TagSerializer
from .models import User, Company, Role, UserTag


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("name",)


class UserPostSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(slug_field="name", queryset=Role.objects.filter(hidden=False))

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "phone_number", "role")
        extra_kwargs = {
            'password': {'write_only': True},
            'phone_number': {'required': False},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name", "website", "contacts", "created_at")


class UserTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTag
        fields = ("user", "tag", "position")
        extra_kwargs = {'user': {'read_only': True}}

    def create(self, validated_data):
        model = self.Meta.model
        tag = validated_data.get("tag")
        if model.objects.filter(user=validated_data.get("user"), tag=tag).exists():
            raise serializers.ValidationError("Already exists.")

        position = validated_data.get("position")
        if model.objects.filter(position=position, tag=tag).exists():
            with transaction.atomic():
                model.objects.filter(position__gte=position, tag=tag).update(position=F('position') + 1)
                instance = super().create(validated_data)
        else:
            instance = super().create(validated_data)

        return instance


class UserTagPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTag
        fields = ("position",)

    def update(self, instance, validated_data):
        model = self.Meta.model
        new_position = validated_data.get('position', instance.position)
        old_position = instance.position
        user = validated_data.get("user", instance.user)

        if old_position != new_position and model.objects.filter(position=new_position, user=user).exists():
            with transaction.atomic():
                if new_position > old_position:
                    model.objects.filter(
                        position__gt=old_position, position__lte=new_position, user=user
                    ).update(position=F('position') - 1)
                else:
                    model.objects.filter(
                        position__gte=new_position, position__lt=old_position, user=user
                    ).update(position=F('position') + 1)
                super().update(instance, validated_data)
        else:
            super().update(instance, validated_data)

        return instance


class UserSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField(source="role.name", read_only=True)
    company = CompanySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    photo = serializers.SerializerMethodField()
    files = FileSerializer(many=True, read_only=True, include_url=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone_number", "contacts",
                  "role", "company", "photo", "tags", "files")

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if self.partial:
            representation.pop("files")
        return representation

    def get_photo(self, obj):
        return generate_presigned_url(obj.photo.file.name) if obj.photo else None


class UserShortSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = ("first_name", "last_name", "phone_number", "contacts", "photo")
