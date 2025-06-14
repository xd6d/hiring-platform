from django.urls import path, include

from accounts.views import UserCreateAPIView, UserRetrieveView, RoleListAPIView, CompanyCreateAPIView, \
    UserTagCreateAPIView, UserTagDestroyAPIView, CompanyRetrieveUpdateDestroyAPIView, UserPhotoDeleteAPIView
from files.views import UserPhotoUploadCreateAPIView
from vacancies.views import UserApplicationsListAPIView, UserVacanciesListAPIView, VacancyRecruiterRetrieveAPIView, \
    VacancyDeletedListAPIView

urlpatterns = [
    path("users/", include([
        path("", UserCreateAPIView.as_view(), name="user-create"),
        path("me/", include([
            path("", UserRetrieveView.as_view(), name="user-me"),
            path("applications/", UserApplicationsListAPIView.as_view(), name="user-me-applications"),
            path("vacancies/", include([
                path("", UserVacanciesListAPIView.as_view(), name="user-me-vacancies"),
                path("<int:pk>/", VacancyRecruiterRetrieveAPIView.as_view(), name="vacancy-recruiter"),
                path("deleted/", VacancyDeletedListAPIView.as_view(), name="vacancies-deleted"),
            ])),
            path("tags/", include([
                path("", UserTagCreateAPIView.as_view(), name="user-tag-create"),
                path("<int:pk>/", UserTagDestroyAPIView.as_view(), name="user-tag-delete"),
            ])),
            path("upload-photo/", UserPhotoUploadCreateAPIView.as_view(), name="user-me-upload-photo"),
            path("delete-photo/", UserPhotoDeleteAPIView.as_view(), name="user-me-delete-photo"),
        ])),
        path("roles/", RoleListAPIView.as_view(), name="role-list"),
    ])),
    path("companies/", include([
        path("", CompanyCreateAPIView.as_view(), name="company-create"),
        path("<int:pk>/", CompanyRetrieveUpdateDestroyAPIView.as_view(), name="company-get-update-delete"),
    ])),
]
