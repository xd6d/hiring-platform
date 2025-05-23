from django.db import transaction
from rest_framework import serializers

from tags.serializers import TagSerializer
from .models import Vacancy, Application, ApplicationStatus, ApplicationNote, VacancyTag


class VacancyTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacancyTag
        fields = ("vacancy", "tag", "position")
        extra_kwargs = {'vacancy': {'read_only': True}}


class VacancySerializer(serializers.ModelSerializer):
    tags = VacancyTagSerializer(many=True, write_only=True)

    class Meta:
        model = Vacancy
        fields = ("id", "name", "description", "work_format", "tags", "application_template", "cities")
        extra_kwargs = {'cities': {'write_only': True}}

    def create(self, validated_data):
        tags = validated_data.pop('tags')
        cities = validated_data.pop('cities')

        with transaction.atomic():
            instance = super().create(validated_data)
            VacancyTag.objects.bulk_create([VacancyTag(**data, vacancy=instance) for data in tags])
            instance.cities.set(cities)

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["tags"] = TagSerializer(
            instance.tags.order_by("vacancytag__position"), many=True
        ).data
        representation["cities"] = instance.cities.values_list("name", flat=True)
        return representation


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatus
        fields = ("name", )


class ApplicationNoteSerializer(serializers.ModelSerializer):  # todo: validate user from request
    class Meta:
        model = ApplicationNote
        fields = ("text", "application")
        extra_kwargs = {"application": {"write_only": True}}

    def validate(self, attrs):
        if attrs.get("application").vacancy.created_by != self.context["request"].user:
            raise serializers.ValidationError()
        return attrs


class ApplicationSerializer(serializers.ModelSerializer):  # todo: bulk_create answers
    status = serializers.SlugRelatedField(queryset=ApplicationStatus.objects.all(), slug_field="name")
    notes = serializers.StringRelatedField(read_only=True, many=True)

    class Meta:
        model = Application
        fields = '__all__'
        extra_kwargs = {"created_by": {"write_only": True}}
