from rest_framework import serializers

from tags.serializers import TagSerializer
from .models import Vacancy, Application


class VacancySerializer(serializers.ModelSerializer):  # todo: bulk_create tags and cities
    tags = TagSerializer(many=True)

    class Meta:
        model = Vacancy
        fields = '__all__'
        extra_kwargs = {"created_by": {"write_only": True}}


class ApplicationSerializer(serializers.ModelSerializer):  # todo: bulk_create answers
    class Meta:
        model = Application
        fields = '__all__'
        extra_kwargs = {"created_by": {"write_only": True}}
