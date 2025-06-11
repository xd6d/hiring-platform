from rest_framework import permissions


class CreatedByPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user


class VacancyCreatedByPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.vacancy.created_by == request.user
