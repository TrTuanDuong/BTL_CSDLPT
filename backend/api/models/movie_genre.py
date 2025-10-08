from django.db import models

class MovieGenre(models.Model):
    movie = models.ForeignKey("api.Movie", on_delete=models.CASCADE)
    genre = models.ForeignKey("api.Genre", on_delete=models.CASCADE)

    class Meta:
        unique_together = ("movie", "genre")