# 🎬 Hệ thống Bán Vé Rạp Chiếu Phim

Dự án bài tập lớn Cơ sở dữ liệu - Học viện PTIT sử dụng Django REST Framework và PostgreSQL với xác thực JWT.

## 🚀 Cài đặt và chạy hệ thống

### Yêu cầu hệ thống
- Python 3.8 trở lên
- PostgreSQL 12 trở lên  
- pip package manager

### Hướng dẫn cài đặt
```bash
# Tải mã nguồn
git clone <repository-url>
cd BTL_CSDL_PTIT/backend

# Tạo môi trường ảo
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Cài đặt thư viện
pip install -r requirements.txt

# Cấu hình cơ sở dữ liệu
cp .env.example .env
# Chỉnh sửa file .env với thông tin DB của bạn

# Tạo và áp dụng migration
python manage.py makemigrations
python manage.py migrate

# Tạo tài khoản quản trị
python manage.py createsuperuser

# Khởi chạy máy chủ
python manage.py runserver
```

## 🏗️ Cấu trúc dự án chi tiết

```
backend/                                    # 📁 Thư mục gốc dự án Django
├─ manage.py                               # 🔧 Script quản lý Django (runserver, migrate, createsuperuser)
├─ requirements.txt                        # 📦 Danh sách thư viện phụ thuộc (DRF, PostgreSQL, JWT, v.v.)
├─ README.md                              # 📖 Tài liệu hướng dẫn và mô tả dự án
├─ .env.example                           # 🔒 File mẫu cấu hình môi trường (DB, secret keys)
├─ config/                                # ⚙️ Cấu hình Django chính
│  ├─ __init__.py                         # 📦 File đánh dấu package Python
│  ├─ settings.py                         # 🔧 Cài đặt chính (DB, JWT, DRF, timezone, middleware)
│  ├─ urls.py                             # 🌐 Định tuyến URL gốc + endpoints xác thực JWT
│  ├─ wsgi.py                             # 🚀 Entry point WSGI cho production
│  └─ asgi.py                             # ⚡ Entry point ASGI cho hỗ trợ bất đồng bộ
├─ api/                                   # 🎯 Layer ứng dụng chính
│  ├─ models/                             # 🗃️ Mô hình cơ sở dữ liệu (định nghĩa ORM)
│  │  ├─ __init__.py                      # 📦 Export các model
│  │  ├─ user.py                          # 👤 Model người dùng (UUID, vai trò: user/admin)
│  │  ├─ movie.py                         # 🎬 Model phim (tiêu đề, thời lượng, đánh giá)
│  │  ├─ genre.py                         # 🏷️ Model thể loại phim
│  │  ├─ movie_genre.py                   # 🔗 Quan hệ nhiều-nhiều Movie ↔ Genre
│  │  ├─ auditorium.py                    # 🏢 Model phòng chiếu
│  │  ├─ seat.py                          # 🪑 Model ghế ngồi (thường/vip/đôi + định giá)
│  │  ├─ showtime.py                      # ⏰ Model suất chiếu (phiên chiếu phim + kiểm tra xung đột)
│  │  ├─ booking.py                       # 📝 Model đặt vé (logic tự hủy sau 10 phút)
│  │  ├─ ticket.py                        # 🎫 Model vé (tự động tính giá + logic check-in)
│  │  └─ payment.py                       # 💳 Model thanh toán (logic hoàn tiền + tích hợp bên ngoài)
│  ├─ serializers/                        # 🔄 API Serializers (chuyển đổi Model ↔ JSON)
│  │  ├─ __init__.py                      # 📦 Export các serializer
│  │  ├─ user.py                          # 👤 Serializer CRUD người dùng + đổi mật khẩu
│  │  ├─ auth.py                          # 🔐 Serializer đăng nhập JWT + token tùy chỉnh
│  │  ├─ movie.py                         # 🎬 Serializer CRUD phim + liên kết thể loại
│  │  ├─ auditorium.py                    # 🏢 Serializer phòng chiếu + tự động tạo ghế
│  │  ├─ showtime.py                      # ⏰ Serializer CRUD suất chiếu + kiểm tra xung đột
│  │  ├─ booking.py                       # 📝 Serializer đặt vé + kiểm tra ghế + thời gian còn lại
│  │  └─ payment.py                       # 💳 Serializer xử lý thanh toán + hoàn tiền
│  ├─ views/                              # 🎮 API ViewSets (xử lý request + logic nghiệp vụ)
│  │  ├─ __init__.py                      # 📦 Export các view
│  │  ├─ user.py                          # 👤 Quản lý người dùng + profile + đăng xuất JWT
│  │  ├─ movie.py                         # 🎬 CRUD phim + tìm kiếm + lọc
│  │  ├─ auditorium.py                    # 🏢 CRUD phòng chiếu + tái tạo ghế
│  │  ├─ showtime.py                      # ⏰ CRUD suất chiếu + sơ đồ ghế + tỷ lệ lấp đầy + thống kê booking
│  │  ├─ booking.py                       # 📝 CRUD đặt vé + hủy + lịch sử + sắp tới
│  │  └─ payment.py                       # 💳 CRUD thanh toán + hoàn tiền + hóa đơn + thống kê
│  ├─ tasks/                              # 🔄 Background Tasks (Celery - tương lai)
│  │  └─ __init__.py                      # 📦 Export tasks (hiện tại trống)
│  ├─ middleware.py                       # 🔄 Tự động dọn dẹp booking hết hạn (chạy mỗi request)
│  ├─ permissions.py                      # 🛡️ Phân quyền tùy chỉnh (Admin, Owner, ReadOnly)
│  ├─ routers.py                          # 🌐 Đăng ký DRF Router + định tuyến URL
│  └─ admin.py                            # 🔧 Tùy chỉnh Django Admin
├─ services/                              # 🧠 Layer logic nghiệp vụ (services tái sử dụng)
│  ├─ availability.py                     # 🎯 Service tính toán ghế trống
│  ├─ booking.py                          # 📝 Logic nghiệp vụ đặt vé (hiện tại trống)
│  └─ payment.py                          # 💳 Service xử lý thanh toán (hiện tại trống)
└─ common/                                # 🛠️ Tiện ích dùng chung
   ├─ utils.py                            # 🔧 Các hàm tiện ích (hiện tại trống)
   ├─ pagination.py                       # 📄 Class phân trang tùy chỉnh (hiện tại trống)
   └─ exceptions.py                       # ⚠️ Xử lý exception tùy chỉnh (hiện tại trống)
```

