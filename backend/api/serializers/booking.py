from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..models import Booking, Ticket, Showtime, Seat, User


class TicketSerializer(serializers.ModelSerializer):
    seat_info = serializers.SerializerMethodField()
    showtime_info = serializers.SerializerMethodField()  # Thêm field này
    booking_info = serializers.SerializerMethodField()  # Thêm field này

    class Meta:
        model = Ticket
        fields = [
            "id",
            "seat",
            "seat_info",
            "price",
            "status",
            "booked_at",
            "showtime_info",
            "booking_info",
        ]  # Thêm các field mới

    def get_seat_info(self, obj):
        try:
            return {
                "row_label": obj.seat.row_label,
                "seat_number": obj.seat.seat_number,
                "seat_type": obj.seat.seat_type,
                "seat_label": f"{obj.seat.row_label}{obj.seat.seat_number}",
            }
        except Exception as e:
            print(f"Error in get_seat_info: {e}")
            return {
                "row_label": "Unknown",
                "seat_number": 0,
                "seat_type": "standard",
                "seat_label": "Unknown",
            }

    def get_showtime_info(self, obj):
        try:
            return {
                "id": str(obj.showtime.id),
                "movie_title": obj.showtime.movie.title,
                "auditorium_name": obj.showtime.auditorium.name,
                "start_time": obj.showtime.start_time,
                "end_time": obj.showtime.end_time,
            }
        except Exception as e:
            print(f"Error in get_showtime_info: {e}")
            return {"movie_title": "Unknown", "start_time": None}

    def get_booking_info(self, obj):
        try:
            return {
                "id": str(obj.booking.id),
                "booking_time": obj.booking.created_at,
                "status": obj.booking.status,
                "total_amount": obj.booking.total_amount,
            }
        except Exception as e:
            print(f"Error in get_booking_info: {e}")
            return {"id": "Unknown", "status": "unknown"}


class BookingSerializer(serializers.ModelSerializer):
    tickets = TicketSerializer(many=True, read_only=True)
    showtime_info = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "showtime",
            "showtime_info",
            #"booking_time",
            "created_at",
            "total_amount",
            "status",
            "tickets",
        ]

    def get_showtime_info(self, obj):
        return {
            "movie_title": obj.showtime.movie.title,
            "auditorium_name": obj.showtime.auditorium.name,
            "start_time": obj.showtime.start_time,
            "end_time": obj.showtime.end_time,
        }


class BookingCreateSerializer(serializers.ModelSerializer):
    seat_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, min_length=1, max_length=10
    )

    class Meta:
        model = Booking
        fields = ["showtime", "seat_ids"]  # seat_ids là write_only field

    def validate_seat_ids(self, value):
        # Kiểm tra không có ghế trùng lặp
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Không được chọn ghế trùng lặp")
        return value

    def validate(self, data):
        showtime = data["showtime"]
        seat_ids = data["seat_ids"]

        # Kiểm tra suất chiếu còn hiệu lực
        if showtime.start_time <= timezone.now():
            raise serializers.ValidationError(
                "Không thể đặt vé cho suất chiếu đã bắt đầu"
            )

        # Kiểm tra suất chiếu đang hoạt động
        if showtime.status != "scheduled":
            raise serializers.ValidationError("Suất chiếu không khả dụng")

        # Kiểm tra ghế tồn tại và thuộc đúng auditorium
        seats = Seat.objects.filter(id__in=seat_ids, auditorium=showtime.auditorium)

        if seats.count() != len(seat_ids):
            raise serializers.ValidationError(
                "Một số ghế không tồn tại hoặc không thuộc phòng chiếu này"
            )

        # Kiểm tra ghế đã được đặt chưa
        existing_tickets = Ticket.objects.filter(
            showtime=showtime,
            seat__in=seats,
            status__in=["reserved", "paid", "checked_in"],
        )

        if existing_tickets.exists():
            booked_seats = existing_tickets.values_list(
                "seat__row_label", "seat__seat_number"
            )
            seat_labels = [f"{row}{num}" for row, num in booked_seats]
            raise serializers.ValidationError(
                f"Ghế đã được đặt: {', '.join(seat_labels)}"
            )

        return data

    def create(self, validated_data):
        seat_ids = validated_data.pop("seat_ids")
        showtime = validated_data["showtime"]
        user = self.context["request"].user

        with transaction.atomic():
            # Sửa status từ 'reserved' → 'pending'
            booking = Booking.objects.create(
                user=user, showtime=showtime, status="pending"  # ← SỬA TỪ 'reserved'
            )

            # Tạo tickets cho từng ghế
            total_amount = 0
            seats = Seat.objects.filter(id__in=seat_ids)

            from decimal import Decimal
            for seat in seats:
                # Tính giá vé theo loại ghế
                multiplier = seat.PRICE_MULTIPLIER.get(seat.seat_type, 1.0)
                price = showtime.base_price * Decimal(str(multiplier))

                ticket = Ticket.objects.create(
                    booking=booking,
                    showtime=showtime,
                    seat=seat,
                    price=price,
                    status="reserved",  # ← Ticket vẫn dùng 'reserved' (đúng)
                )

                total_amount += price

            # Cập nhật tổng tiền
            booking.total_amount = total_amount
            booking.save()

            return booking


class BookingDetailSerializer(BookingSerializer):
    payment_info = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ["payment_info", "time_remaining"]

    def get_payment_info(self, obj):
        if hasattr(obj, "payment"):
            return {
                "payment_id": obj.payment.id,
                "payment_method": obj.payment.payment_method,
                "payment_status": obj.payment.status,
                "payment_time": obj.payment.payment_time,
            }
        return None

    def get_time_remaining(self, obj):
        if obj.status == "pending":
            remaining = obj.expires_at - timezone.now()
            return max(0, int(remaining.total_seconds()))
        return None
