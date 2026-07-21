# Quy trình Fix Bug — lisa-ai-agent (Prompt, Graph, Stream, Docs)

> **Khi nào dùng:** Bug liên quan đến prompt LLM, metadata extraction (agent side), streaming/sanitizer, docs loader trong repo `lisa-ai-agent`.
> Repo path: `d:\TranNgocHuyen\lisa-visa-ai\lisa-ai-agent`

---

## 🏗️ Kiến trúc cần hiểu trước khi fix

```
lisa-ai-agent/
├── app/domains/chat/
│   ├── graph/
│   │   ├── agents/
│   │   │   └── metadata_local_7b.py   # ⭐ COLUMN_PROMPTS & COT_HINTS (FBF mode — prod)
│   │   └── nodes/
│   │       ├── metadata_extraction.py # Node trích xuất metadata
│   │       └── suggestion.py          # Node gợi ý tài liệu
│   ├── prompts/
│   │   ├── builder.py                 # Compile prompt templates
│   │   └── prompt_templates/
│   │       ├── common/
│   │       │   ├── response_style.yaml# Xưng hô, định dạng, tóm tắt
│   │       │   ├── task_1.yaml        # Nhiệm vụ 1: Trả lời theo docs
│   │       │   └── task_2.yaml        # Nhiệm vụ 2: Hỏi bổ sung
│   │       └── dynamic/
│   │           └── response_guides.yaml# Hướng dẫn khi thiếu metadata
│   └── service.py                     # ⭐ Streaming & Sanitizer logic
├── app/domains/metadata/
│   ├── constants.py                   # METADATA_EXTRACTION_RULES (Group mode — KHÔNG phải prod)
│   ├── service.py                     # MetadataService — gọi tool100
│   └── tool_extractors.py            # Wrapper gọi tool100.Extractor
├── app/domains/suggestion/
│   ├── constants.py                   # MARKET_DATA_BASE_PATH, DOC_PRIORITY_TIERS
│   ├── document_loader.py            # DocumentLoader.get_document_content_by_pair()
│   └── service.py                     # SuggestionService.prepare_suggestion_context()
├── storage/private/
│   ├── market_data/                   # Tài liệu nghiệp vụ visa theo thị trường
│   └── metadata_labels/vi.json       # Label hiển thị tiếng Việt cho metadata
└── tests/unit/domains/chat/
    ├── test_prompts.py                # Test prompt (CẤU TRÚC, không assert wording)
    └── test_service.py                # Test sanitizer (Stream vs Non-stream)
```

---

## ⚠️ Chế độ trích xuất Metadata — PHẢI XÁC ĐỊNH TRƯỚC KHI SỬA

| Mode | File sửa | Khi nào chạy |
|---|---|---|
| **Field-by-Field (FBF)** ⭐ | `metadata_local_7b.py` → `COLUMN_PROMPTS`, `COT_HINTS` | **Luôn chạy trên prod** (provider `anai-metadata`) |
| Group | `constants.py` → `METADATA_EXTRACTION_RULES` | Chỉ chạy khi dev cấu hình thủ công |

> **Rule:** Hỏi bản thân trước khi sửa: "Field này dùng FBF hay Group?"
> Prod = **luôn FBF**. Sửa `constants.py` = **vô hiệu trên prod**.

