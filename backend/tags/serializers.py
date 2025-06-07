from api.serializers import NameTranslationSerializer
from .models import Tag, TagGroup


class TagSerializer(NameTranslationSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "group")
        extra_kwargs = {"group": {"write_only": True}}


class TagGroupSerializer(NameTranslationSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = TagGroup
        fields = ("id", "name", "tags")