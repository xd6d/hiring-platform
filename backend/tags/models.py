from django.db import models

from config.settings import LANGUAGE_CHOICES


class TagGroup(models.Model):
    class Meta:
        db_table = 'tags_groups'


class TagGroupTranslation(models.Model):
    tag_group = models.ForeignKey(TagGroup, on_delete=models.CASCADE, related_name='translations')
    name = models.CharField(max_length=100)
    language_code = models.CharField(max_length=10, choices=LANGUAGE_CHOICES)

    class Meta:
        db_table = 'tags_groups_translations'
        unique_together = (("tag_group", "language_code"),)



class Tag(models.Model):
    group = models.ForeignKey(TagGroup, on_delete=models.PROTECT, related_name='tags')

    class Meta:
        db_table = 'tags'


class TagTranslation(models.Model):
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='translations')
    name = models.CharField(max_length=100)
    language_code = models.CharField(max_length=10, choices=LANGUAGE_CHOICES)

    class Meta:
        db_table = 'tags_translations'
        unique_together = (("tag", "language_code"),)
