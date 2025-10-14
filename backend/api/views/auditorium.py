from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Auditorium, Seat
from ..serializers.auditorium import (
    AuditoriumSerializer, AuditoriumDetailSerializer, 
    AuditoriumCreateSerializer, SeatSerializer
)

class AuditoriumViewSet(viewsets.ModelViewSet):
    queryset = Auditorium.objects.prefetch_related('seats').all()
    filter_backends = [DjangoFilterBackend]
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AuditoriumDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AuditoriumCreateSerializer
        return AuditoriumSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'seats']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def seats(self, request, pk=None):
        """Lấy sơ đồ ghế của phòng chiếu"""
        auditorium = self.get_object()
        seats = auditorium.seats.all().order_by('row_label', 'seat_number')
        
        # Nhóm ghế theo hàng
        seats_by_row = {}
        for seat in seats:
            if seat.row_label not in seats_by_row:
                seats_by_row[seat.row_label] = []
            seats_by_row[seat.row_label].append(SeatSerializer(seat).data)
        
        return Response({
            'auditorium': AuditoriumSerializer(auditorium).data,
            'seats_by_row': seats_by_row,
            'total_seats': seats.count()
        })
    
    @action(detail=True, methods=['post'])
    def regenerate_seats(self, request, pk=None):
        """Tạo lại ghế cho phòng chiếu (xóa hết ghế cũ)"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        auditorium = self.get_object()
        
        # Xóa tất cả ghế cũ
        auditorium.seats.all().delete()
        
        # Tạo lại ghế
        serializer = AuditoriumCreateSerializer()
        serializer.create_seats(auditorium)
        
        return Response({
            'message': f'Đã tạo lại ghế cho phòng {auditorium.name}',
            'total_seats': auditorium.seats.count()
        })

class SeatViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Seat.objects.select_related('auditorium').all()
    serializer_class = SeatSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['auditorium', 'seat_type', 'row_label']
    ordering = ['auditorium__name', 'row_label', 'seat_number']