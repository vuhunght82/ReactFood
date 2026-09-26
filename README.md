
Dự án này là phiên bản chuyển đổi toàn diện từ ứng dụng Web HTML/Bootstrap/JS (`d:\React Food\HTML`) sang ứng dụng đa nền tảng **React Native với Expo SDK** (`d:\React Food\ReactFood`), hỗ trợ chạy trên **Android**, **iOS** và **Web**.

---

## 🌟 Tính Năng Đã Chuyển Đổi

1. **Sơ Đồ Phòng Bàn Thời Gian Thực (`/`)**:
   - Quản lý sơ đồ 14 bàn thuộc các khu vực: **Tầng 1**, **Tầng 2**, **Sân Vườn**, **Phòng VIP**.
   - Thẻ bàn trực quan với trạng thái: Bàn trống (xanh lá), Đang phục vụ (đỏ/cam), Khách đang ngồi.
   - Bộ đếm khách ngồi (+ / -) trực tiếp trên bàn.
   - Thao tác bàn: Gọi món, Đổi bàn / Chuyển bàn, Thanh toán hóa đơn, Trả bàn trống.

2. **Thực Đơn & Đặt Món (`/menu`)**:
   - Phân loại theo 10 danh mục ẩm thực chay: *Điểm Tâm & Bún/Phở, Khai Vị & Gỏi, Cơm Chiên, Lẩu Chay, Món Kho & Xào, Canh, Món Chiên, Hấp Luộc, Tráng Miệng, Nước Uống*.
   - Tìm kiếm nhanh món ăn theo tên hoặc mã món (`DT001`, `KV001`, `C001`...).
   - Thẻ món ăn với hình ảnh sắc nét, giá bán chuẩn định dạng VNĐ, mô tả, nhãn Còn hàng/Tạm hết.
   - Nút tăng/giảm số lượng vào giỏ hàng ngay trên thẻ món.
   - Thanh giỏ hàng nổi (Floating Cart) với số lượng và tổng tiền cập nhật tức thì.

3. **Giỏ Hàng & Thiết Lập Đơn (`/cart`)**:
   - Chọn hình thức phục vụ:
     - **Ăn tại quán**: Gắn trực tiếp vào bàn ăn đã chọn.
     - **Giao hàng / Mang về**: Hỗ trợ các nền tảng *GrabFood, ShopeeFood, BeFood, Hotline quán, Khách lấy*.
   - Điền thông tin khách hàng, số điện thoại, địa chỉ, hình thức thanh toán (COD hoặc Chuyển khoản QR).
   - Tùy chỉnh ghi chú cho từng món ăn (ít ớt, không hành, ăn chay thanh...).
   - Nút **"GỬI ĐƠN XUỐNG BẾP"** tự động chuyển đổi trạng thái bàn sang `SERVING` và đẩy order sang màn hình bếp KDS.

4. **Màn Hình Bếp (Kitchen Display System - KDS) (`/kitchen`)**:
   - Giao diện độ tương phản cao chuyên dụng cho đầu bếp.
   - Thẻ vé bếp hiển thị rõ số bàn / shipper, mã đơn hàng, giờ đặt, các món ăn kèm ghi chú chi tiết.
   - Chuyển trạng thái quy trình làm bếp 1 chạm: `Chờ Bếp Nhận` ➔ `Bắt Đầu Nấu` ➔ `Nấu Xong (Báo Phục Vụ)`.

5. **Nhận Món (Bếp Đã Xong) (`/ready`)**:
   - Màn hình thông báo các món ăn và đơn hàng đã được bếp hoàn thành.
   - Số hiệu bàn và mã đơn lớn, nổi bật cho phục vụ bưng ra bàn hoặc bàn giao tài xế giao hàng.
   - Nút xác nhận: *"Đã bưng ra bàn"* / *"Đã giao cho Shipper"*.

6. **Quản Lý Đơn Hàng (`/orders`)**:
   - Lọc đơn hàng theo trạng thái: *Tất Cả, Đang Phục Vụ, Bếp Xong, Hoàn Tất, Đã Hủy*.
   - Trạng thái thanh toán: *Đã Thanh Toán* (PAID) / *Chưa Thanh Toán* (UNPAID).
   - Chi tiết từng món trong đơn, thời gian tạo, người tạo.
   - Thao tác: Thanh toán đơn & Hủy đơn.

