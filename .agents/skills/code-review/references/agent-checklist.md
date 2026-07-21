# Prompt Review PR — lisa-ai-agent (chuyên biệt)

> Dùng prompt này khi review PR trong repo `lisa-ai-agent`.
> Paste URL PR vào `[URL_PR]` rồi gửi cho agent.
> Agent sẽ: (1) fetch và checkout nhánh, (2) phân tích code, (3) chạy test, (4) so sánh với checklist và viết review.

---

## 📌 Prompt Template

```
Hãy review PR sau cho tôi: [URL_PR]

Quy trình BẮT BUỘC trước khi viết bất kỳ nhận xét nào:
1. Checkout nhánh của PR về local (git fetch + git checkout).
2. Chạy unit test của agent: `task test` hoặc pytest riêng cho module bị thay đổi → ghi nhận số pass/fail.
3. Nếu PR sửa đổi Prompt hoặc LLM response logic:
   a. Kiểm tra xem có bị dính lỗi "Change-Detector Test" (assert nguyên văn wording prompt) không.
   b. Kiểm tra xem các thay đổi có làm lệch hành vi giữa Stream và Non-stream hay không.
4. Đọc toàn bộ code diff.
5. So khớp từng dòng code thay đổi với Checklist Review chuyên biệt dưới đây.
6. Với mỗi lưu ý: ghi rõ (a) mô tả + đoạn code, (b) nguồn bài học (commit SHA/PR), (c) mức độ 🔴/🟡.
7. Ghi file comment ngắn theo mẫu trong `SKILL.md`.

⚠️ LƯU Ý BẢO MẬT & QUYỀN HẠN:
- TUYỆT ĐỐI KHÔNG click vào bất kỳ nút nào để thay đổi trạng thái PR trên GitHub (không click 'Merge', 'Approve', 'Close', 'Request changes'...).
- Chỉ được phép đọc thông tin (Read-only) và ghi báo cáo review ra file markdown local.
```

---

## 🏗️ Kiến trúc cần hiểu trước khi review

```
lisa-ai-agent/
├── app/domains/chat/
│   ├── graph/
│   │   ├── agents/
│   │   │   └── metadata_local_7b.py   # COLUMN_PROMPTS & COT_HINTS cho chế độ Field-by-Field (FBF)
│   │   └── nodes/
│   │       └── suggestion.py          # Node xử lý gợi ý tài liệu & câu hỏi confirm
│   ├── prompts/
│   │   ├── builder.py                 # Compile prompt templates
│   │   └── prompt_templates/
│   │       ├── common/
│   │       │   ├── response_style.yaml# Xưng hô, định dạng, XML tags, tóm tắt thông tin khách
│   │       │   ├── task_1.yaml        # Nhiệm vụ 1: Trả lời câu hỏi dựa trên docs
│   │       │   └── task_2.yaml        # Nhiệm vụ 2: Hỏi bổ sung missing metadata
│   │       └── dynamic/
│   │           └── response_guides.yaml# Hướng dẫn phản hồi khi thiếu metadata
│   └── service.py                     # Streaming & Sanitizer logic
├── app/domains/metadata/
│   └── constants.py                   # METADATA_EXTRACTION_RULES cho chế độ Group extraction
└── tests/unit/domains/chat/
    ├── test_prompts.py                # Test prompt generation (Cấu trúc, không assert wording)
    └── test_service.py                # Test sanitizer (Stream vs Non-stream)
```

### Chế độ trích xuất Metadata (Rất Quan Trọng)
1. **FBF (Field-by-Field) mode**:
   - Đây là chế độ chạy mặc định trên production cho provider `local_7b` / `anai-metadata`.
   - Mỗi metadata field được trích xuất bằng 1 LLM call độc lập.
   - LLM prompt được dựng từ `COLUMN_PROMPTS` và `COT_HINTS` trong [metadata_local_7b.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/chat/graph/agents/metadata_local_7b.py).
   - **Lưu ý cực kỳ quan trọng**: FBF **KHÔNG** đọc `METADATA_EXTRACTION_RULES` ở [constants.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/metadata/constants.py). Sửa ở constants.py sẽ không có tác dụng trên production cho FBF mode.
2. **Group mode**:
   - Dùng 1 single LLM call để trích xuất cả cụm metadata.
   - Prompt được build từ registry `METADATA_EXTRACTION_RULES` ở [constants.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/metadata/constants.py).

---

## ✅ CHECKLIST REVIEW

### A. PR Description & Commit Conventions (Bắt buộc)
- [ ] Commit message hoặc PR Description có ghi rõ 3 phần theo chuẩn **dratct**:
  1. **Root cause**: Tại sao logic cũ chạy sai? (Nêu rõ input, output sai, path code lỗi).
  2. **Fix**: Thay đổi những gì? Tại sao chọn hướng đi này?
  3. **Kiểm chứng**: Kết quả unit test (`task test:unit`), hành vi model thử nghiệm thực tế (Staging), hoặc kết quả audit diff.
