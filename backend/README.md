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