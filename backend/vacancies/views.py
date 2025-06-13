from django.db.models import OuterRef, ExpressionWrapper, F, Subquery, FloatField, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from accounts.models import UserTag
from api.permissions import CreatedByPermission, VacancyCreatedByPermission, VacancyApplicationCreatedByPermission
from api.utils import get_language_code
from .filters import VacancyFilter
from .models import Vacancy, Application, ApplicationStatus, VacancyTag, ApplicationNote
from .serializers import VacancySerializer, ApplicationCandidateSerializer, ApplicationStatusSerializer, \
    ApplicationNoteSerializer, ApplicationSerializer, UserVacancySerializer, ApplicationRecruiterSerializer, \
    ApplicationUpdateSerializer
from .utils import get_prefetched_translations_for_vacancies


class VacancyModelViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.none()  # mock for swagger
    serializer_class = VacancySerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = VacancyFilter
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        language_code = get_language_code()

        return Vacancy.objects.prefetch_related(
            *get_prefetched_translations_for_vacancies(language_code)
        ).order_by("-created_at")


class VacancyRecruiterRetrieveAPIView(RetrieveAPIView):
    queryset = Vacancy.objects.none()  # mock for swagger
    serializer_class = UserVacancySerializer
    permission_classes = (IsAuthenticated, CreatedByPermission)

    def get_queryset(self):
        language_code = get_language_code()

        return Vacancy.objects.prefetch_related(
            *get_prefetched_translations_for_vacancies(language_code)
        ).annotate(applied=Count("applications")).order_by("-created_at")


class ApplicationModelViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationCandidateSerializer
    permission_classes = (IsAuthenticated, CreatedByPermission)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ApplicationUpdateSerializer
        return ApplicationCandidateSerializer

    def get_permissions(self):
        if self.request.method == 'PATCH':
            permission_classes = [IsAuthenticated, VacancyCreatedByPermission]
        else:
            permission_classes = [IsAuthenticated, CreatedByPermission]
        return [permission() for permission in permission_classes]


class ApplicationStatusListAPIView(ListAPIView):
    queryset = ApplicationStatus.objects.order_by("id")
    serializer_class = ApplicationStatusSerializer


class ApplicationNoteCreateAPIView(CreateAPIView):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ApplicationNoteRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = ApplicationNote.objects.order_by("created_at")
    serializer_class = ApplicationNoteSerializer
    permission_classes = (IsAuthenticated, CreatedByPermission)
    http_method_names = ["patch", "delete"]


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
        language_code = get_language_code()

        return (
            Vacancy.objects.order_by("created_at")
            .annotate(applied=Count("applications"))
            .prefetch_related(*get_prefetched_translations_for_vacancies(language_code))
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
        language_code = get_language_code()

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
            .prefetch_related(*get_prefetched_translations_for_vacancies(language_code))
            .order_by('-match_score')
        )

        return qs


class VacancyApplicationListAPIView(ListAPIView):
    queryset = Application.objects.select_related(
        "status", "created_by__photo"
    ).prefetch_related(
        "notes__created_by"
    ).order_by("created_at")
    serializer_class = ApplicationRecruiterSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.queryset.filter(vacancy_id=self.kwargs["pk"])
