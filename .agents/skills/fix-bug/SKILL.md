---
name: fix-bug
description: >-
  Quy trình sửa lỗi (bug fix) bắt buộc cho cả 2 repo: tool-100 (trích xuất metadata)
  và lisa-ai-agent (prompt, graph, stream, sanitizer). Kích hoạt khi nhận yêu cầu
  sửa lỗi, debug, hoặc thấy từ khóa: fix, bug, lỗi, sửa, debug, BSVA-xxx.
---

# Quy trình Sửa Lỗi (Bug Fix) — Lisa AI Project

> **Khi nào kích hoạt:** Nhận yêu cầu sửa lỗi, debug, hoặc keyword `fix`, `bug`, `lỗi`, `sửa`, `debug`, `BSVA-xxx`.
> Skill này đúc kết toàn bộ bài học từ Team Lead (anh Trường TC) và các PR thực tế đã merge.

---

## 📌 Tham khảo chi tiết (References)

Tùy repo cần sửa, **BẮT BUỘC** đọc reference tương ứng trước khi bắt đầu:

- **[tool100-fix.md](references/tool100-fix.md)** — Quy trình + quy tắc fix bug repo `tool-100` (regex, guards, rescue rules, fixtures YAML, resolver, pipeline).
- **[agent-fix.md](references/agent-fix.md)** — Quy trình + quy tắc fix bug repo `lisa-ai-agent` (prompt LLM, metadata extraction, streaming, sanitizer, docs loader, graph nodes).

---

## ⚡ 5 BƯỚC BẮT BUỘC

### Bước 1 — Điều tra Root Cause (KHÔNG SỬA CODE)

> 📌 **Bài học TL:** "Không chỉ vá triệu chứng; phải sửa đúng tầng gây lỗi."

1. **Ghi rõ input gây lỗi** — câu input cụ thể, user nói gì.
2. **Ghi rõ output sai** — kết quả hiện tại là gì, field nào sai.
3. **Ghi rõ output đúng** — kết quả mong muốn là gì.
4. **Trace flow** — request đi qua tầng nào: frontend → backend → graph node → prompt → tool → metadata → docs?
5. **Xác định lỗi nằm ở tầng nào:**
   - Regex/Rule trong `tool-100`?
   - Prompt/COT_HINTS trong `lisa-ai-agent`?
   - Stream/Sanitizer?
   - Docs loader / market_data?
6. **Xác định đúng path runtime** (nếu liên quan metadata):
   - Prod dùng provider `anai-metadata` → **LUÔN `field_by_field`**
   - FBF đọc `COLUMN_PROMPTS` + `COT_HINTS` trong `metadata_local_7b.py`
   - Group mode đọc `METADATA_EXTRACTION_RULES` trong `constants.py`
   - ⚠️ Sửa ở `constants.py` khi prod dùng FBF = **đúng ý, sai path** → vô hiệu!
7. **Khi sửa prompt metadata** → **CHỈ sửa `COT_HINTS`**, **KHÔNG đụng `COLUMN_PROMPTS`**:
   - `COLUMN_PROMPTS` = prompt cơ bản mô tả field → giữ nguyên bản gốc, KHÔNG thêm rule phức tạp.
   - `COT_HINTS` = reasoning hints trong `<thought>` block → đây là nơi thêm logic phân biệt, guard, ví dụ.
   - Model 7B tuân thủ rule trong `COT_HINTS` (reasoning step) tốt hơn nhiều so với nhồi vào `COLUMN_PROMPTS`.
   - 📌 Bài học: PR #137 — TL khôi phục `COLUMN_PROMPTS` về bản đầu tiên, chuyển toàn bộ logic phân biệt sang `COT_HINTS`.
8. **Ghi root cause** trước khi sửa bất kỳ dòng code nào.

### Nguyên tắc prompt cho model local nhỏ

