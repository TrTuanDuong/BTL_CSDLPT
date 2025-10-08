from django.db import models
import uuid

class Seat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auditorium = models.ForeignKey("api.Auditorium", on_delete=models.CASCADE, related_name="seats", null=True, blank=True)
    row_label = models.CharField(max_length=5, null=True, blank=True)
    seat_number = models.IntegerField()
    STANDARD = "standard"
    VIP = "vip"
    COUPLE = "couple"
    SEAT_TYPE_CHOICES = [
        (STANDARD, STANDARD),
        (VIP, VIP),
        (COUPLE, COUPLE),
    ]
    PRICE_MULTIPLIER = {
        STANDARD: 1.0,
        VIP: 1.3,
        COUPLE: 2.0,
    }
    seat_type = models.CharField(max_length=10, choices=SEAT_TYPE_CHOICES, default=STANDARD)

    class Meta:
        unique_together = ("auditorium", "row_label", "seat_number")
        indexes = [
            models.Index(fields=["auditorium"]),
        ]