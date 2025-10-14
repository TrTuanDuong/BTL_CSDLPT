from django.utils import timezone
from api.models import Showtime, Seat, Ticket

def get_available_seats(showtime_id):
    """Lấy danh sách ghế trống cho suất chiếu"""
    try:
        showtime = Showtime.objects.get(id=showtime_id)
        auditorium = showtime.auditorium
        
        # Lấy tất cả ghế trong phòng
        all_seats = Seat.objects.filter(auditorium=auditorium)
        
        # Lấy ghế đã được đặt cho suất chiếu này
        booked_seats = Ticket.objects.filter(
            showtime=showtime,
            status__in=['reserved', 'paid', 'checked_in']
        ).values_list('seat_id', flat=True)
        
        # Ghế còn trống
        available_seats = all_seats.exclude(id__in=booked_seats)
        
        return {
            'showtime': showtime,
            'total_seats': all_seats.count(),
            'booked_seats': len(booked_seats),
            'available_seats': available_seats
        }
    except Showtime.DoesNotExist:
        return None

def check_seat_availability(showtime_id, seat_ids):
    """Kiểm tra danh sách ghế có còn trống không"""
    availability = get_available_seats(showtime_id)
    if not availability:
        return False, "Suất chiếu không tồn tại"
    
    available_seat_ids = set(availability['available_seats'].values_list('id', flat=True))
    requested_seat_ids = set(seat_ids)
    
    if not requested_seat_ids.issubset(available_seat_ids):
        unavailable_seats = requested_seat_ids - available_seat_ids
        return False, f"Ghế đã được đặt: {list(unavailable_seats)}"
    
    return True, "Ghế còn trống"