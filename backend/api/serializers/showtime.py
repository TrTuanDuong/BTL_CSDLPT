from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from ..models import Showtime, Movie, Auditorium, Ticket


class ShowtimeSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)
    movie_duration = serializers.IntegerField(
        source="movie.duration_min", read_only=True
    )
    auditorium_name = serializers.CharField(source="auditorium.name", read_only=True)
    available_seats = serializers.SerializerMethodField()
    total_seats = serializers.SerializerMethodField()
    occupancy_rate = serializers.SerializerMethodField()
    booking_status = serializers.SerializerMethodField()
    realtime_status = (
        serializers.SerializerMethodField()
    )  # ✅ THÊM: Trạng thái real-time

    class Meta:
        model = Showtime
        fields = [
            "id",
            "movie",
            "movie_title",
            "movie_duration",
            "auditorium",
            "auditorium_name",
            "start_time",
            "end_time",
            "base_price",
            "status",
            "available_seats",
            "total_seats",
            "occupancy_rate",
            "booking_status",
            "realtime_status",  # ✅ THÊM field
        ]

    def get_available_seats(self, obj):
        from ..models import Ticket

        total_seats = obj.auditorium.seats.count()
        booked_seats = Ticket.objects.filter(
            showtime=obj, status__in=["reserved", "paid", "checked_in"]
        ).count()
        return total_seats - booked_seats

    def get_total_seats(self, obj):
        return obj.auditorium.seats.count()

    def get_occupancy_rate(self, obj):
        from ..models import Ticket

        total_seats = obj.auditorium.seats.count()
        booked_seats = Ticket.objects.filter(
            showtime=obj, status__in=["reserved", "paid", "checked_in"]
        ).count()
        return round((booked_seats / total_seats) * 100, 1) if total_seats > 0 else 0

    def get_booking_status(self, obj):
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        booking_deadline = obj.start_time - timedelta(minutes=30)

        if obj.status != "scheduled":
            return "unavailable"
        elif now > obj.start_time:
            return "ended"
        elif now > booking_deadline:
            return "booking_closed"
        else:
            return "available"

    def get_realtime_status(self, obj):
        """✅ THÊM: Lấy trạng thái theo thời gian thực"""
        return obj.get_realtime_status()


class ShowtimeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Showtime
        fields = ["movie", "auditorium", "start_time", "base_price"]

    def validate_start_time(self, value):
        # Không được tạo suất chiếu trong quá khứ
        if value <= timezone.now():
            raise serializers.ValidationError("Thời gian chiếu phải trong tương lai")
        return value

    def validate(self, data):
        movie = data["movie"]
        auditorium = data["auditorium"]
        start_time = data["start_time"]

        # Tính end_time dựa trên duration của movie
        end_time = start_time + timedelta(
            minutes=movie.duration_min + 30
        )  # +30 phút dọn dẹp

        # Kiểm tra trùng lịch trong cùng auditorium
        overlapping_showtimes = Showtime.objects.filter(
            auditorium=auditorium, start_time__lt=end_time, end_time__gt=start_time
        )

        if self.instance:  # Nếu đang update
            overlapping_showtimes = overlapping_showtimes.exclude(id=self.instance.id)

        if overlapping_showtimes.exists():
            overlap = overlapping_showtimes.first()
            raise serializers.ValidationError(
                f"Trùng lịch với suất chiếu '{overlap.movie.title}' "
                f"từ {overlap.start_time.strftime('%H:%M')} đến {overlap.end_time.strftime('%H:%M')}"
            )

        return data

    def create(self, validated_data):
        movie = validated_data["movie"]
        start_time = validated_data["start_time"]

        # Tự động tính end_time
        end_time = start_time + timedelta(minutes=movie.duration_min + 30)

        showtime = Showtime.objects.create(**validated_data, end_time=end_time)

        return showtime


class ShowtimeDetailSerializer(ShowtimeSerializer):
    movie_info = serializers.SerializerMethodField()
    auditorium_info = serializers.SerializerMethodField()
    seat_pricing = serializers.SerializerMethodField()

    class Meta(ShowtimeSerializer.Meta):
        fields = ShowtimeSerializer.Meta.fields + [
            "movie_info",
            "auditorium_info",
            "seat_pricing",
        ]

    def get_movie_info(self, obj):
        return {
            "id": obj.movie.id,
            "title": obj.movie.title,
            "duration_min": obj.movie.duration_min,
            "rating": obj.movie.rating,
            "poster_url": obj.movie.poster_url,
        }

    def get_auditorium_info(self, obj):
        return {
            "id": obj.auditorium.id,
            "name": obj.auditorium.name,
            "total_seats": obj.auditorium.seats.count(),
            "seat_types": {
                "standard": obj.auditorium.seats.filter(seat_type="standard").count(),
                "vip": obj.auditorium.seats.filter(seat_type="vip").count(),
                "couple": obj.auditorium.seats.filter(seat_type="couple").count(),
            },
        }

    def get_seat_pricing(self, obj):
        from ..models import Seat

        return {
            "base_price": obj.base_price,
            "standard_price": obj.base_price * Seat.PRICE_MULTIPLIER["standard"],
            "vip_price": obj.base_price * Seat.PRICE_MULTIPLIER["vip"],
            "couple_price": obj.base_price * Seat.PRICE_MULTIPLIER["couple"],
        }
