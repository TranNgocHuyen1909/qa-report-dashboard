# 📊 Bảng Công Thức Tính Toán & Quy Tắc Phân Loại — QA Review Stats

Tài liệu này tổng hợp toàn bộ công thức tính toán, quy tắc phân loại và thuật toán thống kê được sử dụng trong giao diện **Review Activity & PR Status (`?tab=review`)** trên **QA Report Dashboard**.

---

## 1. 🎯 Bộ Lọc Phạm Vi & Điều Kiện Bug Gốc (`periodFixedBugs`)

* **Phạm vi thời gian (`activePeriod`)**: Tính theo Tuần / Tháng / Kỳ đang chọn trên Topbar. Nếu chọn *"Tất cả các kỳ"*, hệ thống sẽ tổng hợp từ trước tới nay.
* **Điều kiện tính là Bug đã sửa trong kỳ (`isFixed`)**:
  - Trạng thái Notion / PR không phải `Cancel`.
  - Ghi chú Note trên Notion không chứa từ *"không tái hiện"*.
  - Có trạng thái hợp lệ (`Closed`, `Deployed`, `Resolved`, `Wait for development`, `Ready for review`, `Changes requested`...) HOẶC có GitHub PR Labels.
  - Ngày sửa thuộc khoảng `[startDate, endDate]` của kỳ.
* **Thứ tự ưu tiên lấy Ngày sửa (`bugFixedDate`)**:
  $$\text{Ngày tạo PR (prCreatedAt)} \longrightarrow \text{Ngày chỉnh sửa cuối (lastEditedTime)} \longrightarrow \text{Ngày xác nhận (confirmedDate)}$$

---

## 2. 👑 Phân Hệ VÒNG 1: HUYỀN REVIEW (QC Lead)

### 🔹 Điều kiện nhận diện Bug do Huyền đã Review (`isReviewedByHuyen`)
Một Task/Bug được ghi nhận là Huyền đã test/review khi thỏa mãn **ĐỒNG THỜI** các tiêu chuẩn sau:
1. **BẮT BUỘC phải có Pull Request (PR)**: Task không có PR (`Pull Request: Empty`) thì **không thể review** và **không tính** vào danh sách review. *(1 Task có thể bao gồm 1 hoặc nhiều PR)*.
2. **Thỏa mãn ít nhất 1 trong 3 điều kiện**:
   - Trường `Reviewers` trên Notion có đính kèm tên/ID của Huyền (`38ad872b-594c-81b9-8150-000220c17a19`).
   - Đã có comment trực tiếp của Huyền trên GitHub PR (`prCommentsByHuyen > 0`).
   - Đã được Huyền đổi Status hoặc PR Label sang `wait for development` / `wait for dev`.

### 🔹 Thứ Tự Ưu Tiên Xác Định Thời Gian Review (`huyenReviewDate`)
Đo thời gian review của Huyền được xác định chính xác theo thứ tự ưu tiên giảm dần sau:
$$\text{Thời gian Comment lần 1 (huyenFirstCommentAt)} \longrightarrow \text{Thời gian Comment lần 2+ (Re-review)} \longrightarrow \text{Thời gian đổi Label 'wait for dev'} \longrightarrow \text{confirmedDate}$$

* **Quy tắc Review Nhiều Vòng (Multi-round Re-review)**:
  - Nếu Dev sửa chưa đúng và Huyền phải **comment lần 2, lần 3...** để re-check lại, Task đó **vẫn được tính 100% là Huyền đã review** (`isReviewedByHuyen = true`).
  - Lượt re-review này được thống kê bổ sung vào chỉ số **Multi-round Review** (`huyenReviewRounds >= 2`).

---

