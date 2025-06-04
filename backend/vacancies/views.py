from django.db.models import OuterRef, ExpressionWrapper, F, Subquery, FloatField, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from accounts.models import UserTag
from vacancies.filters import VacancyFilter
from vacancies.models import Vacancy, Application, ApplicationStatus, VacancyTag
from vacancies.serializers import VacancySerializer, ApplicationCandidateSerializer, ApplicationStatusSerializer, \
    ApplicationNoteSerializer, ApplicationSerializer, UserVacancySerializer


class VacancyModelViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.order_by("-created_at")
    serializer_class = VacancySerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = VacancyFilter
    search_fields = ['name', 'description']

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


class VacancySearchListAPIView(ListAPIView):
    serializer_class = VacancySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = VacancyFilter
    search_fields = ['name', 'description']

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            # queryset just for schema generation metadata
            return Vacancy.objects.none()

        user = self.request.user

        user_tags_qs = UserTag.objects.filter(user=user).values('tag')

        vacancy_tag_match_qs = (
            VacancyTag.objects
            .filter(vacancy=OuterRef('pk'), tag__in=user_tags_qs)
            .annotate(user_position=Subquery(UserTag.objects.filter(
                user=user,
                tag=OuterRef('tag')
            ).values('position')[:1]))
            .annotate(weight=ExpressionWrapper(
                1.0 / F('user_position') + 1.0 / F('position'),
                output_field=FloatField())
            )
            .values('vacancy')
            .annotate(total=Sum('weight'))
            .values('total')
        )

        qs = (
            Vacancy.objects
            .annotate(match_score=Subquery(vacancy_tag_match_qs, output_field=FloatField()))
            .filter(match_score__isnull=False)
            .order_by('-match_score')
        )

        return qs
