# 📋 CHECKLIST CHUNG 9 LOẠI LỖI HAY MẮC (MASTER CHECKLIST L1 – L9)
*Dành cho toàn bộ Member, Developer, Tester và Lead (Kiểm tra bắt buộc trước khi tạo PR / bàn giao)*

> **Quy định vận hành:** Mỗi lần bất kỳ member nào làm xong task hoặc bug fix, **BẮT BUỘC phải đối chiếu lần lượt 9 loại lỗi dưới đây** để tự phát hiện, tự sửa lỗi và ghi chú bằng chứng vào PR trước khi gửi Review.

---

## 🛑 BẢNG TRA CỨU 9 LOẠI LỖI HAY MẮC & BÀI HỌC (L1 – L9)

### 🔴 L1 ⭐ [Loại hay gặp nhất] Sửa Sai Tầng — Vá Triệu Chứng
*   **Ví dụ cụ thể:** Sửa prompt AI cho bug `"1–15 ngày"`, nhưng lỗi thật ở `tool-100` extract sai. PR #171 vá prompt khi chưa kiểm tra docs nào được load ra. *(PR liên quan: AI #171, #154, #148, #165)*
*   **💡 Bài học & Nguyên tắc:** Trace đúng tầng trước khi sửa:  
    $$\text{tool-100} \longrightarrow \text{group-rule} \longrightarrow \text{COLUMN\_PROMPTS (frozen)} \longrightarrow \text{COT\_HINTS} \longrightarrow \text{docs} \longrightarrow \text{prompt}$$  
    *Nhớ tắc ngôn: **"Tool > AI"**.*

---

