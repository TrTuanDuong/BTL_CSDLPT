# 🎬 Hệ thống Bán Vé Rạp Chiếu Phim

Dự án bài tập lớn CSDL - PTIT sử dụng Django REST Framework và PostgreSQL.

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.8+
- PostgreSQL 12+
- pip

### Cài đặt
```bash
# Clone project
git clone <repository-url>
cd BTL_CSDL_PTIT/backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình database
cp .env.example .env
# Chỉnh sửa .env với thông tin DB của bạn

# Migrate database
python manage.py migrate

# Tạo superuser
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

## 📊 Database Schema

Hệ thống gồm 10 bảng chính:
- **User** - Người dùng (customer, admin)
- **Movie** - Phim chiếu 
- **Genre** - Thể loại phim
- **Auditorium** - Phòng chiếu
- **Seat** - Ghế ngồi (standard/vip/couple)
- **Showtime** - Suất chiếu
- **Booking** - Đặt vé (auto-expire 10 phút)
- **Ticket** - Vé (tính giá = base_price × seat_multiplier)
- **Payment** - Thanh toán

## 🏗️ Cấu trúc dự án

```
backend/ — gốc dự án Django ạ
├─ manage.py — chạy lệnh Django (runserver, migrate, createsuperuser) ạ
├─ requirements.txt — danh sách thư viện để pip install -r ạ
├─ .env.example — mẫu biến môi trường (SECRET_KEY, DB, ALLOWED_HOSTS) ạ
├─ README.md — hướng dẫn cài đặt, chạy và cấu trúc ạ
├─ config/ — cấu hình framework ạ
│  ├─ settings.py — cấu hình Django/DRF, DB, timezone, REST_FRAMEWORK ạ
│  ├─ urls.py — route gốc, include api.routers ạ
│  ├─ asgi.py — entry ASGI cho server async ạ
│  └─ wsgi.py — entry WSGI cho server production ạ
├─ api/ — lớp transport + ORM ạ
│  ├─ models/ — định nghĩa bảng dữ liệu (User, Movie, Seat, …) ạ
│  ├─ serializers/ — map Model ↔ JSON và validate input ạ
│  ├─ views/ — APIView/ViewSet xử lý request, gọi services ạ
│  ├─ permissions/ — phân quyền (RBAC), rule truy cập endpoint ạ
│  ├─ routers.py — đăng ký router/route DRF một chỗ ạ
│  └─ tasks/ — tác vụ nền liên quan app (vd: auto-cancel booking) ạ
├─ services/ — nghiệp vụ thuần, không phụ thuộc DRF ạ
│  ├─ booking.py — giữ ghế, tính tiền, confirm/cancel ạ
│  ├─ payment.py — tạo/hoàn tất thanh toán, cập nhật trạng thái ạ
│  └─ availability.py — tính ghế trống theo showtime ạ
├─ common/ — tiện ích dùng chung ạ
│  ├─ pagination.py — phân trang mặc định cho toàn API ạ
│  ├─ exceptions.py — handler lỗi trả JSON thống nhất ạ
│  └─ utils.py — hàm tiện ích (id, thời gian, …) ạ
└─ tests/ — kiểm thử tự động ạ
   └─ api/ — test unit/integration cho endpoint và luồng nghiệp vụ ạ
```

## 🔧 Tech Stack

- **Backend**: Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: Django built-in + JWT (planned)
- **API**: RESTful API với auto-generated documentation

## 📝 Features

### ✅ Đã hoàn thành
- Database models với relationships đầy đủ
- Auto seat pricing theo loại ghế
- Booking expiry mechanism
- Basic Django setup

### 🚧 Đang phát triển
- API endpoints (CRUD operations)
- Authentication & authorization
- Payment integration
- Admin dashboard

## 🧪 Testing

```bash
# Chạy tests
python manage.py test

# Test coverage
coverage run --source='.' manage.py test
coverage report
```

## 📚 API Documentation

Sau khi server chạy, truy cập:
- Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/ (planned)

## 👥 Team

Dự án BTL CSDL - PTIT