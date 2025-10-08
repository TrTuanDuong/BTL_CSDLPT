from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    USER = "user"
    SUPER_ADMIN = "super_admin"
    ROLE_CHOICES = [
        (USER, USER),
        (SUPER_ADMIN, SUPER_ADMIN),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default=USER)
    REQUIRED_FIELDS = ["email"]