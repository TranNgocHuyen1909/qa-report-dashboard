---
name: pr-writer
description: >-
  Tự động viết Pull Request (PR) Description chuẩn định dạng dự án LISA bằng tiếng Việt.
  Kích hoạt khi nhận yêu cầu viết PR, tạo PR description, hoặc chuẩn bị gửi PR review.
---

# Hướng dẫn Viết Pull Request Description (Chuẩn LISA)

> **Khi nào kích hoạt:** Người dùng yêu cầu "viết PR", "tạo PR description", "PR cho tui", hoặc khi chuẩn bị review/merge code.
> Skill này tự động phân tích diff hiện tại của branch và sinh PR description chuẩn đét theo template của dự án.

> **Nguyên tắc viết ngắn:** Ưu tiên bản PR ngắn, dễ scan. Chỉ giữ các ý reviewer cần để hiểu root cause, thay đổi chính, phạm vi ảnh hưởng và cách test. Tránh văn phong dài, kể lể hoặc nhìn giống AI-generated.

---

## ⚡ QUY TRÌNH TẠO PR DESCRIPTION

### Bước 1 — Thu thập thông tin Branch & Diff

Trước khi viết PR, Agent **bắt buộc** phải chạy các lệnh sau để thu thập danh sách file và code diff thực tế:

```bash
# 1. Xác định base branch đang so sánh (mặc định là origin/staging hoặc origin/main tùy repo)
# 2. Xem danh sách commit của task hiện tại
git log --oneline origin/staging..HEAD

# 3. Xem danh sách file thực tế thay đổi
git diff --name-status origin/staging..HEAD

# 4. Xem code diff chi tiết để phân tích Root Cause & Changes
git diff origin/staging..HEAD
```

*Lưu ý: Nếu repo là `tool-100` thì so sánh với `origin/main`. Nếu là `lisa-ai-agent` thì so sánh với `origin/staging`.*

### Bước 2 — Kiểm tra PR Template của Repository

Agent **bắt buộc** phải kiểm tra xem trong repository hiện tại (thường là trong thư mục `.github/` hoặc root directory) có tồn tại file PR template hay không:
- Tên file template thường gặp: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md` hoặc `PULL_REQUEST_TEMPLATE.md`.
- **Nếu có:** Bắt buộc phải đọc và sử dụng cấu trúc, định dạng và các section của file template đó làm khung xương (skeleton) để điền thông tin chi tiết (Root Cause, Changes, Test...), thay vì sử dụng template mặc định của skill.
- **Nếu không có:** Sử dụng template mặc định ở mục `TEMPLATE PR DESCRIPTION BẮT BUỘC` dưới đây.

---

## 📝 TEMPLATE PR DESCRIPTION BẮT BUỘC

Mọi PR gửi đi **BẮT BUỘC** phải tuân thủ format markdown tiếng Việt sau (được đồng bộ theo template `.github/pull_request_template.md` của dự án):

```markdown
### [Task/Bug ID] [Tiêu đề ngắn]

---

#### Link

- [Notion Task - BSVA-xxx](URL task/bug trên Notion hoặc issue)
- [Notion Task - BSVA-yyy](URL task/bug trên Notion hoặc issue)

---

#### Sửa đổi sau review (Changes after Review)
*(Chỉ áp dụng với PR cập nhật/sửa đổi sau khi có feedback của reviewer. Nếu là PR tạo mới, hãy xóa hoàn toàn mục này)*

- [Mô tả nội dung sửa đổi sau khi review]

---

#### Root cause / Context

[Với bug: ghi nguyên nhân gốc khiến lỗi xảy ra. Với feature: ghi bối cảnh/vấn đề cần giải quyết.]

---

#### Change

