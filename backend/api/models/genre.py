from django.db import models

from .utils import generate_char_id

class Genre(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=generate_char_id, editable=False)
    name = models.CharField(max_length=60, unique=True)