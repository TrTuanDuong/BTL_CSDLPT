from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta


class Booking(models.Model):
    PENDING = "pending"
    RESERVED = "reserved"
    PAID = "paid"
    CANCELED = "canceled"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (RESERVED, "Reserved"),
        (PAID, "Paid"),
        (CANCELED, "Canceled"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "api.User", on_delete=models.CASCADE, related_name="bookings"
    )
    showtime = models.ForeignKey(
        "api.Showtime", on_delete=models.CASCADE, related_name="bookings"
    )
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

    def is_expired(self):
        """Check booking đã hết hạn thanh toán chưa"""
        if self.status != "pending":
            return False
        return timezone.now() > self.expires_at

    def time_remaining_seconds(self):
        """Thời gian còn lại để thanh toán (giây)"""
        if self.status != "pending":
            return 0

        remaining = self.expires_at - timezone.now()
        return max(0, int(remaining.total_seconds()))

    def auto_cancel_if_expired(self):
        """Tự động hủy nếu hết hạn"""
        if self.is_expired() and self.status == "pending":
            self.status = "canceled"
            self.save()

            # Hủy tất cả tickets của booking này
            self.tickets.update(status="canceled")
            return True
        return False

    @classmethod
    def cleanup_expired_bookings(cls):
        """Class method để cleanup tất cả booking hết hạn"""
        from django.utils import timezone

        now = timezone.now()
        expired_bookings = cls.objects.filter(status="pending", expires_at__lt=now)

        canceled_count = 0
        for booking in expired_bookings:
            booking.status = "canceled"
            booking.save()
            booking.tickets.update(status="canceled")
            canceled_count += 1

        return canceled_count

    @property
    def booking_time(self):
        """Alias cho created_at để tương thích với serializers"""
        return self.created_at