7. **Quản Lý & Cài Đặt Hệ Thống (`/settings`)**:
   - **Cấu hình máy chủ backend**: Nhập IP / Domain server Node.js Express (ví dụ `http://192.168.1.100:3000` hoặc `http://localhost:3000`).
   - Kiểm tra kết nối & Đồng bộ dữ liệu 2 chiều.
   - Hỗ trợ chế độ **Độc Lập (Offline Mode)**: Ứng dụng tự động lưu trữ vào `AsyncStorage`, hoạt động đầy đủ ngay cả khi chưa bật server backend!
   - Thêm bàn ăn mới (Mã bàn, Tên bàn, Khu vực, Sức chứa).
   - Thêm món mới vào thực đơn & Bật/Tắt tình trạng còn hàng của món ăn.

8. **Đăng Nhập & Phân Quyền (`LoginModal`)**:
   - Thiết kế hoa sen xanh lá & viền vàng hoàng gia sang trọng đồng bộ với phiên bản HTML.
   - Chuyển đổi nhanh vai trò: **Quản Lý (ADMIN)**, **Bếp (KITCHEN)**, **Thu Ngân (CASHIER)**, **Bồi Bàn (WAITER)**.

9. **Thanh Toán & Mã QR VietQR (`PaymentModal`)**:
   - Hóa đơn chi tiết dịch vụ.
   - Chọn phương thức: Tiền mặt hoặc Chuyển khoản QR.
   - Tích hợp ảnh quét mã VietQR ACB ngân hàng chính xác từ dự án gốc.

---

## 📁 Cấu Trúc Thư Mục `ReactFood`

```
ReactFood/
├── assets/
│   └── images/               # Biểu tượng, ảnh món mẫu, mã qrcode_acb.png
├── src/
│   ├── app/                  # Expo Router (File-based navigation)
│   │   ├── _layout.tsx       # Root layout, AppProvider, AppHeader, LoginModal
│   │   └── (tabs)/
│   │       ├── _layout.tsx   # Thanh điều hướng 7 Tab với Badge thông báo động
│   │       ├── index.tsx     # Tab 1: Sơ Đồ Phòng Bàn
│   │       ├── menu.tsx      # Tab 2: Thực Đơn & Gọi Món
│   │       ├── cart.tsx      # Tab 3: Giỏ Hàng & Gửi Bếp
│   │       ├── kitchen.tsx   # Tab 4: Màn Hình Bếp (KDS)
│   │       ├── ready.tsx     # Tab 5: Nhận Món (Bếp Xong)
│   │       ├── orders.tsx    # Tab 6: Quản Lý Đơn Hàng
│   │       └── settings.tsx  # Tab 7: Cài Đặt & Quản Lý CRUD
│   ├── components/           # Các component tái sử dụng
│   │   ├── AppHeader.tsx     # Header thương hiệu, Trạng thái Server, Tài khoản
│   │   ├── LoginModal.tsx    # Modal đăng nhập hoa sen & đổi vai trò
│   │   ├── TableDetailModal.tsx # Chi tiết bàn, chỉnh khách, đổi bàn, gọi món
│   │   └── PaymentModal.tsx  # Modal thanh toán & VietQR
│   ├── constants/
│   │   ├── initialData.ts    # Dữ liệu hạt giống chuẩn từ CSDL SQLite
│   │   └── theme.ts          # Bộ màu Hoa Sen (Lotus Green & Gold Amber)
│   ├── context/
│   │   └── AppContext.tsx    # Quản lý State toàn cục, giỏ hàng, Socket.IO, Offline
│   └── types/
│       └── index.ts          # Định nghĩa TypeScript Types & Models
├── app.json                  # Cấu hình Expo
├── package.json              # Danh sách phụ thuộc
└── tsconfig.json             # Cấu hình TypeScript
```

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Khởi chạy trên Web Browser (Chrome/Edge/Safari):
```bash
cd ReactFood
npx expo start --web
```

### 2. Khởi chạy trên Android:
- Khởi động Android Emulator hoặc cắm điện thoại Android bật chế độ USB Debugging.
```bash
cd ReactFood
npx expo start --android
```

### 3. Khởi chạy trên iOS (Mac):
```bash
cd ReactFood
npx expo start --ios
```

### 4. Quét mã QR qua ứng dụng Expo Go trên điện thoại thật:
```bash
cd ReactFood
npx expo start
```
Mở camera (trên iPhone) hoặc ứng dụng **Expo Go** (trên Android) và quét mã QR trên màn hình terminal.
