---
name: daily-report
description: Tự động tổng hợp và viết báo cáo công việc cuối ngày (Daily Report) bằng tiếng Việt theo định dạng chuẩn dự án LISA gửi Leader qua Telegram.
---

# Hướng dẫn viết Báo cáo Cuối ngày (Daily Report) cho dự án LISA

Skill này giúp tự động quét lịch sử git commit trong ngày, các lỗi đã sửa, các vấn đề gặp phải và kế hoạch tiếp theo để soạn thảo báo cáo nhanh nhất.

## 📝 Định dạng Báo cáo chuẩn:

```text
1. Progress
- Tự thực hiện:
  + [Mã Task]: Trạng thái (Ví dụ: "Đã mở PR #180 do reopen", "Đang code").
- Review Code:
  + [Tên Dev] (Ví dụ: Hồ, Hoàng):
    * Có comment: BSVA-XXX, BSVA-YYY (Chỉ ghi mã task, không ghi mô tả hay lý do).
    * Approve: BSVA-ZZZ (Chỉ ghi mã task).

2. Issues
- Ghi nhận vấn đề (nếu có vướng mắc kỹ thuật/nghiệp vụ, nếu không ghi "Không có vướng mắc gì").

3. Next plan
- Kế hoạch làm việc tiếp theo (Ví dụ: "Theo dõi các PR để review lại", "Tiếp tục làm task BSVA-XXX").
```

## 🛠️ Quy trình thực hiện của Agent:
1. Đọc lịch sử commit trong ngày của repo hiện tại để trích xuất danh sách Task/Bug đã làm.
2. Kiểm tra log chat của phiên làm việc để tìm ra các vấn đề (Issues) nổi cộm đã thảo luận với user.
3. Nếu người dùng cung cấp link PR GitHub để review, sử dụng browser để truy cập, đọc và tóm tắt cực ngắn lỗi/góp ý của PR đó để điền vào phần Review Code.
4. Soạn thảo báo cáo ngắn gọn, súc tích bằng tiếng Việt theo đúng định dạng trên.