[Ghi 2-3 thay đổi chính của PR theo hành vi hệ thống, không liệt kê chi tiết từng dòng code. Đối với files thay đổi, hãy sử dụng đường dẫn link file, ví dụ: [chat_history_service.py](file://...)]

- Nếu fix có bổ sung fallback khi thiếu docs/tool/path runtime, cần nêu rõ fallback đi về đâu
  (ví dụ: fallback qua web search / market research) và hệ thống có log warning để theo dõi hay không.

---

#### Impact

[Ghi phạm vi ảnh hưởng: flow/module/API/UI/market nào bị tác động.]

Triển khai ngang (chỉ áp dụng với bug): Có/Không

[Nếu Có: ghi rõ cần áp dụng thêm cho case/flow/market nào. Nếu Không: ghi lý do ngắn. PR feature: xóa dòng này.]

---

#### Test

[Ghi cách đã test: unit test command, manual test, input → expected result. Sử dụng ảnh/video nếu có thay đổi UI.]

- Chỉ ghi command ở dạng inline nếu đủ ngắn để đọc một dòng.
- Nếu command test quá dài, được phép rút gọn theo nhóm test hoặc chỉ nêu bộ test chính + kết quả pass.
- Không đổ block code dài nếu không thực sự cần thiết.

---

#### Note

[Ghi lưu ý cho reviewer/tester: edge case, limitation, breaking change, migration, config/env. Nếu không có thì ghi "Không".]

- Nếu PR có cơ chế fallback hoặc degraded mode, ưu tiên nhắc lại ngắn gọn ở đây để reviewer biết cách quan sát log khi test.
```

---

## 💡 VÍ DỤ PR DESCRIPTION MẪU THỰC TẾ

### Ví dụ 1: Sửa bug prompt & metadata (PR #137 — lisa-ai-agent)

```markdown
### fix(BSVA-137): chan loi AI biya lich su du lich Han Quoc (O5001)

---

#### Link

- [Notion Task - BSVA-137](https://app.notion.com/p/da34b0ce-36f2-4f2c-afc1-d7439601b76e)

---

#### Root cause / Context

- **Bối cảnh:** Khi user nhập "Mình muốn xin visa du lịch Hàn Quốc tự túc", trường O5001 (Lịch sử du lịch) bị nhận nhầm giá trị "Hàn Quốc" (bị lẫn điểm đến hiện tại với lịch sử du lịch quá khứ).
- **Nguyên nhân gốc rễ:** 
  - Logic phân biệt lịch sử du lịch quá khứ vs. điểm đến hiện tại bị đưa vào `COLUMN_PROMPTS` của model 7B. Do model 7B nhỏ, nó bỏ qua các rule dài trong base prompt và tự suy luận sai.
  - Separator của O5001 bị trả về lẫn lộn giữa `,` và `|` dẫn đến downstream parsing lỗi.

---

#### Change

- **[metadata_local_7b.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/chat/graph/agents/metadata_local_7b.py)**:
  - Khôi phục `COLUMN_PROMPTS["Lịch sử du lịch"]` về mô tả cơ bản ban đầu.
  - Chuyển toàn bộ logic loại trừ và guard phân biệt lịch sử sang `COT_HINTS` để model reasoning trong block `<thought>` trước khi xuất kết quả.
- **[value_utils.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/metadata/value_utils.py)**:
  - Thêm hàm `normalize_multi_value()` để tách separator `,` / `、` / `|` và chuẩn hóa về canonical separator `|`.
- **[constants.py](file:///d:/TranNgocHuyen/lisa-visa-ai/lisa-ai-agent/app/domains/metadata/constants.py)**:
  - Đăng ký `MULTI_VALUE_METADATA` và `MULTI_VALUE_SEP`.

---

#### Impact

- **Phạm vi ảnh hưởng:** Tầng Metadata Extraction (FBF mode trên production), ảnh hưởng đến toàn bộ thị trường khi nhận diện trường Lịch sử du lịch (O5001).
- **Triển khai ngang (chỉ áp dụng với bug):** Không (Do lỗi logic suy luận đặc thù của model 7B đối với cấu trúc prompt của trường Lịch sử du lịch).

---

#### Test

- Chạy bộ test suite eval metadata:
  ```bash
  task test:eval:metadata
  ```
- Kết quả: 22/22 cases passed ✅.
- Test thủ công với input "Mình muốn xin visa du lịch Hàn Quốc tự túc" ➔ M0001 = "Hàn Quốc", O5001 = null.

---

#### Note

Không.
```

---

## 🚨 QUY TẮC BẮT BUỘC KHI TẠO PR

1. **Mô tả PR tự nhiên, tránh văn phong "AI-generated":** Tránh sử dụng các mẫu câu sáo rỗng, rườm rà, quá trang trọng hoặc rập khuôn thường thấy của AI. Viết bằng tiếng Việt tự nhiên, gãy gọn và đi thẳng vào vấn đề.
2. **Giữ PR ngắn và dễ scan:** Ưu tiên đoạn ngắn, bullet ngắn, bỏ các ý lặp. Nếu một mục có thể nói trong 2-3 dòng thì không kéo thành đoạn dài.
3. **Cô đọng mục "Change (Làm gì)":** Chỉ ghi từ 2-3 thay đổi chính theo **hành vi của hệ thống**, không liệt kê chi tiết quá mức hoặc kể lể dài dòng từng dòng code.
4. **Làm rõ mục "Root cause (Tại sao)":** 
   - Với Bug: Bắt buộc phải giải thích rõ nguyên nhân gốc rễ (Root Cause) tại sao lỗi xảy ra (do logic code nào chạy sai, do thiếu config gì).
   - Với Feature: Giải thích bối cảnh và lý do cần giải quyết vấn đề này.
5. **Xác định rõ "Impact (Phạm vi ảnh hưởng) & Triển khai ngang":** 
   - Ghi rõ phạm vi ảnh hưởng (flow/module/API/UI/market bị tác động).
   - Với Bug, bắt buộc ghi rõ phần **Triển khai ngang (Có/Không)**: Kiểm tra kỹ xem lỗi này có khả năng xuất hiện tương tự ở các luồng/case/market khác không. Nếu Có: ghi rõ các chỗ cần áp dụng thêm. Nếu Không: giải thích ngắn lý do (ví dụ: do logic này chỉ áp dụng riêng cho Hàn Quốc).
6. **Nêu rõ fallback/runtime behavior nếu có:** Nếu fix thêm fallback khi thiếu docs, thiếu data hoặc lỗi tool, cần nói rõ fallback đi về đâu và có log warning/monitoring gì để reviewer dễ verify.
7. **Viết mục "Test" vừa đủ:** Nêu bộ test chính và kết quả pass. Không cần paste nguyên command dài thành block code nếu chỉ làm PR khó đọc hơn.
8. **Tự review lại diff:** Luôn tự kiểm tra diff của mình một lượt trên GitHub trước khi gắn reviewer.
9. **Cập nhật Notion:** Sau khi mở PR trên GitHub, **BẮT BUỘC sao chép link URL của PR** và paste vào cột **Pull Request** của task/bug tương ứng trên Notion khi chuyển status sang *Review* hoặc *Resolved*.
10. **KHÔNG tự ý merge PR:** Tuyệt đối không tự ý merge PR của mình khi chưa có approval từ leader/reviewer.
11. **Đẩy phần sửa đổi sau review lên đầu:** Đối với các PR cần cập nhật và chỉnh sửa sau khi có feedback của reviewer, **BẮT BUỘC** phải đưa mục **"Sửa đổi sau review (Changes after Review)"** lên đầu tiên (ngay dưới Tóm tắt/Link) để reviewer dễ dàng theo dõi.
12. **Ưu tiên GitHub PR Template của Repo:** Luôn ưu tiên tìm, đọc và sử dụng file template PR có sẵn của repository (ví dụ ở thư mục `.github/`) làm khung sườn trước khi áp dụng template mặc định của skill.
