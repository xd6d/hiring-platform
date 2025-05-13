from django.db import models
from django.utils import timezone

from api.managers import SoftDeleteManager, SoftDeleteQuerySet


class AbstractSoftDeleteModel(models.Model):
    deleted = models.DateTimeField(null=True)
    deleted_by = None  # Overwrite as foreign key in child classes

    objects = SoftDeleteManager.from_queryset(SoftDeleteQuerySet)()
    all_objects = models.Manager.from_queryset(SoftDeleteQuerySet)()

    class Meta:
        abstract = True

    def soft_delete(self, deleted_by_id: int):
        self.deleted = timezone.now()
        self.deleted_by_id = deleted_by_id
        self.save(update_fields=['deleted', 'deleted_by_id'])

    def restore(self):
        self.deleted = None
        self.deleted_by_id = None
        self.save(update_fields=['deleted', 'deleted_by_id'])
