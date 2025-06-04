from rest_framework import viewsets
from rest_framework.generics import CreateAPIView

from .models import TagGroup, Tag
from .serializers import TagGroupSerializer, TagSerializer


class TagGroupViewSet(viewsets.ModelViewSet):
    queryset = TagGroup.objects.all()
    serializer_class = TagGroupSerializer

    #todo: search


class TagCreateAPIView(CreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
