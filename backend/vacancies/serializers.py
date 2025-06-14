from django.db import transaction
from rest_framework import serializers

from accounts.serializers import UserShortSerializer, UserNameSerializer
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
    is_applied = serializers.SerializerMethodField()

    class Meta:
        model = Vacancy
        fields = ("id", "name", "description", "work_format", "tags", "application_template", "cities", "is_applied")
        extra_kwargs = {'cities': {'write_only': True, "allow_empty": True, "required": False}}

    def create(self, validated_data):
        tags = validated_data.pop('tags')
        cities = validated_data.pop('cities')

        with transaction.atomic():
            instance = super().create(validated_data)
            VacancyTag.objects.bulk_create([VacancyTag(**data, vacancy=instance) for data in tags])
            instance.cities.set(cities)

        return instance

    def get_is_applied(self, instance):
        return (self.context["request"].user.is_authenticated and
                self.context["request"].user.applications.filter(vacancy_id=instance.id).exists())

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["tags"] = TagSerializer(instance.tags.all(), many=True).data
        representation["cities"] = [city["name"] for city in CitySerializer(
            instance.cities.all(),
            many=True
        ).data]
        return representation


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatus
        fields = ("name",)


class ApplicationNoteSerializer(serializers.ModelSerializer):
    created_by = UserNameSerializer(read_only=True)

    class Meta:
        model = ApplicationNote
        fields = ("id", "text", "application", "created_at", "created_by")
        extra_kwargs = {"application": {"write_only": True}}

    def validate(self, attrs):
        application = attrs.get("application") if attrs.get("application") else self.instance.application
        if application.vacancy.created_by != self.context["request"].user:
            raise serializers.ValidationError("You can not add a note to this application.")
        return attrs

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request', None)
        if request and request.method != 'POST':
            self.fields.pop('application', None)


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
    notes = ApplicationNoteSerializer(many=True)
    answers = AnswerQuestionSerializer(many=True)
    created_by = UserShortSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ("id", "status", "notes", "answers", "created_at", "created_by")


class ApplicationUpdateSerializer(serializers.ModelSerializer):
    status = serializers.SlugRelatedField(slug_field="name", queryset=ApplicationStatus.objects.all())
    class Meta:
        model = Application
        fields = ("status", )


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
    applied = serializers.IntegerField(read_only=True)

    class Meta(VacancySerializer.Meta):
        fields = ("id", "name", "description", "work_format", "tags", "cities", "applied")


class VacancyDeletedSerializer(UserVacancySerializer):
    class Meta(UserVacancySerializer.Meta):
        fields = UserVacancySerializer.Meta.fields + ("deleted_at", )


class VacancyRestoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacancy
        fields = []

    def update(self, instance, validated_data):
        return instance.restore()
