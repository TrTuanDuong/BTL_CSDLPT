# 🎬 Hệ thống Bán Vé Rạp Chiếu Phim

Dự án bài tập lớn CSDL - PTIT sử dụng Django REST Framework và PostgreSQL với JWT Authentication.

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
python manage.py makemigrations
python manage.py migrate

# Tạo superuser
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

## 📊 Database Schema

Hệ thống gồm 10 bảng chính:
- **User** - Người dùng (customer, admin) với UUID primary key
- **Movie** - Phim chiếu
- **Genre** - Thể loại phim
- **Auditorium** - Phòng chiếu
- **Seat** - Ghế ngồi (standard/vip/couple)
- **Showtime** - Suất chiếu
- **Booking** - Đặt vé (auto-expire 10 phút)
- **Ticket** - Vé (tính giá = base_price × seat_multiplier)
- **Payment** - Thanh toán

## 🔐 Authentication

Hệ thống sử dụng **JWT (JSON Web Token)** authentication:
- **Access Token**: 1 giờ
- **Refresh Token**: 7 ngày
- **Auto rotation**: Token mới mỗi lần refresh

### JWT Endpoints:
- `POST /api/auth/login/` - Đăng nhập, nhận JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/verify/` - Verify token validity

## 🏗️ Cấu trúc dự án

```
backend/ — gốc dự án Django ạ
├─ manage.py — chạy lệnh Django (runserver, migrate, createsuperuser) ạ
├─ requirements.txt — danh sách thư viện để pip install -r ạ
├─ .env.example — mẫu biến môi trường (SECRET_KEY, DB, ALLOWED_HOSTS) ạ
├─ README.md — hướng dẫn cài đặt, chạy và cấu trúc ạ
├─ config/ — cấu hình framework ạ
│  ├─ settings.py — cấu hình Django/DRF, DB, timezone, JWT, AUTH_USER_MODEL ạ
│  ├─ urls.py — route gốc, include api.routers + JWT auth endpoints ạ
│  ├─ asgi.py — entry ASGI cho server async ạ
│  └─ wsgi.py — entry WSGI cho server production ạ
├─ api/ — lớp transport + ORM ạ
│  ├─ models/ — định nghĩa bảng dữ liệu ạ
│  │  ├─ user.py — User model với UUID, roles (user/super_admin) ạ
│  │  ├─ movie.py — Movie model với title, duration, rating ạ
│  │  ├─ genre.py — Genre model và MovieGenre M2M ạ
│  │  ├─ auditorium.py — Auditorium với seat counts theo loại ạ
│  │  ├─ seat.py — Seat với types và price multipliers ạ
│  │  ├─ showtime.py — Showtime link movie + auditorium + time ạ
│  │  ├─ booking.py — Booking với auto-expire mechanism ạ
│  │  ├─ ticket.py — Ticket với auto-calculate price ạ
│  │  └─ payment.py — Payment tracking với external IDs ạ
│  ├─ serializers/ — map Model ↔ JSON và validate input ạ
│  │  ├─ __init__.py — package init file ạ
│  │  ├─ user.py — UserSerializer, UserCreateSerializer, ChangePasswordSerializer ạ
│  │  └─ auth.py — CustomTokenObtainPairSerializer cho JWT login ạ
│  ├─ views/ — APIView/ViewSet xử lý request, gọi services ạ
│  │  ├─ __init__.py — package init file ạ
│  │  └─ user.py — UserViewSet với CRUD + profile + JWT actions ạ
│  ├─ permissions/ — phân quyền (RBAC), rule truy cập endpoint ạ
│  ├─ routers.py — đăng ký DRF router + custom auth endpoints ạ
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
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API**: RESTful API với auto-generated documentation

## 📝 Features

### ✅ Đã hoàn thành
- Database models với relationships đầy đủ
- JWT Authentication system
- User management (CRUD, profile, password change)
- Auto seat pricing theo loại ghế
- Booking expiry mechanism
- Custom User model với UUID

### 🚧 Đang phát triển
- Movie, Showtime, Booking API endpoints
- Payment integration
- Admin dashboard enhancements
- API documentation với Swagger

## 🧪 Testing

```bash
# Chạy tests
python manage.py test

# Test coverage
coverage run --source='.' manage.py test
coverage report
```

## 📚 API Documentation

### User Endpoints:
- `GET/POST /api/users/` - List/Create users
- `GET /api/users/profile/` - User profile
- `PUT /api/users/update_profile/` - Update profile
- `POST /api/users/change_password/` - Change password
- `GET /api/users/my_bookings/` - User's bookings

