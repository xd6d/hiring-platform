from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from .models import File
from .serializers import FileSerializer
from .utils import generate_presigned_url


class FileModelViewSet(viewsets.ModelViewSet):  # todo: write read permission
    queryset = File.objects.all()
    serializer_class = FileSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()
        if hasattr(instance, "user_photo"):
            user = instance.user_photo
            user.photo = None
            user.save()
