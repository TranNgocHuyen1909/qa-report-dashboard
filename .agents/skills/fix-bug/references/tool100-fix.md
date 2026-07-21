# Quy trình Fix Bug — tool-100 (Trích xuất Metadata)

> **Khi nào dùng:** Bug liên quan đến trích xuất metadata bằng regex/rule trong repo `tool-100`.
> Repo path: `d:\TranNgocHuyen\lisa-visa-ai\tool-100`

---

## 🏗️ Kiến trúc cần hiểu trước khi fix

```
tool-100/
├── src/tool100/extractors/
│   ├── <field_id>/
│   │   ├── data/       # Dữ liệu: CountrySpec, PurposeSpec, ...
│   │   ├── rules.py    # DetectRule (phát hiện), FilterRule (lọc false positive)
│   │   ├── helpers.py  # Hàm phụ trợ (regex, normalize)
│   │   ├── resolver.py # Resolve logic cuối cùng: chọn candidate tốt nhất
│   │   └── extractor.py# BaseExtractor — entry point cho field
│   ├── m0001/          # Quốc gia đích đến
│   ├── m0002/          # Mục đích chuyến đi
│   ├── m0003/          # Khoảng thời gian
│   ├── m0004/          # Loại visa (tự túc / tour)
│   ├── o1001/          # Thông tin liên hệ
│   ├── o3001/          # Sổ tiết kiệm (có/không)
│   ├── o3002/          # Định giá sổ tiết kiệm (phụ thuộc O3001)
│   ├── o9001/          # Số lần nhập cảnh
│   └── o400101/        # Tài sản (nhà đất, hợp đồng)
├── tests/fixtures/     # 1 file YAML per extractor
│   ├── m0001_country_cases.yaml
│   ├── m0002_purpose_cases.yaml
│   └── ...
└── tests/unit/
    └── test_extractors_mandatory.py  # Chạy tất cả fixture YAML
```

**2 loại Rule chính:**
- `DetectRule` → phát hiện giá trị (regex match → Candidate)
- `FilterRule` → lọc bỏ false positive (should_reject → bool)

**Pipeline:**
```
Input text → Preprocessor (normalize) → DetectRules (candidates)
→ FilterRules (reject FP) → Resolver (chọn best) → ExtractionResult
```

### Xác nhận bug trước khi sửa
```bash
uv run python -c "
from tool100 import Extractor
ext = Extractor()
r = ext.extract('<input_gây_lỗi>')
print(r.results)
"
```

---

## ✅ QUY TẮC CODE KHI FIX

### A. Regex / Pattern

**A1. Từ đồng âm / prefix nhầm**
- Khi viết regex mới → **bắt buộc** test với từ cùng prefix có thể bị bắt nhầm:
  - `"hàn"` → `"hàn lâm"`, `"lạnh hàn"`, `"thợ hàn"`
  - `"nhật"` → `"sinh nhật"`, `"chủ nhật"`, `"cập nhật"`
  - `"so"` → `"so sánh"`, `"chi"` → `"chi tiết"`
