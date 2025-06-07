from django.db.models import Prefetch
from rest_framework.generics import ListAPIView

from api.utils import get_language_code
from dict.models import Country, City, CountryTranslation, CityTranslation
from dict.serializers import CountrySerializer


class CountryListView(ListAPIView):
    queryset = Country.objects.none()  # mock for swagger
    serializer_class = CountrySerializer

    def get_queryset(self):
        language_code = get_language_code()

        return Country.objects.prefetch_related(
            Prefetch("translations", CountryTranslation.objects.filter(language_code=language_code)),
            Prefetch("cities", City.objects.prefetch_related(
                Prefetch("translations", CityTranslation.objects.filter(language_code=language_code)),
            ).order_by("-population"))
        ).all()
    # todo: search
