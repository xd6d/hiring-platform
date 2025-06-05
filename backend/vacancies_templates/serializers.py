from django.db import transaction
from rest_framework import serializers

from files.models import File
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
        exclude = ("application_template", "custom_requirements")


class QuestionTemplateSerializer(QuestionSerializer):
    answers = AnswerSerializer(many=True, required=False)

    class Meta(QuestionSerializer.Meta):
        exclude = ("application_template",)


class ApplicationTemplateSerializer(serializers.ModelSerializer):
    questions = QuestionTemplateSerializer(many=True)

    class Meta:
        model = ApplicationTemplate
        fields = ("id", "name", "created_at", "questions", "is_global")
        read_only_fields = ("created_at",)

    def validate(self, attrs):
        attrs["created_by"] = self.context["request"].user
        return attrs

    def create(self, validated_data):
        questions = validated_data.pop("questions")
        with transaction.atomic():
            instance = super().create(validated_data)
            for question in questions:
                answer_serializer = AnswerSerializer(data=question.pop("answers", []), many=True)
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

    class Meta:
        model = Answer
        fields = ("question", "value")

    def validate(self, attrs):
        question = attrs["question"]
        answer = attrs["value"]
        if question.type.name in ["SHORT_TEXT", "LONG_TEXT"]:
            if not isinstance(answer, str):
                raise serializers.ValidationError("This text field must be a string.")
            if len(answer) > question.max_length:
                raise serializers.ValidationError(
                    f"This text field cannot be longer than {question.max_length} characters.")
        if question.type.name == "FILE":
            if not isinstance(answer, list) or len(answer) == 0:
                raise serializers.ValidationError("Specify files.")
            if question.max_length and len(answer) > question.max_length:
                raise serializers.ValidationError(f"This field cannot be more than {question.max_length}.")
            if types := question.custom_requirements.get("types"):
                file_types = File.objects.filter(id__in=answer).select_related("type").values_list("type__name",
                                                                                                   flat=True)
                if set(types) != set(file_types):
                    raise serializers.ValidationError("Enter correct files.")
        if question.type.name == "SINGLE_ANSWER":
            if not isinstance(answer, int):
                raise serializers.ValidationError("This answer field must be an int.")
            elif answer not in question.answers.values_list("id", flat=True):
                raise serializers.ValidationError("This answer field must be related to question.")
        return attrs

    def create(self, validated_data):
        if validated_data["question"].type.name in ["SHORT_TEXT", "LONG_TEXT", "FILE"]:
            validated_data["application_created"] = True
            return super().create(validated_data)
        if validated_data["question"].type.name == "SINGLE_ANSWER":
            return self.Meta.model.objects.get(pk=validated_data["value"])

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["question"] = QuestionShortSerializer(instance.question).data
        return representation
