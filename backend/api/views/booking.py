from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta
from ..models import Booking, Ticket, Showtime
from ..serializers.booking import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingDetailSerializer,
    TicketSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    queryset = Booking.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status", "showtime"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # User chỉ xem được booking của mình
        return (
            Booking.objects.filter(user=self.request.user)
            .select_related("showtime__movie", "showtime__auditorium")
            .prefetch_related("tickets__seat")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookingDetailSerializer
        elif self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Hủy booking"""
        booking = self.get_object()

        # Sửa condition check
        if booking.status not in ["pending"]:  # ← SỬA TỪ 'reserved'
            return Response(
                {"error": "Chỉ có thể hủy booking đang pending"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cập nhật status
        booking.status = "canceled"  # ← SỬA TỪ 'cancelled'
        booking.save()

        # Cập nhật tickets
        booking.tickets.update(status="canceled")  # ← THÊM STATUS CHO TICKET

        return Response(
            {"message": "Đã hủy booking thành công", "booking_id": booking.id}
        )

    @action(detail=False, methods=["get"])
    def history(self, request):
        """Lịch sử đặt vé của user"""
        bookings = self.get_queryset().order_by("-created_at")  # ← SỬA TỪ booking_time

        # Filter theo status nếu có
        status_filter = request.query_params.get("status")
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Vé sắp tới (chưa chiếu)"""
        now = timezone.now()
        upcoming_bookings = (
            self.get_queryset()
            .filter(
                showtime__start_time__gt=now,
                status="paid",  # ← Chỉ booking đã thanh toán
            )
            .order_by("showtime__start_time")
        )

        serializer = self.get_serializer(upcoming_bookings, many=True)
        return Response(serializer.data)


class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TicketSerializer
    queryset = Ticket.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status", "showtime", "booking"]
    ordering_fields = ["booked_at"]  # ← Chỉ dùng field có trong Ticket model
    ordering = ["-booked_at"]  # ← Không dùng booking__booking_time nữa

    def get_queryset(self):
        # User chỉ xem được ticket của mình
        return Ticket.objects.filter(booking__user=self.request.user).select_related(
            "seat", "showtime__movie", "booking"
        )

    @action(detail=True, methods=["post"])
    def check_in(self, request, pk=None):
        """Check-in vé tại rạp"""
        ticket = self.get_object()

        if ticket.status != "paid":
            return Response(
                {"error": "Chỉ có thể check-in vé đã thanh toán"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Kiểm tra thời gian check-in (30 phút trước suất chiếu)
        now = timezone.now()
        checkin_time = ticket.showtime.start_time - timedelta(minutes=30)

        if now < checkin_time:
            return Response(
                {"error": f'Chỉ có thể check-in từ {checkin_time.strftime("%H:%M")}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if now > ticket.showtime.end_time:
            return Response(
                {"error": "Suất chiếu đã kết thúc"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check-in thành công
        ticket.status = "checked_in"
        ticket.save()

        return Response(
            {
                "message": "Check-in thành công",
                "ticket_id": ticket.id,
                "seat": f"{ticket.seat.row_label}{ticket.seat.seat_number}",
                "showtime": ticket.showtime.start_time,
            }
        )
