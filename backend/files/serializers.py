from rest_framework import serializers

from .models import File, FileType


class FileSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field='name', queryset=FileType.objects.all())
    file = serializers.FileField(use_url=False)

    class Meta:
        model = File
        fields = ("file", "user_filename", "type", "created_at")
        extra_kwargs = {"user_filename": {"read_only": True}}

    def validate(self, attrs):  # todo: validate type
        file = attrs.get('file', '')

        if file:
            attrs['user_filename'] = file.name
        else:
            raise serializers.ValidationError("File cannot be empty")

        return attrs