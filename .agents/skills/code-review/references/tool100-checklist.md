# Prompt Review PR — tool-100 (chuyên biệt)

> Dùng prompt này khi review PR trong repo `tool-100`.
> Paste URL PR vào `[URL_PR]` rồi gửi cho agent.
> Agent sẽ: (1) checkout nhánh, (2) chạy test local, (3) phân tích code, (4) comment review.

---

## 📌 Prompt Template

```
Hãy review PR sau cho tôi: [URL_PR]

Quy trình BẮT BUỘC trước khi viết bất kỳ nhận xét nào:
1. Checkout nhánh của PR về local (git fetch + git checkout).
2. Chạy test fixture: `uv run pytest tests/unit -k "<tên extractor>" -v` → ghi số pass/fail.
3. Với mỗi nghi ngờ "thiếu case âm/dương":
   a. Đếm case hiện có: `Select-String -Path "tests/fixtures/xxx.yaml" -Pattern "expected: \"<value>\""`
   b. Nếu ≥ 2 case dương đã có → KHÔNG comment thiếu case dương
   c. Nếu comment thiếu case âm → chạy extractor thực tế trước: `uv run python -c "ext.extract('<input nghi ngờ>')"`
      → Nếu extractor đã trả về đúng → KHÔNG comment (không có bug)
      → Chỉ comment nếu extractor trả về sai (có bug thực sự)
4. Đọc toàn bộ code diff.
5. Check từng mục trong checklist bên dưới.
6. Với mỗi lưu ý: ghi rõ (a) mô tả + đoạn code, (b) nguồn bài học (commit SHA), (c) mức độ 🔴/🟡.
7. Ghi file comment ngắn theo mẫu trong `SKILL.md`.

⚠️ LƯU Ý BẢO MẬT & QUYỀN HẠN:
- TUYỆT ĐỐI KHÔNG click vào bất kỳ nút nào để thay đổi trạng thái PR trên GitHub (không click 'Merge', 'Approve', 'Close', 'Request changes'...).
- Chỉ được phép đọc thông tin (Read-only) và ghi báo cáo review ra file markdown local.
```

---

## 🏗️ Kiến trúc cần hiểu trước khi review

```
tool-100/
├── src/tool100/extractors/
│   ├── m0001/          # Quốc gia đích đến (M0001)
│   │   ├── data/       # Dữ liệu quốc gia: east_asia.py, southeast_asia.py, europe.py...
│   │   │   └── CountrySpec(canonical, keywords, guards: FalsePositiveGuard[])
│   │   └── rules.py    # FilterRule, DetectRule, build_m0001_rules()
│   ├── m0002/          # Mục đích chuyến đi
│   ├── m0003/          # Khoảng thời gian (số ngày/tuần/tháng)
│   ├── m0004/          # Loại visa (tự túc / tour)
│   ├── o9001/          # Số lần nhập cảnh (Single/Double/Multiple entry)
│   └── o400101/        # Tài sản (nhà đất, hợp đồng)
├── tests/fixtures/
│   ├── m0001_country_cases.yaml
│   ├── m0004_visa_type_cases.yaml
│   ├── o9001_entry_count_cases.yaml
│   └── ... (1 file YAML per extractor)
└── tests/unit/
    └── test_extractors_mandatory.py  # Chạy tất cả fixture YAML
```

**2 loại Rule chính:**
- `DetectRule` → phát hiện giá trị (regex match → candidate)
- `FilterRule` → lọc bỏ false positive (should_reject → bool)

---

## ✅ CHECKLIST REVIEW

### A. PR Description (bắt buộc)
- [ ] Có đủ **3 mục**: Làm gì / Tại sao / Cách test?
- [ ] Có **ticket BSVA-xxx** trong commit title?
- [ ] Có **audit diff before/after** hoặc pytest result?
- [ ] Nếu không có audit diff → yêu cầu bổ sung trước khi merge

> 📌 Chuẩn dratct: mỗi commit phải có 3 phần:
> (1) Root cause rõ, (2) Fix gì, (3) Kiểm chứng: fixture xanh + task CI pass + audit diff không regression

---

### B. Regex / Pattern — FalsePositiveGuard

