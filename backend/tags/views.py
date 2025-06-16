from django.db.models import Prefetch, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import viewsets
from rest_framework.generics import CreateAPIView

from api.utils import get_language_code
from .models import TagGroup, Tag, TagGroupTranslation, TagTranslation
from .serializers import TagGroupSerializer, TagSerializer

@extend_schema(
    parameters=[
        OpenApiParameter(
            "search",
            str,
            OpenApiParameter.QUERY,
            required=False,
        ),
    ]
)
class TagGroupViewSet(viewsets.ModelViewSet):
    queryset = TagGroup.objects.none()  # mock for swagger
    serializer_class = TagGroupSerializer

    def get_queryset(self):
        language_code = get_language_code()
        search = self.request.query_params.get('search', '')

        if not search:
            return TagGroup.objects.prefetch_related(
                Prefetch("translations", TagGroupTranslation.objects.filter(language_code=language_code)),
                Prefetch("tags", Tag.objects.prefetch_related(
                    Prefetch("translations", TagTranslation.objects.filter(language_code=language_code)),
                ).order_by("id"))
            ).order_by("id")

        return (
            TagGroup.objects.
            filter(Q(tags__translations__name__icontains=search) | Q(translations__name__icontains=search))
            .prefetch_related(
                Prefetch("translations", TagGroupTranslation.objects.filter(language_code=language_code)),
                Prefetch("tags", Tag.objects.filter(
                    Q(translations__name__icontains=search) | Q(group__translations__name__icontains=search)
                ).prefetch_related(
                    Prefetch("translations", TagTranslation.objects.filter(language_code=language_code)),
                ).order_by("id").distinct())
            )
            .order_by("id")
            .distinct()
        )


class TagCreateAPIView(CreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
