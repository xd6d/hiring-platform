from django.db.models import Prefetch

from dict.models import City, CityTranslation
from tags.models import Tag, TagTranslation


def get_prefetched_translations_for_vacancies(language_code="en"):
    return (
        Prefetch("tags", queryset=Tag.objects.prefetch_related(
            Prefetch("translations", TagTranslation.objects.filter(language_code=language_code)),
        ).order_by("vacancytag__position")),
        Prefetch("cities", queryset=City.objects.prefetch_related(
            Prefetch("translations", CityTranslation.objects.filter(language_code=language_code))
        ).order_by("-population"))
    )
