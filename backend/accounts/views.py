from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, \
    DestroyAPIView
from rest_framework.permissions import IsAuthenticated

from accounts.filters import CurrentUserFilterBackend
from accounts.models import User, Role, UserTag, Company
from accounts.serializers import UserPostSerializer, UserSerializer, RoleSerializer, CompanySerializer, \
    UserTagSerializer


class UserCreateAPIView(CreateAPIView):
    serializer_class = UserPostSerializer


class UserRetrieveView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


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


class UserTagDestroyAPIView(DestroyAPIView):
    queryset = UserTag.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [CurrentUserFilterBackend]
    lookup_field = 'tag_id'
    lookup_url_kwarg = 'pk'
