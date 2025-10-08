from django.db import models
import uuid

class Auditorium(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60, unique=True)
    standard_row_count = models.PositiveIntegerField(default=0)
    vip_row_count = models.PositiveIntegerField(default=0)
    couple_row_count = models.PositiveIntegerField(default=0)
    seats_per_row = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)