- Nếu bắt nhầm → thêm `negative-lookahead` hoặc `FalsePositiveGuard`
- 📌 Bài học: commit [`a5c54b1c`](https://github.com/truongtc/tool-100/commit/a5c54b1c) (PR #9 — dratct)

**A2. Biến thể có dấu / không dấu**
- Pattern regex PHẢI cover cả biến thể có dấu và không dấu:
  - ✅ `r"\bh[aà]n\s+(?:l[aâ]m|g[aắ]n)"`
  - ❌ `r"\bhàn\s+(?:lâm|gắn)"` (chỉ có dấu)
- `restrict_to_match` phải list đủ: `("hàn", "han", "hàn quốc", "han quoc")`
- 📌 Bài học: commit [`97330b9`](https://github.com/truongtc/tool-100/commit/97330b9) (PR #9)

**A3. Guard phủ định**
- Guard "ambiguous/bare" PHẢI bỏ qua trường hợp phủ định:
  - `"không có sổ đỏ"` = user KHÔNG sở hữu → không coi là khai tài sản
  - `"chưa có visa"` ≠ user có visa
- 📌 Bài học: commit [`07f55105`](https://github.com/truongtc/tool-100/commit/07f55105) (PR #9 — dratct)

**A4. Verb set phải đồng bộ**
- Khi thêm/bỏ verb trong pattern tài sản → phải đồng bộ TẤT CẢ regex liên quan
- Phân biệt **sở hữu** (mua/bán/cho thuê) vs. **đi thuê** (thuê trọ)
- 📌 Bài học: commit [`26f2d584`](https://github.com/truongtc/tool-100/commit/26f2d584) (PR #9 — dratct)

**A5. Regex KHÔNG inline trong hàm**
- Regex phức tạp → tách thành `_CONSTANT_RE` ở module level
- Lý do: inline → không test riêng từng nhánh được
- 📌 Bài học: commit [`0bb84c2f`](https://github.com/truongtc/tool-100/commit/0bb84c2f) (PR #9 — dratct)

**A6. Import ở top-level file**
- `import re` và mọi import khác → ĐẶT Ở ĐẦU FILE, không inline trong thân hàm

---

### B. Rescue / Exception Rule

**B1. Phải có anchor thứ 2**
- `rescue = CONDITION_A AND CONDITION_B` (cả 2 phải đúng)
- Chỉ 1 điều kiện → over-rescue (bắt cả tán gẫu)
- 📌 Bài học: commit [`29f5bb07`](https://github.com/truongtc/tool-100/commit/29f5bb07) (PR #9 — dratct)

**B2. Chủ ngữ user vs. bên thứ ba**
- `"bạn mình vừa đi Hàn"` ≠ lịch sử user → KHÔNG loại nước Hàn
- `"em vừa đi Hàn về"` = lịch sử user → loại nước Hàn
- 📌 Bài học: commit [`1613781a`](https://github.com/truongtc/tool-100/commit/1613781a) (PR #9 — dratct)

---

### C. FilterRule mới

- [ ] Class FilterRule mới đã thêm vào `build_xxx_rules()` chưa? (quên → filter không chạy)
- [ ] `applies_to` có giới hạn đúng scope không? (rỗng → filter áp cho mọi candidate)
- 📌 Bài học: commit [`97330b9`](https://github.com/truongtc/tool-100/commit/97330b9) (PR #9)

---

### D. m0004 Visa Type — đặc thù

- Pattern `"đi tự túc"` phải có negative-lookbehind đủ: `không/khong/ko/k/chưa/chua/phải/phai/muốn/muon/cần/can`
- `_VISA_NEARBY_RE` phải bao gồm: `visa / thị thực / phí / xin / diện / chứng minh / hồ sơ / thủ tục / giấy tờ`
- `"tự túc" in m2.group(0)` thay vì `m2.group(0).startswith("du lịch tự túc")`
- 📌 Bài học: commit [`e940e74`](https://github.com/truongtc/tool-100/commit/e940e74) (PR #9)

---

## ✅ QUY TẮC FIXTURE YAML

**E1. Naming convention**
- Tên case: `BSVA-xxx mô tả ngắn`
  - ✅ `BSVA-662 tham ban phan loai du lich`
  - ❌ `negated tourism keeps friend visit` (thiếu mã ticket)

**E2. Đủ negative case**
- Mỗi positive case → phải có negative case tương ứng:
  - Thêm alias `"1 lần"` → test `"Em lần đầu xin visa"` → null
  - Thêm alias `"thăm bạn"` → test `"thăm bạn, không phải du lịch"` → xem expected đúng chưa

**E3. Khi thêm alias số → cập nhật `_OPTION_DISCUSSION_RE`**
- Dạng số (`"1 lần"`, `"2 lần"`) phải đồng bộ trong `_OPTION_DISCUSSION_RE`
- 📌 Bài học: commit [`a60fd08`](https://github.com/truongtc/tool-100/commit/a60fd08) (PR #8 — dratct)

**E4. Merge fixture conflict = union**
- Resolve conflict YAML = giữ TẤT CẢ case (cả 2 nhánh), không xóa case nào
- Sau merge: chạy `ruff format` để fix lint gate
- 📌 Bài học: commit [`fa81a144`](https://github.com/truongtc/tool-100/commit/fa81a144) (PR #9 — dratct)

---

## 🗂️ Bảng tra cứu nhanh commit SHA (bài học từ PR đã merge)

| Chủ đề | Commit SHA | PR |
|---|---|---|
| Regex đồng âm (so/chi) false positive | `a5c54b1c` | tool-100 #9 (dratct) |
| Guard ambiguous bỏ qua phủ định | `07f55105` | tool-100 #9 (dratct) |
| Over-rescue thiếu anchor thứ 2 | `29f5bb07` | tool-100 #9 (dratct) |
| Temporal filter bên thứ ba | `1613781a` | tool-100 #9 (dratct) |
| Verb set không đồng bộ | `26f2d584` | tool-100 #9 (dratct) |
| Regex inline → tách module constant | `0bb84c2f` | tool-100 #9 (dratct) |
| Merge fixture = union | `fa81a144` | tool-100 #9 (dratct) |
| restrict_to_match thiếu biến thể | `97330b9` | tool-100 #9 |
| Pattern regex chỉ có dấu | `97330b9` | tool-100 #9 |
| Alias số cần cập nhật OPTION_DISCUSSION_RE | `a60fd08` | tool-100 #8 |
| m0004 negative-lookbehind đầy đủ | `e940e74` | tool-100 #9 |
| m0004 _VISA_NEARBY_RE thiếu hồ sơ | `e940e74` | tool-100 #9 |
| m0004 guard "tự túc" quá cứng | `e940e74` | tool-100 #9 |