**B1. Từ đồng âm / prefix nhầm**
- [ ] Regex mới có bắt nhầm từ cùng prefix không?
  - Ví dụ pattern Korea guard: `"hàn"` → bắt `"hàn lâm"`, `"lạnh hàn"`, `"thợ hàn"`
  - Ví dụ pattern Japan guard: `"nhật"` → bắt `"sinh nhật"`, `"chủ nhật"`, `"cập nhật"`
  - Ví dụ o1001: `"so"` → `"so sánh"`, `"chi"` → `"chi tiết"`, `"chị"`
- [ ] Nếu có → cần thêm `negative-lookahead` hoặc thêm vào `FalsePositiveGuard`
- 📌 `pr_review_lessons.md` → PR #9 / commit `a5c54b1c`

**B2. restrict_to_match**
- [ ] `FalsePositiveGuard` có `restrict_to_match` phù hợp chưa?
  - Phải list đủ cả bản có dấu và không dấu: `("hàn", "han", "hàn quốc", "han quoc")`
  - Nếu thiếu biến thể không dấu → guard không hoạt động khi text đã lowercase
- 📌 Bài học: PR #9 commit `97330b9` — `restrict_to_match=("hàn",)` thiếu `"han"`, `"hàn quốc"`, `"han quoc"`

**B3. Regex pattern — biến thể có dấu / không dấu**
- [ ] Pattern regex có cover cả biến thể có dấu và không dấu không?
  - ✅ Đúng: `r"\bh[aà]n\s+(?:l[aâ]m|g[aắ]n|the|vi|nho|x[iì])\b"`
  - ❌ Sai: `r"\bhàn\s+(?:lâm|gắn|the|vi|nho)\b"` (chỉ có dấu, bỏ qua text đã normalize)
- [ ] Nếu text xử lý lowercase trước khi match → pattern phải bao gồm cả ký tự lowercase
- 📌 Bài học: PR #9 commit `97330b9` — pattern Japan guard được cải tiến thêm biến thể

**B4. Guard "ambiguous/bare" — phủ định**
- [ ] Guard chặn ambiguous có bỏ qua trường hợp phủ định không?
  - `"không có sổ đỏ"` = user KHÔNG sở hữu → không coi là khai tài sản
  - `"chưa có visa"` ≠ user có visa
- 📌 `pr_review_lessons.md` → PR #9 / commit `07f55105`

**B5. Verb set đồng bộ**
- [ ] Nếu thêm/bỏ verb khỏi pattern tài sản → các regex `_REAL_ESTATE_CONTRACT_RE` và guard liên quan đã đồng bộ chưa?
- [ ] Thiếu đồng bộ → 1 case ra double-count
- 📌 `pr_review_lessons.md` → PR #9 / commit `26f2d584`

---

### C. Rescue / Exception Rule

**C1. Điều kiện anchor thứ 2**
- [ ] Rescue rule có đủ 2 điều kiện không? `rescue = COND_A AND COND_B`
  - Chỉ COND_A → over-rescue (bắt cả tán gẫu)
  - Ví dụ friend-trip: COND_A = bạn bè làm chủ ngữ chuyến đi, COND_B = message có nghi vấn
- 📌 `pr_review_lessons.md` → PR #9 / commit `29f5bb07`

**C2. Chủ ngữ user vs. bên thứ ba**
- [ ] Filter temporal/past-trip có kiểm tra chủ ngữ không?
  - `"bạn mình vừa đi Hàn"` ≠ lịch sử của user → KHÔNG loại nước Hàn
  - `"em vừa đi Hàn về"` = lịch sử của user → loại nước Hàn
- 📌 `pr_review_lessons.md` → PR #9 / commit `1613781a`

**C3. PersonNameFilter — applies_to**
- [ ] `FilterRule` có `applies_to` đúng không?
  - Nếu bỏ `applies_to` → filter áp dụng cho TẤT CẢ nước → có thể reject nhầm
  - Kiểm tra: `PersonNameFilter` trước chỉ `applies_to=("Japan",)`, sau mở rộng
    dùng `_PRONOUN_PRE_RE` cho mọi nước → đúng vì cơ chế check trước bằng pronoun
- 📌 Bài học: PR #9 commit `97330b9`

---

### D. FilterRule class mới