- [ ] Có mã task Jira/Linear trong commit title (ví dụ: `[BSVA-711]`, `[BSVA-937]`).
- [ ] Nhánh phải checkout từ base thích hợp (`origin/staging`), không checkout bừa bãi.

---

### B. Metadata Extraction & Chặn suy diễn (M0004 & O5001)
- [ ] **Chấm dứt suy đoán diện visa (M0004)**:
  - Cấm LLM tự suy đoán M0004 (`theo tour`/`tự túc`) từ mục đích chuyến đi (du lịch, thăm thân, du học...), mã visa, số lần nhập cảnh, ngắn hạn/dài hạn hoặc thời gian lưu trú.
  - Phải sửa ở cả **FBF** (`COLUMN_PROMPTS` trong `metadata_local_7b.py`) và **Group** (`constants.py`):
    - `COLUMN_PROMPTS["Diện visa"]`: Thêm câu cấm suy diễn rõ ràng.
    - `METADATA_EXTRACTION_RULES["M0004"]`: Cập nhật luật cấm suy luận.
  - 📌 Nguồn: [PR #126](https://github.com/truongtc/lisa-ai-agent/pull/126) | Commit `fb75f9e3`
- [ ] **Chặn LLM tự gán quốc gia đến vào Lịch sử du lịch (O5001)**:
  - Khi khách nói `"Mình đi Hy Lạp 15 ngày..."` → Đây là điểm đến dự kiến (`M0001`), KHÔNG phải lịch sử du lịch đã đi (`O5001`).
  - Sửa đúng path chạy production (FBF): Thêm guard vào `COT_HINTS` thay vì cố nhồi nhét prompt chính. Model 7B dễ nuốt mất guard trong prompt dài, nhưng sẽ tuân thủ nếu đưa vào bước suy luận `<thought>` (Chain-of-Thought hint).
  - 📌 Nguồn: [PR #130](https://github.com/truongtc/lisa-ai-agent/pull/130) | Commit `a04af927` (`fix(metadata): chặn LLM gán quốc gia đến vào O5001`)

---

### C. Prompt & Response Generation (Task 1, Task 2 & Style)
- [ ] **Xưng hô nhất quán và không mập mờ**:
  - Không dùng dấu gạch chéo `/` trong mapping xưng hô (ví dụ: `anh/chị → em`). Model 7B không hiểu ký tự `/` có nghĩa là "hoặc" nên sẽ xưng hô sai.
  - Phải viết thành câu điều kiện tường minh: `"Nếu khách xưng 'anh' hoặc 'chị' hoặc 'tôi' thì Lisa xưng 'em' và gọi là 'anh/chị'"`.
  - Gom tất cả quy tắc xưng hô và ví dụ đúng/sai vào chung block `Mapping` trong `response_style.yaml`.
  - Khớp đúng quy tắc `"mình - bạn"` khi khách tự xưng là `"mình"`.
  - 📌 Nguồn: [PR #130](https://github.com/truongtc/lisa-ai-agent/pull/130) | Commit `d6d9c581`
- [ ] **CẤM tự chốt nhánh tài liệu khi thiếu metadata**:
  - Nếu tài liệu nghiệp vụ có nhiều nhánh phụ thuộc vào thông tin chưa biết (ví dụ: visa thăm thân có C-3-1, C-3-9... tùy thuộc vào mối quan hệ thân nhân), CẤM tự ý chọn một nhánh cụ thể làm kết luận cho khách.
  - Phải viết theo hướng điều kiện/khả năng: `"Nếu... thì..."`, dùng tên mục đích chung và đặt câu hỏi hỏi thẳng vào metadata còn thiếu (`MISSING_METADATA`).
  - Phải đồng bộ luật này trong cả `task_1.yaml` và `response_guides.yaml`.
  - 📌 Nguồn: [PR #126](https://github.com/truongtc/lisa-ai-agent/pull/126) & [PR #128](https://github.com/truongtc/lisa-ai-agent/pull/128)
- [ ] **Diễn đạt nơi ở tự nhiên và chính xác**:
  - Khi nhắc lại thông tin của khách, không được tự tiện đổi `"hiện ở/tôi ở/đang ở"` thành các thuật ngữ pháp lý như `"hộ khẩu"`, `"nơi nộp hồ sơ"` trừ khi khách nói rõ.
  - Không nối thời lượng chuyến đi với nơi ở bằng từ `"tại"` hay `"ở"` gây mơ hồ (ví dụ tránh viết: *"du lịch 5 ngày tại TP.HCM"* nếu khách chỉ ở TP.HCM nhưng đi du lịch nước ngoài). Phải viết tách biệt rõ ràng: *"du lịch 5 ngày, hiện đang ở TP.HCM"*.
  - 📌 Nguồn: [PR #128](https://github.com/truongtc/lisa-ai-agent/pull/128) | Commit `0b5504b7`

---

### D. Output Sanitizer (Streaming vs Non-streaming)
- [ ] **Khớp lớp whitespace giữa Regex Sanitize và safe_cut**:
  - Regex `_DOLLAR_MATH_RE` dùng để khử ký tự LaTeX (như `$\rightarrow$`) phải khớp hoàn toàn về khoảng trắng với hàm `_safe_cut` ở backend.
  - Chỉ chấp nhận space (`[ ]*`), KHÔNG dùng `\s*` (vì `\s` bắt cả newline `\n` và tab `\t`), tránh làm lệch hành vi hiển thị giữa stream và non-stream đối với cùng một input.
  - 📌 Nguồn: [PR #130](https://github.com/truongtc/lisa-ai-agent/pull/130) | Commit `63981d3f`
- [ ] **Tránh regex tham lam phá USD currency**:
  - Sanitizer phải hoạt động an toàn, không được nhận diện nhầm hoặc nuốt dấu `$` của mệnh giá tiền tệ thường gặp (ví dụ: `$100 đến $150`, `$20 -> $30`).
  - Gói logic feed/flush lặp ở các call site vào một wrapper chung `_sanitized_stream` để tránh lỗi quên flush đuôi buffer ở cuối stream.
  - 📌 Nguồn: [PR #130](https://github.com/truongtc/lisa-ai-agent/pull/130) | Commit `63981d3f`

---

### E. Unit Testing & Prompt Testing Style
- [ ] **CẤM tuyệt đối "Change-Detector Tests"**:
  - Không được viết unit test assert khớp từng từ literal (wording copy) của prompt template hoặc rules. Những test này rất dễ vỡ mỗi khi tinh chỉnh câu chữ nhỏ trong prompt mặc dù logic hệ thống không đổi.
  - **Quy tắc test prompt đúng đắn**: Chỉ kiểm tra **cấu trúc** và **wiring logic**:
    - Assert các section header chính (ví dụ `### NHIỆM VỤ 1`, `## RESPONSE STYLE`) có xuất hiện trong prompt sau compile.
    - Đảm bảo definition không rỗng.
    - Đảm bảo mapping các field hoạt động đầy đủ.
  - Gỡ bỏ hoàn toàn các test change-detector thừa thãi.
  - 📌 Nguồn: [PR #128](https://github.com/truongtc/lisa-ai-agent/pull/128) | Commit `0b5504b7` (`test(prompt): ✅ bỏ assert nguyên văn nội dung prompt`)
- [ ] **Xóa bỏ code chết và test mồ côi**:
  - Khi dọn dẹp hoặc refactor sang flow mới (như migrate sang Graph), phải xóa toàn bộ packages/files cũ không còn runtime path nào gọi tới.
  - Xóa kèm các file test tương ứng để tránh collection error khi chạy test suite.
  - 📌 Nguồn: [PR #130](https://github.com/truongtc/lisa-ai-agent/pull/130) | Commit `63981d3f` (xóa package `app/domains/chat/templates` cũ)

---

## 🗂️ Bảng tra cứu nhanh commit SHA

| Chủ đề / Bài học                                  | Commit SHA | PR   | File ảnh hưởng chính                   |
| ---------------------------------------------------| ------------| ------| ----------------------------------------|
| Chặn suy diễn diện visa (M0004)                   | `fb75f9e3` | #126 | `metadata_local_7b.py`, `constants.py` |
| Chấm dứt chốt nhánh tài liệu khi thiếu metadata   | `fb75f9e3` | #126 | `task_1.yaml`                          |
| Cấm assert literal prompt (Change-Detector)       | `0b5504b7` | #128 | `test_prompts.py`                      |
| Tóm tắt thông tin khách & Nơi ở tự nhiên          | `0b5504b7` | #128 | `response_style.yaml`                  |
| Diễn giải rõ mapping xưng hô bằng câu điều kiện   | `d6d9c581` | #130 | `response_style.yaml`                  |
| Xóa package templates mồ côi sau migrate graph    | `63981d3f` | #130 | `app/domains/chat/templates/`          |
| Chặn LLM gán quốc gia đến vào O5001 bằng CoT Hint | `a04af927` | #130 | `metadata_local_7b.py`                 |
| Đồng bộ whitespace stream sanitizer và safe_cut   | `63981d3f` | #130 | `service.py`, `test_service.py`        |
