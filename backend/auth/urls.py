from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path("token/", include([
        path("refresh/", TokenRefreshView.as_view()),
        path("verify/", TokenVerifyView.as_view()),
    ]),
         ),
    path("login/", TokenObtainPairView.as_view()),
]
