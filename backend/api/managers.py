from django.db.models import query, Manager
from django.utils import timezone


class SoftDeleteQuerySet(query.QuerySet):
    def soft_delete(self, deleted_by_id: int):
        self.update(deleted=timezone.now(), deleted_by_id=deleted_by_id)

    def restore(self):
        self.update(deleted=None, deleted_by_id=None)


class SoftDeleteManager(Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted__isnull=True)