## 📊 Lược đồ cơ sở dữ liệu & mối quan hệ

### **🗃️ Các Model chính:**
- **User** (`UUID`) - Xác thực + phân quyền theo vai trò (user/admin)
- **Movie** (`UUID`) - Catalog phim với thể loại (quan hệ M2M)
- **Auditorium** (`UUID`) - Phòng chiếu với cấu hình ghế ngồi
- **Seat** (`UUID`) - Ghế đơn lẻ với bậc giá (thường/vip/đôi)
- **Showtime** (`UUID`) - Phiên chiếu phim với phát hiện xung đột
- **Booking** (`UUID`) - Đặt chỗ với **tự động hết hạn sau 10 phút**
- **Ticket** (`UUID`) - Vé ghế đơn lẻ với định giá động
- **Payment** (`UUID`) - Ghi nhận giao dịch với khả năng hoàn tiền

### **🔗 Mối quan hệ chính:**
```
User 1:N Booking 1:N Ticket N:1 Seat
Movie 1:N Showtime N:1 Auditorium 1:N Seat  
Booking 1:1 Payment
Movie N:M Genre (qua MovieGenre)
```

## ⏰ Hệ thống tự động hết hạn (10 phút)

### **🔄 Quy trình hoạt động:**
1. **Tạo Booking** → `expires_at = now() + 10 phút`
2. **Kiểm tra Middleware** → Tự động hủy booking hết hạn trên mỗi request
3. **Đếm ngược thời gian thực** → API trả về `time_remaining` tính bằng giây
4. **Tự động dọn dẹp** → Ghế trở về trạng thái available sau khi hết hạn

### **📍 Vị trí triển khai:**
- **Logic Model**: `api/models/booking.py` - method `save()` đặt thời hạn
- **Middleware**: `api/middleware.py` - dọn dẹp nền
- **Phản hồi API**: `api/serializers/booking.py` - đếm ngược thời gian thực

## 🔐 Xác thực & phân quyền

