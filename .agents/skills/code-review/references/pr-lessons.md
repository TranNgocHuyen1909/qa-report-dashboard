# Tổng hợp Lỗi & Bài Học từ các PR đã Merge

> Tổng hợp nhận xét của TL (truongtc/dratct) từ tất cả các PR đã merge.
> Dùng như checklist cá nhân **trước khi push** và **trước khi tạo PR**.

---

## Repo: `lisa-ai-agent`

### PR #126 — fix(metadata): chặn Lisa tự chốt C-3-1 cho flow thăm thân Hàn Quốc

**Merged:** 2026-07-02

#### ❌ Lỗi TL chỉ ra

**`metadata_local_7b.py`**
> *"Chỗ này nên tách làm 2 ý ra cho rõ ràng tránh llm hiểu nhầm: Do not infer or guess. In particular, never infer from travel purpose, visa code, number of entries, ..."*

**Bài học:**
- Tách negative instruction thành **2 phần riêng**:
  1. Rule chung: `Do not infer or guess.`
  2. Ví dụ cụ thể: `In particular, never infer from [danh sách]`
- Gom hết vào 1 câu dài → LLM khó phân tách ngữ nghĩa.

---

**`response_guides.yaml`**
> *"Chỗ này anh nghĩ có thể bỏ qua luôn, vì chỉnh sửa trong file task_1.yaml đã cover đầy đủ rồi. Prompt càng dài thì LLM càng phải xử lý nhiều token ở card, từ đó làm giảm hiệu suất phản hồi."*

**Bài học:**
- Trước khi thêm rule vào file prompt → kiểm tra file khác đã cover chưa.
- Prompt ngắn gọn > dài dòng. Chỉ giữ instruction thật sự cần cho output mong muốn.

---

**`test_metadata_extraction_rules.py`**
> *"Không cần code test lại constants này nha. Mấy cái test cũ chủ yếu viết do đợt migrate cấu trúc. Do đó mấy này em bỏ được nha."*

**Bài học:**
- Không viết test chỉ để assert hằng số/literal → **"change-detector test"** vô nghĩa.
- Test viết lúc migrate là tạm thời; sau khi ổn định phải xóa.

#### ✅ Commits TL sửa thêm khi merge PR #126

| Commit | Nội dung |
|---|---|
| `71405377` | Gỡ test kỳ vọng prompt diện visa sai — test assert prompt không còn nội dung sau khi chặn suy đoán |

---

### PR #128 — fix: [BSVA-711] cải thiện cách diễn đạt thông tin nơi ở

**Merged:** 2026-07-02

#### ✅ Commits TL sửa thêm khi merge PR #128

| Commit | Nội dung |
|---|---|
| `09e52958` | Bỏ assert nguyên văn nội dung prompt (change-detector test) — chỉ giữ assert section header |
| `26d53b63` | Rút gọn rule tóm tắt nơi ở; gộp rule tránh tự chốt metadata vào chung block; sửa typo mismatch |

**Giải thích của TL cho commit `09e52958`:**
> *"Các test này assert nguyên văn business copy lấy từ YAML/constants nên chỉ là 'change-detector test': copy chuỗi sang test rồi assert chuỗi bằng chính nó, không kiểm tra logic nào. Hễ ai tinh chỉnh câu chữ prompt là vỡ test dù hành vi không đổi → bảo trì tốn công mà không bắt được bug thật."*
>
> *"Nguyên tắc: test cho code build prompt CHỈ đảm bảo CẤU TRÚC — section có render, không rỗng, mảnh YAML được inject — KHÔNG assert nội dung."*

**Bài học:**
- ✅ `assert "## RESPONSE STYLE" in output` → đúng (assert cấu trúc)
- ❌ `assert "Dựa trên thông tin anh/chị cung cấp" in output` → sai (change-detector)

---

### PR #130 — fix: [BSVA-905/909/711/937/669] (Multi-bug)

**Merged:** 2026-07-02

#### ❌ Lỗi TL chỉ ra PR #130

**`service.py` — stream sanitizer**
> *"Hàm này chạy đúng khi nhận full text, nhưng ở service.py:538 và :826 nó đang được gọi trên từng chunk stream. Pattern nhiều ký tự (`\rightarrow`, `${\rightarrow}`, `->`) rất dễ bị cắt ngang 2 chunk → regex không match → không chuẩn hoá được ở luồng stream."*
>
> *"Hướng xử lý 2 lớp: (1) đổi từ per-chunk sang streaming-safe có buffer giữ ~32 ký tự cuối chưa emit; (2) + 1 dòng prompt bảo model xuất `→` trực tiếp thay vì LaTeX."*

