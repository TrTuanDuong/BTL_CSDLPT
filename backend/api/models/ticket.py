from django.db import models
import uuid

class Ticket(models.Model):
    RESERVED = "reserved"
    PAID = "paid"
    CHECKED_IN = "checked_in"
    STATUS_CHOICES = [
        (RESERVED, RESERVED),
        (PAID, PAID),
        (CHECKED_IN, CHECKED_IN),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey("api.Booking", on_delete=models.CASCADE, related_name="tickets")
    showtime = models.ForeignKey("api.Showtime", on_delete=models.CASCADE, related_name="tickets")
    seat = models.ForeignKey("api.Seat", on_delete=models.RESTRICT, related_name="tickets")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    qr_code = models.CharField(max_length=64, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=RESERVED)
    booked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("showtime", "seat")
        indexes = [
            models.Index(fields=["showtime"]),
        ]

    def save(self, *args, **kwargs):
        if not self.price or self.price == 0:
            base_price = self.showtime.base_price if self.showtime else 0
            multiplier = getattr(self.seat, "PRICE_MULTIPLIER", {}).get(self.seat.seat_type, 1.0)
            self.price = base_price * multiplier
        super().save(*args, **kwargs)