- Giả định model đang chạy ở mode **tắt suy luận** và có năng lực thấp hơn model lớn; không viết prompt dựa vào việc model tự nối nhiều bước suy luận.
- Viết mỗi rule thành một mệnh lệnh ngắn, trực tiếp và chỉ chứa **một intent**. Nêu rõ điều kiện, kết quả cần trả về và trường hợp phải trả `null`.
- Với mỗi rule quan trọng, dùng ví dụ cụ thể theo dạng `Input → Output`, kèm ít nhất một ví dụ phủ định gần giống để phân biệt.
- Ưu tiên bằng chứng xuất hiện trực tiếp trong câu user; không yêu cầu model tự suy diễn từ địa danh, mục đích, thời lượng, quốc tịch hoặc ngữ cảnh chung.
- Routing, allow/deny, mapping giá trị và các điều kiện xác định được bằng code phải để code xử lý; chỉ giao cho LLM phần cần hiểu ngữ nghĩa.
- Không chữa lỗi bằng cách nối thêm nhiều đoạn giải thích vào prompt. Nếu prompt phình hoặc model bị tràn token, phải rút gọn context và kiểm tra lại tầng gây lỗi trước.
- Không coi một rule prompt là đúng tuyệt đối cho mọi model hoặc mọi lần chạy; phải kiểm tra bằng eval có biến thể và regression.
- Tránh câu mô tả chung chung khiến model tự đoán. Viết điều kiện theo dạng tường minh: `Nếu A, B và C đều đúng thì làm D; nếu thiếu một điều kiện thì không làm D/null`.
- Hạn chế chuỗi suy luận nhiều lượt trong prompt; nếu điều kiện xác định được bằng code thì chuyển logic đó về code thay vì bắt model suy luận.

### Bước 1b — Nếu bug nằm ở Regex / Rule / Resolver (BẮT BUỘC)

> 📌 **Bài học TL:** "Sửa regex/rule không phải chỉ fix case mới; phải biết regex này đang bắt cho cái nào."

Trước khi đổi regex, guard hay resolver, **bắt buộc** ghi rõ:

1. **Regex/rule hiện tại đang dùng để bắt case nào?**
   - Liệt kê ngắn gọn các case đúng hiện tại mà rule đang cover.
2. **Bug mới là false positive hay false negative?**
   - Nó bắt nhầm cái gì / bị sót cái gì?
3. **Nếu sửa regex này, case cũ nào có nguy cơ bị ảnh hưởng?**
   - Bắt buộc xác định trước 1-2 case cũ cần giữ nguyên hành vi.
4. **Có thể chuyển từ "thêm guard" sang "đổi trục nhận diện" được không?**
   - Ưu tiên hướng ít chắp vá hơn nếu regex cũ đang phủ quá rộng.
5. **⚠️ Cẩn trọng với False Positive của Từ khóa mới (Bài học BSVA-683):**
   - Khi bổ sung một từ khóa (keyword) mới vào regex, luôn lường trước các câu hỏi khái niệm chung (ví dụ: *"tuổi nghỉ hưu của nam là bao nhiêu"*) hoặc câu phủ định xa (*"chưa đến tuổi nghỉ hưu"*) để viết bộ lọc (FilterRule) chặn kịp thời. Không được để tự động nhận diện sai lệch làm điền nhầm thông tin ở sidebar.

### Bước 1c — Bảng tránh lỗi từ các PR

Trước khi sửa, đối chiếu các pattern sau và ghi kết quả vào root-cause report:

- **L1 — Sửa đúng tầng:** trace `tool-100 → group/rule → FBF/COT_HINTS → docs → response`; không vá prompt khi tool đã sai. Tham khảo AI #171, #154, #148, #165.
- **L2 — Xanh giả:** test phải fail khi nghiệp vụ sai; không assert nguyên văn business copy hoặc chỉ kiểm chuỗi SQL mock. Tham khảo AI #150, #146, #160, #126, BE #32.
- **L3 — Test thiếu:** mỗi nhánh cần happy, absent/present-mirror và variant/edge case.
- **L4 — Guard rộng:** dùng denylist hẹp có anchor/context; luôn test phủ định và context hợp lệ. Tham khảo AI #162, tool100 #17.
- **L5 — Sai định nghĩa field:** đọc schema, `COLUMN_PROMPTS` và extractor trước khi đặt expected. Tham khảo AI #162.
- **L6 — Sót pattern:** quét toàn bộ alias/module cùng pattern và ghi rõ phạm vi đã rà soát. Tham khảo AI #143.
- **L7 — Prompt dài/mơ hồ:** mỗi rule một intent, rule chung trước, ví dụ sau; giữ prompt ngắn và sửa `COT_HINTS`/YAML, không sửa `COLUMN_PROMPTS` frozen. Tham khảo AI #126, #122, #166, #137.
- **L8 — Hygiene:** fixture phải có ticket; không commit file local/cache; báo test phải kèm output/evidence. Tham khảo AI #142, tool100 #18, #19, #22, #23.
- **L9 — Input/vận hành:** escape input khi search/backend và dùng integration test thật khi behavior phụ thuộc DB/runtime. Tham khảo BE #32.

