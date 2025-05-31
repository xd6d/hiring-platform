from django.urls import path, include

from vacancies.views import VacancyModelViewSet, ApplicationModelViewSet, VacancySearchListAPIView

urlpatterns = [
    path("vacancies/", include([
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
        path("personalized/", VacancySearchListAPIView.as_view())
    ])),
    path("applications/", include([
        path(
            "",
            ApplicationModelViewSet.as_view({'post': 'create'}),
            name="applications-create"
        ),
        path(
            "<int:pk>/",
            ApplicationModelViewSet.as_view({
                'get': 'retrieve'
            }),
            name="applications-retrieve-update-delete"),
    ])),

]
