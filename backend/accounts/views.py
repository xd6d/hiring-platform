from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import CreateAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView, ListAPIView

from accounts.models import User, Role, Company, UserTag
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


class UserTagCreateAPIView(CreateAPIView):
    serializer_class = UserTagSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)