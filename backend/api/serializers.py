from rest_framework import serializers


class NameTranslationSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        for translation in obj.translations.all():  # Makes prefetch working, lol
            return translation.name
        return None
