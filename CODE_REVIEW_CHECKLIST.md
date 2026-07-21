# 📋 CODE REVIEW & QUALITY CHECKLIST
*Dành cho Developer, Tester và QC Lead (Dự án QA Report Dashboard & Hệ sinh thái LISA)*

---

## 🎯 I. NGUYÊN TẮC CỐT LÕI & BAREM CHUẨN ANH ĐẠT

### 1. Mô Hình "Black Box" Bàn Giao Bug Fix / Task
- **📥 Input (Đầu vào):** Defect log Notion chi tiết, chỉ thị họp (phương án sửa, priority, deadline), specs/design docs.
- **⚡ Process (Quy trình):** Developer bắt buộc đề xuất & giải trình phương án sửa code trước khi triển khai (tránh rework).
- **📤 Output (Đầu ra):** Mã nguồn hoàn chỉnh (PR), môi trường test tương ứng, và **Checklist tự kiểm tra chất lượng (Pre-handover Checklist)**.

### 2. Các Chỉ Số Target & Phân Bổ Hạn Mức
| Chỉ số | Target Tiêu chuẩn | Ghi chú & Định hướng |
| :--- | :--- | :--- |
| **Năng suất sửa bug** | `3.0 - 5.0` bug/ngày/người | Đạt 3.0 ở tháng 1, nâng dần lên 4.0 - 5.0 ở các tháng tiếp theo. |
| **Tỷ lệ lỗi (Defect Rate)** | `< 1.15%` (`< 15` lỗi / 100 testcases) | Kiểm soát quy mô 1,500 testcases, tránh ngợp thời gian retest. |
| **Tỷ lệ Re-open** | `< 15%` | Phân tích root cause bắt buộc với các lỗi bị mở lại. |
| **Hạn mức Review Lead** | `20%` effort (~1.6h/ngày) | Hướng tới tối ưu dài hạn 5%. Không chuyển review cho dev. |
| **Thẩm quyền Close Bug** | **Chỉ Anh Trường** | Lead quản lý và Dev không tự ý đóng lỗi (`Closed`) trên hệ thống. |

---

## ✅ II. PRE-HANDOVER SELF-CHECKLIST (DEV & TESTER BẮT BUỘC TICK TRƯỚC PR)

Trước khi gửi Pull Request hoặc chuyển trạng thái sang **Chờ review**, Developer & Tester bắt buộc phải tự tick chọn đầy đủ 6 điểm kiểm tra dưới đây:

- [ ] **1. Test Metadata & Schema Data:**
  - [ ] Đúng kiểu dữ liệu, các trường metadata bắt buộc không bị `null` hoặc `undefined`.
  - [ ] Đếm chính xác số lượng record, không bị lệch do trùng lặp dữ liệu.
- [ ] **2. Test UI/UX Responsive & Cross-Browser:**
  - [ ] Kiểm thử hiển thị trên Chrome, Firefox và Safari.
  - [ ] Kiểm thử trên giao diện di động (Mobile Layout), đảm bảo không tràn khung hoặc vỡ layout.
- [ ] **3. Check Lỗi Console JavaScript (F12 Debug Console):**
  - [ ] Mở tab Console trình duyệt kiểm tra: KHÔNG còn bất kỳ Warning hay Uncaught Exception/Error nào.
- [ ] **4. Tự Retest Cục Bộ (Local Retest):**
  - [ ] Tự chạy lại kịch bản kiểm thử trên môi trường local dev trước khi bấm tạo PR.
- [ ] **5. Xử Lý Lỗi Ảnh Hưởng Ngang:**
  - [ ] Nếu thuộc phạm vi task/bug của mình ➔ Tự sửa triệt để.
  - [ ] Nếu ngoài phạm vi task ➔ Ghi chú (note) đẩy ra ngoài và tham vấn Anh Trường trước khi sửa.
- [ ] **6. Review Chéo Testcase (Cross-Testcase Review):**
  - [ ] Đã chuyển giao và thực hiện review chéo kịch bản kiểm thử giữa các thành viên (Huy ↔ Hoàng ↔ Hồ).

---

## 🔍 III. CHECKLIST CODE REVIEW CHI TIẾT THEO TẦNG

### 1. Tầng Business Logic & Routing
- [ ] **Scope Matcher:** Regex hoặc điều kiện match không bị ăn quá rộng (Over-matching) gây dính false positive.
- [ ] **Rule Isolation:** Thay đổi logic ở module này không phá hỏng luồng chạy của các module tương tự.
- [ ] **Duplicate Bug Exclusion:** Loại trừ các lỗi trùng lặp/cancel ra khỏi thống kê "Số thực nhận" để bảo toàn năng suất thực.

### 2. Tầng Metadata & Schema Integrity
- [ ] **Strict Typing:** Đảm bảo sử dụng đúng interface TypeScript, không `any` hoặc ép kiểu tùy tiện.
- [ ] **Null Guarantee:** Mọi dereference thuộc tính (ví dụ: `obj.prop.subProp`) đều có optional chaining `?.` hoặc null check an toàn.
- [ ] **Standardized Personnel Names:** Sử dụng Tên tiếng Việt chuẩn chỉ (`displayName` như *Nguyễn Xuân Hồ*, *Hoàng Giáp Việt*, *Huyền Trần Ngọc*) thay cho raw code.

### 3. Tầng Git Convention & Branching
- [ ] **Branch Naming:** Đặt tên nhánh theo chuẩn `fix/<ticket-id>-mô-tả` hoặc `feature/<ticket-id>-mô-tả`.
- [ ] **No Local Config Leak:** Không commit `.env.local`, `.devcontainer/`, file cache tạm hoặc `scratch/`.
- [ ] **Commit Message:** Đúng chuẩn Conventional Commit (Tiếng Việt): `fix(BSVA-xxx): mô tả ngắn gọn`.

---

## 📝 IV. MẪU BÁO CÁO REVIEW PR (PR COMMENT TEMPLATE)

```markdown
# 🛡️ PR Review Comment — <Repo Name> #<PR Number>

## 📍 Line Comment: `<file_path>:<line_number>`
> **Hiện trạng (Actual):** [Input/hành vi gây lỗi + ví dụ output sai]
> **Kỳ vọng (Expected):** [Hành vi đúng sau khi sửa]
> **Root Cause:** [Nguyên nhân gốc rễ: sai regex, dính null check, sai mapping...]
> **Đề xuất sửa:** [Đoạn code gợi ý sửa ngắn gọn]

## ⚖️ General Review Summary
- [ ] **Approve** — Code sạch, đã test kỹ local, đáp ứng đầy đủ checklist.
- [ ] **Request Changes** — Cần chỉnh sửa các dòng comment trên trước khi merge.
```
