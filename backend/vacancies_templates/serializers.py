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
        fields = ("id", "value", "application_created")


class QuestionSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="name", queryset=QuestionType.objects.all())
    answers = AnswerSerializer(many=True, source="initial_answers")

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


class QuestionShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "name")


class AnswerQuestionSerializer(serializers.ModelSerializer):
    value = serializers.JSONField()
    question = QuestionShortSerializer()

    class Meta:
        model = Answer
        fields = ("question", "value")

    def validate(self, attrs):  # todo: validate against max_length
        if (attrs["question"].type.name in ["SHORT_TEXT", "LONG_TEXT"]
                and not isinstance(attrs["value"], str)):
            raise serializers.ValidationError("This text field must be a string.")
        if attrs["question"].type.name == "SINGLE_ANSWER":
            if not isinstance(attrs["value"], int):
                raise serializers.ValidationError("This answer field must be an int.")
            elif attrs["value"] not in attrs["question"].answers.values_list("id", flat=True):
                raise serializers.ValidationError("This answer field must be related to question.")
        return attrs

    def create(self, validated_data):
        if validated_data["question"].type.name in ["SHORT_TEXT", "LONG_TEXT"]:
            validated_data["application_created"] = True
            return super().create(validated_data)
        if validated_data["question"].type.name == "SINGLE_ANSWER":
            return self.Meta.model.objects.get(pk=validated_data["value"])
