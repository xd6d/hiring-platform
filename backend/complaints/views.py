from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from complaints.models import ComplaintCause, Complaint
from complaints.serializers import ComplaintCauseSerializer, ComplaintSerializer


class ComplaintCauseSerializerListAPIView(ListAPIView):
    queryset = ComplaintCause.objects.all()
    serializer_class = ComplaintCauseSerializer


class ComplaintModelViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = (IsAuthenticated,) # todo: enhance permissions

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)