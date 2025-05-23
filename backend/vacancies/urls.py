from django.urls import path, include

from vacancies.views import VacancyModelViewSet

urlpatterns = [
    path(
        "",
        VacancyModelViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="vacancies-list-create"
    ),
    path(
        "<int:pk>/",
        VacancyModelViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="vacancies-retrieve-update-delete"),
]