### **🎫 Xác thực JWT:**
- **Access Token**: Hết hạn sau 1 giờ
- **Refresh Token**: 7 ngày với tự động xoay vòng
- **Middleware**: `BookingExpiryMiddleware` + kiểm tra JWT

### **👥 Phân quyền theo vai trò:**

#### **👤 Vai trò USER (Khách hàng):**
```python
✅ Xem phim, suất chiếu, phòng chiếu (công khai)
✅ Tạo/xem/hủy booking của riêng mình
✅ Thanh toán, check-in vé
✅ Xem lịch sử booking/thanh toán cá nhân
❌ Không thể truy cập endpoint admin
❌ Không thể xem dữ liệu của người khác
```

#### **👨‍💼 Vai trò ADMIN (Quản trị viên):**
```python
✅ Tất cả quyền của USER +
✅ CRUD phim, suất chiếu, phòng chiếu
✅ Xem booking của tất cả người dùng
✅ Truy cập thống kê tỷ lệ lấp đầy & doanh thu
✅ Tái tạo sơ đồ ghế phòng chiếu
✅ Xem phân tích booking chi tiết
```

## 🌐 Các endpoint API

### **🔐 Xác thực:**
```
POST /api/auth/login/           # Đăng nhập JWT + thông tin user
POST /api/auth/refresh/         # Làm mới access token
POST /api/auth/verify/          # Xác minh tính hợp lệ của token
POST /api/users/logout/         # Đưa refresh token vào blacklist
```

### **👤 Quản lý người dùng:**
```
GET/POST /api/users/            # Liệt kê/Tạo người dùng
GET /api/users/profile/         # Profile người dùng hiện tại
PUT /api/users/update_profile/  # Cập nhật profile
POST /api/users/change_password/ # Đổi mật khẩu
GET /api/users/my_bookings/     # Lịch sử booking của user
```

### **🎬 Catalog phim:**
```
GET/POST /api/movies/           # Liệt kê/Tạo phim (POST: chỉ admin)
GET /api/movies/{id}/           # Chi tiết phim
PUT/DELETE /api/movies/{id}/    # Cập nhật/Xóa phim (chỉ admin)
GET /api/genres/                # Liệt kê tất cả thể loại
```

### **🏢 Quản lý phòng chiếu:**
```
GET/POST /api/auditoriums/      # Liệt kê/Tạo phòng chiếu (POST: chỉ admin)
GET /api/auditoriums/{id}/      # Chi tiết phòng chiếu + sơ đồ ghế
GET /api/auditoriums/{id}/seats/ # Hiển thị sơ đồ ghế
POST /api/auditoriums/{id}/regenerate_seats/ # Tái tạo ghế (chỉ admin)
```

### **⏰ Lập lịch suất chiếu:**
```
GET/POST /api/showtimes/        # Liệt kê/Tạo suất chiếu (POST: chỉ admin)
GET /api/showtimes/{id}/        # Chi tiết suất chiếu
GET /api/showtimes/today/       # Suất chiếu hôm nay
GET /api/showtimes/upcoming/    # 7 ngày tới
GET /api/showtimes/by_movie/?movie_id={id} # Suất chiếu theo phim
GET /api/showtimes/{id}/seats/  # Tình trạng ghế thời gian thực
GET /api/showtimes/{id}/occupancy/ # Thống kê (chỉ admin)
GET /api/showtimes/{id}/bookings/ # Danh sách booking (chỉ admin)
POST /api/showtimes/{id}/check_seats/ # Kiểm tra ghế cụ thể
```

### **📝 Hệ thống booking:**
```
GET/POST /api/bookings/         # Liệt kê/Tạo booking
GET /api/bookings/{id}/         # Chi tiết booking + thời gian còn lại
POST /api/bookings/{id}/cancel/ # Hủy booking
GET /api/bookings/history/      # Lịch sử booking của user
GET /api/bookings/upcoming/     # Booking đã thanh toán sắp tới
```

### **🎫 Quản lý vé:**
```
GET /api/tickets/               # Vé của user
GET /api/tickets/{id}/          # Chi tiết vé
POST /api/tickets/{id}/check_in/ # Check-in tại rạp (30 phút trước suất chiếu)
GET /api/tickets/?status=paid   # Lọc theo trạng thái
```

