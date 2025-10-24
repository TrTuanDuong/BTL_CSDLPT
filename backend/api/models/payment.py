from django.db import models
import uuid


class Payment(models.Model):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (COMPLETED, "Completed"),
        (FAILED, "Failed"),
        (REFUNDED, "Refunded"),
    ]

    CREDIT_CARD = "credit_card"
    CASH = "cash"
    E_WALLET = "e_wallet"
    BANK_TRANSFER = "bank_transfer"

    PROVIDER_CHOICES = [
        (CREDIT_CARD, "Credit Card"),
        (CASH, "Cash"),
        (E_WALLET, "E-Wallet"),
        (BANK_TRANSFER, "Bank Transfer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        "api.Booking", on_delete=models.CASCADE, related_name="payment"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider = models.CharField(max_length=40, choices=PROVIDER_CHOICES, default=CREDIT_CARD)
    
    external_id = models.CharField(max_length=80, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(
        auto_now_add=True, null=True, blank=True
    )  # ← Tạm null=True
    # created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["booking"]),
        ]

    def can_refund(self):
        """Check có thể hoàn tiền không"""
        if self.status != "completed":
            return False, "Chỉ có thể hoàn tiền payment đã hoàn thành"

        from django.utils import timezone
        from datetime import timedelta

        # Không thể hoàn tiền nếu suất chiếu cách đây < 2 giờ
        time_limit = self.booking.showtime.start_time - timedelta(hours=2)

        if timezone.now() > time_limit:
            return False, "Quá thời hạn hoàn tiền (2 giờ trước suất chiếu)"

        return True, "OK"

    def process_refund(self, reason="Customer request"):
        """Xử lý hoàn tiền"""
        can_refund, message = self.can_refund()

        if not can_refund:
            return False, message

        # Cập nhật payment status
        self.status = "refunded"
        self.save()

        # Cập nhật booking status
        self.booking.status = "canceled"
        self.booking.save()

        # Cập nhật tickets
        self.booking.tickets.update(status="refunded")

        return True, "Hoàn tiền thành công"

    @property
    def payment_method(self):
        """Alias cho provider để tương thích với serializers"""
        return self.provider

    @property
    def payment_time(self):
        """Alias cho paid_at để tương thích với serializers"""
        return self.paid_at

    @property
    def transaction_id(self):
        """Alias cho external_id để tương thích với serializers"""
        return self.external_id or f"TXN_{self.id.hex[:8].upper()}"