### 🔹 Phân loại danh mục Bug Vòng 1 & Kết Quả Đánh Giá
| Danh mục / Kết quả | Định nghĩa & Điều kiện phân loại | Ghi chú / Quy tắc hiển thị |
| :--- | :--- | :--- |
| **Không tái hiện** | Note hoặc Status chứa cụm từ *"tái hiện"* (như *"Không thể tái hiện"*, *"Ko tái hiện"*...), *"no repro"*, *"không phải lỗi"* | Hiển thị badge màu xám **Không tái hiện**. |
| **Pass** | Task có PR, đã đạt 100% test (không comment HOẶC đã chuyển sang `wait for dev` / `Closed` / `Deployed`) | Hiển thị badge màu xanh **Pass**. |
| **Dev đã phản hồi** | Task đang mở có comment review từ QC Lead VÀ Dev đã comment trả lời dưới PR / đổi trạng thái | Hiển thị badge màu xanh dương **Dev đã phản hồi**. |
| **Chờ Dev phản hồi** | Task đang mở có comment review từ QC Lead VÀ Dev CHƯA comment trả lời | Hiển thị badge màu đỏ **Chờ Dev phản hồi**. |
| **Tổng Đã Review** | `huyenReviewedBugs` = Tất cả Task có PR thỏa mãn `isReviewedByHuyen` trong kỳ | 1 Task chứa 1 hoặc nhiều PR đếm là 1 Task |
| **Review Có Comment** | `huyenReviewedWithComments` = Task có PR VÀ có comment của Huyền trên GitHub PR (`prCommentsByHuyen > 0`) | Phát sinh lỗi cần Dev sửa |
| **Bug Chờ Review** | `pendingHuyenReviewBugs` = Tất cả Task có PR chưa được Huyền review từ trước đến nay (**Tất cả thời gian**) | Không lọc theo kỳ để đảm bảo **không bao giờ bị sót** task chờ review còn tồn đọng |

---

### 🔹 Công thức Bảng Thống Kê Dev (Vòng 1 - `devReviewStats`)

1. **Tỷ Lệ Lỗi Cá Nhân (%)**:
   $$\text{Tỷ Lệ Lỗi Cá Nhân (\%)} = \left( \frac{\text{Số bug bị Huyền comment của Dev này}}{\text{Tổng số bug Huyền đã review của Dev này}} \right) \times 100$$
   * **Cảnh báo mức độ**:
     - `> 30%`: Màu đỏ 🔴 (`#ef4444`) — Tỷ lệ lỗi cá nhân cao.
     - `> 15% - 30%`: Màu vàng 🟡 (`#f59e0b`).
     - `≤ 15%`: Màu xanh 🟢 (`#10b981`).

2. **Đóng Góp Lỗi Cả Team (%)**:
   $$\text{Đóng Góp Lỗi Team (\%)} = \left( \frac{\text{Số bug bị Huyền comment của Dev này}}{\text{TỔNG SỐ BUG BỊ COMMENT CỦA CẢ TEAM}} \right) \times 100$$
   * **Cảnh báo mức độ**: `> 40%`: Hiển thị icon 🚨 đỏ đậm (`#dc2626`) — Chiếm trên 40% tổng số lỗi của cả team.

3. **Tiến Độ Review (%)**:
   $$\text{Tiến Độ Review (\%)} = \left( \frac{\text{Số bug Huyền đã review của Dev}}{\text{Tổng số bug Dev đã sửa trong kỳ}} \right) \times 100$$

---

## 3. 👨‍💻 Phân Hệ VÒNG 2: ANH TRƯỜNG REVIEW (Tech Lead)

### 🔹 Phân loại PR Vòng 2
- **Tổng PRs (`truongTotalPrs`)**: Tất cả bug có `pullRequestUrl` hợp lệ trong kỳ (không tính Cancel).
- **Anh Trường Đã Review (`truongReviewedBugs`)**: PR có `ghReviewStatus` là `Approved`, `Changes Requested`, hoặc `Commented` HOẶC có comment của Anh Trường (`prCommentsByTruong > 0`).
- **Approved / Merged (`truongApprovedBugs`)**: `ghReviewStatus == Approved` HOẶC Notion/PR status là `Closed`, `Deployed`, `Merged`.
- **Changes Requested (`truongChangesReqBugs`)**: PR có trạng thái `Changes Requested`.
- **Đang Chờ Review (`truongPendingBugs`)**: PR chưa được Approve, chưa có comment của Anh Trường và chưa bị Cancel.