### **💳 Xử lý thanh toán:**
```
GET/POST /api/payments/         # Liệt kê/Tạo thanh toán
GET /api/payments/{id}/         # Chi tiết thanh toán
POST /api/payments/{id}/refund/ # Yêu cầu hoàn tiền (2 giờ trước suất chiếu)
GET /api/payments/{id}/receipt/ # Tạo hóa đơn
GET /api/payments/history/      # Lịch sử thanh toán với bộ lọc
GET /api/payments/statistics/   # Thống kê thanh toán của user
```

## 🎯 Luồng logic nghiệp vụ

### **📱 Hành trình khách hàng:**
```
1. Duyệt Phim → 2. Chọn Suất chiếu → 3. Chọn Ghế → 4. Tạo Booking
   ↓ (đếm ngược 10 phút bắt đầu)
5. Thanh toán → 6. Nhận Vé → 7. Check-in tại rạp
```

### **⚖️ Quy tắc nghiệp vụ chính:**
- **Hết hạn Booking**: 10 phút để hoàn thành thanh toán
- **Cửa sổ Check-in**: 30 phút trước suất chiếu
- **Hạn hoàn tiền**: 2 giờ trước suất chiếu
- **Định giá ghế**: Động dựa trên loại ghế (thường/vip/đôi)
- **Ngăn xung đột**: Không có suất chiếu chồng chéo trong cùng phòng

### **🔄 Quy trình tự động:**
- **Dọn dẹp Booking hết hạn**: Middleware chạy nền
- **Tính giá**: Tự động từ base_price × seat_multiplier
- **Tính thời gian kết thúc**: start_time + movie_duration + 30 phút dọn dẹp
- **Xoay vòng JWT Token**: Refresh token mới mỗi lần làm mới

## 🧪 Testing & phát triển

### **🔧 Lệnh phát triển:**
```bash
python manage.py runserver          # Khởi động dev server
python manage.py makemigrations     # Tạo DB migration
python manage.py migrate            # Áp dụng migration
python manage.py createsuperuser    # Tạo user admin
python manage.py shell              # Django shell để test
```

### **📊 Admin Panel:**
- **URL**: `http://localhost:8000/admin/`
- **Tính năng**: Quản lý user, truy cập DB trực tiếp, duyệt model

### **🧪 Test API:**
- **Base URL**: `http://localhost:8000/api/`
- **Documentation**: DRF browsable API tự động tạo
- **Auth Header**: `Authorization: Bearer {access_token}`

## 🎛️ Cấu hình hệ thống

### **⚙️ Cài đặt chính:**
```python
# Cấu hình JWT
ACCESS_TOKEN_LIFETIME = 1 giờ
REFRESH_TOKEN_LIFETIME = 7 ngày
ROTATE_REFRESH_TOKENS = True

# Quy tắc nghiệp vụ
BOOKING_EXPIRY_MINUTES = 10
CHECKIN_WINDOW_MINUTES = 30
REFUND_DEADLINE_HOURS = 2

# Cơ sở dữ liệu
ENGINE = PostgreSQL
TIMEZONE = Asia/Ho_Chi_Minh
```

### **🛡️ Tính năng bảo mật:**
- UUID primary key (không tuần tự, bảo mật)
- JWT blacklisting khi đăng xuất
- Kiểm soát truy cập theo vai trò
- Validation & sanitization đầu vào
- Bảo vệ SQL injection (Django ORM)

## 🚀 Sẵn sàng triển khai

### **📦 Cân nhắc production:**
- Biến môi trường cho secrets
- PostgreSQL connection pooling
- Redis cho session/cache (tùy chọn)
- Máy chủ Gunicorn WSGI sẵn sàng
- Cấu hình phục vụ static file
- Xử lý lỗi toàn diện

### **🔒 File cấu hình môi trường (.env.example):**
```bash
# Cơ sở dữ liệu
DATABASE_NAME=cinema_booking
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Bảo mật
SECRET_KEY=your-secret-key-here
DEBUG=True

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

---

## 👥 Nhóm & hỗ trợ

**Dự án**: BTL Cơ sở dữ liệu - Học viện PTIT  
**Công nghệ**: Django REST Framework + PostgreSQL + JWT  
**Kiến trúc**: RESTful API với xác thực theo vai trò  
**Tính năng đặc biệt**: Tình trạng ghế thời gian thực + hệ thống booking tự động hết hạn

---

*📝 Cập nhật lần cuối: Tháng 10 năm 2024*