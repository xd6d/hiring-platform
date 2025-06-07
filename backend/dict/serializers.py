from api.serializers import NameTranslationSerializer
from dict.models import City, Country


class CitySerializer(NameTranslationSerializer):
    class Meta:
        model = City
        fields = ("name", "id")


class CountrySerializer(NameTranslationSerializer):
    cities = CitySerializer(many=True)

    class Meta:
        model = Country
        fields = ("name", "cities")