from django.db import models


class WorkFormat(models.TextChoices):
    OFFICE = "OFFICE"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"