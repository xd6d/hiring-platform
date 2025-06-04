from django.db import models
from django.utils import timezone

from api.managers import SoftDeleteManager, SoftDeleteQuerySet


class AbstractSoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True)

    objects = SoftDeleteManager.from_queryset(SoftDeleteQuerySet)()
    all_objects = models.Manager.from_queryset(SoftDeleteQuerySet)()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])
