from django.db import models
import uuid

class Showtime(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey("api.Movie", on_delete=models.RESTRICT, related_name="showtimes")
    auditorium = models.ForeignKey("api.Auditorium", on_delete=models.RESTRICT, related_name="showtimes")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="scheduled")

    class Meta:
        unique_together = ("auditorium", "start_time")
        indexes = [
            models.Index(fields=["movie"]),
            models.Index(fields=["auditorium", "start_time"]),
        ]