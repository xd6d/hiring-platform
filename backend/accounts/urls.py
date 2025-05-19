from django.urls import path, include

from accounts.views import UserCreateAPIView, UserRetrieveView, RoleListAPIView, CompanyCreateAPIView, \
    UserTagCreateAPIView

urlpatterns = [
    path("", UserCreateAPIView.as_view(), name="user-create"),
    path("me/", include([
        path("", UserRetrieveView.as_view(), name="user-me"),
        path("tags/", UserTagCreateAPIView.as_view(), name="user-tag-create"),
    ])),
    path("roles/", RoleListAPIView.as_view(), name="role-list"),
    path("companies/", CompanyCreateAPIView.as_view(), name="company-create"),
]
