from django.urls import path, include

from vacancies.views import VacancyModelViewSet, ApplicationModelViewSet, VacancySearchListAPIView, \
    VacancyApplicationListAPIView, ApplicationStatusListAPIView, ApplicationNoteCreateAPIView, \
    ApplicationNoteRetrieveUpdateDestroyAPIView

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
            name="vacancies-retrieve-update-delete"
        ),
        path("<int:pk>/", include([
            path(
                "",
                VacancyModelViewSet.as_view({
                    'get': 'retrieve',
                    'put': 'update',
                    'patch': 'partial_update',
                    'delete': 'destroy'
                }),
                name="vacancies-retrieve-update-delete"
            ),
            path("applications/", VacancyApplicationListAPIView.as_view(), name="vacancies-application-list"),
        ])),
        path("personalized/", VacancySearchListAPIView.as_view())
    ])),
    path("applications/", include([
        path(
            "",
            ApplicationModelViewSet.as_view({'post': 'create'}),
            name="applications-create"
        ),
        path("<int:pk>/", include([
            path("",
                 ApplicationModelViewSet.as_view({
                     'get': 'retrieve',
                     'patch': 'partial_update'
                 }),
                 name="applications-retrieve-update-delete"
                 ),
        ])),
        path("statuses/", ApplicationStatusListAPIView.as_view(), name="applications-statuses"),
    ])),
    path("application-notes/", include([
        path("", ApplicationNoteCreateAPIView.as_view(), name="application-notes-create"),
        path("<int:pk>/", ApplicationNoteRetrieveUpdateDestroyAPIView.as_view(), name="application-get-update-delete"),
    ]))
]
