from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from config.settings import ALLOWED_IMAGE_EXTENSIONS, ALLOWED_FILE_EXTENSIONS
from .models import File, FileType
from .utils import generate_presigned_url


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = ("name", )


class FileSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(slug_field='name', queryset=FileType.objects.all())
    file = serializers.FileField(use_url=False, validators=[
        FileExtensionValidator(allowed_extensions=ALLOWED_IMAGE_EXTENSIONS + ALLOWED_FILE_EXTENSIONS)
    ])

    class Meta:
        model = File
        fields = ("id", "file", "user_filename", "extension", "type", "created_at")
        extra_kwargs = {"user_filename": {"read_only": True}, "extension": {"read_only": True}, }

    def __init__(self, *args, **kwargs):
        self.validate_photo = kwargs.pop('validate_photo', False)
        self.include_url = kwargs.pop('include_url', False)
        super().__init__(*args, **kwargs)

        if self.validate_photo:
            self.fields['file'].validators = [FileExtensionValidator(allowed_extensions=ALLOWED_IMAGE_EXTENSIONS)]

    def validate(self, attrs):
        file = attrs.get('file')
        max_size_mb = 6 if self.validate_photo else 50
        max_size_bytes = max_size_mb * 1024 * 1024

        if file:
            attrs['user_filename'] = file.name[:255]
            attrs['extension'] = file.content_type.split('/')[1][:100]
            if file.size > max_size_bytes:
                raise serializers.ValidationError(f"File size must be ≤ {max_size_mb} MB.")
        else:
            raise serializers.ValidationError("File cannot be empty")

        return attrs

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if self.include_url:
            representation["url"] = generate_presigned_url(instance.file.name)
        return representation


class FilePhotoSerializer(FileSerializer):
    type = serializers.SlugRelatedField(slug_field='name', queryset=FileType.objects.all(),
                                        default=serializers.CreateOnlyDefault(lambda: FileType.objects.get(id=3)))
