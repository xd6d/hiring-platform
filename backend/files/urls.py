from django.urls import path, include

from files.views import FileModelViewSet, FileTypeListAPIView

urlpatterns = [
    path(
        "",
        FileModelViewSet.as_view({'get': 'list', 'post': 'create'}),
        name="files-list-create"
    ),
    path(
        "<int:pk>/",
        FileModelViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name="files-retrieve-update-delete"),
    path("types/", FileTypeListAPIView.as_view(), name="files-types-list"),
]