### 🔴 L2 ⭐ [Loại hay gặp nhất] Test "Xanh Giả" — Không Fail Khi Logic Sai
*   **Ví dụ cụ thể:** Assert nguyên văn `"Du lịch"` nằm trong prompt (đổi wording là vỡ test); test backend chỉ so chuỗi SQL, không chạy DB thật; eval equals hạ lowercase nên `"du lịch"` pass mà production drop. *(PR liên quan: AI #150, #146, #160, #126, BE #32)*
*   **💡 Bài học & Nguyên tắc:** Test phải **fail khi nghiệp vụ sai**, không phải khi câu chữ thay đổi. Cần đúng casing thì dùng `contains` hoặc `regex`.

---

### 🔴 L3 ⭐ [Loại hay gặp nhất] Test Thiếu — Chỉ Vá Đúng Câu Bug
*   **Ví dụ cụ thể:** `o2001` thiếu present-mirror `"Thất nghiệp"`; `m0002` nhánh fallback vừa restructure lại mù test; fix `"Bỉ 45 ngày"` không kèm test. *(PR liên quan: AI #146, #160, #166)*
*   **💡 Bài học & Nguyên tắc:** Sửa 1 nhánh ➔ **Cover cả nhánh**: `happy case` + `absent` (kèm present-mirror) + `biến thể`, không chỉ test duy nhất câu bug gốc.

---

### 🟡 L4. Guard / Regex Allowlist Rộng ➔ Xoá Oan
*   **Ví dụ cụ thể:** Guard `O9004` *"chỉ giữ khi khớp regex"* xoá oan câu thật *"visa Nhật được cấp năm ngoái"*; `m0003` bắt nhầm câu hỏi *"...2 tháng à?"*. *(PR liên quan: AI #162, tool100 #17)*
*   **💡 Bài học & Nguyên tắc:** **Denylist hẹp** — chặn đúng cái sai đã kiểm chứng, mặc định tin tưởng model; thiết kế theo intent, đừng cố liệt kê "mọi cách khách nói".

---

### 🔷 L5 [Case study chiếu kỹ] Hiểu Sai Định Nghĩa Field / Nghiệp Vụ
*   **Ví dụ cụ thể:** `O9004` scoped theo **NƯỚC ĐÍCH**, nhưng test gán *"đậu visa Mỹ, giờ xin Schengen"* = *"đã đậu"* — sai, vì Schengen chưa có lịch sử. *(PR liên quan: AI #162)*
*   **💡 Bài học & Nguyên tắc:** **Bám nguồn chuẩn** (`COLUMN_PROMPTS` *"for destination country"*, `tool-100` nhận destinations) trước khi viết expected.

---

### ⚪ L6. Sửa 1 Chỗ, Sót N Chỗ Cùng Pattern
*   **Ví dụ cụ thể:** Fix mapping Schengen nhưng thiếu Iceland / Switzerland / Liechtenstein; token visa copy-paste ở 8 module khác nhau. *(PR liên quan: AI #143)*
*   **💡 Bài học & Nguyên tắc:** **Fix hệ thống** — quét toàn bộ vị trí có cùng pattern trong codebase, ghi rõ *"Đã rà soát các file X, Y, Z"* vào PR.

---

### ⚪ L7. Prompt Mơ Hồ / Dài Dòng
*   **Ví dụ cụ thể:** `task_1` viết *"ngược lại cái gì?"* để model tự đoán; rule THÁI ĐỘ ~1k token; thiếu nhãn *"Ví dụ:"* khiến model hiểu nhầm. *(PR liên quan: AI #126, #122, #166, #137)*
*   **💡 Bài học & Nguyên tắc:** Mỗi câu **chỉ một intent**, phải có nhãn (*"Ví dụ:"*), cắt bỏ token thừa. Sửa ở `COT_HINTS`/yaml, **KHÔNG đụng `COLUMN_PROMPTS` finetune**.

---

### ⚪ L8. Ẩu Quy Trình — Hygiene & Convention
*   **Ví dụ cụ thể:** Comment *"giải trình chỉnh sửa AI"* thừa; thiếu mã ticket BSVA trong fixture; báo *"đã test"* chung chung không kèm ảnh/output. *(PR liên quan: AI #142, tool100 #18, #19, #22, #23)*
*   **💡 Bài học & Nguyên tắc:** Gắn mã ticket ticket/JIRA; **hiểu vì sao code tồn tại rồi mới bỏ** (Chesterton's fence); báo *"đã test"* bắt buộc phải kèm ảnh chụp hoặc log output chứng minh.

---

### ⚪ L9. An Toàn Input & Vận Hành
*   **Ví dụ cụ thể:** Search ghép `f"%{q}%"` vào `ILIKE` ➔ `"50%"` khớp mọi thứ (wildcard injection); migration `CREATE EXTENSION` cần superuser, dễ nổ trên prod least-privilege. *(PR liên quan: BE #32)*
*   **💡 Bài học & Nguyên tắc:** **Escape input ILIKE** (`% _ \`) + khai báo `ESCAPE`; tách thao tác superuser khỏi migration app, note rõ vào runbook.

---

## 📋 CHECKLIST TỰ TÍCH XÁC NHẬN CHO MEMBER KHI HOÀN THÀNH TASK

Mỗi khi làm xong 1 task, member mở checklist này và tự tích vào từng ô bên dưới:

- [ ] **Khớp L1:** Đã trace đúng tầng (`tool-100` ➔ `group-rule` ➔ `COT_HINTS` ➔ `docs` ➔ `prompt`), không vá triệu chứng.
- [ ] **Khớp L2:** Đã kiểm tra test case fail khi logic nghiệp vụ sai, không viết test xanh giả.
- [ ] **Khớp L3:** Đã viết test cover cả nhánh (happy + absent + present-mirror), không chỉ test câu bug gốc.
- [ ] **Khớp L4:** Guard/Regex sử dụng denylist hẹp, không xóa oan dữ liệu thật của khách.
- [ ] **Khớp L5:** Đã đọc kỹ định nghĩa field trong `COLUMN_PROMPTS` trước khi gán expected.
- [ ] **Khớp L6:** Đã rà soát và sửa hết N vị trí có cùng pattern trong toàn bộ dự án.
- [ ] **Khớp L7:** Prompt viết một intent, có ví dụ minh họa, sửa đúng file `COT_HINTS`.
- [ ] **Khớp L8:** Đã gắn mã Ticket/JIRA, đính kèm bằng chứng ảnh/log output "Đã test" vào PR.
- [ ] **Khớp L9:** Đã escape input ILIKE, kiểm tra an toàn sql/migration.
