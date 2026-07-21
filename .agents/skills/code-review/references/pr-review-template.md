# Prompt Review PR — Chung (tool-100 / lisa-ai-agent)

> Dùng prompt này mỗi khi bắt đầu review PR của người khác.
> Paste URL PR vào chỗ `[URL_PR]` rồi gửi cho agent.

---

## 📌 Prompt Template

```
Hãy review PR sau cho tôi: [URL_PR]

Yêu cầu review:

1. **Đọc toàn bộ PR**: title, description, files changed, commits.

2. **Check từng mục trong checklist** bên dưới. Với mỗi lưu ý tìm được, **bắt buộc ghi rõ**:
   - Mô tả vấn đề + đoạn code liên quan
   - 📌 Nguồn bài học: tên file bài học + số commit SHA của dratct đã từng gặp
   - Mức độ: 🔴 Nên sửa / 🟡 Cần confirm / 🟢 OK

3. **Cuối cùng**: kết luận `Approve` hoặc `Request changes` trong một câu.

---

### CHECKLIST REVIEW

#### A. PR Description
- [ ] Có đủ 3 mục: **Làm gì / Tại sao / Cách test**?
- [ ] Có ticket BSVA-xxx trong title/commit không?
- [ ] Có audit diff before/after hoặc pytest result không?

#### B. Regex / Guard / Filter (áp dụng cho extractor)
- [ ] **Từ đồng âm**: Regex mới có thể bắt nhầm từ cùng prefix không?
  - Ví dụ: "so" → "so sánh", "chi" → "chi tiết", "chị"
  - → Nếu có: cần negative-lookahead
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit a5c54b1c

- [ ] **Guard ambiguous**: Guard mới có chặn cả trường hợp phủ định không?
  - "không/chưa/kg/k có X" = user KHÔNG sở hữu → không nên bắt
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 07f55105

- [ ] **Rescue / Exception rule**: Có điều kiện anchor thứ 2 không?
  - Rescue bắt quá rộng (tán gẫu, kể chuyện) → cần anchor thêm (nghi vấn, từ khóa)
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 29f5bb07

- [ ] **Chủ ngữ temporal filter**: Filter loại quá khứ có kiểm tra chủ ngữ user vs. bên thứ ba không?
  - "bạn mình vừa đi Hàn" ≠ "em vừa đi Hàn"
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 1613781a

- [ ] **Verb set đồng bộ**: Nếu thêm/bỏ verb khỏi pattern tài sản, các regex guard liên quan đã đồng bộ chưa?
  - Thiếu đồng bộ → double-count
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 26f2d584

- [ ] **Regex inline**: Regex phức tạp có đang để inline trong hàm không?
  - Nếu có → nên tách thành _CONSTANT_RE ở module level để unit test được
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 0bb84c2f

#### C. Test / Fixture
- [ ] Có fixture case **dương** cho case mới (happy path) không?

- [ ] Có fixture case **âm** (negative case) kèm theo không?
  - Đặc biệt quan trọng khi thêm rescue/exception rule
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 29f5bb07

- [ ] Fixture case name có đúng format "BSVA-xxx mô tả ngắn" không?
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 0bb84c2f

- [ ] Test có assert **nguyên văn nội dung prompt** không?
  - Nếu có → đây là change-detector test, nên xóa
  - 📌 Bài học: pr_review_lessons.md → PR #128 / commit 09e52958

- [ ] Có test dư của guard/function đã bị xóa không?
  - 📌 Bài học: pr_review_lessons.md → PR #130 / commit 4b743f89

- [ ] Unit test cover đủ: từng nhánh OR của regex, biến thể không dấu, negative case?
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit 0bb84c2f

#### D. Prompt / Instruction (áp dụng cho lisa-ai-agent)
- [ ] Instruction mới có gom nhiều ý vào 1 câu không?
  - Nên tách: rule chung trước, ví dụ cụ thể sau
  - 📌 Bài học: pr_review_lessons.md → PR #126 (lisa-ai-agent)

- [ ] Rule mới có duplicate với file prompt khác không?
  - 📌 Bài học: pr_review_lessons.md → PR #126 / response_guides.yaml

- [ ] Dùng dấu "/" trong mapping xưng hô không? (anh/chị, em/anh)
  - Nên viết điều kiện riêng thay vì dùng "/"
  - 📌 Bài học: pr_review_lessons.md → PR #130 / commit d6d9c581

#### E. Merge / Conflict
- [ ] Nếu có merge conflict fixture YAML: resolve bằng **union** (giữ cả 2 bên)?
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit fa81a144

- [ ] Sau merge: đã chạy ruff format chưa?
  - 📌 Bài học: pr_review_lessons.md → PR #9 / commit fa81a144
```

---

### OUTPUT FORMAT YÊU CẦU

Dùng đúng mẫu file comment ngắn trong `SKILL.md`: mỗi finding gồm vị trí dòng diff và một blockquote tối đa 3 câu để copy-paste, cuối file có một `General review summary`. Không thêm bảng, checklist hoặc log test.

---

## 🗂️ Bảng tra cứu nhanh — Commit SHA theo chủ đề

| Chủ đề | Commit SHA | Repo / PR |
|---|---|---|
| Regex đồng âm → false positive | `a5c54b1c` | tool-100 #9 |
| Guard ambiguous chặn phủ định | `07f55105` | tool-100 #9 |
| Over-rescue thiếu anchor | `29f5bb07` | tool-100 #9 |
| Temporal filter bên thứ ba | `1613781a` | tool-100 #9 |
| Verb set không đồng bộ → double-count | `26f2d584` | tool-100 #9 |
| Regex inline → khó unit test | `0bb84c2f` | tool-100 #9 |
| Merge fixture conflict = union | `fa81a144` | tool-100 #9 |
| Change-detector test prompt | `09e52958` | lisa-ai-agent #128 |
| Test assert section header (đúng) | `b6b1cccd` | lisa-ai-agent #130 |
| Xóa test của guard đã xóa | `4b743f89` | lisa-ai-agent #130 |
| Fix sai path (constants vs field_by_field) | `a04af927` | lisa-ai-agent #130 |
| Tách negative instruction thành 2 phần | PR #126 | lisa-ai-agent |
| Xưng hô không dùng "/" | `d6d9c581` | lisa-ai-agent #130 |
