from django.db import models
import uuid


class Ticket(models.Model):
    RESERVED = "reserved"
    PAID = "paid"
    CHECKED_IN = "checked_in"
    CANCELED = "canceled"  # ← THÊM
    REFUNDED = "refunded"  # ← THÊM

    STATUS_CHOICES = [
        (RESERVED, "Reserved"),
        (PAID, "Paid"),
        (CHECKED_IN, "Checked In"),
        (CANCELED, "Canceled"),  # ← THÊM
        (REFUNDED, "Refunded"),  # ← THÊM
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        "api.Booking", on_delete=models.CASCADE, related_name="tickets"
    )
    showtime = models.ForeignKey(
        "api.Showtime", on_delete=models.CASCADE, related_name="tickets"
    )
    seat = models.ForeignKey(
        "api.Seat", on_delete=models.RESTRICT, related_name="tickets"
    )
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
            multiplier = getattr(self.seat, "PRICE_MULTIPLIER", {}).get(
                self.seat.seat_type, 1.0
            )
            self.price = base_price * multiplier
        super().save(*args, **kwargs)

    def can_check_in(self):
        """Check có thể check-in không"""
        if self.status != "paid":
            return False, "Chỉ có thể check-in vé đã thanh toán"

        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        checkin_time = self.showtime.start_time - timedelta(minutes=30)

        if now < checkin_time:
            return False, f"Chỉ có thể check-in từ {checkin_time.strftime('%H:%M')}"

        if now > self.showtime.end_time:
            return False, "Suất chiếu đã kết thúc"

        return True, "OK"
