from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta

class Booking(models.Model):
    PENDING = "pending"
    PAID = "paid"
    CANCELED = "canceled"
    STATUS_CHOICES = [
        (PENDING, PENDING),
        (PAID, PAID),
        (CANCELED, CANCELED),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("api.User", on_delete=models.CASCADE, related_name="bookings")
    showtime = models.ForeignKey("api.Showtime", on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["showtime"]),
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.expires_at is None:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)