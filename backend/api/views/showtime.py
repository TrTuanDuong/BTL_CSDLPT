from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from ..models import Showtime, Movie, Auditorium
from ..models import Seat
from ..serializers.showtime import (
    ShowtimeSerializer,
    ShowtimeCreateSerializer,
    ShowtimeDetailSerializer,
)
from django.db import models


class ShowtimeViewSet(viewsets.ModelViewSet):
    queryset = Showtime.objects.select_related("movie", "auditorium").all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["movie", "auditorium", "status"]
    ordering_fields = ["start_time", "base_price"]
    ordering = ["start_time"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ShowtimeDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ShowtimeCreateSerializer
        return ShowtimeSerializer

    def get_permissions(self):
        if self.action in [
            "list",
            "retrieve",
            "today",
            "upcoming",
            "by_movie",
            "seats",
        ]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        # ✅ LOGIC MỚI: Chỉ hiển thị suất chiếu chưa bắt đầu (cho user)
        # Admin vẫn thấy tất cả
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            # Lọc bỏ suất chiếu đã bắt đầu (start_time < now)
            queryset = queryset.filter(start_time__gte=timezone.now())

        # Filter theo ngày nếu có query param
        date = self.request.query_params.get("date", None)
        if date:
            try:
                filter_date = datetime.strptime(date, "%Y-%m-%d").date()
                queryset = queryset.filter(start_time__date=filter_date)
            except ValueError:
                pass

        return queryset

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Suất chiếu hôm nay"""
        today = timezone.now().date()
        showtimes = (
            self.get_queryset()
            .filter(start_time__date=today, start_time__gte=timezone.now())
            .order_by("start_time")
        )

        serializer = self.get_serializer(showtimes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Suất chiếu sắp tới (7 ngày tới)"""
        now = timezone.now()
        next_week = now + timedelta(days=7)

        showtimes = (
            self.get_queryset()
            .filter(start_time__gte=now, start_time__lte=next_week)
            .order_by("start_time")
        )

        serializer = self.get_serializer(showtimes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_movie(self, request):
        """Nhóm suất chiếu theo phim"""
        movie_id = request.query_params.get("movie_id")
        if not movie_id:
            return Response(
                {"error": "movie_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(
                {"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND
            )

        showtimes = (
            self.get_queryset()
            .filter(movie=movie, start_time__gte=timezone.now())
            .order_by("start_time")
        )

        # Nhóm theo ngày
        showtimes_by_date = {}
        for showtime in showtimes:
            date_str = showtime.start_time.strftime("%Y-%m-%d")
            if date_str not in showtimes_by_date:
                showtimes_by_date[date_str] = []
            showtimes_by_date[date_str].append(ShowtimeSerializer(showtime).data)

        return Response(
            {
                "movie": {
                    "id": movie.id,
                    "title": movie.title,
                    "duration_min": movie.duration_min,
                    "rating": movie.rating,
                },
                "showtimes_by_date": showtimes_by_date,
            }
        )

    # Thay thế method seats() trong api/views/showtime.py

    @action(detail=True, methods=["get"])
    def seats(self, request, pk=None):
        """Xem sơ đồ ghế và tình trạng đặt cho suất chiếu"""
        showtime = self.get_object()

        try:
            from ..models import Ticket

            # Lấy tất cả ghế trong auditorium
            seats = showtime.auditorium.seats.all().order_by("row_label", "seat_number")

            # Lấy danh sách ghế đã được đặt cho suất chiếu này
            booked_seat_ids = Ticket.objects.filter(
                showtime=showtime,
                status__in=[
                    "reserved",
                    "paid",
                    "checked_in",
                ],  # ← GIỮ NGUYÊN (đúng cho Ticket)
            ).values_list("seat_id", flat=True)

            # Nhóm ghế theo hàng
            seats_by_row = {}
            total_booked = 0

            for seat in seats:
                if seat.row_label not in seats_by_row:
                    seats_by_row[seat.row_label] = []

                # Kiểm tra ghế có được đặt không
                is_booked = seat.id in booked_seat_ids
                if is_booked:
                    total_booked += 1

                # Basic seat info
                seat_data = {
                    "id": str(seat.id),
                    "row_label": seat.row_label,
                    "seat_number": seat.seat_number,
                    "seat_type": seat.seat_type,
                    "is_available": not is_booked,  # ← Real-time availability
                    "status": "booked" if is_booked else "available",
                }

                # Tính giá vé theo loại ghế
                try:
                    multiplier = seat.PRICE_MULTIPLIER.get(seat.seat_type, 1.0)
                    seat_data["price_multiplier"] = multiplier
                    seat_data["ticket_price"] = float(showtime.base_price) * multiplier
                except:
                    seat_data["price_multiplier"] = 1.0
                    seat_data["ticket_price"] = float(showtime.base_price)

                seats_by_row[seat.row_label].append(seat_data)

            # Thống kê availability
            total_seats = seats.count()
            available_seats = total_seats - total_booked

            return Response(
                {
                    "showtime": {
                        "id": str(showtime.id),
                        "movie_title": showtime.movie.title,
                        "auditorium_name": showtime.auditorium.name,
                        "start_time": showtime.start_time,
                        "end_time": showtime.end_time,
                        "base_price": float(showtime.base_price),
                        "status": showtime.status,
                    },
                    "seats_by_row": seats_by_row,
                    "seat_pricing": {
                        "base_price": float(showtime.base_price),
                        "standard_price": float(showtime.base_price)
                        * Seat.PRICE_MULTIPLIER[Seat.STANDARD],
                        "vip_price": float(showtime.base_price)
                        * Seat.PRICE_MULTIPLIER[Seat.VIP],
                        "couple_price": float(showtime.base_price)
                        * Seat.PRICE_MULTIPLIER[Seat.COUPLE],
                    },
                    "availability": {
                        "total_seats": total_seats,
                        "booked_seats": total_booked,
                        "available_seats": available_seats,
                        "occupancy_rate": (
                            round((total_booked / total_seats) * 100, 1)
                            if total_seats > 0
                            else 0
                        ),
                    },
                    "booking_info": {
                        "can_book": showtime.status == "scheduled"
                        and showtime.start_time > timezone.now(),
                        "booking_deadline": showtime.start_time
                        - timedelta(minutes=30),  # 30 phút trước chiếu
                        "time_until_showtime": (
                            (showtime.start_time - timezone.now()).total_seconds()
                            if showtime.start_time > timezone.now()
                            else 0
                        ),
                    },
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def bookings(self, request, pk=None):
        """Xem danh sách booking cho suất chiếu (Admin only)"""
        if not request.user.is_staff:
            return Response(
                {"error": "Chỉ admin mới có thể xem thông tin này"},
                status=status.HTTP_403_FORBIDDEN,
            )

        showtime = self.get_object()

        from ..models import Booking

        bookings = (
            Booking.objects.filter(showtime=showtime)
            .select_related("user")
            .prefetch_related("tickets__seat")
        )

        booking_data = []
        for booking in bookings:
            tickets_info = []
            for ticket in booking.tickets.all():
                tickets_info.append(
                    {
                        "seat": f"{ticket.seat.row_label}{ticket.seat.seat_number}",
                        "seat_type": ticket.seat.seat_type,
                        "price": ticket.price,
                        "status": ticket.status,
                    }
                )

            booking_data.append(
                {
                    "id": booking.id,
                    "user": booking.user.username,
                    "created_at": booking.created_at,  # ✅ SỬA: booking_time -> created_at
                    "status": booking.status,
                    "total_amount": booking.total_amount,
                    "tickets_count": booking.tickets.count(),
                    "tickets": tickets_info,
                }
            )

        return Response(
            {
                "showtime": {
                    "id": showtime.id,
                    "movie_title": showtime.movie.title,
                    "start_time": showtime.start_time,
                },
                "bookings": booking_data,
                "summary": {
                    "total_bookings": bookings.count(),
                    "paid_bookings": bookings.filter(status="paid").count(),
                    "reserved_bookings": bookings.filter(status="reserved").count(),
                    "cancelled_bookings": bookings.filter(status="cancelled").count(),
                },
            }
        )

    @action(detail=True, methods=["get"])
    def occupancy(self, request, pk=None):
        """Xem tỷ lệ lấp đầy phòng chiếu"""
        showtime = self.get_object()
        total_seats = showtime.auditorium.seats.count()

        # Thống kê ticket theo status
        ticket_stats = (
            Ticket.objects.filter(showtime=showtime)
            .values("status")
            .annotate(count=models.Count("id"))
        )

        stats = {
            "reserved": 0,
            "paid": 0,
            "checked_in": 0,
            "canceled": 0,
            "refunded": 0,
        }

        for stat in ticket_stats:
            stats[stat["status"]] = stat["count"]

        booked_seats = stats["reserved"] + stats["paid"] + stats["checked_in"]

        return Response(
            {
                "showtime": {
                    "id": showtime.id,
                    "movie_title": showtime.movie.title,
                    "start_time": showtime.start_time,
                    "auditorium_name": showtime.auditorium.name,
                },
                "occupancy": {
                    "total_seats": total_seats,
                    "available_seats": total_seats - booked_seats,
                    "booked_seats": booked_seats,
                    "occupancy_rate": (
                        round((booked_seats / total_seats) * 100, 1)
                        if total_seats > 0
                        else 0
                    ),
                },
                "ticket_breakdown": stats,
                "revenue": {
                    "total_revenue": sum(
                        [
                            ticket.price
                            for ticket in Ticket.objects.filter(
                                showtime=showtime, status__in=["paid", "checked_in"]
                            )
                        ]
                    ),
                    "potential_revenue": float(showtime.base_price)
                    * total_seats,  # Nếu full
                },
            }
        )

    # Thêm action này để check real-time

    @action(detail=True, methods=["get"])
    def check_seats(self, request, pk=None):
        """Kiểm tra tình trạng ghế cụ thể"""
        showtime = self.get_object()
        seat_ids = request.query_params.get("seat_ids", "").split(",")

        if not seat_ids or seat_ids == [""]:
            return Response(
                {"error": "seat_ids parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from ..models import Ticket, Seat

        # Lấy thông tin ghế
        seats = Seat.objects.filter(id__in=seat_ids, auditorium=showtime.auditorium)

        # Check availability
        booked_seat_ids = Ticket.objects.filter(
            showtime=showtime,
            seat__in=seats,
            status__in=["reserved", "paid", "checked_in"],
        ).values_list("seat_id", flat=True)

        seat_status = []
        for seat in seats:
            is_available = seat.id not in booked_seat_ids
            seat_status.append(
                {
                    "seat_id": str(seat.id),
                    "seat_label": f"{seat.row_label}{seat.seat_number}",
                    "seat_type": seat.seat_type,
                    "is_available": is_available,
                    "status": "available" if is_available else "booked",
                    "price": float(showtime.base_price)
                    * seat.PRICE_MULTIPLIER[seat.seat_type],
                }
            )

        return Response(
            {
                "showtime_id": str(showtime.id),
                "seats": seat_status,
                "can_book_all": all(seat["is_available"] for seat in seat_status),
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def admin_all(self, request):
        """✅ ADMIN: Xem tất cả showtime với trạng thái real-time"""
        if not request.user.is_staff:
            return Response(
                {"error": "Chỉ admin mới có thể xem"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Lấy TẤT CẢ showtime (không filter)
        showtimes = (
            Showtime.objects.select_related("movie", "auditorium")
            .all()
            .order_by("-start_time")
        )

        # Phân nhóm theo trạng thái
        now = timezone.now()
        showing = []  # Đang chiếu
        upcoming = []  # Sắp chiếu
        finished = []  # Đã kết thúc

        for showtime in showtimes:
            realtime = showtime.get_realtime_status()
            data = ShowtimeSerializer(showtime).data
            data["realtime_status"] = realtime

            if realtime["status"] == "showing":
                showing.append(data)
            elif realtime["status"] == "finished":
                finished.append(data)
            else:
                upcoming.append(data)

        return Response(
            {
                "summary": {
                    "total": showtimes.count(),
                    "showing": len(showing),
                    "upcoming": len(upcoming),
                    "finished": len(finished),
                },
                "showing": showing,
                "upcoming": upcoming,
                "finished": finished,
            }
        )
