from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from ..models import Payment, Booking


class PaymentSerializer(serializers.ModelSerializer):
    booking_info = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "booking_info",
            "amount",
            #"payment_method",
            "provider",
            "status",
            "payment_time",
            "transaction_id",
        ]

    def get_booking_info(self, obj):
        return {
            "booking_id": obj.booking.id,
            "showtime": {
                "movie_title": obj.booking.showtime.movie.title,
                "start_time": obj.booking.showtime.start_time,
                "auditorium": obj.booking.showtime.auditorium.name,
            },
            "tickets_count": obj.booking.tickets.count(),
            "total_amount": obj.booking.total_amount,
        }


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["booking", "provider"]  # ← SỬA TỪ payment_method

    def validate_booking(self, value):
        # Kiểm tra booking thuộc về user hiện tại
        request = self.context["request"]
        if value.user != request.user:
            raise serializers.ValidationError("Booking không thuộc về bạn")

        # Kiểm tra booking đang ở trạng thái reserved
        if value.status != "pending":
            raise serializers.ValidationError(
                "Booking không ở trạng thái có thể thanh toán"
            )

        # Kiểm tra booking chưa quá hạn (10 phút)
        from datetime import timedelta

        expire_time = value.booking_time + timedelta(minutes=10)
        if timezone.now() > expire_time:
            raise serializers.ValidationError("Booking đã quá hạn thanh toán")

        # Kiểm tra chưa có payment nào cho booking này
        if hasattr(value, "payment"):
            raise serializers.ValidationError("Booking này đã có payment")

        return value

    def create(self, validated_data):
        booking = validated_data["booking"]
        provider = validated_data["provider"]  # ← SỬA TỪ payment_method

        with transaction.atomic():
            payment = Payment.objects.create(
                booking=booking,
                amount=booking.total_amount,
                provider=provider,  # ← SỬA
                status="pending",
            )

            # Auto confirm (demo)
            payment.status = "completed"
            payment.paid_at = timezone.now()  # ← SỬA TỪ payment_time
            payment.external_id = f"TXN_{payment.id.hex[:8].upper()}"
            #payment.transaction_id = f"TXN_{payment.id.hex[:8].upper()}"
            payment.save()

            # Update booking status
            booking.status = "paid"
            booking.save()

            booking.tickets.update(status="paid")

            return payment


class PaymentDetailSerializer(PaymentSerializer):
    booking_details = serializers.SerializerMethodField()

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ["booking_details"]

    def get_booking_details(self, obj):
        tickets = obj.booking.tickets.all()
        return {
            "booking_id": obj.booking.id,
            "booking_time": obj.booking.booking_time,
            "showtime": {
                "id": obj.booking.showtime.id,
                "movie_title": obj.booking.showtime.movie.title,
                "start_time": obj.booking.showtime.start_time,
                "end_time": obj.booking.showtime.end_time,
                "auditorium": obj.booking.showtime.auditorium.name,
            },
            "tickets": [
                {
                    "id": ticket.id,
                    "seat": f"{ticket.seat.row_label}{ticket.seat.seat_number}",
                    "seat_type": ticket.seat.seat_type,
                    "price": ticket.price,
                }
                for ticket in tickets
            ],
            "total_tickets": tickets.count(),
            "total_amount": obj.amount,
        }


class RefundSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=False)

    def validate(self, data):
        payment = self.instance

        # Kiểm tra payment đã completed
        if payment.status != "completed":
            raise serializers.ValidationError(
                "Chỉ có thể hoàn tiền payment đã hoàn thành"
            )

        # Kiểm tra thời gian (có thể hoàn tiền trước 2 giờ chiếu)
        from datetime import timedelta

        refund_deadline = payment.booking.showtime.start_time - timedelta(hours=2)
        if timezone.now() > refund_deadline:
            raise serializers.ValidationError(
                "Quá thời hạn hoàn tiền (2 giờ trước suất chiếu)"
            )

        return data

    def save(self):
        payment = self.instance
        reason = self.validated_data.get("reason", "Customer request")

        with transaction.atomic():
            # Cập nhật payment status
            payment.status = "refunded"
            payment.save()

            # Cập nhật booking và tickets
            payment.booking.status = "refunded"
            payment.booking.save()

            payment.booking.tickets.update(status="refunded")

            # Tạo refund record (có thể tạo model riêng nếu cần)
            # RefundRecord.objects.create(payment=payment, reason=reason)

        return payment
