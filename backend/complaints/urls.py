from django.urls import path, include

from complaints.views import ComplaintCauseSerializerListAPIView, ComplaintModelViewSet

urlpatterns = [
    path("causes/", ComplaintCauseSerializerListAPIView.as_view(), name="complaint-causes-list"),
    path(
        "",
        ComplaintModelViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="complaints-list-create"
    ),
    path(
        "<int:pk>/",
        ComplaintModelViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="complaints-retrieve-update-delete"
    ),
]
