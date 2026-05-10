from django.db import models

from .utils import generate_char_id

class Movie(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=generate_char_id, editable=False)
    title = models.CharField(max_length=200)
    duration_min = models.PositiveIntegerField()
    rating = models.CharField(max_length=10, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True)
    poster_url = models.TextField(blank=True)