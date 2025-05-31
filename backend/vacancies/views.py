from rest_framework import viewsets
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from vacancies.models import Vacancy, Application, ApplicationStatus
from vacancies.serializers import VacancySerializer, ApplicationCandidateSerializer, ApplicationStatusSerializer, \
    ApplicationNoteSerializer, ApplicationSerializer, UserVacancySerializer


class VacancyModelViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.order_by("-created_at")
    serializer_class = VacancySerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ApplicationModelViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationCandidateSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ApplicationStatusListAPIView(ListAPIView):
    queryset = ApplicationStatus.objects.order_by("id")
    serializer_class = ApplicationStatusSerializer


class ApplicationNoteCreateAPIView(CreateAPIView):
    serializer_class = ApplicationNoteSerializer


class UserApplicationsListAPIView(ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            Application.objects.order_by("-created_at")
            .filter(created_by=self.request.user)
            .select_related("vacancy", "status")
            .prefetch_related("answers__question")
        )


class UserVacanciesListAPIView(ListAPIView):
    serializer_class = UserVacancySerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            Vacancy.objects.order_by("created_at")
            .filter(created_by=self.request.user)
            .prefetch_related("tags", "cities")
        )