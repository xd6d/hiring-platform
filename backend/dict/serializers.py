from rest_framework import serializers

from dict.models import City, Country


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        exclude = ("country", )


class CountrySerializer(serializers.ModelSerializer):
    cities = CitySerializer(many=True)

    class Meta:
        model = Country
        fields = ("name", "cities")