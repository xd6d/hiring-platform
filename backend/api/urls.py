from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from django.conf import settings
from django.urls import path, include

urlpatterns = [
    path("auth/", include("auth.urls")),
    path("", include("accounts.urls")),
    path("tags/", include("tags.urls")),
    path("dict/", include("dict.urls")),
    path("", include("vacancies.urls")),
    path("templates/", include("vacancies_templates.urls")),
    path("complaints/", include("complaints.urls")),
    path("files/", include("files.urls")),
]


if settings.DEBUG:
    urlpatterns += [
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
    ]