**Bài học:**
- Khi sửa hàm sanitize: kiểm tra ngay có gọi trên từng chunk stream không.
- Regex per-chunk **KHÔNG** bắt pattern bị cắt ngang 2 chunk.

#### ✅ Commits TL sửa thêm khi merge PR #130

| Commit | Nội dung |
|---|---|
| `d6d9c581` | Viết lại mapping xưng hô bằng câu điều kiện; bỏ `/`; sửa lệch cặp "mình → mình-bạn" |
| `a04af927` | Chặn LLM gán quốc gia đến vào O5001 — fix đúng path `COT_HINTS` trong `metadata_local_7b.py` |
| `63981d3f` | Siết regex `_DOLLAR_MATH_RE` từ `\s*` về `[ ]*`; tạo `_sanitized_stream` wrapper |
| `7caec55a` | Xóa package `templates` chết sau migrate graph |
| `4b743f89` | Gỡ test guard O5001 đã bị loại bỏ |
| `b6b1cccd` | Đổi test sang assert section header thay vì substring |
| `5016cc62` | Gỡ test change-detector rule M0004 |
| `e1176305` | Gỡ test change-detector prompt M0004 |
| `af56d0a5` | Thêm docs mô tả chế độ FBF extraction |

**Giải thích TL cho commit `a04af927` (quan trọng nhất):**
> Prod dùng provider `anai-metadata` + mode `auto` → **LUÔN chạy `field_by_field`**.
> - `group` mode đọc `extraction_rule` trong `constants.py`
> - `field_by_field` đọc `COLUMN_PROMPTS` + `COT_HINTS` trong `metadata_local_7b.py`
> - Fix ở `constants.py` = **đúng ý, sai path** → prod không bao giờ chạy
> - Fix đúng = thêm `COT_HINTS["Lịch sử du lịch"]` → nhét hint vào bước `<thought>` reasoning

---

## Repo: `tool-100`

### PR #8 — fix[BSVA-877]: Nhận diện O9001 dạng số

**Merged:** 2026-07

#### ✅ Commits TL sửa thêm khi merge PR #8

Không có commit nào của dratct — PR merge sạch ✅

---

### PR #9 — huyen/BSVA-877: M0001 Country Disambiguation

**Merged:** 2026-07

> dratct có **6 commit** thêm vào PR trước khi merge. Mỗi commit là 1 vấn đề dratct tìm thấy và sửa — tức là những lỗi **trong code của mình** hoặc những thứ **mình bỏ sót**.

#### ✅ Commits TL (dratct) thêm khi merge PR #9

| SHA | Tiêu đề |
|---|---|
| `fa81a144` | Merge branch main → resolve fixture conflicts bằng union |
| `e32226e9` | Merge remote-tracking (resolve conflict o9001 fixture) |
| `a5c54b1c` | fix(extractor): [BSVA-875] tránh nhầm "chi tiết/so sánh" thành danh xưng |
| `07f55105` | fix(extractor): [BSVA-830,BSVA-831] bắt hợp đồng tài sản O400101 |
| `1613781a` | fix(extractor): [BSVA-842] bắt quốc gia user hỏi qua chuyến bạn bè |
| `29f5bb07` | fix(extractor): [BSVA-842] chỉ rescue nước bạn-đi khi câu có nghi vấn |
| `26f2d584` | fix(extractor): [BSVA-831] chỉ bắt hợp đồng nhà đất sở hữu, không đếm trùng |
| `0bb84c2f` | refactor(extractor): tách _SELF_CONTACT_TITLE_RE O1001 + test guard BSVA-875 |
| `7f2d3d84` | refactor(claude): gỡ enabledPlugins khỏi settings |

---

#### ❌ Lỗi TL chỉ ra / Sửa thêm trong PR #9

**1. [BSVA-875] Regex nhận diện SĐT/Zalo gây false positive danh xưng**

> Commit `a5c54b1c` — dratct:
> *"Regex m_contact (o1001) nhận diện SĐT/Zalo tự xưng đọc 'So' trong 'so sánh' thành 'số' và 'chi' trong 'chi tiết' thành danh xưng 'Chị', khiến O1001=Chị và kéo theo O1004=Nữ (suy từ danh xưng) dù câu không hề nói về giới tính."*
>
> **Fix:** Thêm negative-lookahead loại "so sánh/so với/so đo" khỏi nhánh số và "chi tiết/chi phí/chi nhánh" khỏi nhánh danh xưng.