### Auth Endpoints:
- `POST /api/auth/login/` - JWT login
- `POST /api/auth/refresh/` - Refresh token
- `POST /api/auth/verify/` - Verify token

### Admin Panel:
- http://localhost:8000/admin/ - Django admin interface

## 🔐 JWT Usage

### Login và nhận tokens:
```bash
POST /api/auth/login/
{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {...}
}
```

### Sử dụng access token:
```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 👥 Team

Dự án BTL CSDL - PTIT


## 💻 Hướng dẫn chạy dự án với PyCharm

### 🚀 Cách 1: Sử dụng PyCharm Professional

#### Bước 1: Mở dự án
```
File → Open → Chọn thư mục BTL_CSDL_PTIT/backend
```

#### Bước 2: Cấu hình Python Interpreter
```
File → Settings (Ctrl+Alt+S)
→ Project → Python Interpreter
→ Add Interpreter → Virtualenv Environment
→ New environment
→ Location: ./venv
→ Base interpreter: Python 3.8+
→ OK
```

#### Bước 3: Cài đặt dependencies
```bash
# Terminal trong PyCharm (Alt+F12)
pip install -r requirements.txt
```

#### Bước 4: Cấu hình Django
```
File → Settings → Languages & Frameworks → Django
→ ✅ Enable Django Support
→ Django project root: [đường dẫn đến thư mục backend]
→ Settings: config/settings.py
→ Manage script: manage.py
→ OK
```

#### Bước 5: Cấu hình Database (Optional)
```
View → Tool Windows → Database
→ + → Data Source → PostgreSQL
→ Nhập thông tin từ file .env
→ Test Connection → OK
```

#### Bước 6: Tạo Django Run Configuration
```
Run → Edit Configurations
→ + → Django Server
→ Name: Cinema API Server
→ Host: localhost
→ Port: 8000
→ Environment variables: Load from .env file
→ Python interpreter: venv
→ OK
```

#### Bước 7: Chạy Migration
```bash
# Terminal trong PyCharm
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

#### Bước 8: Chạy Server
```
Run → Run 'Cinema API Server'
# Hoặc click vào nút Run (Shift+F10)
```

### 🔧 Cách 2: PyCharm Community Edition

#### Bước 1-3: Giống như PyCharm Professional

#### Bước 4: Chạy bằng Terminal
```bash
# Terminal trong PyCharm (Alt+F12)
# Kích hoạt virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Chạy migration
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

#### Bước 5: Tạo Python Run Configuration
```
Run → Edit Configurations
→ + → Python
→ Name: Django Server
→ Script path: manage.py
→ Parameters: runserver
→ Working directory: [thư mục backend]
→ Python interpreter: venv
→ OK
```

### 🎯 Ưu điểm PyCharm với Django:

#### PyCharm Professional:
- ✅ **Django integration** tích hợp sẵn
- ✅ **Template debugging** cho Django templates
- ✅ **Database browser** trực quan
- ✅ **Model diagram** tự động generate
- ✅ **Migration tools** với UI
- ✅ **Django console** tích hợp
- ✅ **URL mapping** visualization

#### PyCharm Community:
- ✅ **Python debugging** mạnh mẽ
- ✅ **Git integration** tốt
- ✅ **Code completion** thông minh
- ✅ **Refactoring tools** đa dạng

### 📋 Troubleshooting PyCharm:

#### Lỗi "Django not detected":
```
File → Invalidate Caches and Restart
```

#### Lỗi Module not found:
```
File → Settings → Project → Python Interpreter
→ Kiểm tra venv đã chọn đúng
→ Reinstall packages nếu cần
```

#### Debug không hoạt động:
```
Run → Edit Configurations
→ Kiểm tra Python interpreter path
→ Working directory phải là thư mục backend
```

### 🔍 Tips sử dụng PyCharm hiệu quả:

#### Shortcuts hữu ích:
- `Ctrl+Shift+F10` - Run file hiện tại
- `Shift+F10` - Run configuration cuối cùng
- `Ctrl+F2` - Stop server
- `Alt+F12` - Mở terminal
- `Ctrl+Shift+A` - Find Action

#### Debug Django:
```python
# Đặt breakpoint và chạy Debug mode
# PyCharm sẽ dừng tại breakpoint trong API calls
import pdb; pdb.set_trace()  # Hoặc dùng breakpoint UI
```