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
    ShowtimeSerializer, ShowtimeCreateSerializer, ShowtimeDetailSerializer
)

class ShowtimeViewSet(viewsets.ModelViewSet):
    queryset = Showtime.objects.select_related('movie', 'auditorium').all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movie', 'auditorium', 'status']
    ordering_fields = ['start_time', 'base_price']
    ordering = ['start_time']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ShowtimeDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ShowtimeCreateSerializer
        return ShowtimeSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'today', 'upcoming', 'by_movie', 'seats']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter theo ngày nếu có query param
        date = self.request.query_params.get('date', None)
        if date:
            try:
                filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date=filter_date)
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Suất chiếu hôm nay"""
        today = timezone.now().date()
        showtimes = self.get_queryset().filter(
            start_time__date=today,
            start_time__gte=timezone.now()
        ).order_by('start_time')
        
        serializer = self.get_serializer(showtimes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Suất chiếu sắp tới (7 ngày tới)"""
        now = timezone.now()
        next_week = now + timedelta(days=7)
        
        showtimes = self.get_queryset().filter(
            start_time__gte=now,
            start_time__lte=next_week
        ).order_by('start_time')
        
        serializer = self.get_serializer(showtimes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_movie(self, request):
        """Nhóm suất chiếu theo phim"""
        movie_id = request.query_params.get('movie_id')
        if not movie_id:
            return Response({'error': 'movie_id is required'},
                        status=status.HTTP_400_BAD_REQUEST)
        
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response({'error': 'Movie not found'},
                        status=status.HTTP_404_NOT_FOUND)
        
        showtimes = self.get_queryset().filter(
            movie=movie,
            start_time__gte=timezone.now()
        ).order_by('start_time')
        
        # Nhóm theo ngày
        showtimes_by_date = {}
        for showtime in showtimes:
            date_str = showtime.start_time.strftime('%Y-%m-%d')
            if date_str not in showtimes_by_date:
                showtimes_by_date[date_str] = []
            showtimes_by_date[date_str].append(
                ShowtimeSerializer(showtime).data
            )
        
        return Response({
            'movie': {
                'id': movie.id,
                'title': movie.title,
                'duration_min': movie.duration_min,
                'rating': movie.rating
            },
            'showtimes_by_date': showtimes_by_date
        })
    
    @action(detail=True, methods=['get'])
    def seats(self, request, pk=None):
        """Xem sơ đồ ghế và tình trạng đặt cho suất chiếu"""
        showtime = self.get_object()
        
        try:
            # Lấy tất cả ghế trong auditorium
            seats = showtime.auditorium.seats.all().order_by('row_label', 'seat_number')
            
            # Nhóm ghế theo hàng
            seats_by_row = {}
            for seat in seats:
                if seat.row_label not in seats_by_row:
                    seats_by_row[seat.row_label] = []
                
                # Basic seat info
                seat_data = {
                    'id': str(seat.id),
                    'row_label': seat.row_label,
                    'seat_number': seat.seat_number,
                    'seat_type': seat.seat_type,
                    'is_available': True  # Tạm thời tất cả đều available
                }
                
                # Tính giá vé theo loại ghế
                try:
                    multiplier = seat.PRICE_MULTIPLIER.get(seat.seat_type, 1.0)
                    seat_data['price_multiplier'] = multiplier
                    seat_data['ticket_price'] = float(showtime.base_price) * multiplier
                except:
                    seat_data['price_multiplier'] = 1.0
                    seat_data['ticket_price'] = float(showtime.base_price)

                seats_by_row[seat.row_label].append(seat_data)
            return Response({
                'showtime': {
                    'id': str(showtime.id),
                    'movie_title': showtime.movie.title,
                    'auditorium_name': showtime.auditorium.name,
                    'start_time': showtime.start_time,
                    'end_time': showtime.end_time,
                    'base_price': float(showtime.base_price),
                },
                'seats_by_row': seats_by_row,
                'seat_pricing': {
                'base_price': float(showtime.base_price),
                'standard_price': float(showtime.base_price) * Seat.PRICE_MULTIPLIER[Seat.STANDARD],
                'vip_price': float(showtime.base_price) * Seat.PRICE_MULTIPLIER[Seat.VIP],
                'couple_price': float(showtime.base_price) * Seat.PRICE_MULTIPLIER[Seat.COUPLE],
},
                'availability': {
                    'total_seats': seats.count(),
                    'booked_seats': 0,  # Chưa có booking system
                    'available_seats': seats.count()
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)