---
name: rag-docs-analyzer
description: Phân tích sự tồn tại của tài liệu RAG local và trace đường đi của tài liệu qua các Graph Nodes trong hệ thống LISA.
---

# Skill Phân Tích Tài Liệu RAG & Graph Flow (rag-docs-analyzer)

Skill này hướng dẫn quy trình từng bước để kiểm tra độ phủ của tài liệu hướng dẫn visa (docs) tại local, xác định xem chatbot đã được cung cấp đủ ngữ cảnh chưa, và trace luồng RAG đi qua các Graph Nodes.

---

## 🔍 1. QUY TRÌNH KIỂM TRA SỰ TỒN TẠI CỦA DOCS (Coverage Check)

Khi gặp lỗi chatbot trả lời chung chung hoặc thiếu thông tin chi tiết (ví dụ: đối với nông dân, người chưa thành niên, hưu trí...), thực hiện các bước sau:

### Bước 1: Trích xuất các Metadata liên quan từ câu hỏi
- Xác định Quốc gia đến (`M0001` - vd: KOR, JP, CN, EU, UK, TW, HK).
- Xác định trường điều kiện liên quan đến câu hỏi:
  - Công việc (`O2001` - vd: Nhân viên, Học sinh, Nông dân, Tự do...).
  - Tài sản (`O4001` - vd: Sổ đỏ/Sổ hồng).
  - Tài chính (`O3001`/`O3004` - vd: Sổ tiết kiệm, Sao kê tài khoản).
  - Mối quan hệ (`O1006` - vd: Bố mẹ không đi cùng).

### Bước 2: Xác định và định vị file tài liệu tương ứng
Các tài liệu của mỗi thị trường được đặt tại:
`lisa-ai-agent/storage/private/market_data/{market_code}/{pair_id}/{pair_id}.md`
Trong đó `pair_id` được ghép từ 2 metadata (vd: `M0001_O2001`, `O2001_O8001`...).

### Bước 3: Đánh giá độ phủ thông tin (Content Audit)
Mở file tài liệu `.md` vừa tìm được và kiểm tra:
1. File có tồn tại không?
2. Có tiêu đề/mục lục nào tương ứng với đối tượng người dùng hỏi không?
3. Nội dung có trả lời trực tiếp câu hỏi *"Có được không?"* và nêu rõ các điều kiện/giấy tờ bắt buộc không?

---

## 🧭 2. LUỒNG ĐI QUA CÁC GRAPH NODES (Graph Flow Trace)

Mỗi tin nhắn đi vào sẽ kích hoạt luồng RAG nạp tài liệu qua các node:

1. **MetadataExtractionNode (Trích xuất Metadata)**:
   - Hệ thống (dùng regex của `tool-100` hoặc LLM Metadata) nhận diện các giá trị metadata thô từ tin nhắn.
2. **IntentDetectionNode (Phát hiện Intent)**:
   - Nhận diện yêu cầu thông thường (`unknown`) hay so sánh (`comparison`) để bẻ nhánh luồng.
3. **SuggestionNode hoặc ComparisonNode (Nạp tài liệu)**:
   - Dựa trên các metadata đã nhận diện, hệ thống tự động sinh ra danh sách `pair_id` cần thiết.
   - Gọi hàm đọc file local để nạp nội dung tài liệu `.md` tương ứng vào context.
4. **LLM Chat (Phản hồi)**:
   - LLM đọc các tài liệu được nạp vào context để sinh câu trả lời trực diện. Nếu file tài liệu rỗng hoặc thiếu thông tin, LLM sẽ bịa hoặc trả lời chung chung.

---

## 🛠️ 3. BIỆN PHÁP KHẮC PHỤC (Resolution)

Nếu phát hiện thiếu tài liệu hoặc thông tin tài liệu không đủ chi tiết:
1. Thêm đề mục và nội dung chi tiết trực tiếp vào file `.md` tương ứng ở local.
2. Đảm bảo câu trả lời có tính khẳng định trực tiếp (ví dụ: *"Có, đối với..."*) trước khi đi vào hướng dẫn hồ sơ chi tiết.
3. Commit các thay đổi tài liệu đó với tiền tố `docs: [BSVA-XXX] update docs...`.
