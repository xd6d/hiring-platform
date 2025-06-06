from django.db.models import Prefetch
from django.utils import translation
from rest_framework.generics import ListAPIView

from config.settings import DEFAULT_LANGUAGE_CODE, AVAILABLE_LANGUAGES
from dict.models import Country, City, CountryTranslation, CityTranslation
from dict.serializers import CountrySerializer


class CountryListView(ListAPIView):
    queryset = Country.objects.none()  # mock for swagger
    serializer_class = CountrySerializer

    def get_queryset(self):
        request_lang_code = translation.get_language() or DEFAULT_LANGUAGE_CODE
        lang_code = request_lang_code if request_lang_code in AVAILABLE_LANGUAGES else DEFAULT_LANGUAGE_CODE

        return Country.objects.prefetch_related(
            Prefetch("translations", CountryTranslation.objects.filter(language_code=lang_code)),
            Prefetch("cities", City.objects.prefetch_related(
                Prefetch("translations", CityTranslation.objects.filter(language_code=lang_code)),
            ).order_by("-population"))
        ).all()
    # todo: search
