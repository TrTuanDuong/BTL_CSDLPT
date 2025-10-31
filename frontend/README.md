# 🎬 Cinema Booking System - Frontend

Frontend của hệ thống đặt vé xem phim, xây dựng bằng React và JavaScript.

## 🚀 Cài đặt và chạy

### Yêu cầu
- Node.js 14.0 trở lên
- npm hoặc yarn

### Hướng dẫn

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start

# Build production
npm run build
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## 📁 Cấu trúc dự án

```
frontend/
├── public/               # Static files
├── src/
│   ├── components/       # Reusable components
│   │   ├── common/       # Common components (Button, Input, Card, etc.)
│   │   ├── layout/       # Layout components (Header, Footer, Sidebar)
│   │   └── movies/       # Movie components
│   ├── pages/            # Page components
│   │   ├── auth/         # Login, Register
│   │   ├── user/         # User pages (Movies, Booking, etc.)
│   │   └── admin/        # Admin pages
│   ├── services/         # API services
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── utils/            # Utility functions
│   ├── styles/           # CSS files
│   ├── App.js            # Main App component
│   └── index.js          # Entry point
└── package.json
```

## 🎯 Tính năng

### Người dùng (User)
- ✅ Đăng ký / Đăng nhập
- ✅ Xem danh sách phim
- ✅ Tìm kiếm và lọc phim
- ✅ Xem chi tiết phim và suất chiếu
- ✅ Chọn ghế và đặt vé
- ✅ Thanh toán
- ✅ Xem lịch sử đặt vé
- ✅ Quản lý thông tin cá nhân

### Quản trị viên (Admin)
- ✅ Quản lý phim (CRUD)
- ✅ Quản lý thể loại
- ✅ Quản lý phòng chiếu
- ✅ Quản lý suất chiếu
- ✅ Xem thống kê booking
- ✅ Quản lý người dùng

## 🔧 Cấu hình

Backend API URL được cấu hình trong `src/services/api.js`:
```javascript
const API_URL = 'http://localhost:8000/api'
```

## 📝 Ghi chú

- Frontend tự động refresh JWT token khi hết hạn
- Tất cả request đều được attach JWT token trong header
- Phân quyền User/Admin được kiểm tra ở cả client và server
