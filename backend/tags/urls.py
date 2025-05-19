from django.urls import path, include

from tags.views import TagGroupViewSet, TagCreateAPIView

urlpatterns = [
    path("", include([
        path("", TagCreateAPIView.as_view(), name="tag-create"),
        path("groups/", include([
            path(
                "",
                TagGroupViewSet.as_view({'get': 'list', 'post': 'create'}),
                name="tag-groups-list-create"
            ),
            path(
                "<int:id>/",
                TagGroupViewSet.as_view({
                    'get': 'retrieve',
                    'put': 'update',
                    'patch': 'partial_update',
                    'delete': 'destroy'
                }),
                name="tag-groups-retrieve-update-delete")
        ])),
    ])),

]
