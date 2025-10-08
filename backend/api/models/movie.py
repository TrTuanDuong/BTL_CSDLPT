from django.db import models
import uuid

class Movie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    duration_min = models.PositiveIntegerField()
    rating = models.CharField(max_length=10, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True)
    poster_url = models.TextField(blank=True)