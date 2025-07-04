# Generated by Django 5.0.7 on 2025-05-17 19:58

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tags', '0001_initial'),
        ('vacancies_templates', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Application',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'vacancies_applications',
            },
        ),
        migrations.CreateModel(
            name='ApplicationAnswer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('answer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='vacancies_templates.answer')),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='application_answers', to='vacancies.application')),
            ],
            options={
                'db_table': 'applications_answers',
            },
        ),
        migrations.AddField(
            model_name='application',
            name='answers',
            field=models.ManyToManyField(through='vacancies.ApplicationAnswer', to='vacancies_templates.answer'),
        ),
        migrations.CreateModel(
            name='Vacancy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deleted_at', models.DateTimeField(null=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('work_format', models.CharField(choices=[('OFFICE', 'Office'), ('REMOTE', 'Remote'), ('HYBRID', 'Hybrid')], max_length=6)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('application_template', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='vacancies', to='vacancies_templates.applicationtemplate')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'vacancies',
            },
        ),
        migrations.AddField(
            model_name='application',
            name='vacancy',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='vacancies.vacancy'),
        ),
        migrations.CreateModel(
            name='VacancyTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveSmallIntegerField(default=0)),
                ('tag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tags.tag')),
                ('vacancy', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vacancy_tags', to='vacancies.vacancy')),
            ],
            options={
                'db_table': 'vacancies_tags',
                'unique_together': {('vacancy', 'tag')},
            },
        ),
        migrations.AddField(
            model_name='vacancy',
            name='tags',
            field=models.ManyToManyField(related_name='vacancies', through='vacancies.VacancyTag', to='tags.tag'),
        ),
    ]
