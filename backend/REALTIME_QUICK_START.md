# ✅ TÍNH NĂNG MỚI: TRẠNG THÁI REAL-TIME

## 🎯 TỔNG QUAN

Đã thêm tính năng hiển thị trạng thái suất chiếu theo thời gian thực:

- **Đang chiếu** 🟢
- **Sắp chiếu** 🟠
- **Chưa chiếu** 🔵
- **Đã kết thúc** ⚫

---

## 📝 FILE ĐÃ THAY ĐỔI

1. **api/models/showtime.py**

   - ✅ Thêm method `get_realtime_status()`
   - Logic phân loại theo thời gian

2. **api/serializers/showtime.py**

   - ✅ Thêm field `realtime_status`
   - Tự động tính khi serialize

3. **api/views/showtime.py**
   - ✅ Thêm action `admin_all()`
   - Endpoint cho admin xem tất cả + phân nhóm

---

## 🚀 CÁCH SỬ DỤNG

### 1. User (Public)

```bash
# Xem suất chiếu còn hiệu lực
GET http://localhost:8000/api/showtime/
```

Response có thêm:

```json
{
  "realtime_status": {
    "status": "scheduled",
    "label": "Chưa chiếu",
    "color": "blue"
  }
}
```

### 2. Admin

```bash
# Xem TẤT CẢ suất chiếu với phân nhóm
GET http://localhost:8000/api/showtime/admin_all/
Authorization: Bearer <token>
```

Response:

```json
{
  "summary": {
    "total": 25,
    "showing": 3,
    "upcoming": 15,
    "finished": 7
  },
  "showing": [
    {
      "id": "...",
      "movie_title": "Avatar",
      "realtime_status": {
        "status": "showing",
        "label": "Đang chiếu",
        "color": "green"
      }
    }
  ],
  "upcoming": [...],
  "finished": [...]
}
```

---

## 🎨 FRONTEND IMPLEMENTATION

### React Component Example

```jsx
function ShowtimeCard({ showtime }) {
  const { realtime_status } = showtime;

  const getBadgeClass = (color) => {
    return `badge badge-${color}`;
  };

  return (
    <div className="showtime-card">
      <h3>{showtime.movie_title}</h3>
      <span className={getBadgeClass(realtime_status.color)}>
        {realtime_status.label}
      </span>
      <p>Thời gian: {showtime.start_time}</p>
    </div>
  );
}

// Admin Dashboard
function AdminShowtimes() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/showtime/admin_all/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <div>
      <Stats summary={data.summary} />

      <Section title="🟢 Đang chiếu" showtimes={data.showing} />
      <Section title="🔵 Sắp chiếu" showtimes={data.upcoming} />
      <Section title="⚫ Đã kết thúc" showtimes={data.finished} />
    </div>
  );
}
```

### CSS

```css
.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.badge-green {
  background: #10b981;
  color: white;
}

.badge-orange {
  background: #f59e0b;
  color: white;
}

.badge-blue {
  background: #3b82f6;
  color: white;
}

.badge-gray {
  background: #6b7280;
  color: white;
}
```

---

## 🧪 TEST

```bash
# Chạy test script
./test_realtime.sh
```

Kết quả mong đợi:

```
📊 SUMMARY:
=========================================
Tổng số suất chiếu: 25
🟢 Đang chiếu: 3
🔵 Sắp chiếu: 15
⚫ Đã kết thúc: 7
=========================================
```

---

## 📚 TÀI LIỆU

- **REALTIME_STATUS.md** - Chi tiết đầy đủ
- **CHANGELOG.md** - Lịch sử thay đổi
- **test_realtime.sh** - Script test tự động

---

## 🎯 TIMELINE LOGIC

```
Ví dụ: Suất chiếu 14:00 - 16:30

13:00  →  "Chưa chiếu" (blue)
13:40  →  "Sắp chiếu (20 phút nữa)" (orange)
14:00  →  "Đang chiếu" (green)
15:00  →  "Đang chiếu" (green)
16:30  →  "Đã kết thúc" (gray)
```

---

## ⚙️ TECHNICAL DETAILS

### Không cần migration

- Logic ở application layer
- Không thay đổi database schema

### Performance

- Tính toán real-time mỗi request
- Đã optimize với `select_related()`

### Auto-refresh recommended

```javascript
// Refresh mỗi 30 giây
setInterval(() => fetchShowtimes(), 30000);
```

---

## ✅ CHECKLIST

- [x] Model method `get_realtime_status()`
- [x] Serializer field `realtime_status`
- [x] Admin endpoint `admin_all()`
- [x] Test script
- [x] Documentation
- [ ] Frontend integration (tùy bạn)

---

**🎉 HOÀN TẤT! Giờ admin có thể quản lý suất chiếu với trạng thái real-time.**