**Bài học:**
- Khi viết regex nhận diện danh xưng/số: **bắt buộc test với câu chứa từ đồng âm** ("so sánh", "chi tiết", "chi phí").
- Thiếu negative-lookahead → 1 regex có thể kéo theo false positive ở metadata hoàn toàn khác (O1001 → O1004).
- **Pattern:** Luôn liệt kê những từ cùng prefix có thể bị bắt nhầm rồi thêm guard.

---

**2. [BSVA-830, BSVA-831] Guard `_has_ambiguous_bare_so_do` chặn quá mức**

> Commit `07f55105` — dratct:
> *"_has_ambiguous_bare_so_do chặn TOÀN BỘ khi câu có 'sổ đỏ' trơ, nuốt luôn 'hợp đồng góp vốn' đã nêu rõ. 'không có sổ đỏ' là phủ định (user KHÔNG sở hữu) nên bỏ qua, không coi là khai tài sản mơ hồ."*

**Bài học:**
- Guard "ambiguous/bare" phải xét đến **phủ định**: `"không/chưa/kg/k có sổ đỏ"` = user **không** sở hữu → không coi là asset.
- Khi viết guard chặn mơ hồ: test thêm case **phủ định** + case **có context rõ ràng kèm theo**.
- Guard quá rộng (chặn TOÀN BỘ câu) nguy hiểm hơn guard thiếu.

---

**3. [BSVA-831] Pattern `real_estate_contract` bắt cả "hợp đồng thuê nhà" (nhầm asset)**

> Commit `26f2d584` — dratct:
> *"'hợp đồng thuê nhà' là bên ĐI THUÊ (không sở hữu) nên không phải tài sản; chỉ mua/bán/cho thuê/chuyển nhượng mới tính. Đồng bộ _REAL_ESTATE_CONTRACT_RE (dùng chống đếm trùng cert) với verb set mới để 'hợp đồng mua căn hộ' ra 1 giá trị contract thay vì cả contract lẫn sổ đỏ."*

**Bài học:**
- Khi mở rộng verb list trong pattern tài sản: phân biệt **người sở hữu vs. người đi thuê**.
  - ✅ Tính là tài sản: `mua / bán / cho thuê / chuyển nhượng`
  - ❌ Không tính là tài sản: `thuê` trơ (người đi thuê)
- Nếu có nhiều regex guard/counter dùng chung verb set → **phải đồng bộ tất cả** khi thay đổi.
- Thiếu đồng bộ → 1 case ra 2 giá trị (double-count) thay vì 1.

---

**4. [BSVA-842] PastTripFilter loại nhầm quốc gia bạn bè**

> Commit `1613781a` — dratct:
> *"PastTripFilter loại 'hàn' trong 'Bạn mình vừa đi Hàn về, bảo...' vì _PAST_BEFORE_RE match 'vừa đi' — coi là lịch sử đi quá khứ. Nhưng chủ ngữ chuyến đi là bạn bè (bên thứ ba) mà user kể lại để HỎI về visa nước đó, nên nước đó là đích tư vấn, không phải lịch sử của chính user để loại."*

**Bài học:**
- Filter "past trip" phải xét **chủ ngữ của chuyến đi**: user hay bên thứ ba (bạn bè/người thân)?
- Chỉ loại nước khi chủ ngữ là **user** ("em đã đi", "anh từng đi") — không loại khi chủ ngữ là bạn bè.
- Khi thêm temporal filter: **test thêm case bên-thứ-ba-kể** để tránh over-filter.

---

**5. [BSVA-842] Rescue friend-trip bắt cả câu tán gẫu (over-rescue)**