### Nhìn tổng quan trước khi viết test

Không thiết kế test chỉ quanh câu reproduction. Trước khi chốt hướng fix và fixture:

- Đọc schema/allowed values của toàn field; lập coverage matrix và bảo đảm mỗi giá trị enum hợp lệ có ít nhất một `happy` case.
- Với mỗi guard trả `null/absent`, thêm `present-mirror` cho tín hiệu hợp lệ gần nhất để phát hiện over-correct.
- Edge phải chứng minh ranh giới nghiệp vụ: nếu bug suy diễn giá trị mặc định X, case “tín hiệu phụ + giá trị hợp lệ Y khác X” mới chứng minh model không còn mặc định X và vẫn giữ Y.
- Rà caller, flow, alias, metadata field và rule dùng chung trước khi kết luận phạm vi chỉ có một bug; ghi rõ phần đã kiểm tra vào root-cause report.
- Test assert hành vi extraction/response thật. Không dùng assert nguyên văn prompt làm bằng chứng fix; đó chỉ là change-detector test.

### Bước 2 — Viết Fix

- Đọc reference tương ứng để nắm quy tắc code chi tiết.
- Sửa **đúng tầng** gây lỗi, không vá triệu chứng.
- Với bug liên quan docs/suggestion: **vẽ flow load docs** trước khi fix (xem mục "Câu hỏi bắt buộc" trong agent-fix.md).

### Bước 3 — Viết Test

- Mỗi positive case → phải có negative case tương ứng.
- Mỗi field enum → lập coverage matrix: `happy` cho các allowed values quan trọng, `absent`, `present-mirror`, variant và edge case.
- Mỗi negative/`absent` guard → phải có present-mirror gần giống nhưng có tín hiệu hợp lệ.
- Edge phải dùng giá trị hợp lệ khác với giá trị mặc định/suy diễn sai trong bug; không lặp lại đúng giá trị sai rồi coi là đã phân biệt được.
- Mixed past/current phải assert tập kết quả hoặc `not_contains` giá trị quá khứ; `contains` một giá trị đúng không đủ chống lọt thêm giá trị sai.
- Khi sửa mapping/prompt, phải snapshot alias cũ và viết test giữ lại alias; đặc biệt alias tool không rescue được phải được kiểm tra ở agent.
- Thêm present-mirror cùng giá trị cho guard theo thời điểm (quá khứ Japan nhưng kế hoạch hiện tại cũng Japan).
- Assert **cấu trúc** (section header, format), KHÔNG assert nội dung cụ thể dễ vỡ.
- Khi xóa guard/function → xóa luôn test tương ứng.
- Fixture YAML: tên case BẮT BUỘC theo format `BSVA-xxx mô tả ngắn`.

### Bước 3b — Test Bắt Buộc Cho Bug Regex / Rule

Khi sửa `regex`, `DetectRule`, `resolver`, `filter`, `guard`:

- **Phải có ít nhất 3 nhóm case test:**
  1. **Bug case mới** ➔ case đang fail cần fix (ví dụ: *"Liệt kê hồ sơ cho người nghỉ hưu"*)
  2. **Keep-old-behavior case** ➔ 1 hoặc nhiều case cũ mà regex/rule này trước đó bắt đúng, sau khi sửa vẫn phải pass (ví dụ: *"Bố anh đã về hưu rồi"*)
  3. **Negative / nearby case** ➔ case gần vùng regex đang sửa để chặn bắt nhầm mới (ví dụ: *"tuổi nghỉ hưu của nam là bao nhiêu"* ➔ mong muốn: `None`)

- **Không được dừng ở "thêm 1 test cho bug mới".**
- Nếu regex/rule dùng chung cho nhiều alias/value, bắt buộc grep/rà soát fixtures/tests liên quan trước khi chốt.

### Bước 4 — Chạy Test & Regression

