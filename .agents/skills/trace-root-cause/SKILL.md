---
name: trace-root-cause
description: >-
  Trace end-to-end root cause cho một câu hỏi trên LISA: đối chiếu output tool-100,
  metadata LLM, metadata sau merge, graph flow, docs candidate, docs thực sự được
  load và các dòng nội dung đã đưa vào prompt. Dùng khi cần biết chính xác staging
  sai ở tầng nào trước khi sửa code, prompt, metadata hoặc docs.
---

# Trace Root Cause End-to-End

Skill này chỉ phân tích và thu thập bằng chứng trước khi sửa. Không kết luận từ câu trả lời cuối hoặc từ keyword đơn lẻ.

## Nguyên tắc

- Dùng đúng input, môi trường và commit đang chạy trên staging; ghi lại timestamp, branch/commit, market và trace/request id.
- Ghi rõ execution surface của từng bằng chứng: `direct extractor`, CLI public của tool-100, metadata node, agent end-to-end hay staging UI. Không coi hai surface là tương đương nếu chưa đối chiếu caller/config.
- Khóa exact SHA cho local, remote PR head và staging. Nếu khác SHA, ưu tiên điều tra version/deployment và chạy lại trên detached worktree trước khi kết luận logic sai.
- Phân biệt rõ bốn trạng thái metadata:
  1. `tool_metadata`: output thô của tool-100.
  2. `llm_metadata`: output thô của metadata LLM.
  3. `merged_metadata`: kết quả sau precedence/normalization.
  4. `final_metadata`: metadata thực sự được node loader dùng.
- Phân biệt `candidate_pairs` do matrix đề xuất với `loaded_docs` thực sự được đọc và `prompt_docs` thực sự được bơm vào LLM.
- Không sửa prompt để chữa lỗi tool, không sửa docs khi pair chưa được load, không coi metadata trong sidebar là bằng chứng của tool-100.
- Không coi final metadata đúng là bằng chứng tool đúng: metadata LLM có thể rescue tool miss. Ngược lại, tool miss không tự động là lỗi user-facing nếu merged/final metadata vẫn đúng; phải ghi đúng tầng và blast radius.
- Chỉ so sánh các reproduction có cùng tiền điều kiện. Case thiếu quốc gia/market không đại diện cho case đã có `M0001` và đã đủ điều kiện load pair country-duration.
- Nếu không có log/traces đủ chi tiết, ghi `UNKNOWN/BLOCKED` và nêu chính xác dữ liệu còn thiếu.

### Lưu ý khi trace prompt/model

- Không giả định một rule prompt đúng cho mọi model; cùng prompt có thể được model khác hiểu khác hoặc cùng model cho kết quả không ổn định.
- Kiểm tra prompt có đang mô tả nghiệp vụ cụ thể hay chỉ dùng câu chữ chung chung, và có đang bắt model tự suy luận nhiều lượt không.
- Ưu tiên câu lệnh tường minh theo chuỗi điều kiện `Nếu A và B thì D; nếu thiếu A hoặc B thì null/không làm D` thay vì mô tả dài để model tự nối ý.
- Khi thấy prompt có vẻ đúng nhưng output không ổn định, phải ghi nhận đây là rủi ro model/eval và kiểm tra bằng nhiều biến thể, không kết luận chỉ từ một lần chạy.

## Bảng lỗi thường gặp khi trace/review

Đối chiếu bảng này trước khi kết luận hoặc đề xuất hướng sửa:

