from rest_framework import serializers

from vacancies_templates.models import QuestionType, ApplicationTemplate, Question, Answer


class QuestionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionType
        fields = ("name", )


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = "__all__"


class QuestionSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field="name", queryset=QuestionType.objects.all())
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Question
        fields = "__all__"

class ApplicationTemplateSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = ApplicationTemplate
        fields = ("name", "created_at", "questions")
        read_only_fields = ("created_at", )