**D1. Đặt trong build_xxx_rules()**
- [ ] Class FilterRule mới đã được thêm vào `build_m00x_rules()` chưa?
  - Lỗi kinh điển: quên gọi `rules.append(MY_NEW_FILTER)` trong build function
  - Ví dụ: `ITALY_COLLOQUIAL_PARTICLE_FILTER` phải có `rules.append(ITALY_COLLOQUIAL_PARTICLE_FILTER)`
- 📌 Bài học: PR #9 commit `97330b9`

**D2. applies_to hợp lý**
- [ ] `applies_to` có giới hạn đúng scope không? Filter tên người chỉ nên áp dụng cho từ có thể là tên người
- [ ] Nếu `applies_to` rỗng → filter áp cho mọi candidate → cần test kỹ regression

**D3. Regex inline → module constant**
- [ ] Regex phức tạp trong filter có đang inline không?
  - Nên tách thành `_NAME_RE` ở module level để unit test riêng từng nhánh
- 📌 `pr_review_lessons.md` → PR #9 / commit `0bb84c2f`

---

### E. Fixture YAML

**E1. Naming convention**
- [ ] Fixture case name có đúng format `BSVA-xxx mô tả ngắn` không?
  - ✅ Đúng: `nhap canh 1 lan digit`, `one time before entry context`
  - ❌ Sai: `BSVA stay duration not suppressed by trailing ho so context` (thiếu số ticket)
- 📌 `pr_review_lessons.md` → PR #9 / commit `0bb84c2f`

**E2. Có đủ negative case không?**
- [ ] Với mỗi positive case → có negative case tương ứng không?
  - Nếu thêm alias `"1 lần"` → phải có case `"Em lần đầu xin visa"` → null (người, không phải số lần)
  - Nếu thêm alias `"2 lần"` → phải có case `"Đi 2 người"` → null
- [ ] Negative case dùng làm finding có phải câu chat tự nhiên trong nghiệp vụ visa không?
  - Giữ đủ ngữ cảnh như xin visa, nộp hồ sơ, lịch hẹn, tài chính hoặc chứng minh công việc.
  - Không dùng câu ngoài miền chỉ để va vào substring/regex. Chuỗi tối giản chỉ được dùng để debug matcher, không dùng làm blocker correctness.
- 📌 `pr_review_lessons.md` → PR #9 / commit `29f5bb07`

**E3. Merge conflict fixture → union**
- [ ] Nếu có merge conflict trong fixture YAML → resolve bằng cách giữ CẢ 2 bên không?
  - Không được xóa regression case của main khi merge nhánh
- 📌 `pr_review_lessons.md` → PR #9 / commit `fa81a144`

**E4. Option discussion guard khi thêm alias số**
- [ ] Nếu thêm alias dạng số (`"1 lần"`, `"2 lần"`) → đã cập nhật `_OPTION_DISCUSSION_RE` chưa?
  - `_OPTION_DISCUSSION_RE` phải bao gồm cả dạng chữ lẫn dạng số để guard câu so sánh giá
  - ✅ Đúng: `r"\b(?:1|2|một|hai|nhiều)\s+lần\s+thì\s+(?:phụ\s+thu|cần|tốn|mất)\b"`
  - ❌ Sai: `r"\b(?:một|hai|nhiều)\s+lần\s+..."` (chỉ chữ, bỏ qua dạng số)
- 📌 Bài học: PR #8 commit `a60fd08` — dratct phải cập nhật cùng lúc alias + option_discussion_re

---

### F. m0004 Visa Type — đặc thù

**F1. Negative-lookbehind cho "đi tự túc"**
- [ ] Pattern `"đi tự túc"` có negative-lookbehind đủ không?
  - Phải guard: `không/khong/ko/k/chưa/chua/phải/phai/muốn/muon/cần/can` đứng trước
  - Thiếu guard `phải` và `muốn` → bắt nhầm `"phải đi tự túc"` (chưa chắc ý muốn)
- 📌 Bài học: PR #9 commit `e940e74`

**F2. _VISA_NEARBY_RE coverage**
- [ ] `_VISA_NEARBY_RE` có đủ từ khóa ngữ cảnh không?
  - Phải bao gồm: `visa / thị thực / phí / xin / diện / chứng minh / hồ sơ / thủ tục / giấy tờ`
  - Thiếu `hồ sơ` → câu "du lịch tự túc, chuẩn bị hồ sơ" không được coi là visa context
