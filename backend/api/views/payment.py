from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from datetime import timedelta
from ..models import Payment, Booking
from ..serializers.payment import (
    PaymentSerializer, PaymentCreateSerializer, PaymentDetailSerializer, RefundSerializer
)

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'provider']
    ordering_fields = ['paid_at', 'amount']
    ordering = ['-paid_at']
    
    def get_queryset(self):
        # User chỉ xem được payment của mình
        return Payment.objects.filter(
            booking__user=self.request.user
        ).select_related(
            'booking__showtime__movie',
            'booking__showtime__auditorium'
        ).prefetch_related('booking__tickets__seat')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PaymentDetailSerializer
        elif self.action == 'create':
            return PaymentCreateSerializer
        elif self.action == 'refund':
            return RefundSerializer
        return PaymentSerializer
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Hoàn tiền"""
        payment = self.get_object()
        serializer = self.get_serializer(payment, data=request.data)
        
        if serializer.is_valid():
            refunded_payment = serializer.save()
            
            return Response({
                'message': 'Hoàn tiền thành công',
                'payment_id': refunded_payment.id,
                'refund_amount': refunded_payment.amount,
                'booking_id': refunded_payment.booking.id
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Xuất hóa đơn thanh toán"""
        payment = self.get_object()
        
        if payment.status != 'completed':
            return Response({
                'error': 'Chỉ có thể xuất hóa đơn cho payment đã hoàn thành'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        receipt_data = PaymentDetailSerializer(payment).data
        receipt_data['receipt_info'] = {
            'receipt_number': f"RC_{payment.id.hex[:8].upper()}",
            'issued_date': timezone.now(),
            'customer': payment.booking.user.username,
            'cinema_info': {
                'name': 'Cinema Booking System',
                'address': '123 Main Street, City',
                'phone': '0123-456-789'
            }
        }
        
        return Response(receipt_data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Lịch sử thanh toán"""
        payments = self.get_queryset().order_by('-paid_at')
        
        # Filter theo status nếu có
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        # Filter theo thời gian
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            try:
                from datetime import datetime
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                payments = payments.filter(payment_time__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                payments = payments.filter(payment_time__date__lte=date_to)
            except ValueError:
                pass
        
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Thống kê thanh toán của user"""
        payments = self.get_queryset()
        
        # Tổng số giao dịch
        total_payments = payments.count()
        completed_payments = payments.filter(status='completed').count()
        refunded_payments = payments.filter(status='refunded').count()
        
        # Tổng số tiền
        from django.db.models import Sum
        total_amount = payments.filter(status='completed').aggregate(
            Sum('amount')
        )['amount__sum'] or 0
        
        # Phương thức thanh toán phổ biến
        payment_methods = payments.values('provider').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        return Response({
            'total_payments': total_payments,
            'completed_payments': completed_payments,
            'refunded_payments': refunded_payments,
            'total_amount': total_amount,
            'payment_methods': payment_methods,
            'success_rate': (completed_payments / total_payments * 100) if total_payments > 0 else 0
        })