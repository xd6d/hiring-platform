# Generated by Django 5.0.7 on 2025-06-04 10:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_usertag_options'),
        ('files', '0003_file_deleted_at_file_extension_alter_file_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='photo',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_photo', to='files.file'),
        ),
    ]
