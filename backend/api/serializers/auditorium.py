from rest_framework import serializers
from ..models import Auditorium, Seat

class SeatSerializer(serializers.ModelSerializer):
    price_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Seat
        fields = ['id', 'row_label', 'seat_number', 'seat_type', 'price_info']
    
    def get_price_info(self, obj):
        return {
            'seat_type': obj.seat_type,
            'multiplier': obj.PRICE_MULTIPLIER.get(obj.seat_type, 1.0)
        }

class AuditoriumSerializer(serializers.ModelSerializer):
    total_seats = serializers.SerializerMethodField()
    seat_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Auditorium
        fields = ['id', 'name', 'standard_row_count', 'vip_row_count',
                'couple_row_count', 'seats_per_row', 'total_seats', 'seat_summary']
    
    def get_total_seats(self, obj):
        return obj.seats.count()
    
    def get_seat_summary(self, obj):
        seats = obj.seats.all()
        return {
            'standard': seats.filter(seat_type=Seat.STANDARD).count(),
            'vip': seats.filter(seat_type=Seat.VIP).count(),
            'couple': seats.filter(seat_type=Seat.COUPLE).count(),
        }

class AuditoriumDetailSerializer(AuditoriumSerializer):
    seats = SeatSerializer(many=True, read_only=True)
    
    class Meta(AuditoriumSerializer.Meta):
        fields = AuditoriumSerializer.Meta.fields + ['seats']

class AuditoriumCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auditorium
        fields = ['name', 'standard_row_count', 'vip_row_count',
                'couple_row_count', 'seats_per_row']
    
    def validate(self, data):
        total_rows = data['standard_row_count'] + data['vip_row_count'] + data['couple_row_count']
        if total_rows > 12:  # Giới hạn 12 hàng (A-L)
            raise serializers.ValidationError("Tổng số hàng không được vượt quá 12")
        
        if data['seats_per_row'] > 20:  # Giới hạn 20 ghế mỗi hàng
            raise serializers.ValidationError("Số ghế mỗi hàng không được vượt quá 20")
        
        return data
    
    def create(self, validated_data):
        auditorium = Auditorium.objects.create(**validated_data)
        
        # Tự động tạo ghế
        self.create_seats(auditorium)
        return auditorium
    
    def create_seats(self, auditorium):
        """Tự động tạo ghế theo cấu hình"""
        row_labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        current_row = 0
        
        # Tạo ghế Standard
        for i in range(auditorium.standard_row_count):
            row_label = row_labels[current_row]
            for seat_num in range(1, auditorium.seats_per_row + 1):
                Seat.objects.create(
                    auditorium=auditorium,
                    row_label=row_label,
                    seat_number=seat_num,
                    seat_type=Seat.STANDARD
                )
            current_row += 1
        
        # Tạo ghế VIP
        for i in range(auditorium.vip_row_count):
            row_label = row_labels[current_row]
            for seat_num in range(1, auditorium.seats_per_row + 1):
                Seat.objects.create(
                    auditorium=auditorium,
                    row_label=row_label,
                    seat_number=seat_num,
                    seat_type=Seat.VIP
                )
            current_row += 1
        
        # Tạo ghế Couple (2 ghế 1 cặp)
        for i in range(auditorium.couple_row_count):
            row_label = row_labels[current_row]
            for seat_num in range(1, auditorium.seats_per_row + 1, 2):
                # Tạo ghế couple theo cặp
                Seat.objects.create(
                    auditorium=auditorium,
                    row_label=row_label,
                    seat_number=seat_num,
                    seat_type=Seat.COUPLE
                )
                # Ghế couple số 2 trong cặp
                if seat_num + 1 <= auditorium.seats_per_row:
                    Seat.objects.create(
                        auditorium=auditorium,
                        row_label=row_label,
                        seat_number=seat_num + 1,
                        seat_type=Seat.COUPLE
                    )
            current_row += 1