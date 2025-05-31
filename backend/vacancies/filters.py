import django_filters
from django.db.models import Count, Q
from .models import Vacancy

class VacancyFilter(django_filters.FilterSet):
    tags = django_filters.CharFilter(method='filter_tags_and_order',
                                     label="tags (comma-separated IDs)")

    class Meta:
        model = Vacancy
        fields = ['tags']

    def filter_tags_and_order(self, queryset, name, value):
        try:
            requested_ids = [int(pk) for pk in value.split(',') if pk.strip().isdigit()]
        except ValueError:
            return queryset

        if not requested_ids:
            return queryset

        return queryset.annotate(
            match_count=Count(
                'tags',
                filter=Q(tags__in=requested_ids),
                distinct=True
            )
        ).filter(match_count__gt=0).order_by('-match_count')
