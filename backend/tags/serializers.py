from rest_framework import serializers

from .models import Tag, TagGroup


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        exclude = ("group", )


class TagGroupSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = TagGroup
        fields = ("id", "name", "tags")