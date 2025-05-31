from django.urls import path, include

from accounts.views import UserCreateAPIView, UserRetrieveView, RoleListAPIView, CompanyCreateAPIView, \
    UserTagCreateAPIView, UserTagDestroyAPIView, CompanyRetrieveUpdateDestroyAPIView
from vacancies.views import UserApplicationsListAPIView, UserVacanciesListAPIView

urlpatterns = [
    path("users/", include([
        path("", UserCreateAPIView.as_view(), name="user-create"),
        path("me/", include([
            path("", UserRetrieveView.as_view(), name="user-me"),
            path("applications/", UserApplicationsListAPIView.as_view(), name="user-me-applications"),
            path("vacancies/", UserVacanciesListAPIView.as_view(), name="user-me-vacancies"),
            path("tags/", include([
                path("", UserTagCreateAPIView.as_view(), name="user-tag-create"),
                path("<int:pk>/", UserTagDestroyAPIView.as_view(), name="user-tag-delete"),
            ])),
        ])),
        path("roles/", RoleListAPIView.as_view(), name="role-list"),
    ])),
    path("companies/", include([
        path("", CompanyCreateAPIView.as_view(), name="company-create"),
        path("<int:pk>/", CompanyRetrieveUpdateDestroyAPIView.as_view(), name="company-get-update-delete"),
    ])),
]
