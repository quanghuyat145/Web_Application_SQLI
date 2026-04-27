# Frontend - HTML/CSS/JavaScript

## Chức Năng

### 📝 Trang Đăng Nhập/Đăng Ký (`index.html`)
- Form đăng nhập với validation
- Form đăng ký với:
  - Tên đăng nhập (max 20 ký tự)
  - Email
  - Mật khẩu (min 6 ký tự)
  - Nhập lại mật khẩu
- Giao diện đẹp với gradient background

### 🏠 Trang Chủ (`home.html`)
- Hiển thị danh sách sản phẩm
- Quản lý giỏ hàng (thêm, xóa, cập nhật số lượng)
- Tính toán tổng giá tiền tự động
- Chức năng thanh toán đơn hàng

---

## 📁 File Structure

```
frontend/
├── index.html       # Trang đăng nhập/đăng ký
├── home.html        # Trang chủ
├── style.css        # CSS cho index.html
├── home.css         # CSS cho home.html
├── script.js        # JavaScript cho index.html
└── home.js          # JavaScript cho home.html
```

---

## 🚀 Chạy Frontend

### Cách 1: Live Server (VS Code)
```
Right-click index.html → "Open with Live Server"
```

### Cách 2: Python HTTP Server
```bash
python -m http.server 8000
# Truy cập: http://localhost:8000
```

### Cách 3: Node HTTP Server
```bash
http-server
```

---

## 📌 Cấu Hình

### API URL
Chỉnh sửa `script.js` và `home.js`:
```javascript
const API_URL = 'http://localhost:5000';  // Thay đổi nếu backend port khác
```

---

## 💾 LocalStorage

Frontend lưu trữ ở localStorage:
- **token**: JWT token xác thực
- **username**: Tên người dùng
- **cart**: Giỏ hàng (JSON)

---

## 🎨 Giao Diện

### Trang Đăng Nhập/Đăng Ký
- Gradient background (hồng → xanh)
- 2 form nằm cạnh nhau
- Nút social media (Gmail, Facebook, Twitter)

### Trang Chủ
- Header với navigation
- Hero section chào mừng
- Grid sản phẩm 3-4 cột
- Bảng giỏ hàng
- Section liên hệ

---

## 🔧 Customization

### Thay đổi màu sắc
Chỉnh sửa `style.css` hoặc `home.css`:
```css
/* Màu chính */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Thay đổi font
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

### Thêm sản phẩm mới
Không cần thay đổi frontend, backend sẽ tự cấp
(Xem hướng dẫn backend)

---

## 🐛 Debug

### Bật console
Nhấn `F12` hoặc `Ctrl+Shift+I`

### Xem requests
- Tab "Network"
- Kiểm tra requests tới `localhost:5000`

### Clear cache
- Ctrl+Shift+Delete
- Hoặc: Right-click → "Clear browsing data"

---

## 📱 Responsive Design

- ✓ Desktop (1200px+)
- ✓ Tablet (768px-1199px)
- ✓ Mobile (< 768px)

---

## ⌨️ Phím Tắt

- `F12` - Mở Developer Tools
- `Ctrl+Shift+I` - DevTools
- `Ctrl+Shift+J` - Console
- `Ctrl+Shift+K` - Debugger
- `Ctrl+F5` - Hard Reload (Clear Cache)

---

## 🔗 Kết Nối Backend

Frontend kết nối Backend qua API:
- Login → POST `/api/login`
- Register → POST `/api/register`
- Get Products → GET `/api/products`
- Create Order → POST `/api/orders`

Chi tiết xem `API_DOCUMENTATION.md`

---

## 📝 Ghi Chú

- Frontend là **Single Page Application** (SPA)
- Tất cả file CSS/JS được load cùng lúc
- Không cần build/compile
- Hoạt động trên trình duyệt hiện đại

---

**Hành động tiếp theo:** Xem `HƯỚNG_DẪN_CHẠY.md` để chạy toàn bộ ứng dụng
