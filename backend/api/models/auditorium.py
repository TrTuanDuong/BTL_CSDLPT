from django.db import models

from .utils import generate_char_id

class Auditorium(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=generate_char_id, editable=False)
    name = models.CharField(max_length=60, unique=True)
    standard_row_count = models.PositiveIntegerField(default=0)
    vip_row_count = models.PositiveIntegerField(default=0)
    couple_row_count = models.PositiveIntegerField(default=0)
    seats_per_row = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)