from django.db.models import Prefetch, Q, OuterRef, Subquery
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.generics import ListAPIView

from api.utils import get_language_code
from dict.models import Country, City, CountryTranslation, CityTranslation
from dict.serializers import CountrySerializer


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
class CountryListView(ListAPIView):
    queryset = Country.objects.none()  # mock for swagger
    serializer_class = CountrySerializer

    def get_queryset(self):
        language_code = get_language_code()
        search = self.request.query_params.get('search', '')

        if not search:
            return Country.objects.prefetch_related(
                Prefetch("translations", CountryTranslation.objects.filter(language_code=language_code)),
                Prefetch("cities", City.objects.prefetch_related(
                    Prefetch("translations", CityTranslation.objects.filter(language_code=language_code)),
                ).order_by("-population"))
            ).alias(translation=Subquery(
                CountryTranslation.objects.filter(country=OuterRef('pk'))
                .filter(language_code=language_code)
                .values('name')
            )).order_by("translation")

        country_ids = Country.objects.filter(
            Q(cities__translations__name__icontains=search) | Q(translations__name__icontains=search)
        ).values_list("id", flat=True)
        return (
            Country.objects.
            filter(id__in=country_ids)
            .prefetch_related(
                Prefetch("translations", CountryTranslation.objects.filter(language_code=language_code)),
                Prefetch("cities", City.objects.filter(
                    Q(translations__name__icontains=search) | Q(country__translations__name__icontains=search)
                ).prefetch_related(
                    Prefetch("translations", CityTranslation.objects.filter(language_code=language_code)),
                ).order_by("-population").distinct())
            )
            .alias(translation=Subquery(
                CountryTranslation.objects.filter(country=OuterRef('pk'))
                .filter(language_code=language_code)
                .values('name')
            )
            )
            .order_by("translation")
        )