- 📌 Bài học: PR #9 commit `e940e74`

**F3. "tự túc" guard condition**
- [ ] Điều kiện `if m2.group(0).startswith("du lịch tự túc")` có quá cứng không?
  - Nên dùng `"tự túc" in m2.group(0)` để bắt cả `"đi tự túc"`, `"tự túc toàn bộ"`
- 📌 Bài học: PR #9 commit `e940e74`

**F4. M0003 duration phải theo ý định lưu trú**
- [ ] Không dùng `tự túc` đơn lẻ làm anchor cho M0003; phải có pattern `muốn/dự định ... xin/làm visa tự túc ... <số> ngày|tuần|tháng`.
- [ ] Negative: câu hỏi `thời gian xử lý/xét duyệt`, `bao lâu`, `mấy tháng`, `có lâu không`, `chi phí 2 tháng bao nhiêu`, `à/đúng không` không được ra M0003.
- [ ] Positive: `Dự định làm visa tự túc ở khoảng 2 tháng` và lượt 2 `Cụ thể là đi Bỉ 45 ngày.` phải có fixture riêng.

---

### G. Sau khi checkout và test local

**G1. Chạy fixture test**
```bash
uv run pytest tests/unit -k "m0001"   # hoặc m0004, o9001...
```
- [ ] Tất cả test pass không? Nếu fail → PR không ready

**G2. Audit diff trước/sau**
- [ ] Kiểm tra `tests/fixtures/audit_diff/` có file audit không?
- [ ] Nếu có → verdict phải 🟢 (không regression)

**G3. Test thủ công case nghi ngờ**
- [ ] Với rescue rule mới → viết script Python test thủ công (dùng `_local_sentence_window` + regex từ file)
- [ ] Xác nhận regex `{0,2}` không over-rescue (xem PR #19 làm ví dụ)

**G4. ruff format**
```bash
uv run ruff format src/
```
- [ ] Sau khi sửa → chạy ruff format trước khi commit
- 📌 `pr_review_lessons.md` → PR #9 / commit `fa81a144`

---

## 📊 OUTPUT FORMAT YÊU CẦU

Dùng đúng mẫu file comment ngắn trong `SKILL.md`. Mỗi finding chỉ gồm dòng cần comment và blockquote copy-paste tối đa 3 câu; không chép lệnh test, bảng tổng kết hoặc toàn bộ fixture vào file.

Trước khi comment thiếu case dương/âm, vẫn phải đếm fixture và chạy extractor để xác minh như quy trình ở đầu tài liệu.

---

## 🗂️ Bảng tra cứu nhanh commit SHA

| Chủ đề | Commit SHA | PR |
|---|---|---|
| restrict_to_match thiếu biến thể | `97330b9` | tool-100 #9 |
| Pattern regex chỉ có dấu, thiếu không dấu | `97330b9` | tool-100 #9 |
| PersonNameFilter extends sang mọi nước | `97330b9` | tool-100 #9 |
| FilterRule quên thêm vào build_rules() | `97330b9` | tool-100 #9 |
| Alias số cần cập nhật OPTION_DISCUSSION_RE | `a60fd08` | tool-100 #8 |
| Regex đồng âm (so/chi) false positive | `a5c54b1c` | tool-100 #9 (dratct) |
| Guard ambiguous bỏ qua phủ định | `07f55105` | tool-100 #9 (dratct) |
| Over-rescue thiếu anchor thứ 2 | `29f5bb07` | tool-100 #9 (dratct) |
| Temporal filter bên thứ ba | `1613781a` | tool-100 #9 (dratct) |
| Verb set không đồng bộ | `26f2d584` | tool-100 #9 (dratct) |
| Regex inline → tách module constant | `0bb84c2f` | tool-100 #9 (dratct) |
| Merge fixture = union | `fa81a144` | tool-100 #9 (dratct) |
| m0004 negative-lookbehind đầy đủ | `e940e74` | tool-100 #9 |
| m0004 _VISA_NEARBY_RE thiếu hồ sơ | `e940e74` | tool-100 #9 |
| m0004 guard "tự túc" quá cứng | `e940e74` | tool-100 #9 |