> **⚠️ QUY TẮC QUAN TRỌNG NHẤT (từ PR #137):**
> - **CHỈ sửa `COT_HINTS`**, **KHÔNG đụng `COLUMN_PROMPTS`**.
> - `COLUMN_PROMPTS` = prompt cơ bản mô tả field → giữ nguyên bản gốc.
> - `COT_HINTS` = reasoning hints trong `<thought>` block → đây là nơi thêm logic phân biệt, guard, ví dụ.
> - Model 7B tuân thủ rule trong `COT_HINTS` (reasoning step) tốt hơn nhiều so với nhồi vào `COLUMN_PROMPTS`.
> - TL đã khôi phục `COLUMN_PROMPTS` về bản đầu tiên, chuyển toàn bộ logic phân biệt sang `COT_HINTS`.

> 📌 Bài học: commit [`a04af927`](https://github.com/truongtc/lisa-ai-agent/commit/a04af927) (PR #130), [`fb75f9e3`](https://github.com/truongtc/lisa-ai-agent/commit/fb75f9e3) (PR #126), PR #137 (định nghĩa quy tắc COT_HINTS-only)

---

## 🔄 Luồng xử lý Graph — từ User Message đến Lisa Response

```
GreetingDetectionNode
  → MetadataExtractionNode (trích xuất metadata)
    → IntentDetectionNode
      → [visa/question] TopicDetectionNode
        → EarlyRejectNode
          → MandatoryValidationNode
            → SuggestionNode ⭐ (Load docs + Build prompt + Call LLM)
              → Lisa Response
      → [comparison] ComparisonNode
      → [currency] CurrencyConversionNode
```

| Node | Nhiệm vụ | Output chính |
|---|---|---|
| `MetadataExtractionNode` | Gọi tool100 trích xuất metadata (M0001, M0002...) | `ChatState.full_metadata` |
| `MandatoryValidationNode` | Check mandatory fields đã đủ chưa | `ResponseContext` |
| `SuggestionNode` ⭐ | Load docs nghiệp vụ + Build prompt + Gọi LLM | `ChatResult` (Lisa response) |

---

## 📚 Luồng Load Docs Nghiệp Vụ — SuggestionNode

> 📌 **Từ TL:** "Trước khi fix sâu, vẽ flow load docs và phân tích tổng thể."

```
SuggestionNode.run():
1. Lấy country_code từ metadata M0001
   → get_country_code_by_name("Hong Kong") → "HK"
2. Build đường dẫn market_data
   → storage/private/market_data/HK/
3. MatrixLoader đọc deterministic_layer.csv
   → Tìm tất cả metadata pairs liên quan
4. DocumentLoader load file .md cho mỗi pair
   → storage/private/market_data/HK/{pair_id}/{pair_id}.md
5. Inject docs vào prompt
   → confirmation_docs + question_doc
6. Prompt template compile (task_1.yaml, task_2.yaml, response_style.yaml)
7. Call LLM (Gemma 7B) với prompt đã compile
```

### Câu hỏi bắt buộc trước khi sửa bug docs/suggestion:
- [ ] User message đi qua node nào đầu tiên?
- [ ] Metadata extraction tạo `tool_metadata`, `llm_metadata`, `merged_metadata`, `full_metadata` ra sao?
- [ ] `mentioned_fields` được set từ nguồn nào?
- [ ] Pair tài liệu nào được load dựa trên field đã có value?
- [ ] Nếu docs không load, thiếu điều kiện nào: field value, mentioned field, market, matrix, hay file docs?
- [ ] Fix có làm load dư tài liệu cho case không liên quan không?

---

## ✅ QUY TẮC CODE KHI FIX

### A. Metadata Extraction & Chặn suy diễn

**A1. Cấm suy đoán diện visa M0004**
- LLM KHÔNG được tự suy M0004 (`theo tour`/`tự túc`) từ mục đích, mã visa, số lần nhập cảnh, thời lượng.
- Sửa ở CẢ 2 path:
  - FBF: `COLUMN_PROMPTS["Diện visa"]` trong `metadata_local_7b.py`
  - Group: `METADATA_EXTRACTION_RULES["M0004"]` trong `constants.py`
- 📌 Bài học: commit [`fb75f9e3`](https://github.com/truongtc/lisa-ai-agent/commit/fb75f9e3) (PR #126)

**A2. Chặn LLM gán quốc gia đến vào O5001 (Lịch sử du lịch)**
- `"Mình đi Hy Lạp 15 ngày"` = điểm đến M0001, KHÔNG phải lịch sử O5001.
- Sửa đúng path FBF: thêm guard vào `COT_HINTS` (reasoning `<thought>`), KHÔNG sửa `COLUMN_PROMPTS`.
- 📌 Bài học: commit [`a04af927`](https://github.com/truongtc/lisa-ai-agent/commit/a04af927) (PR #130)

**A3. Chuẩn hoá multi-value fields (O5001 và các field nhiều giá trị)**
- Field multi-value (ví dụ: O5001 lịch sử du lịch) qua FBF path có thể trả về separator khác nhau: `,`, `、`, `|`.
- Downstream đọc theo `|` → bị lệch nếu model trả separator khác.
- Phải dùng `normalize_multi_value()` tách trên mọi separator, bỏ phần rỗng, re-join về `|` (canonical separator).
- Value toàn separator → rỗng sau normalize → coi absent.
- 📌 Bài học: PR #137 — `normalize_multi_value` trong `value_utils.py`, `MULTI_VALUE_SEP` + `MULTI_VALUE_METADATA` trong `constants.py`.

---

### B. Prompt & Response Generation

**B1. Xưng hô rõ ràng — KHÔNG dùng dấu "/"**
- ❌ `anh/chị → em` (model 7B không hiểu `/` = "hoặc")
- ✅ `Nếu khách xưng "anh" hoặc "chị" hoặc "tôi" thì Lisa xưng "em" và gọi là "anh/chị"`
- Gom tất cả rule + ví dụ vào chung block Mapping trong `response_style.yaml`
- 📌 Bài học: commit [`d6d9c581`](https://github.com/truongtc/lisa-ai-agent/commit/d6d9c581) (PR #130)

**B2. CẤM tự chốt nhánh tài liệu khi thiếu metadata**
- Nếu tài liệu có nhiều nhánh phụ thuộc thông tin chưa biết → CẤM chọn 1 nhánh cụ thể.
- Viết theo hướng điều kiện: `"Nếu... thì..."`, hỏi thẳng metadata còn thiếu.
- Đồng bộ trong `task_1.yaml` VÀ `response_guides.yaml`.
- 📌 Bài học: PR #126, PR #128

**B3. Diễn đạt nơi ở tự nhiên**
- Không tự đổi `"hiện ở/đang ở"` thành `"hộ khẩu"`, `"nơi nộp hồ sơ"`.
- Không nối thời lượng + nơi ở bằng `"tại"` gây mơ hồ.
- 📌 Bài học: commit [`0b5504b7`](https://github.com/truongtc/lisa-ai-agent/commit/0b5504b7) (PR #128)

**B4. Viết prompt ngắn gọn hiệu quả**
- Rule chung trước, ví dụ cụ thể sau.
- Tách câu đơn rõ ràng, không gom nhiều ý vào 1 câu.
- Negative instruction: `"Do not infer or guess. In particular, never infer from [danh sách cụ thể]"`
- Mỗi rule phải có positive + negative examples.
- Trước khi thêm rule: kiểm tra file khác đã cover chưa → tránh duplicate.

---

### C. Output Sanitizer (Streaming vs Non-streaming)

> 📌 **Từ TL:** "Sửa ở luồng stream trong backend source, không chỉ vá frontend."

**C1. Khớp lớp whitespace**
- `[ ]*` (chỉ space) ≠ `\s*` (cả newline/tab).
- Regex `_DOLLAR_MATH_RE` và hàm `_safe_cut` PHẢI dùng cùng lớp whitespace.
- 📌 Bài học: commit [`63981d3f`](https://github.com/truongtc/lisa-ai-agent/commit/63981d3f) (PR #130)

**C2. Sanitize per-chunk**
- Regex per-chunk KHÔNG bắt pattern bị cắt ngang 2 chunk (`→`, `\rightarrow`, `${...}`).
- Buffer ~32 ký tự cuối, chỉ emit khi chắc pattern không vắt ngang.
- Gói logic feed/flush lặp vào wrapper `_sanitized_stream`.
- Luôn có flush cuối stream.

**C3. Tránh nuốt currency**
- Sanitizer KHÔNG được nhận diện nhầm `$` của mệnh giá tiền (`$100`, `$20 -> $30`).

---

### D. Unit Test

> 📌 **Từ TL:** "Test prompt = assert cấu trúc, KHÔNG assert nội dung cụ thể."

**D1. CẤM Change-Detector Tests**
- ❌ `assert "Dựa trên thông tin anh/chị cung cấp" in output`
- ✅ `assert "## RESPONSE STYLE" in output`
- Chỉ assert **cấu trúc** (section header, definition không rỗng, mapping đủ), KHÔNG assert business copy.
- 📌 Bài học: commit [`0b5504b7`](https://github.com/truongtc/lisa-ai-agent/commit/0b5504b7) (PR #128)

**D2. Xóa test khi xóa guard**
- Khi xóa guard/function → xóa luôn test tương ứng.
- Giữ test mồ côi → collection error.
- 📌 Bài học: commit [`63981d3f`](https://github.com/truongtc/lisa-ai-agent/commit/63981d3f) (PR #130)

**D3. KHÔNG assert literal constants**
- ❌ Assert `METADATA_EXTRACTION_RULES["M0004"]` chứa chuỗi literal = chỉ assert chính nó → vô nghĩa.

---

### E. Task Test Cần Chạy (đầy đủ từ Taskfile)

| Task | Mô tả | Khi nào chạy |
|---|---|---|
| `task test` | Chạy tất cả unit tests | Luôn chạy trước khi báo cáo |
| `task test:file -- <path>` | Test file/folder cụ thể | Sửa module nào test module đó |
| `task test:cov` | Coverage report (terminal) | Kiểm tra phạm vi test |
| `task test:cov:check` | Check coverage >= 80% | Trước khi tạo PR |
| `task test:eval` | LLM eval toàn bộ suite | Cần model server chạy |
| `task test:eval:metadata` | LLM eval metadata 7B | **BẮT BUỘC khi sửa `COT_HINTS`** |
| `task test:eval:pytest -- -k <field>` | Eval field cụ thể | Vd: `-- -k o5001` |
| `task code:fix` | Auto-fix (ruff + ty) | Sửa nhanh lint |
| `task code:check` | Daily check (ruff + ty) | Hàng ngày |
| `task code:check-strict` | Pre-PR (+ mypy strict) | **BẮT BUỘC trước khi push** |

---

## 🗂️ Bảng tra cứu nhanh commit SHA (bài học từ PR đã merge)

| Chủ đề / Bài học | Commit SHA | PR | File ảnh hưởng chính |
|---|---|---|---|
| Chặn suy diễn diện visa (M0004) | `fb75f9e3` | #126 | `metadata_local_7b.py`, `constants.py` |
| Chấm dứt chốt nhánh tài liệu khi thiếu metadata | `fb75f9e3` | #126 | `task_1.yaml` |
| Cấm assert literal prompt (Change-Detector) | `0b5504b7` | #128 | `test_prompts.py` |
| Tóm tắt thông tin khách & Nơi ở tự nhiên | `0b5504b7` | #128 | `response_style.yaml` |
| Diễn giải rõ mapping xưng hô bằng câu điều kiện | `d6d9c581` | #130 | `response_style.yaml` |
| Xoá package templates chết sau migrate graph | `63981d3f` | #130 | `app/domains/chat/templates/` |
| Chặn LLM gán quốc gia đến vào O5001 bằng CoT Hint | `a04af927` | #130 | `metadata_local_7b.py` |
| Đồng bộ whitespace stream sanitizer và safe_cut | `63981d3f` | #130 | `service.py`, `test_service.py` |
| **Khôi phục COLUMN_PROMPTS về bản gốc, logic vào COT_HINTS** | — | **#137** | `metadata_local_7b.py` |
| **Chuẩn hoá multi-value O5001 về separator `\|`** | — | **#137** | `value_utils.py`, `constants.py` |
| **LLM eval harness cho metadata 7B** | — | **#137** | `tests/eval/` |
