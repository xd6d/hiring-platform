from django.urls import path, include

from vacancies_templates.views import ApplicationTemplateModelViewSet, QuestionModelViewSet, AnswerModelViewSet, \
    QuestionTypeListAPIView

urlpatterns = [
    path("questions/", include([
        path(
            "",
            QuestionModelViewSet.as_view({'get': 'list', 'post': 'create'}),
            name="questions-list-create"
        ),
        path(
            "<int:pk>/",
            QuestionModelViewSet.as_view({
                'get': 'retrieve',
                'put': 'update',
                'patch': 'partial_update',
                'delete': 'destroy'
            }),
            name="questions-retrieve-update-delete"
        ),
        path("types/", QuestionTypeListAPIView.as_view(), name="types-list"),
    ])),
    path("answers/", include([
        path(
            "",
            AnswerModelViewSet.as_view({'get': 'list', 'post': 'create'}),
            name="answers-list-create"
        ),
        path(
            "<int:pk>/",
            AnswerModelViewSet.as_view({
                'get': 'retrieve',
                'put': 'update',
                'patch': 'partial_update',
                'delete': 'destroy'
            }),
            name="answers-retrieve-update-delete"
        ),
    ])),
    path(
        "",
        ApplicationTemplateModelViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="application-templates-list-create"
    ),
    path(
        "<int:pk>/",
        ApplicationTemplateModelViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="application-templates-retrieve-update-delete"
    ),
]
