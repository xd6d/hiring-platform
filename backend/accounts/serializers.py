from rest_framework import serializers

from tags.serializers import TagSerializer
from .models import User, Company, Role, UserTag


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("name", )


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


class UserSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField(source="role.name", read_only=True)
    company = CompanySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone_number", "contacts",
                  "role", "company", "tags")