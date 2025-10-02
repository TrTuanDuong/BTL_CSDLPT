from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    USER = "user"
    SUPER_ADMIN = "super_admin"
    ROLE_CHOICES = [
        (USER, USER),
        (SUPER_ADMIN, SUPER_ADMIN),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default=USER)
    REQUIRED_FIELDS = ["email"]


class Genre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60, unique=True)


class Movie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    duration_min = models.PositiveIntegerField()
    rating = models.CharField(max_length=10, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True)
    poster_url = models.TextField(blank=True)


class MovieGenre(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("movie", "genre")


class Auditorium(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60, unique=True)
    standard_row_count = models.PositiveIntegerField(default=0)
    vip_row_count = models.PositiveIntegerField(default=0)
    couple_row_count = models.PositiveIntegerField(default=0)
    seats_per_row = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Seat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auditorium = models.ForeignKey(Auditorium, on_delete=models.CASCADE, related_name="seats", null=True, blank=True)
    row_label = models.CharField(max_length=5, null=True, blank=True)
    seat_number = models.IntegerField()
    STANDARD = "standard"
    VIP = "vip"
    COUPLE = "couple"
    SEAT_TYPE_CHOICES = [
        (STANDARD, STANDARD),
        (VIP, VIP),
        (COUPLE, COUPLE),
    ]
    PRICE_MULTIPLIER = {
        STANDARD: 1.0,
        VIP: 1.3,
        COUPLE: 2.0,
    }
    seat_type = models.CharField(max_length=10, choices=SEAT_TYPE_CHOICES, default=STANDARD)

    class Meta:
        unique_together = ("auditorium", "row_label", "seat_number")
        indexes = [
            models.Index(fields=["auditorium"]),
        ]


class Showtime(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(Movie, on_delete=models.RESTRICT, related_name="showtimes")
    auditorium = models.ForeignKey(Auditorium, on_delete=models.RESTRICT, related_name="showtimes")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="scheduled")

    class Meta:
        unique_together = ("auditorium", "start_time")
        indexes = [
            models.Index(fields=["movie"]),
            models.Index(fields=["auditorium", "start_time"]),
        ]


class Booking(models.Model):
    PENDING = "pending"
    PAID = "paid"
    CANCELED = "canceled"
    STATUS_CHOICES = [
        (PENDING, PENDING),
        (PAID, PAID),
        (CANCELED, CANCELED),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    showtime = models.ForeignKey(Showtime, on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["showtime"]),
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.expires_at is None:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)


class Ticket(models.Model):
    RESERVED = "reserved"
    PAID = "paid"
    CHECKED_IN = "checked_in"
    STATUS_CHOICES = [
        (RESERVED, RESERVED),
        (PAID, PAID),
        (CHECKED_IN, CHECKED_IN),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="tickets")
    showtime = models.ForeignKey(Showtime, on_delete=models.CASCADE, related_name="tickets")
    seat = models.ForeignKey(Seat, on_delete=models.RESTRICT, related_name="tickets")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    qr_code = models.CharField(max_length=64, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=RESERVED)
    booked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("showtime", "seat")
        indexes = [
            models.Index(fields=["showtime"]),
        ]

    def save(self, *args, **kwargs):
        if not self.price or self.price == 0:
            base_price = self.showtime.base_price if self.showtime else 0
            multiplier = getattr(self.seat, "PRICE_MULTIPLIER", {}).get(self.seat.seat_type, 1.0)
            self.price = base_price * multiplier
        super().save(*args, **kwargs)


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider = models.CharField(max_length=40)
    external_id = models.CharField(max_length=80, blank=True, null=True)
    status = models.CharField(max_length=20)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["booking"]),
        ]