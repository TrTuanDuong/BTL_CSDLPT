from django.utils import timezone
from .models import Booking


class BookingExpiryMiddleware:
    """Middleware để check và hủy booking hết hạn"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Cleanup expired bookings trước khi xử lý request
        self.cleanup_expired_bookings()
        response = self.get_response(request)
        return response

    def cleanup_expired_bookings(self):
        """Hủy các booking hết hạn 10 phút"""
        try:
            now = timezone.now()
            expired_bookings = Booking.objects.filter(
                status="pending",
                expires_at__lt=now,  # ← Dùng expires_at thay vì tính toán
            )

            for booking in expired_bookings:
                booking.status = "canceled"
                booking.save()
                booking.tickets.update(status="canceled")

        except Exception as e:
            print(f"Error in cleanup_expired_bookings: {e}")
