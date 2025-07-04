# Generated by Django 5.0.7 on 2025-05-23 08:10

import django.db.models.deletion
from django.core.management import call_command
from django.db import migrations, models


def load_statuses_fixture(apps, schema_editor):
    call_command("loaddata", "application_statuses.json", verbosity=1)


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0002_vacancy_cities'),
    ]

    operations = [
        migrations.CreateModel(
            name='ApplicationStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'application_statuses',
            },
        ),
        migrations.AlterModelOptions(
            name='vacancytag',
            options={'ordering': ['position']},
        ),
        migrations.CreateModel(
            name='ApplicationNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='vacancies.application')),
            ],
            options={
                'db_table': 'application_notes',
            },
        ),
        migrations.RunPython(load_statuses_fixture, lambda *args: None),
        migrations.AddField(
            model_name='application',
            name='status',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to='vacancies.applicationstatus'),
            preserve_default=False,
        ),
    ]
