from django.db import transaction
from django.db.models import Prefetch
from rest_framework import serializers

from api.utils import get_language_code
from dict.models import CityTranslation
from dict.serializers import CitySerializer
from tags.serializers import TagSerializer
from vacancies_templates.serializers import AnswerQuestionSerializer
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
            instance.tags.order_by("vacancytag__position"), many=True  # todo: prefetch is better: see users-tags
        ).data

        language_code = get_language_code()
        representation["cities"] = [city["name"] for city in CitySerializer(
            instance.cities.prefetch_related(
                Prefetch("translations", CityTranslation.objects.filter(language_code=language_code)),
            ).order_by("-population"),
            many=True
        ).data]
        representation["is_applied"] = (
                self.context["request"].user.is_authenticated
                and self.context["request"].user.applications.filter(vacancy_id=instance.id).exists()
        )
        return representation


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatus
        fields = ("name",)


class ApplicationNoteSerializer(serializers.ModelSerializer):  # todo: validate user from request
    class Meta:
        model = ApplicationNote
        fields = ("text", "application")
        extra_kwargs = {"application": {"read_only": True}}

    def validate(self, attrs):
        if attrs.get("application").vacancy.created_by != self.context["request"].user:
            raise serializers.ValidationError()
        return attrs


class ApplicationCandidateSerializer(serializers.ModelSerializer):
    answers = AnswerQuestionSerializer(many=True)

    class Meta:
        model = Application
        fields = ("vacancy", "answers")
        extra_kwargs = {"created_by": {"read_only": True}}

    def validate_answers(self, answers):
        for answer in answers:
            answer["question"] = answer["question"].id
        return answers

    def validate(self, attrs):
        if self.context["request"].user.applications.filter(vacancy=attrs["vacancy"]).exists():
            raise serializers.ValidationError("You already applied!")
        return attrs

    def create(self, validated_data):
        answers = validated_data.pop("answers")
        required_question_ids = list(validated_data.get("vacancy").application_template.questions.filter(
            is_required=True
        ).values_list("id", flat=True))
        for answer in answers:
            if answer["question"] in required_question_ids:
                required_question_ids.remove(answer["question"])
        if required_question_ids:
            raise serializers.ValidationError("Answer required questions.")

        validated_data["status"] = ApplicationStatus.objects.get(pk=1)

        with transaction.atomic():
            instance = super().create(validated_data)
            answer_serializer = AnswerQuestionSerializer(data=answers, many=True)
            answer_serializer.is_valid(raise_exception=True)
            created_answers = answer_serializer.save()
            instance.answers.set(created_answers)

        return instance

class ApplicationRecruiterSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(queryset=ApplicationStatus.objects.all(), slug_field="name")
    notes = serializers.StringRelatedField(read_only=True, many=True)

    class Meta:
        model = Application
        fields = ("vacancy", "status", "notes", "answers", "created_at", "created_by")


class VacancyShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacancy
        fields = ("id", "name", "created_at")


class ApplicationSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(queryset=ApplicationStatus.objects.all(), slug_field="name")
    vacancy = VacancyShortSerializer(read_only=True)
    answers = AnswerQuestionSerializer(many=True)

    class Meta:
        model = Application
        fields = ("id", "vacancy", "answers", "status", "created_at")


class UserVacancySerializer(VacancySerializer):
    class Meta(VacancySerializer.Meta):
        fields = ("id", "name", "description", "work_format", "tags", "cities")
