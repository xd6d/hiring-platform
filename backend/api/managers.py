from django.db.models import query, Manager
from django.utils import timezone


class SoftDeleteQuerySet(query.QuerySet):
    def soft_delete(self):
        self.update(deleted_at=timezone.now())

    def restore(self):
        self.update(deleted_at=None)


class SoftDeleteManager(Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)