> Commit `29f5bb07` — dratct (fix ngay sau commit #4):
> *"Rescue friend-trip trước đây bắt cả câu kể tán gẫu ('bạn mình đi Hàn về khen đẹp'). Thêm _QUESTION_SIGNAL_RE: chỉ coi nước bạn-đi là đích tư vấn khi message thực sự đặt câu hỏi."*

**Bài học:**
- Rescue/exception rule cần **điều kiện anchor thêm** để tránh over-rescue.
- Khi thêm rescue: **phải test ngay case không muốn rescue** (tán gẫu, kể chuyện thuần túy).
- Pattern: `rescue = CONDITION_A AND CONDITION_B` (cả 2 phải đúng) — không chỉ CONDITION_A.
- Đây là ví dụ điển hình: Sửa → test → phát hiện over-rescue → sửa thêm guard trong **cùng PR**.

---

**6. [BSVA-875] Refactor: regex inline → hằng số module để test được**

> Commit `0bb84c2f` — dratct:
> *"Đưa regex m_contact (SĐT/Zalo tự xưng) inline thành hằng số module _SELF_CONTACT_TITLE_RE để test trực tiếp từng nhánh guard — behavior giữ nguyên."*
>
> *"Bổ sung unit test phủ hết: nhánh number-word (số/so/sđt/sdt/zl/zalo) + title (anh/chị/chi), guard 'so' và guard 'chi' gồm biến thể không dấu; kèm fixture end-to-end."*

**Bài học:**
- Regex phức tạp **KHÔNG nên để inline** trong hàm — khó test độc lập.
- Tách thành `_CONSTANT_RE` ở module level → có thể import trực tiếp vào unit test.
- Unit test cho regex phải cover: **mỗi nhánh** (OR), **biến thể không dấu**, **negative case** (từ bị guard).
- Format kiểm chứng chuẩn của dratct:
  1. Fixture end-to-end xanh
  2. Regex coverage (từng nhánh)
  3. Task CI pass
  4. Audit diff before/after không regression

---

**7. Merge conflict trong fixture YAML**

> Commit `fa81a144` — dratct:
> *"Resolve fixture conflicts bằng union (giữ cả case của nhánh lẫn main): o9001_entry_count_cases.yaml: thêm 2 regression case của main. m0004_visa_type_cases.yaml: giữ cả case tự-túc của nhánh và C23 của main. Chạy ruff format cho m0001/rules.py (fix lint gate)."*

**Bài học:**
- Khi merge main vào nhánh: resolve fixture YAML conflict = **union** (giữ tất cả case, không xóa case nào).
- Sau merge: chạy `ruff format` để đảm bảo lint gate pass.
- **Không** arbitrarily chọn 1 bên khi merge fixture — cả 2 set đều phải xanh.

---

## Repo: `lisa-visa-web-backend`

### PR #32 — fix: [BSVA-656] unaccent chat search

**Merged:** 2026-07-09

#### ❌ Lỗi TL chỉ ra PR #32

**`chat_history_service.py`**
> *"ILIKE ở đây nhận thẳng pattern chưa escape, nên ký tự % _ \ trong từ khoá người dùng sẽ bị hiểu là wildcard. Vd search '50%' sẽ khớp mọi thứ, hay 'a_b' khớp 'aXb'. Nên escape input trước khi ghép %...% và khai báo escape char."*

**`test_chat_history_service.py`**
> *"Test hiện tại chỉ kiểm tra chuỗi SQL sinh ra ở tầng Python - tức xác nhận SQLAlchemy build đúng cú pháp unaccent(col) ILIKE unaccent(pattern). Nó không gửi câu SQL đó xuống database, nên không kiểm chứng được kết quả thực tế của việc bỏ dấu. Hiện tại source chưa có Integration test setup sẵn cho db thật psql nên tạm thời bỏ qua test code nhé. Xóa file này đi vì không có ý nghĩa lắm."*

**Bài học:**
- **SQL Wildcard Injection:** Bắt buộc escape input (`%`, `_`, `\`) bằng ký tự escape (ví dụ `/`) trước khi truyền vào câu query `ILIKE` để tránh lỗi tìm kiếm wildcard không kiểm soát. Khai báo `escape` trong SQLAlchemy.
- **Unit test SQL:** Tránh viết unit test change-detector chỉ so sánh chuỗi SQL do SQLAlchemy build. Nếu chưa có setup integration test với DB thật, bỏ test đó thay vì viết mock vô nghĩa.
- **Alembic Migration:** Không tạo và tự chạy migration tạo database extension (`unaccent`) nếu không được setup và hỗ trợ sẵn từ cơ sở dữ liệu local/Docker.

---

## Checklist Cá Nhân — Rút ra từ tất cả PR

### 🔴 Lỗi hay bị nhất

| # | Lỗi | Cách phòng tránh |
|---|---|---|
| 1 | Test assert nguyên văn nội dung prompt | Chỉ assert section header, không assert business copy |
| 2 | Sửa `constants.py` khi prod dùng `field_by_field` | Xác định path runtime trước: group hay field_by_field? |
| 3 | Viết instruction prompt gom nhiều ý vào 1 câu | Tách câu đơn, rule chung trước, ví dụ cụ thể sau |
| 4 | Dùng dấu `/` trong mapping (`anh/chị`, `em/anh`) | Viết câu điều kiện: `Nếu khách xưng "anh" hoặc "chị"...` |
| 5 | Sanitize regex gọi per-chunk trong stream | Kiểm tra call site: cần buffer 32 ký tự cuối |
| 6 | Giữ test cũ sau khi xóa guard/flow | Khi xóa guard, xóa luôn test của guard đó |
| 7 | Duplicate rule ở nhiều file prompt | Kiểm tra file khác đã cover chưa trước khi thêm |
| 8 | Import nằm trong thân hàm | Import luôn ở top-level file |
| 9 | Regex nhận diện từ đồng âm gây false positive metadata khác | Thêm negative-lookahead cho prefix dễ nhầm ("so", "chi") |
| 10 | Guard `ambiguous` chặn cả trường hợp phủ định | Test thêm case "không có X" trong bộ test guard |
| 11 | Pattern asset include cả người đi thuê | Phân biệt rõ verb sở hữu vs. verb thuê trong regex |
| 12 | Temporal filter loại nhầm nước của bên thứ ba | Guard chỉ áp dụng khi chủ ngữ là user, không phải bạn bè |
| 13 | Rescue rule bắt cả câu tán gẫu (over-rescue) | Rescue phải có anchor thứ 2 (ví dụ: phải có dấu nghi vấn) |
| 14 | Để regex phức tạp inline trong hàm, không test được | Tách regex thành hằng số module `_CONSTANT_RE` để unit test |
| 15 | Resolve merge conflict fixture YAML bằng cách chọn 1 bên | Union tất cả case từ cả 2 nhánh, chạy ruff format sau merge |
| 16 | Nhận thẳng search input chưa escape vào ILIKE | Escape wildcard characters (`\`, `%`, `_`) và dùng `escape='/'` |
| 17 | Tự chạy unaccent migration hoặc viết unit test SQL giả | Bỏ file migration unaccent và unit test SQL mock builder |

### 🟡 Khi sửa metadata extraction

- Hỏi ngay: **Field này dùng group mode hay field_by_field?**
- Prod (`anai-metadata` provider) = **luôn `field_by_field`**
- Sửa `constants.py` (group) ≠ Sửa `metadata_local_7b.py` (field_by_field)
- Model 7B: đặt rule vào `COT_HINTS` (reasoning `<thought>`) hiệu quả hơn `COLUMN_PROMPTS`

### 🟡 Khi sửa stream/sanitize

- Kiểm tra hàm sanitize gọi ở đâu: per-chunk hay full-text?
- `[ ]*` (chỉ space) ≠ `\s*` (cả newline/tab) — phải đồng bộ giữa non-stream và stream
- Luôn có flush cuối stream

### 🟡 Khi viết test

- ✅ Assert: section có render, output contract, key behavior
- ❌ KHÔNG assert: câu ví dụ, wording, business copy cụ thể
- ❌ KHÔNG assert: literal trong constants/YAML (change-detector)
- ❌ KHÔNG giữ test của guard/function đã bị xóa

### 🟡 Khi viết regex extractor (tool-100)

- Test với **từ đồng âm / prefix bị bắt nhầm** → thêm negative-lookahead nếu cần
- Guard "ambiguous" phải xét phủ định (`không/chưa/kg/k có X`) = không bắt
- Rescue/exception rule cần **điều kiện anchor thứ 2** (ví dụ: phải có dấu nghi vấn)
- Phân biệt chủ ngữ user vs. bên thứ ba trong temporal/past filter
- Regex phức tạp → tách `_CONSTANT_RE` ở module level để unit test từng nhánh
- Kiểm chứng chuẩn dratct: fixture xanh → regex coverage → CI pass → audit diff no regression

### 🟡 Khi merge fixture YAML

- Resolve conflict = **union** (giữ tất cả case, không chọn 1 bên)
- Sau merge: chạy `ruff format` để fix lint gate
- Không xóa regression case của nhánh main khi merge

### 🟡 Khi phát triển Web Backend

- **Bắt buộc escape wildcard** (`%`, `_`, `\`) trong đầu vào tìm kiếm trước khi ghép `%...%` làm pattern cho `ILIKE`. Khai báo escape character trong SQLAlchemy.
- **Tránh viết unit test cho SQL builder** nếu test đó chỉ mock SQL string build từ Python mà không gửi xuống DB PostgreSQL thật.
- **Không tự ý tạo migration enable extension** (như `unaccent`) mà chưa qua cấu hình thống nhất trên Database Docker/local.
