from django.db import transaction
from rest_framework import serializers

from vacancies_templates.models import QuestionType, ApplicationTemplate, Question, Answer


class QuestionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionType
        fields = ("name",)


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        exclude = ("question",)


class QuestionSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="name", queryset=QuestionType.objects.all())
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Question
        exclude = ("application_template",)


class ApplicationTemplateSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = ApplicationTemplate
        fields = ("id", "name", "created_at", "questions")
        read_only_fields = ("created_at",)

    def validate(self, attrs):
        attrs["created_by"] = self.context["request"].user
        return attrs

    def create(self, validated_data):
        questions = validated_data.pop("questions")
        with transaction.atomic():
            instance = super().create(validated_data)
            for question in questions:
                answer_serializer = AnswerSerializer(data=question.pop("answers"), many=True)
                created_question = Question.objects.create(**question, application_template=instance)
                answer_serializer.is_valid(raise_exception=True)
                answer_serializer.save(question=created_question)

        return instance
