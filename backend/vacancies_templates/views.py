from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ApplicationTemplate, Question, Answer
from .serializers import ApplicationTemplateSerializer, QuestionSerializer, AnswerSerializer


class ApplicationTemplateModelViewSet(viewsets.ModelViewSet):
    queryset = ApplicationTemplate.objects.all()
    serializer_class = ApplicationTemplateSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuestionModelViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = (IsAuthenticated,)


class AnswerModelViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = (IsAuthenticated,)
