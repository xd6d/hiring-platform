from django.db import models

from accounts.models import User
from vacancies.models import Vacancy


class ComplaintCause(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    class Meta:
        db_table = "complaints_causes"


class Complaint(models.Model):
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, null=True)
    employer = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    description = models.TextField()
    causes = models.ManyToManyField(ComplaintCause, related_name="complaints", db_table="complaints_complaints_causes")

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='created_complaints')

    class Meta:
        db_table = 'complaints'
