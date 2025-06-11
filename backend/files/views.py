from rest_framework import viewsets
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from api.permissions import CreatedByPermission
from .models import File, FileType
from .serializers import FileSerializer, FilePhotoSerializer, FileTypeSerializer


class FileModelViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, CreatedByPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()
        if hasattr(instance, "user_photo"):
            user = instance.user_photo
            user.photo = None
            user.save()


class UserPhotoUploadCreateAPIView(CreateAPIView):
    queryset = File.objects.all()
    serializer_class = FilePhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer(self, *args, **kwargs):
        return super().get_serializer(validate_photo=True, include_url=True, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        instance = serializer.save(created_by=user)
        user.photo = instance
        user.save()


class FileTypeListAPIView(ListAPIView):
    queryset = FileType.objects.all()
    serializer_class = FileTypeSerializer
    permission_classes = [IsAuthenticated]
