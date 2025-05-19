from rest_framework import serializers

from complaints.models import Complaint, ComplaintCause


class ComplaintCauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCause
        fields = ("name", "description", )


class ComplaintSerializer(serializers.ModelSerializer):  # todo: bulk_create cause links
    class Meta:
        model = Complaint
        fields = '__all__'
