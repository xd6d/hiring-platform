from django.db import models

from accounts.models import User
from api.models import AbstractSoftDeleteModel
from dict.models import City
from tags.models import Tag
from vacancies_templates.models import ApplicationTemplate, Answer
from .enums import WorkFormat


class Vacancy(AbstractSoftDeleteModel):
    name = models.CharField(max_length=100)
    description = models.TextField()
    work_format = models.CharField(max_length=6, choices=WorkFormat.choices)
    tags = models.ManyToManyField(Tag, related_name='vacancies', through="VacancyTag")
    application_template = models.ForeignKey(ApplicationTemplate, on_delete=models.PROTECT, related_name='vacancies')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    cities = models.ManyToManyField(City, related_name="vacancies")

    class Meta:
        db_table = 'vacancies'


class VacancyTag(models.Model):
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name='vacancy_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'vacancies_tags'
        ordering = ['position']
        unique_together = (('vacancy', 'tag'),)


class ApplicationStatus(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'application_statuses'


class Application(models.Model):
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name="applications")
    status = models.ForeignKey(ApplicationStatus, on_delete=models.PROTECT)
    answers = models.ManyToManyField(Answer, through="ApplicationAnswer")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")

    class Meta:
        db_table = 'vacancies_applications'


class ApplicationNote(models.Model):
    text = models.TextField()
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="application_notes")

    class Meta:
        db_table = 'application_notes'


class ApplicationAnswer(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='application_answers')
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE)

    class Meta:
        db_table = 'applications_answers'
        ordering = ["id"]