- **L1 — Sửa sai tầng, vá triệu chứng:** Không sửa prompt trước khi biết tool-100 đã extract gì và docs nào được load. Trace theo thứ tự `tool-100 → group-rule → COLUMN_PROMPTS (frozen) → COT_HINTS → docs → prompt`; nhớ `Tool > AI`. Tham khảo [AI #171](https://github.com/truongtc/lisa-ai-agent/pull/171), [#154](https://github.com/truongtc/lisa-ai-agent/pull/154), [#148](https://github.com/truongtc/lisa-ai-agent/pull/148), [#165](https://github.com/truongtc/lisa-ai-agent/pull/165).
- **L2 — Test xanh giả:** Test phải fail khi nghiệp vụ sai, không phụ thuộc nguyên văn wording. Không chấp nhận test chỉ assert prompt/SQL mock hoặc normalize casing làm sai vẫn pass; cần contains/regex khi casing là nghiệp vụ. Tham khảo [AI #150](https://github.com/truongtc/lisa-ai-agent/pull/150), [#146](https://github.com/truongtc/lisa-ai-agent/pull/146), [#160](https://github.com/truongtc/lisa-ai-agent/pull/160), [#126](https://github.com/truongtc/lisa-ai-agent/pull/126), [BE #32](https://github.com/truongtc/lisa-visa-web-backend/pull/32).
- **L3 — Test thiếu:** Mỗi nhánh sửa phải rà `happy`, `absent` kèm `present-mirror`, biến thể và edge case; không chỉ chạy câu bug gốc. Tham khảo [AI #146](https://github.com/truongtc/lisa-ai-agent/pull/146), [#160](https://github.com/truongtc/lisa-ai-agent/pull/160), [#166](https://github.com/truongtc/lisa-ai-agent/pull/166).
- **L4 — Guard/regex quá rộng:** Ưu tiên denylist hẹp có anchor/context, mặc định tin model; kiểm tra case hợp lệ gần vùng guard để tránh xoá oan. Tham khảo [AI #162](https://github.com/truongtc/lisa-ai-agent/pull/162), [tool100 #17](https://github.com/truongtc/tool-100/pull/17).
- **L5 — Sai định nghĩa field/nghiệp vụ:** Đọc schema, `COLUMN_PROMPTS` và contract của tool-100 trước khi viết expected. Kiểm tra field scoped theo nước đích hay lịch sử, không suy diễn theo câu tự nhiên. Tham khảo [AI #162](https://github.com/truongtc/lisa-ai-agent/pull/162).
- **L6 — Sửa một chỗ, sót pattern:** Tìm toàn bộ alias, module, country/value và caller dùng cùng pattern; ghi rõ phạm vi đã rà soát vào report/PR. Tham khảo [AI #143](https://github.com/truongtc/lisa-ai-agent/pull/143).
- **L7 — Prompt mơ hồ/dài:** Mỗi câu một intent, có nhãn `Ví dụ:`, cắt context thừa; với metadata ưu tiên `COT_HINTS`/YAML, không sửa `COLUMN_PROMPTS` frozen. Tham khảo [AI #126](https://github.com/truongtc/lisa-ai-agent/pull/126), [#122](https://github.com/truongtc/lisa-ai-agent/pull/122), [#166](https://github.com/truongtc/lisa-ai-agent/pull/166), [#137](https://github.com/truongtc/lisa-ai-agent/pull/137).
- **L8 — Hygiene/convention kém:** Fixture phải có mã ticket; không bỏ code/comment/file trước khi hiểu lý do tồn tại; báo test phải có command, exit code và output/ảnh/evidence. Tham khảo [AI #142](https://github.com/truongtc/lisa-ai-agent/pull/142), [tool100 #18](https://github.com/truongtc/tool-100/pull/18), [#19](https://github.com/truongtc/tool-100/pull/19), [#22](https://github.com/truongtc/tool-100/pull/22), [#23](https://github.com/truongtc/tool-100/pull/23).
- **L9 — Input/vận hành không an toàn:** Kiểm tra wildcard injection, escaping, quyền migration, dependency/runtime và logging; với search dùng escape `%`, `_`, `\\` và `ESCAPE`, với migration superuser phải có runbook riêng. Tham khảo [BE #32](https://github.com/truongtc/lisa-visa-web-backend/pull/32).

### Review ở cấp project, không chỉ ở câu bug

Khi đọc comment của reviewer/tech lead hoặc review một PR metadata, phải nâng phạm vi từ reproduction lên contract của cả field/project:

- Đọc schema/allowed values của field và lập coverage matrix; mỗi giá trị hợp lệ cần ít nhất một `happy` case, không chỉ test giá trị xuất hiện trong bug.
- Với mỗi rule loại trừ/`absent`, bắt buộc có `present-mirror` chứng minh tín hiệu hợp lệ gần nhất vẫn được giữ lại.
- Edge “có tín hiệu tài chính + nghề nghiệp” phải dùng một nghề hợp lệ khác với giá trị model đang tự suy diễn; case chỉ lặp lại giá trị sai không chứng minh được ranh giới.
- Tách test contract hành vi khỏi change-detector test. Test assert nguyên văn prompt chỉ kiểm tra wording, không chứng minh model/flow đúng.
- Rà các field, alias, enum value, caller và flow dùng chung; ghi rõ phạm vi đã kiểm tra và phần không bị ảnh hưởng. Không kết luận “chỉ ảnh hưởng bug này” nếu chưa có ma trận coverage/evidence.
- Với case mixed past/current, `contains` một nước đúng là chưa đủ: phải assert exact-set/`allowed_subset` hoặc `not_contains` toàn bộ nước quá khứ.
- Khi thay prompt mapping, lập danh sách alias trước/sau và kiểm tra alias cũ không bị rơi (ví dụ `TBN/Tây Ban Nha → Spain`).
- Bổ sung present-mirror cùng giá trị: quá khứ `Japan` rồi hiện tại lại muốn `Japan` phải giữ M0001=Japan và O5001=Japan.
- Phân loại `llm_error`/401/skip là `BLOCKED`, không phải pass hoặc fail logic.
- Đối chiếu số case/regression trong PR description với HEAD và registry test thực tế.

## Quy trình review trước khi chốt root cause

Khi trace để review task/PR của người khác, phải làm theo thứ tự này trước khi đề xuất sửa:

1. Đọc lại mô tả task/bug và xác nhận nghiệp vụ cần đạt; phần chưa rõ phải ghi thành câu hỏi.
2. Tái hiện lỗi trên base code chưa sửa, dùng đúng input và ghi lại output/log.
3. Tự phân tích nguyên nhân và hướng xử lý trước khi xem diff PR, để phát hiện khác biệt trong cách hiểu.
4. Đọc PR theo thứ tự **Flow → Prompt → Metadata LLM → Metadata tool**, kiểm tra code có giải quyết đúng bản chất không.
5. Rà edge case, exception, caller/callee và các luồng tương tự để tìm ảnh hưởng ngang hoặc pattern bị bỏ sót.
6. Đánh giá giải pháp: độ đơn giản, khả năng maintain, reuse, regression, security, performance và logging.
7. Kiểm tra test có cover bug case, happy case, absent/present-mirror, biến thể và regression hay chỉ làm test xanh giả.
8. Chỉ sau các bước trên mới chạy trace chi tiết tool → LLM → merge → docs để định vị tầng lỗi chính.

## Phân tích triển khai ngang và ảnh hưởng toàn cục

Không được kết luận một fix chỉ ảnh hưởng câu bug gốc. Sau khi xác định tầng lỗi, phải lập blast-radius report:

### 1. Xác định phạm vi code bị tác động

- Liệt kê file, function/class, constant, prompt field, rule, extractor và matrix row bị thay đổi.
- Dùng `rg`/AST để tìm toàn bộ caller/callee, import, alias, country/value mapping và module dùng chung.
- Kiểm tra path runtime khác nhau: `field_by_field` vs Group, local vs staging, stream vs non-stream, comparison vs general flow.

### 2. Tìm các case tương tự đang tồn tại

- Tìm toàn bộ fixture/eval/test có cùng field, keyword, regex, metadata ID, pair hoặc prompt hint.
- Tìm các market/country/value khác dùng chung rule; không chỉ kiểm tra market trong bug report.
- Với mỗi case, ghi trạng thái trước sửa: `pass`, `fail`, `xfail`, `unknown` và lý do case liên quan.

### 3. So sánh hành vi trước và sau

Chạy baseline trên code chưa sửa và after trên code mới bằng cùng input/corpus. So sánh theo business value/metadata, không chỉ text:

| Case | Baseline | After | Expected | Verdict |
|---|---|---|---|---|
| bug reproduction | ... | ... | ... | fixed/regressed |
| case đúng cũ | ... | ... | ... | preserved/regressed |
| present-mirror/negative | ... | ... | ... | preserved/regressed |
| market/value tương tự | ... | ... | ... | preserved/regressed |

Với tool-100 dùng audit diff nếu có; với agent dùng eval metadata/graph test và output metadata sau merge. Nếu không chạy được baseline, ghi `BASELINE UNAVAILABLE`, không gọi là không ảnh hưởng.

### 4. Chốt triển khai ngang

Bắt buộc ghi một trong hai kết luận:

- **Có:** nêu rõ các flow/field/market/case tương tự cần áp dụng hoặc đã kiểm tra, cùng nguy cơ regression.
- **Không:** nêu bằng chứng vì sao logic được scope hẹp và không dùng chung với nơi khác.

Nếu phát hiện case đúng có thể bị sai, không tự mở rộng guard/allowlist để chữa nhanh; dừng lại, ghi case đó vào report và đề xuất hướng xử lý riêng.

### 5. Ngưỡng kết luận

Chỉ được kết luận “không ảnh hưởng toàn cục” khi đã có:

- danh sách caller/pattern đã rà soát;
- danh sách fixture/case tương tự;
- kết quả baseline vs after;
- các nhánh runtime/market đã loại trừ;
- evidence cho các case đúng quan trọng vẫn giữ nguyên.

Khi được yêu cầu **review**, không tự sửa code, commit hoặc push. Chỉ chuyển sang skill `fix-bug` khi người dùng yêu cầu sửa.

## Quy trình bắt buộc

### 1. Khóa reproduction

Ghi lại:

```text
Input: "..."
Environment: staging/local
Execution surface: direct extractor | tool CLI | agent E2E | staging UI
Base/head/staging SHA: ...
Timestamp: ...
Market: ...
Chat/request/trace id: ...
Expected: ...
Actual: ...
```

Lấy log của đúng request, không lấy một request gần giống. Nếu staging không trả trace id, bật/capture request id hoặc dùng log window theo timestamp.

### 2. Trace tool-100 trước

Trong repo `tool-100`, chạy extractor trực tiếp với đúng input hoặc audit command theo README. Ghi đủ:

| Field | Value |
|---|---|
| metadata id | `M...` / `O...` |
| raw value | giá trị tool trả về |
| found | `true/false` |
| rule/extractor | rule, group, alias hoặc file bắt được |
| source span | cụm từ/offset nếu tool có trả |

Đối chiếu thêm log staging của tool. Nếu direct tool và staging khác nhau, ưu tiên điều tra version/config/deployment trước khi sửa agent.

Chạy thêm public CLI khi PR thay đổi contract CLI/pipeline. Nếu direct extractor, CLI và agent end-to-end cho kết quả khác nhau, báo riêng từng output và trace cơ chế rescue/merge; không chọn một output để phủ định các output còn lại.

### 3. Trace metadata LLM

Trong `lisa-ai-agent`, xác định runtime path trước:

- Production metadata thường chạy `field_by_field` qua `metadata_field_by_field.py`.
- Prompt field nằm ở `metadata_local_7b.py`: `COLUMN_PROMPTS` và `COT_HINTS`.
- Không dùng output của Group mode để kết luận FBF.

Ghi lại:

```text
llm_mode: field_by_field | group
field requested: O...
prompt source: file + symbol
conversation sent: user/assistant turns thực tế
raw model output: nguyên văn
parse/normalize result: ...
```

Nếu model timeout/tràn token/connection error, không gọi đó là metadata `null`; đó là `llm_error`.

### 4. Trace merge và graph branch

Theo dõi tại `MetadataExtractionNode` và các node tiếp theo:

```text
tool_metadata + llm_metadata
        -> precedence / conflict resolution
        -> merged_metadata
        -> state.full_metadata / state.merged_metadata
        -> intent/topic/mandatory/comparison/suggestion node
```

Ghi riêng mỗi field bị tranh chấp: `tool value`, `LLM value`, `winner`, `reason`. Kiểm tra caller/callee để biết node nào đọc `full_metadata` và node nào đọc delta `merged_metadata`.

### 5. Trace docs từ pair đến dòng

Từ `final_metadata`, trace theo thứ tự:

1. `country_code/market` thực tế được dùng.
2. Matrix file và các row/candidate pair.
3. Pair bị chọn: `pair_id` và lý do chọn.
4. Pair bị missing: path tuyệt đối và `exists`.
5. File thực sự loaded: path, byte/char count, loader log.
6. File bị loại sau load: lý do filter/deduplicate/limit.
7. Đoạn được đưa vào prompt: section/header và line number.
8. Fallback: có gọi web search/market research không, warning log nào, kết quả có được merge không.

Chuẩn path local thường là:

```text
storage/private/market_data/{MARKET}/{PAIR_ID}/{PAIR_ID}.md
```

Không được trả lời “docs có tồn tại” thay cho “docs đã được load”. Hai kết quả phải có bằng chứng riêng.

### 6. Chốt root cause

Chọn đúng một tầng chính, các tầng còn lại ghi là đã kiểm tra:

- `tool-100 extraction`
- `metadata LLM/prompt`
- `merge/precedence/normalization`
- `graph routing`
- `matrix/pair selection`
- `document loading/filtering`
- `prompt assembly/response`
- `staging version/config`

Root cause phải có dạng: “Ở input X, tầng Y tạo output Z; tầng kế tiếp dùng Z để chọn pair/doc W; vì vậy response sai Q.”

## Output comment PR

Khi user yêu cầu review PR hoặc viết comment, sau khi trace xong phải tạo comment ngắn theo format sau; không chỉ trả một report root cause dài:

```markdown
### [P1/P2/P3] <mô tả lỗi trong một câu>
- File: `<path>`
- Dòng: `<line>`
- Lỗi: <hành vi sai + evidence/repro ngắn>
- Đề xuất: <cách sửa hoặc test cần bổ sung>
```

Quy tắc:

- Mỗi comment phải chỉ rõ file và dòng code PR; không ghi chung chung như “prompt chưa đủ” hoặc “cần fix edge case”.
- Chỉ comment khi có evidence từ diff, reproduction, test hoặc trace; nếu chưa đủ evidence ghi `UNKNOWN/BLOCKED` và không khuyến nghị fix cụ thể.
- Một comment chỉ nên nêu một lỗi; tách riêng tool, prompt, merge, docs và test gap.
- Ưu tiên comment ngắn (1–4 dòng nội dung), có command/output quan trọng nhất; chi tiết trace để trong report.
- Nếu không có lỗi actionable trong PR, ghi `LGTM` và nêu test/evidence đã kiểm tra; không tạo comment suy đoán.

### Guard duration của tool-100

Khi trace M0003, phải phân biệt ý định lưu trú với thời gian xử lý/xét duyệt. `tự túc` đơn lẻ không đủ làm anchor duration. Repro tối thiểu:

| Case | Expected |
|---|---|
| `Visa tự túc thời gian xử lý 2 tháng à?` | không M0003 |
| `Xin visa tự túc chờ xét duyệt 3 tháng có lâu không?` | không M0003 |
| `Anh xin visa tự túc chi phí 2 tháng bao nhiêu?` | không M0003 |
| `Dự định làm visa tự túc ở khoảng 2 tháng` | M0003 |
| `Cụ thể là đi Bỉ 45 ngày.` (lượt 2) | M0001 + M0003 khi đã có context visa |

Nếu PR dùng regex/guard chung chung, comment phải chỉ rõ file + dòng bị match rộng, câu negative bị bắt nhầm, câu positive bị bỏ sót và fixture cần bổ sung.

### Không suy diễn mã visa từ mục đích chung

Khi response tự gán mã visa (ví dụ `thăm bạn` → `S2`), phải kiểm tra theo thứ tự:

1. **Tool-100:** xác nhận output M0001/M0002/M0003/M0004. Nếu không có M0004 thì không gán lỗi cho extractor visa type.
2. **Pair/docs:** ghi pair đã load, file Markdown và dòng chứa mã visa. Kiểm tra section đó có điều kiện áp dụng hay không.
3. **Response/prompt:** nếu input thiếu điều kiện (ví dụ không biết người bạn là công dân HK hay người nước ngoài cư trú HK), phải hỏi bổ sung hoặc trả lời có điều kiện; không khẳng định mã visa.

Comment phải chỉ đúng chỗ sửa:

- Sai extractor: comment `tool-100/src/.../rules.py:<line>` và nêu output metadata sai.
- Sai knowledge: comment `storage/private/market_data/<MARKET>/<PAIR>/<PAIR>.md:<line>` và nêu section thiếu/rõ điều kiện.
- Sai prompt/response grounding: comment file prompt/response builder cụ thể; yêu cầu không suy diễn khi thiếu input.
- Chưa có trace id hoặc raw model output: ghi `UNKNOWN/BLOCKED`, không đoán file cần sửa.

### Chọn repo và vị trí lỗi trước khi comment

Luôn ghi `Repo` và `Category` trước root cause. Dùng bảng sau để không comment nhầm repo:

| Bằng chứng | Repo cần sửa | Category | Vị trí cần ghi |
|---|---|---|---|
| Tool trả sai/thiếu M0001–M0005/O... | `tool-100` | Metadata Tool | `src/tool100/extractors/<field>/rules.py:<line>` hoặc `data/<...>` |
| Tool metadata đúng nhưng merge/precedence đổi sai | `lisa-ai-agent` | Flow / Metadata | node merge/precedence file + dòng |
| Model tự chọn field/mã không có trong tool | `lisa-ai-agent` | Metadata LLM / Prompt | `metadata_local_7b.py`/`COT_HINTS`/prompt file + dòng |
| Pair đúng nhưng file chứa quy tắc mâu thuẫn/thiếu điều kiện | `lisa-ai-agent` | Docs | `storage/private/market_data/<MARKET>/<PAIR>/<PAIR>.md:<line>` |
| Docs đúng nhưng model khẳng định khi thiếu điều kiện | `lisa-ai-agent` | Prompt / Response | prompt template, response builder hoặc node assemble + dòng |

Mỗi comment PR phải có đủ: `Repo`, `Category`, `File:Line`, `Evidence`, `Hướng sửa`. Nếu chưa phân biệt được hai repo, ghi `UNKNOWN/BLOCKED` thay vì đoán.

Khi nghi ngờ **thiếu docs**, phải so sánh cùng pair giữa market bị lỗi và market tương tự: kiểm tra `exists`, section tương ứng và nội dung điều kiện. Nếu market khác có rule explicit (ví dụ “thăm bạn không thuộc thăm thân”) nhưng market bị lỗi không có, ưu tiên finding `Docs` trước khi thêm prompt guard.

## Báo cáo bắt buộc

```markdown
## Trace summary
- Input:
- Environment/commit:
- Trace/request id:
- Expected / Actual:

## Metadata pipeline
| Stage | Result | Evidence |
|---|---|---|
| tool-100 | ... | rule/log/direct run |
| metadata LLM | ... | model output + prompt source |
| merged metadata | ... | precedence/normalization |
| final metadata | ... | state/node log |

## Docs pipeline
- Market thực tế:
- Matrix/candidate pairs:
- Missing pairs:
- Loaded docs:
- Docs đưa vào prompt:
- Dòng/section liên quan:
- Fallback và warning:

## Root cause
- Tầng lỗi chính:
- Vì sao:
- Tầng đã loại trừ:

## Hướng xử lý
- Nếu tool sai: sửa tool-100 trước.
- Nếu metadata LLM sai: sửa `COT_HINTS`, giữ `COLUMN_PROMPTS` nếu không có yêu cầu khác.
- Nếu merge/flow sai: sửa graph/precedence.
- Nếu pair/docs sai: sửa matrix/loader hoặc bổ sung docs đúng pair.
- Nếu thiếu local docs: cân nhắc research fallback và bắt buộc ghi warning.
```

## Không được báo “đã tìm ra root cause” khi

- Chỉ có screenshot câu trả lời nhưng chưa có trace/log.
- Chưa tách output tool-100 khỏi output LLM.
- Chưa ghi winner sau merge.
- Chỉ kiểm tra file `.md` tồn tại mà chưa chứng minh file được load.
- Không biết staging đang chạy commit/config nào.
