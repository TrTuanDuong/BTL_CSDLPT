from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


class User(AbstractUser):
    USER = "user"
    ADMIN = "admin"  # SỬA TỪ SUPER_ADMIN thành ADMIN

    ROLE_CHOICES = [
        (USER, "User"),  # Thêm label cho dễ đọc
        (ADMIN, "Admin"),  # Thêm label cho dễ đọc
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default=USER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    date_of_birth = models.DateField(blank=True, null=True)

    REQUIRED_FIELDS = ["email"]

    def is_admin_user(self):
        """Check user có phải admin không"""
        return self.role == self.ADMIN or self.is_staff

    def can_manage_cinema(self):
        """Check user có thể quản lý rạp không (CRUD movies, showtimes, auditoriums)"""
        return self.is_admin_user()

    def can_view_all_bookings(self):
        """Check user có thể xem tất cả booking không"""
        return self.is_admin_user()

    def can_access_statistics(self):
        """Check user có thể xem thống kê không"""
        return self.is_admin_user()

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        db_table = "api_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
