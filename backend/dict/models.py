from django.db import models


class Country(models.Model):  # todo
    name = models.CharField(max_length=100)

    class Meta:
        db_table = "dict_countries"


class City(models.Model):  # todo find Ukraine cities
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'dict_cities'
