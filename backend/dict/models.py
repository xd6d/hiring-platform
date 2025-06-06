from django.db import models

from config.settings import LANGUAGE_CHOICES


class Country(models.Model):
    class Meta:
        db_table = "dict_countries"


class CountryTranslation(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="translations")
    name = models.CharField(max_length=100)
    language_code = models.CharField(max_length=10, choices=LANGUAGE_CHOICES)

    class Meta:
        db_table = "dict_countries_translations"


class City(models.Model):
    population = models.IntegerField()
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, related_name="cities")

    class Meta:
        db_table = 'dict_cities'


class CityTranslation(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="translations")
    name = models.CharField(max_length=100)
    language_code = models.CharField(max_length=10, choices=LANGUAGE_CHOICES)

    class Meta:
        db_table = "dict_cities_translations"
        unique_together = (("city", "language_code"),)