---

### 🔹 Công thức Bảng Thống Kê Dev (Vòng 2 - `truongDevStats`)

1. **Tỷ Lệ Changes Requested Cá Nhân (%)**:
   $$\text{Tỷ Lệ Changes Requested Cá Nhân (\%)} = \left( \frac{\text{Số PR bị Changes Requested của Dev}}{\text{Số PR Anh Trường đã review của Dev}} \right) \times 100$$

2. **Đóng Góp Changes Requested Cả Team (%)**:
   $$\text{Đóng Góp Changes Requested Team (\%)} = \left( \frac{\text{Số PR bị Changes Requested của Dev}}{\text{TỔNG PR BỊ CHANGES REQUESTED CỦA CẢ TEAM}} \right) \times 100$$

3. **Tỷ Lệ Approve (%)**:
   $$\text{Tỷ Lệ Approve (\%)} = \left( \frac{\text{Số PR được Approved của Dev}}{\text{Tổng số PR của Dev}} \right) \times 100$$

---

## 4. 🌐 Phân Hệ TỔNG QUAN (Tab Tất Cả)

### 🔹 Thống kê KPI Toàn Dự Án
- **Tổng Bug Dự Án**: $\sum \text{periodFixedBugs}$ trong kỳ.
- **Hoàn Thành (`allCompletedBugs`)**: Bug có status `closed`, `deployed` hoặc PR label chứa `close` / `merge`.
- **Đang Xử Lý (Pending)**:
  $$\text{Đang Xử Lý} = \text{Tổng Bug Dự Án} - \text{Hoàn Thành}$$

### 🔹 Ma trận Thống kê Tất cả Dev (`allDevStats`)
1. **Tỷ Lỗi Vòng 1 (Huyền %)** = $\left( \frac{\text{Số bug bị Huyền comment}}{\text{Số bug Huyền đã review}} \right) \times 100$
2. **Tỷ Lỗi Vòng 2 (Trường %)** = $\left( \frac{\text{Số PR bị Changes Requested}}{\text{Số PR Anh Trường đã review}} \right) \times 100$
3. **Tiến Độ Hoàn Thành Chung (Overall Progress %)**:
   $$\text{Overall Progress (\%)} = \left( \frac{\text{Số bug đã Closed / Deployed của Dev}}{\text{Tổng số bug Dev đã sửa trong kỳ}} \right) \times 100$$

---

## 5. 📄 Quy Tắc Phân Trang & Trạng Thái Reply

- **Dev Đã Reply (`isDevRepliedBug`)**: Bug bị comment ở Vòng 1 VÀ (Dev đã comment lại trên GitHub HOẶC số vòng review > 1 HOẶC status đã đổi sang `Resolved` / `Ready for review`).
- **Chờ Dev Reply (`huyenPendingReplyBugs`)**: Bug bị comment ở Vòng 1 VÀ chưa được Dev reply/resolve.
- **Công thức Phân trang (Pagination)**:
  - $\text{Chỉ số bắt đầu (Start Index)} = (\text{Page} - 1) \times \text{PageSize (10)} + 1$
  - $\text{Chỉ số kết thúc (End Index)} = \min(\text{Page} \times \text{PageSize (10)}, \text{Tổng số Bug})$
  - $\text{Tổng số trang (Total Pages)} = \left\lceil \frac{\text{Tổng số Bug}}{\text{PageSize (10)}} \right\rceil$

---
*Tài liệu được khởi tạo tự động dựa trên mã nguồn `ReviewStats.tsx` của hệ thống QA Report Dashboard.*
