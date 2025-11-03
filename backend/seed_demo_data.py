import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import *

def seed():
    print("🌱 Seeding demo data...")
    
    # 1. Genres (đã có từ schema.sql)
    action = Genre.objects.get(name='Action')
    scifi = Genre.objects.get(name='Sci-Fi')
    drama = Genre.objects.get(name='Drama')
    comedy = Genre.objects.get(name='Comedy')
    
    # 2. Movies
    print("📽️  Creating movies...")
    movie1 = Movie.objects.create(
        title='Avatar: The Way of Water',
        duration_min=192,
        rating='PG-13',
        release_date='2022-12-16',
        description='Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.',
        poster_url='https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg'
    )
    MovieGenre.objects.create(movie=movie1, genre=action)
    MovieGenre.objects.create(movie=movie1, genre=scifi)
    
    movie2 = Movie.objects.create(
        title='The Shawshank Redemption',
        duration_min=142,
        rating='R',
        release_date='1994-09-23',
        description='Two imprisoned men bond over a number of years, finding solace and eventual redemption.',
        poster_url='https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
    )
    MovieGenre.objects.create(movie=movie2, genre=drama)
    
    movie3 = Movie.objects.create(
        title='The Grand Budapest Hotel',
        duration_min=99,
        rating='R',
        release_date='2014-03-28',
        description='A writer encounters the owner of an aging high-class hotel.',
        poster_url='https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg'
    )
    MovieGenre.objects.create(movie=movie3, genre=comedy)
    MovieGenre.objects.create(movie=movie3, genre=drama)
    
    print(f"✅ Created {Movie.objects.count()} movies")
    
    # 3. Auditoriums
    print("🎭 Creating auditoriums...")
    aud1 = Auditorium.objects.create(
        name='Phòng VIP 1',
        standard_row_count=5,
        vip_row_count=3,
        couple_row_count=2,
        seats_per_row=10
    )
    
    aud2 = Auditorium.objects.create(
        name='Phòng Standard 1',
        standard_row_count=8,
        vip_row_count=0,
        couple_row_count=0,
        seats_per_row=12
    )
    
    # Tạo ghế cho aud1
    rows_aud1 = {
        'A': 'standard', 'B': 'standard', 'C': 'standard',
        'D': 'standard', 'E': 'standard',
        'F': 'vip', 'G': 'vip', 'H': 'vip',
        'I': 'couple', 'J': 'couple'
    }
    
    for row, seat_type in rows_aud1.items():
        for num in range(1, 11):
            Seat.objects.create(
                auditorium=aud1,
                row_label=row,
                seat_number=num,
                seat_type=seat_type
            )
    
    # Tạo ghế cho aud2
    for row in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        for num in range(1, 13):
            Seat.objects.create(
                auditorium=aud2,
                row_label=row,
                seat_number=num,
                seat_type='standard'
            )
    
    print(f"✅ Created {Auditorium.objects.count()} auditoriums with {Seat.objects.count()} seats")
    
    # 4. Showtimes
    print("🎫 Creating showtimes...")
    tomorrow = datetime.now() + timedelta(days=1)
    next_week = datetime.now() + timedelta(days=7)
    
    # Showtimes cho Avatar
    for day_offset in [1, 2, 3]:
        date = datetime.now() + timedelta(days=day_offset)
        for hour in [10, 14, 19]:
            start = date.replace(hour=hour, minute=0, second=0, microsecond=0)
            end = start + timedelta(minutes=movie1.duration_min)
            Showtime.objects.create(
                movie=movie1,
                auditorium=aud1,
                start_time=start,
                end_time=end,
                base_price=Decimal('120000'),
                status='scheduled'
            )
    
    # Showtimes cho Shawshank
    for day_offset in [1, 2]:
        date = datetime.now() + timedelta(days=day_offset)
        for hour in [15, 20]:
            start = date.replace(hour=hour, minute=30, second=0, microsecond=0)
            end = start + timedelta(minutes=movie2.duration_min)
            Showtime.objects.create(
                movie=movie2,
                auditorium=aud2,
                start_time=start,
                end_time=end,
                base_price=Decimal('100000'),
                status='scheduled'
            )
    
    print(f"✅ Created {Showtime.objects.count()} showtimes")
    
    # 5. Demo users
    print("👤 Creating demo users...")
    if not User.objects.filter(username='demo').exists():
        User.objects.create(
            username='demo',
            email='demo@cinema.com',
            password='pbkdf2_sha256$600000$placeholder',
            full_name='Demo User',
            phone='0123456789',
            role='user',
            is_active=True
        )
    
    print("\n" + "="*50)
    print("🎉 DEMO DATA SEEDED SUCCESSFULLY!")
    print("="*50)
    print(f"   📚 Genres: {Genre.objects.count()}")
    print(f"   🎬 Movies: {Movie.objects.count()}")
    print(f"   🎭 Auditoriums: {Auditorium.objects.count()}")
    print(f"   💺 Seats: {Seat.objects.count()}")
    print(f"   🎫 Showtimes: {Showtime.objects.count()}")
    print(f"   👥 Users: {User.objects.count()}")
    print("="*50)

if __name__ == '__main__':
    seed()
