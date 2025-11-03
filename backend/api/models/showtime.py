from django.db import models
import uuid


class Showtime(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(
        "api.Movie", on_delete=models.RESTRICT, related_name="showtimes"
    )
    auditorium = models.ForeignKey(
        "api.Auditorium", on_delete=models.RESTRICT, related_name="showtimes"
    )
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

    def can_book(self):
        """Check có thể đặt vé cho suất chiếu này không"""
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()

        if self.status != "scheduled":
            return False, "Suất chiếu không khả dụng"

        if now >= self.start_time:
            return False, "Suất chiếu đã bắt đầu"

        # Ngừng nhận booking 30 phút trước chiếu
        booking_deadline = self.start_time - timedelta(minutes=30)
        if now >= booking_deadline:
            return False, "Đã hết thời hạn đặt vé"

        return True, "OK"

    def get_available_seats_count(self):
        """Đếm số ghế còn trống"""
        from .ticket import Ticket

        total_seats = self.auditorium.seats.count()
        booked_seats = Ticket.objects.filter(
            showtime=self, status__in=["reserved", "paid", "checked_in"]
        ).count()

        return total_seats - booked_seats

    def get_occupancy_rate(self):
        """Tính tỷ lệ lấp đầy"""
        total_seats = self.auditorium.seats.count()
        if total_seats == 0:
            return 0

        available_seats = self.get_available_seats_count()
        booked_seats = total_seats - available_seats

        return round((booked_seats / total_seats) * 100, 1)

    def get_realtime_status(self):
        """Lấy trạng thái theo thời gian thực"""
        from django.utils import timezone

        now = timezone.now()

        # Đã kết thúc
        if now >= self.end_time:
            return {"status": "finished", "label": "Đã kết thúc", "color": "gray"}

        # Đang chiếu
        elif now >= self.start_time and now < self.end_time:
            return {"status": "showing", "label": "Đang chiếu", "color": "green"}

        # Sắp chiếu
        else:
            from datetime import timedelta

            time_until_start = (self.start_time - now).total_seconds() / 60  # phút

            if time_until_start <= 30:
                return {
                    "status": "starting_soon",
                    "label": f"Sắp chiếu ({int(time_until_start)} phút nữa)",
                    "color": "orange",
                }
            else:
                return {"status": "scheduled", "label": "Chưa chiếu", "color": "blue"}
