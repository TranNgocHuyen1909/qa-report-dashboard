# 🚀 Hướng Dẫn Đẩy FTP - Dashboard QA Report

Danh sách các file thay đổi trong thư mục `dist/` sau khi build (`npm run build`) cần copy / đẩy FTP đè vào `c:\Users\trann\bug-report` (hoặc server FTP):

---

## 📦 Danh Sách File Cần Cập Nhật Sang FTP / `bug-report`

| STT | Thư mục / File | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `dist/index.html` | **Thay đổi** | Cập nhật đường dẫn tham chiếu bundle JS/CSS mới |
| 2 | `dist/assets/index-eB2e0-fx.js` | **File mới** | Bundle JS giao diện mới (chứa logic Review Tech Lead & thống kê chuẩn) |
| 3 | `dist/assets/index-bohglOTW.css` | **File mới** | Bundle CSS giao diện mới |
| 4 | `dist/server/main.js` | **Thay đổi/Mới** | Build API Server Node.js |
| 5 | `dist/server/commentGrabber-XCCT2I3E.js` | **File mới** | Module phụ trách cào GitHub Comment/Review |

---

## ⚙️ Các Thay Đổi Quan Trọng Đã Được Fix & Commit

1. **Sửa Nạp Token GitHub (`src/server/config.ts`)**:
   - Thêm `override: true` vào `dotenv.config()` để nạp đúng `GITHUB_TOKEN` thật từ `.env`, sửa dứt điểm lỗi `Error` 103/103 PR khi fetch dữ liệu review.

2. **Cập Nhật Công Thức Tech Lead Approved (`ReviewStats.tsx`)**:
   - `isTruongApprovedBug`: Tính cho tất cả Bug có PR đã **Approved**, hoặc PR đã **Merged**, hoặc trạng thái Notion đã chuyển sang **`Closed` / `Deployed`**.

3. **Loại Trừ Đếm Trùng Trạng Thái (`ReviewStats.tsx`)**:
   - Logic `CHƯA ĐỤNG TỚI` và `TỔNG BUG FIX` tự động loại trừ các ticket đã `Closed`/`Merged` và `Cancel`, đảm bảo phép cộng hàng dọc/hàng ngang khớp 100% (Ví dụ: `20 Approved + 7 Chưa đụng tới = 27 Bug Total`).

---

## 🛠️ Thao Tác Copy / Đẩy FTP

Nếu đẩy thủ công sang `c:\Users\trann\bug-report`:
1. Xóa hoặc ghi đè thư mục `assets/` cũ trong `bug-report` bằng thư mục `dist/assets/` mới.
2. Ghi đè file `index.html` mới từ `dist/index.html`.
3. Ghi đè thư mục `server/` mới từ `dist/server/`.