**Nếu sửa `tool-100`:**
```bash
# 4a. Test extractor liên quan
uv run pytest tests/unit -k "<tên_extractor>" -v

# 4b. Full regression
uv run pytest tests/unit -v

# 4c. Audit regression (BẮT BUỘC với tool-100, dùng tệp input/Review_record.xlsx)
# Bước này phải thực hiện trước và sau khi sửa code để đối chiếu:
# 1. Stash code cũ, chạy baseline:
uv run tool100 audit run -i input/Review_record.xlsx -o output/<TASK>_before.xlsx --rule-trace
# 2. Pop/apply code mới, chạy after:
uv run tool100 audit run -i input/Review_record.xlsx -o output/<TASK>_after.xlsx --rule-trace -f
# 3. So sánh kết quả:
uv run tool100 audit diff -b output/<TASK>_before.xlsx -a output/<TASK>_after.xlsx --rules
# Verdict bắt buộc phải là IMPROVED hoặc UNCHANGED. Nếu REGRESSED/MIXED → KHÔNG ĐƯỢC merge.
```

**Nếu sửa `lisa-ai-agent`:**
```bash
# README gate: bắt buộc chạy toàn bộ, không chỉ test module liên quan.
task test
task code:check-strict

# Nếu sửa metadata/prompt: model server phải chạy và eval phải đạt 100%.
task test:eval:metadata
task test:eval:pytest -- -k o5001
```

**Nếu sửa `tool-100`:** README gate là `task ci` (lint + type + test + build + schema/version). Không thay bằng chỉ một test extractor.

**Evidence bắt buộc:** lưu command, exit code, số pass/fail và output quan trọng vào `.ai/evidence/<task>/` để gắn vào PR. `401`, timeout, skip hoặc `llm_error` là `BLOCKED`, không phải pass/fail logic. Chỉ báo `done` khi tất cả gate pass; nếu thiếu model server/DB/network/dependency thì báo `BLOCKED`, không tuyên bố đã fix.

> 📌 **Bảng task test đầy đủ (lisa-ai-agent):**
> | Task | Mô tả |
> |---|---|
> | `task test` | Chạy tất cả tests |
> | `task test:file -- <path>` | Test file/folder cụ thể |
> | `task test:cov` | Coverage report (terminal) |
> | `task test:cov:check` | Check coverage >= 80% |
> | `task test:eval` | LLM eval toàn bộ suite (cần model server) |
> | `task test:eval:metadata` | LLM eval metadata (7B extraction) |
> | `task test:eval:pytest -- <args>` | LLM eval qua pytest (vd: `-- -k o5001`) |
> | `task code:fix` | Auto-fix tất cả (ruff + ty) |
> | `task code:check` | Daily check (ruff + ty) |
> | `task code:check-strict` | Pre-PR check (+ mypy strict) |

### Bước 5 — Báo cáo (KHÔNG commit, KHÔNG push)

Viết báo cáo tiếng Việt theo cấu trúc dưới đây. **KHÔNG tự ý commit/push.**

```markdown
## 1. Nguyên nhân lỗi (Root Cause)

- **Input lỗi:** "<câu input>"
- **Output sai:** <field_id> = "<giá trị sai>" / Lisa trả lời "..."
- **Output đúng:** <field_id> = "<giá trị đúng>" / Lisa phải trả lời "..."
- **Path runtime:** FBF / Group / Prompt template
- **File lỗi:** `<file.py>` (link file://)
- **Tại sao sai:** [giải thích ngắn]

## 2. Cách sửa (Implementation)

- File: `<path/to/file>` (link file://)
- Thay đổi: [mô tả cụ thể]
- Lý do chọn hướng này: [giải thích]

## 3. Test Fixture / Unit Test

- File: `<path/to/test>`
- Case mới: [liệt kê]

## 4. Kết quả test

- `<lệnh test>` → X passed ✅
- `<lệnh regression>` → X passed, 0 failed ✅

## 5. Files thay đổi (chưa commit)

- `git status --short`:
  ```
  M src/...
  M tests/...
  ```

## 6. Lệnh Git đề xuất (chỉ khi được yêu cầu)

```bash
git checkout -b huyen/fix-BSVA-xxx-short-desc origin/<base-branch>
git add <chỉ file thay đổi>
git commit -m "fix(<scope>): [BSVA-xxx] mô tả ngắn

