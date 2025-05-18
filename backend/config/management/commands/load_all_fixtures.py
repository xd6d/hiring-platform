import os

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load all fixtures in a specific order"

    def handle(self, *args, **kwargs):
        fixtures = [
            "roles.json",
            "users.json",
            "countries.json",
            "cities.json",
        ]

        call_command("loaddata", *fixtures, verbosity=1)
