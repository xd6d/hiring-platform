from rest_framework.generics import ListAPIView

from dict.models import Country
from dict.serializers import CountrySerializer


class CountryListView(ListAPIView):
    queryset = Country.objects.prefetch_related("cities").all()
    serializer_class = CountrySerializer

    # todo: search
