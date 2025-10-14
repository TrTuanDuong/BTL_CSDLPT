from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..models import Booking, Ticket, Showtime, Seat, User

class TicketSerializer(serializers.ModelSerializer):
    seat_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = ['id', 'seat', 'seat_info', 'price', 'status']
    
    def get_seat_info(self, obj):
        return {
            'row_label': obj.seat.row_label,
            'seat_number': obj.seat.seat_number,
            'seat_type': obj.seat.seat_type,
        }

class BookingSerializer(serializers.ModelSerializer):
    tickets = TicketSerializer(many=True, read_only=True)
    showtime_info = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'user', 'showtime', 'showtime_info', 'booking_time', 
                 'total_amount', 'status', 'tickets']
    
    def get_showtime_info(self, obj):
        return {
            'movie_title': obj.showtime.movie.title,
            'auditorium_name': obj.showtime.auditorium.name,
            'start_time': obj.showtime.start_time,
            'end_time': obj.showtime.end_time,
        }

class BookingCreateSerializer(serializers.ModelSerializer):
    seat_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        min_length=1,
        max_length=10  # Giới hạn tối đa 10 ghế 1 lần đặt
    )
    
    class Meta:
        model = Booking
        fields = ['showtime', 'seat_ids']
    
    def validate_seat_ids(self, value):
        # Kiểm tra không có ghế trùng lặp
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Không được chọn ghế trùng lặp")
        return value
    
    def validate(self, data):
        showtime = data['showtime']
        seat_ids = data['seat_ids']
        
        # Kiểm tra suất chiếu còn hiệu lực
        if showtime.start_time <= timezone.now():
            raise serializers.ValidationError("Không thể đặt vé cho suất chiếu đã bắt đầu")
        
        # Kiểm tra suất chiếu đang hoạt động
        if showtime.status != 'scheduled':
            raise serializers.ValidationError("Suất chiếu không khả dụng")
        
        # Kiểm tra ghế tồn tại và thuộc đúng auditorium
        seats = Seat.objects.filter(
            id__in=seat_ids,
            auditorium=showtime.auditorium
        )
        
        if seats.count() != len(seat_ids):
            raise serializers.ValidationError("Một số ghế không tồn tại hoặc không thuộc phòng chiếu này")
        
        # Kiểm tra ghế đã được đặt chưa
        existing_tickets = Ticket.objects.filter(
            showtime=showtime,
            seat__in=seats,
            status__in=['reserved', 'paid', 'checked_in']
        )
        
        if existing_tickets.exists():
            booked_seats = existing_tickets.values_list('seat__row_label', 'seat__seat_number')
            seat_labels = [f"{row}{num}" for row, num in booked_seats]
            raise serializers.ValidationError(f"Ghế đã được đặt: {', '.join(seat_labels)}")
        
        return data
    
    def create(self, validated_data):
        showtime = validated_data['showtime']
        seat_ids = validated_data.pop('seat_ids')
        user = self.context['request'].user
        
        with transaction.atomic():
            # Tạo booking
            booking = Booking.objects.create(
                user=user,
                showtime=showtime,
                status='reserved'  # Tạm giữ ghế 15 phút
            )
            
            # Tạo tickets cho từng ghế
            total_amount = 0
            seats = Seat.objects.filter(id__in=seat_ids)
            
            for seat in seats:
                # Tính giá vé theo loại ghế
                price = showtime.base_price * seat.PRICE_MULTIPLIER[seat.seat_type]
                
                Ticket.objects.create(
                    booking=booking,
                    showtime=showtime,
                    seat=seat,
                    price=price,
                    status='reserved'
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
        fields = BookingSerializer.Meta.fields + ['payment_info', 'time_remaining']
    
    def get_payment_info(self, obj):
        if hasattr(obj, 'payment'):
            return {
                'payment_id': obj.payment.id,
                'payment_method': obj.payment.payment_method,
                'payment_status': obj.payment.status,
                'payment_time': obj.payment.payment_time,
            }
        return None
    
    def get_time_remaining(self, obj):
        if obj.status == 'reserved':
            # 15 phút để thanh toán
            expire_time = obj.booking_time + timedelta(minutes=15)
            remaining = expire_time - timezone.now()
            
            if remaining.total_seconds() > 0:
                return int(remaining.total_seconds())
            else:
                return 0
        return None