Root cause: ...
Fix: ...
Kiểm chứng: ..."
```
```

---

## 🚫 QUY TẮC AN TOÀN GIT & QUY TRÌNH (BẮT BUỘC)

> 📌 **Từ TL:** "KHÔNG tự ý commit/push. Cấm force push. Cấm amend commit đã push. Cập nhật PR Notion."

| Quy tắc | Chi tiết |
|---|---|
| ❌ KHÔNG tự commit | Chỉ commit khi user nói rõ "commit đi", "push đi" |
| ❌ KHÔNG tự push | Kể cả sau khi commit xong |
| ❌ CẤM force push | `-f`, `--force`, `--force-with-lease` đều cấm trên branch chung |
| ❌ CẤM amend commit đã push | Không `git commit --amend` sau khi đã push |
| ❌ CẤM commit secrets | Không commit `.env`, credentials, API keys |
| ❌ KHÔNG sửa file docs/data | `.md`, `.csv` trong `docs/data/market_data` |
| ❌ KHÔNG commit file local | Cấm commit `.devcontainer/devcontainer.json`, `docker-compose.yml`, `pyproject.toml`, `uv.lock`, `.pnpm-store` và các cấu hình phát triển cục bộ tương tự. **Được phép mang theo các file local này sang nhánh mới nếu đang cần để chạy local**, nhưng trước khi `git add` / commit thì bắt buộc phải loại chúng khỏi diff commit (unstage / restore / stash các file local này). |
| ✅ Branch gốc sạch | BẮT BUỘC checkout nhánh mới từ nhánh gốc sạch mới nhất của đúng repo. Base branch **không cố định**: phải xác định theo repo / quy ước hiện tại rồi mới tạo nhánh (ví dụ `origin/staging`, `origin/main`, hoặc `origin/dev`). TUYỆT ĐỐI KHÔNG checkout nhánh mới từ nhánh local hiện tại nếu nhánh đó đang chứa các thay đổi dở dang hoặc commit chưa được merge để tránh nhiễm chéo code. |
| ✅ Tên branch | BẮT BUỘC theo dạng `huyen/fix-BSVA-XXX-short-desc` cho bug fix, trừ khi user/TL yêu cầu format khác. |
| ✅ PR tối đa 3 bug cùng cụm | Không gom quá nhiều bug khác chủ đề |
| ✅ Quy trình Notion | Khi task sang Review/Resolved → BẮT BUỘC điền PR URL vào Notion |

### Trước khi commit (khi được yêu cầu):
```bash
git log --oneline origin/<base-branch>..HEAD
git diff --name-status origin/<base-branch>..HEAD
git status --short --branch
```

---

## 📝 FORMAT COMMIT MESSAGE

```
fix(<scope>): [BSVA-XXX] mô tả ngắn gọn vấn đề

Root cause:
- Input: "<câu gây lỗi>"
- Output sai: <field> = "<giá trị sai>"
- Output đúng: <field> = "<giá trị đúng>"
- Path: <FBF/Group/Prompt> → <file gây lỗi>
- Nguyên nhân: <rule/regex/guard nào gây ra>

Fix:
- <Thay đổi cụ thể>
- Tại sao chọn hướng này: <giải thích>

Kiểm chứng:
- <lệnh test> → X passed ✅
- regression/audit diff → IMPROVED/UNCHANGED ✅
```

---

## 📋 CHECKLIST CUỐI — TRƯỚC KHI BÁO TL REVIEW

> 📌 **Từ TL:** "Mỗi bug cần log root cause. Phải test/regression. Phải kiểm diff."

- [ ] Đã pull/fetch base mới nhất
- [ ] Branch tạo từ đúng base (`origin/staging` hoặc theo yêu cầu)
- [ ] PR không quá 3 bug
- [ ] Diff không có file local/cache/generated
- [ ] Có root cause + hướng sửa rõ ràng
- [ ] Có test liên quan chạy pass
- [ ] Có regression check (audit diff nếu tool-100)
- [ ] Nếu metadata → xác định đúng path prod (FBF, không phải Group)
- [ ] Nếu stream/output → kiểm cả stream và non-stream
- [ ] Nếu TL từng sửa/comment vùng code này → đọc lại commit/PR cũ trước
- [ ] Đọc lại diff cuối cùng trước khi báo
