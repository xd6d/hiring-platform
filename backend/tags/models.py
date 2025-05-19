from django.db import models


class TagGroup(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'tags_groups'


class Tag(models.Model):
    name = models.CharField(max_length=100)
    group = models.ForeignKey(TagGroup, on_delete=models.PROTECT, related_name='tags')

    class Meta:
        db_table = 'tags'
