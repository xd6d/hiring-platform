# Generated by Django 5.0.7 on 2025-06-04 10:26

import files.utils
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0002_remove_file_path_file_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='deleted_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='file',
            name='extension',
            field=models.CharField(default='', max_length=100),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='file',
            name='file',
            field=models.FileField(upload_to=files.utils.upload_file_path),
        ),
    ]
