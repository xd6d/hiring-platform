from django.db import models

from accounts.models import User


class FileType(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'file_types'


class File(models.Model):
    file = models.FileField(upload_to="files/")
    user_filename = models.CharField(max_length=255)
    type = models.ForeignKey(FileType, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='files')

    class Meta:
        db_table = 'files'
