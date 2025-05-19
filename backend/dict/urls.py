from django.urls import path, include

from dict.views import CountryListView

urlpatterns = [
    path("countries/", CountryListView.as_view(), name="countries-list"),
]