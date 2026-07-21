# 📋 QA DASHBOARD & BLACK BOX CODE REVIEW CHECKLIST

Tài liệu này đúc kết các quy chuẩn kiểm thử và code review đặc thù cho các dự án trong hệ sinh thái LISA (bao gồm QA Report Dashboard, `tool-100`, `lisa-ai-agent`, `lisa-visa-web`):

---

## 🎯 1. NGUYÊN TẮC QUẢN LÝ CHẤT LƯỢNG (ANH ĐẠT CHỈ ĐẠO)

1. **Mô Hình Black Box:**
   - **Input:** Log defect Notion, chỉ thị họp, specs.
   - **Process:** Dev đề xuất & giải trình phương án sửa trước khi code.
   - **Output:** PR hoàn chỉnh, môi trường test, và **Checklist tự kiểm tra trước bàn giao**.
2. **Chỉ số Barem:**
   - Target năng suất: `3.0 - 5.0` bug/ngày/người.
   - Target Defect rate: `< 1.15%` (< 15 lỗi / 100 testcases).
   - Target Re-open rate: `< 15%`.
   - Hạn mức Review Lead: `20%` effort (~1.6h/ngày).
3. **Thẩm quyền Close Bug:** Chỉ Tech Lead (Anh Trường) mới có thẩm quyền close bug.

---

## ✅ 2. PRE-HANDOVER CHECKLIST (TỰ CHECK TRƯỚC KHI MỞ PR)

- [ ] **1. Metadata & Schema Data:** Kiểm tra đúng kiểu dữ liệu, các trường metadata không bị `null` hoặc `undefined`.
- [ ] **2. UI/UX Responsive & Cross-Browser:** Test trên Chrome, Firefox và giao diện di động (Mobile Layout).
- [ ] **3. Debug Console JS Check:** Mở F12 Console đảm bảo KHÔNG dính Uncaught Exception hoặc Warning JS.
- [ ] **4. Local Retest:** Đã tự chạy lại kịch bản test trên môi trường local dev.
- [ ] **5. Lỗi Ảnh Hưởng Ngang:** Nếu trong scope task ➔ tự sửa triệt để; ngoài scope ➔ note lại đẩy ra ngoài & tham vấn Anh Trường.
- [ ] **6. Review Chéo Testcase:** Đã thực hiện review chéo kịch bản kiểm thử giữa các thành viên (Huy ↔ Hoàng ↔ Hồ).

---

## 📝 3. PR DESCRIPTION TEMPLATE CHUẨN

```markdown
## Tóm tắt
[Mô tả ngắn gọn fix này làm gì]

## Root Cause
[Nguyên nhân gốc rễ — file, function, logic path]

## Test Evidence
- [x] Test Metadata & Schema data pass.
- [x] Test UI/UX responsive & JS Console cleanly passed.
- [x] Local retest executed cleanly.
```
