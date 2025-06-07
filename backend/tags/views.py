from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.generics import CreateAPIView

from api.utils import get_language_code
from .models import TagGroup, Tag, TagGroupTranslation, TagTranslation
from .serializers import TagGroupSerializer, TagSerializer


class TagGroupViewSet(viewsets.ModelViewSet):
    queryset = TagGroup.objects.none()  # mock for swagger
    serializer_class = TagGroupSerializer

    def get_queryset(self):
        language_code = get_language_code()

        return TagGroup.objects.prefetch_related(
            Prefetch("translations", TagGroupTranslation.objects.filter(language_code=language_code)),
            Prefetch("tags", Tag.objects.prefetch_related(
                Prefetch("translations", TagTranslation.objects.filter(language_code=language_code)),
            ).order_by("id"))
        ).order_by("id")
    #todo: search


class TagCreateAPIView(CreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
