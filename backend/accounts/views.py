from django.db.models import Prefetch
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, \
    DestroyAPIView
from rest_framework.mixins import UpdateModelMixin
from rest_framework.permissions import IsAuthenticated

from accounts.filters import CurrentUserFilterBackend
from accounts.models import User, Role, UserTag, Company
from accounts.serializers import UserPostSerializer, UserSerializer, RoleSerializer, CompanySerializer, \
    UserTagSerializer, UserTagPositionSerializer
from api.utils import get_language_code
from files.models import File
from tags.models import Tag, TagTranslation


class UserCreateAPIView(CreateAPIView):
    serializer_class = UserPostSerializer


class UserRetrieveView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.none()  # mock for swagger
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        language_code = get_language_code()

        return User.objects.select_related(
            "photo"
        ).prefetch_related(
            Prefetch("tags", queryset=Tag.objects.prefetch_related(
                Prefetch("translations", TagTranslation.objects.filter(language_code=language_code)),
            ).order_by("usertag__position")),
            Prefetch("files", queryset=File.objects.filter(user_photo__isnull=True).select_related("type")),
        ).all()

    def get_object(self):
        return self.get_queryset().get(pk=self.request.user.pk)


class RoleListAPIView(ListAPIView):
    queryset = Role.objects.filter(hidden=False)
    serializer_class = RoleSerializer


class CompanyCreateAPIView(CreateAPIView):
    serializer_class = CompanySerializer


class CompanyRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):  # todo: update and destroy only for creator
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]


class UserTagCreateAPIView(CreateAPIView):
    serializer_class = UserTagSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs.setdefault('context', self.get_serializer_context())
        many = type(self.request.data) is list
        return serializer_class(many=many, *args, **kwargs)


class UserTagDestroyAPIView(DestroyAPIView, UpdateModelMixin):
    queryset = UserTag.objects.all()
    serializer_class = UserTagPositionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [CurrentUserFilterBackend]
    lookup_field = 'tag_id'
    lookup_url_kwarg = 'pk'

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class UserPhotoDeleteAPIView(DestroyAPIView):
    queryset = User.objects.all()

    def get_object(self):
        return self.get_queryset().get(pk=self.request.user.pk)

    def perform_destroy(self, instance):
        instance.photo.soft_delete()
        instance.photo = None
        instance.save()
