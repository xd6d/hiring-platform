from django.db import models

from accounts.models import User
from api.models import AbstractSoftDeleteModel


class ApplicationTemplate(AbstractSoftDeleteModel):
    name = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'application_templates'


class QuestionType(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'question_types'


class Question(models.Model):
    name = models.CharField(max_length=100)
    type = models.ForeignKey(QuestionType, on_delete=models.PROTECT)
    application_template = models.ForeignKey(ApplicationTemplate, on_delete=models.CASCADE, related_name='questions')
    max_length = models.PositiveIntegerField(null=True)
    is_required = models.BooleanField(default=True)

    class Meta:
        db_table = 'templates_questions'


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    value = models.TextField(null=True)  # or JSONField ?

    class Meta:
        db_table = 'templates_answers'
