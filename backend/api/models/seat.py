from django.db import models
import uuid


class Seat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auditorium = models.ForeignKey(
        "api.Auditorium", on_delete=models.CASCADE, related_name="seats"
    )
    row_label = models.CharField(max_length=5)
    seat_number = models.IntegerField()

    STANDARD = "standard"
    VIP = "vip"
    COUPLE = "couple"

    SEAT_TYPE_CHOICES = [
        (STANDARD, "Standard"),
        (VIP, "VIP"),
        (COUPLE, "Couple"),
    ]

    PRICE_MULTIPLIER = {
        STANDARD: 1.0,
        VIP: 1.5,
        COUPLE: 3.0,
    }

    seat_type = models.CharField(
        max_length=10, choices=SEAT_TYPE_CHOICES, default=STANDARD
    )

    class Meta:
        unique_together = ("auditorium", "row_label", "seat_number")
        ordering = ["auditorium", "row_label", "seat_number"]

    def __str__(self):
        return f"{self.auditorium.name if self.auditorium else 'No Auditorium'} - {self.row_label}{self.seat_number} ({self.seat_type})"
