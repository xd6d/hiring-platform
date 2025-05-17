from django.contrib.auth.models import AbstractUser
from django.db import models

from tags.models import Tag
from .managers import UserManager


class Role(models.Model):
    name = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'users_roles'


class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    website = models.URLField(unique=True)
    contacts = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("User", on_delete=models.CASCADE, related_name="created_companies")

    class Meta:
        db_table = 'users_companies'


class User(AbstractUser):
    username = None
    email = models.EmailField("email address", unique=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    contacts = models.JSONField(default=dict)
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, related_name="users")
    tags = models.ManyToManyField(Tag, related_name='users', through="UserTag")
    photo = models.OneToOneField("files.File", on_delete=models.SET_NULL, null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email


class UserTag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'users_tags'
        unique_together = (('user', 'tag'),)
