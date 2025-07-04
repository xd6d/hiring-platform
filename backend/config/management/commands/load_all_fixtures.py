from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load all fixtures in a specific order"

    def handle(self, *args, **kwargs):
        fixtures = [
            "roles.json",
            "users.json",
            "countries.json",
            "country_translations.json",
            "cities.json",
            "city_translations.json",
            "question_types.json",
            "application_statuses.json",
            "tag_groups.json",
            "tags.json",
            "file_types.json",
        ]

        call_command("loaddata", *fixtures, verbosity=1)
