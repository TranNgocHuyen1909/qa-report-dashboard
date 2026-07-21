---
name: code-review
description: >-
  Checklist và hướng dẫn review code, git commit, branch naming, quy trình sửa lỗi
  (bug fix), và các quy tắc đặc thù trong dự án Lisa AI Agent. Tự động kích hoạt trước khi
  review code, commit, hoặc tạo PR.
---

# Quy chuẩn Code Review & Phát triển Bug Fix

Skill này đúc kết toàn bộ bài học, chỉ thị từ Team Lead (anh Trường TC) để tự động hóa khâu review code, quản lý Git, thiết kế Prompt và tối ưu lồng ghép nghiệp vụ.

## 🎯 Triết lý Thiết kế Cốt lõi của LISA

- **Mục tiêu cao nhất:** Tư vấn **CHÍNH XÁC**, hạn chế tối đa hallucination (AI bịa thông tin).
- **Nguyên tắc cốt lõi:** **Cái gì code xử lý được thì để code xử lý**.
  - Ưu tiên đưa logic nghiệp vụ vào **tool-100** (regex, rule) hoặc **DeterministicLayer** (backend `lisa-agent`) trước khi giao cho LLM.
  - LLM chỉ dùng khi thật sự cần (hiểu ngữ cảnh, suy luận thông tin ẩn, sinh câu trả lời tự nhiên).
  - Sửa đổi prompt metadata: **CHỈ sửa `COT_HINTS`**, **KHÔNG đụng `COLUMN_PROMPTS`**.

---

## Quy trình review task/PR

### Quy tắc scope extractor duration (tool-100)

- Không dùng `tự túc` đơn lẻ làm tín hiệu cho M0003; cụm này có thể chỉ nói về nguồn chi phí.
- Duration chỉ match khi có pattern thể hiện ý định lưu trú, ví dụ `muốn/dự định ... xin/làm visa tự túc ... (khoảng|tầm) <số> (ngày|tuần|tháng)`.
- Phải có negative fixtures cho câu hỏi về `thời gian xử lý/xét duyệt`, `bao lâu`, `mấy tháng`, `có lâu không`, và câu hỏi đuôi `à/đúng không`.
- Phải có positive fixture cho `Dự định làm visa tự túc ở khoảng 2 tháng` và case hội thoại lượt 2 `Cụ thể là đi Bỉ 45 ngày.`; không chỉ test câu đủ từ khóa ở một lượt.

### Review lỗi tự gán mã visa

- Phân biệt `M0004` do tool trả về và mã visa do model sinh trong response. Không có `M0004` thì không comment sửa extractor visa type.
- Nếu input chỉ nói mục đích chung như `thăm bạn`, không approve logic gán thẳng mã `S2/Q2` khi chưa có điều kiện về người mời/người được thăm.
- Finding phải ghi đúng file cần sửa: extractor `src/tool100/...`, knowledge `storage/private/market_data/...md`, hoặc prompt/response builder cụ thể. Không ghi chung chung "model hallucinate".
- Comment mẫu: `Tool output không có M0004; pair <PAIR> load <file>:<line> chứa mã visa có điều kiện. Input chưa đủ điều kiện nhưng response khẳng định mã; cần hỏi bổ sung/ground theo điều kiện tài liệu.`

### Bảng chọn repo/category cho finding

- `tool-100` / `Metadata Tool`: chỉ dùng khi output extractor sai hoặc thiếu field; ghi `src/tool100/extractors/<field>/rules.py:<line>` hoặc file data/fixture tương ứng.
- `lisa-ai-agent` / `Flow` hoặc `Metadata`: dùng khi merge, precedence, routing hoặc field sau merge sai; ghi node/function + dòng.
- `lisa-ai-agent` / `Metadata LLM` hoặc `Prompt`: dùng khi model tự sinh field/mã không có trong tool hoặc không tuân thủ điều kiện; ghi prompt/COT/response builder + dòng.
- `lisa-ai-agent` / `Docs`: dùng khi knowledge sai/mâu thuẫn/thiếu điều kiện; ghi `storage/private/market_data/<MARKET>/<PAIR>/<PAIR>.md:<line>`.
- Không được comment tool-100 cho lỗi chỉ xuất hiện sau khi docs/prompt được load.
- Khi nghi ngờ thiếu docs, phải so sánh pair cùng field giữa market lỗi và market tương tự; nếu market tương tự có rule explicit mà market lỗi không có, comment `Docs` trước, không vội comment `Prompt`.

Review không chỉ là kiểm tra code có chạy hay không. Phải xác nhận người sửa hiểu đúng yêu cầu, sửa đúng bản chất và không làm hỏng luồng khác.

1. Đọc task/bug để chốt expected behavior, phạm vi và định nghĩa nghiệp vụ.
2. Tái hiện trên code chưa sửa nếu có thể; ghi output baseline.
3. Tự phân tích root cause và hướng xử lý trước khi đọc diff PR.
4. Đọc diff theo thứ tự ưu tiên: **Flow → Prompt → Metadata LLM → Metadata tool**.
5. Trace caller/callee, call site, branch, docs/prompt loading và pattern tương tự; đặc biệt khi thêm parameter hoặc guard.
6. Kiểm tra edge case, regression, test coverage, security, performance và logging khi liên quan.
7. Kết luận finding theo severity, file/line và scenario tái hiện được; nếu không có finding thì nói rõ không có.

### Đầu ra review

- Mỗi lần review tạo **đúng một file Markdown mới** trong `knowledge/important/ho/YYYY-MM-DD/`; không ghi nối hoặc ghi đè file cũ. Đặt tên `review_<repo>_pr<number>_<ticket-or-topic>_<HHmm>.md`.
- Viết file để user dán comment trực tiếp lên PR, theo đúng mẫu ngắn sau:

  ```markdown
  # Comment PR <repo> #<number>

  ## Comment 1 — `<repo-relative-path>:<new-side-line>`

  > <Nội dung copy-paste: lỗi, repro hoặc bằng chứng chính, expected và hướng sửa; tối đa 3 câu.>

  ## General review summary

  > Approve | Request changes: <một câu kết luận>.
  ```

- Mỗi finding là một `Comment N`; neo đúng dòng diff mới. Không thêm mục phân tích riêng, bảng tổng kết, điểm tốt, checklist, code snippet dài hoặc log test.
- Chỉ ghi finding đã được xác minh. Giữ chi tiết điều tra ở nội bộ; trong comment chỉ giữ bằng chứng đủ để tác giả hiểu và sửa.
- Nếu không có finding, file chỉ cần `General review summary` với `Approve` và một câu kết luận.
- Tin nhắn trả user tối đa 2 câu: kết luận ngắn và link file.

### Chuẩn bằng chứng trước khi báo finding

- Khóa `base SHA`, `head SHA` và execution surface đang kiểm tra: `direct extractor`, CLI public, agent end-to-end hay staging UI. Không dùng output của surface này để khẳng định surface khác sai.
- Nếu local branch, remote PR head và staging khác commit, chạy lại trên đúng head bằng detached worktree; ghi rõ version mismatch thay vì tranh luận từ hai output khác phiên bản.
- Phân biệt lỗi contract của một tầng với lỗi user-facing: tool có thể sai nhưng metadata LLM rescue được ở end-to-end. Ghi đúng phạm vi finding, không gọi là blocker của toàn flow nếu chưa chứng minh final metadata/response sai.
- Mỗi finding phải có: file + dòng diff, input/command tái hiện, baseline/head và expected/actual. Giữ bằng chứng đầy đủ khi phân tích nhưng chỉ ghi phần tối thiểu giúp hiểu và sửa lỗi. Không báo nhận xét chung kiểu “guard rộng” hoặc “prompt khó hiểu” mà thiếu vị trí và bằng chứng.
- Mỗi finding phải chỉ rõ **vị trí đăng comment** theo đúng một trong hai loại:
  - `Inline comment — <repo-relative-path>:<new-side-line>`: dùng khi finding quy về một đoạn code cụ thể. Chọn dòng được thêm/sửa ở phía phải của diff và gần nguyên nhân nhất; nếu lỗi trải nhiều dòng, neo vào dòng sở hữu logic rồi ghi các dòng liên quan trong nội dung. Không chỉ đưa file link hoặc line range mơ hồ.
  - `General comment`: chỉ dùng cho vấn đề cấp PR không có dòng neo hợp lý, như thiếu evidence/audit, PR description sai hoặc quyết định kiến trúc trải nhiều file. Phải giải thích vì sao không comment inline.
- Luôn viết nội dung comment copy-paste theo mẫu đầu ra; không tự đăng comment lên GitHub nếu user chưa yêu cầu.
- Testcase so sánh phải có cùng tiền điều kiện nghiệp vụ. Ví dụ flow cần `M0001_M0003` thì case chưa có quốc gia không chứng minh được hành vi của case đã có quốc gia.
- Testcase dùng làm finding phải là câu người dùng có khả năng nhập trong luồng xin visa, tư vấn hồ sơ, tài chính, lịch hẹn hoặc giấy tờ thực tế. Giữ đủ chủ thể, mục đích và ngữ cảnh để expected có thể suy ra từ contract metadata; không lấy một câu bất kỳ chỉ vì nó va vào substring/regex.
- Trước khi báo false positive của regex/keyword, viết lại reproduction thành câu chat tự nhiên trong nghiệp vụ visa rồi chạy lại trên public extractor hoặc end-to-end. Nếu lỗi chỉ tồn tại với chuỗi nhân tạo, câu ngoài miền visa, token lặp hoặc cách ghép từ để ép matcher, không dùng nó làm blocker correctness; hạ thành ghi chú robustness khi có tác động vận hành đã chứng minh, hoặc loại finding.
- Phân biệt rõ `kiểm tra implementation` với `kiểm tra nghiệp vụ`: có thể dùng chuỗi tối giản để hiểu vì sao regex match, nhưng comment PR phải dùng reproduction nghiệp vụ thực tế. Ví dụ không dùng `Đại sứ quán bảo vệ quyền lợi công dân` làm blocker O9002; ưu tiên case như `Mình đang làm ở Bộ Ngoại giao, muốn xin visa Anh du lịch thì cần giấy tờ gì?` để chứng minh tên cơ quan bị hiểu nhầm thành nguồn tham khảo.

Khi user yêu cầu **review**, không tự sửa code, commit hoặc push. Chỉ chuyển sang `fix-bug` khi user yêu cầu fix sau review.

## 📌 Hướng dẫn tham khảo sâu (References)

Xem chi tiết các quy trình mẫu và checklist chuyên biệt trong thư mục `references/`:
- **[pr-review-template.md](references/pr-review-template.md)** - Mẫu PR review chung và bảng tra cứu nhanh commit SHA.
- **[tool100-checklist.md](references/tool100-checklist.md)** - Checklist review chi tiết cho repo `tool-100` (regex, guards, rescue rules, fixtures).
- **[agent-checklist.md](references/agent-checklist.md)** - Checklist review chi tiết cho repo `lisa-ai-agent` (CoT hints, xưng hô, change-detector prompt test).
- **[web-backend-checklist.md](references/web-backend-checklist.md)** - Checklist review chi tiết cho repo `lisa-visa-web-backend` (SQL wildcards, Alembic migrations, unit tests).
- **[pr-lessons.md](references/pr-lessons.md)** - Tổng hợp các lỗi hay gặp và bài học đúc kết từ các PR thực tế đã merge của Team Lead.

---

## 1. Quy tắc Git & Quản lý Branch

### Khởi tạo & Checkout
- **Checkout gốc:** Tất cả các branch sửa lỗi bắt buộc phải tạo từ `origin/staging` (hoặc base được yêu cầu). KHÔNG checkout từ các branch đang làm dở của người khác hoặc bản thân để tránh nhiễm commit chéo.
- **Quy tắc đặt tên branch:** 
  - Định dạng chuẩn: `feature/<task-id>-mo-ta-ngan` hoặc `fix/<bug-id>-mo-ta-ngan` (ví dụ: `fix/BUG-123-sai-metadata-o5001`).
  - Hoặc local cá nhân: `huyen/{JIRA-KEY}-{mô-tả-ngắn}` (Ví dụ: `huyen/BSVA-861-fix-travel-history`).

### Quy trình trước khi Push/Commit
- **Không tự tiện commit/push:** Chỉ commit hoặc push khi có yêu cầu rõ ràng từ người dùng ("commit đi", "push đi").
- **Kiểm tra trạng thái branch:** Trước khi thực hiện commit, bắt buộc chạy:
  ```bash
  git log --oneline origin/staging..HEAD
  git diff --name-status origin/staging..HEAD
  git status --short --branch
  ```
- **File bị cấm commit:** Các file cấu hình local phát triển (`.devcontainer/`, `pyproject.toml` liên kết local path, `uv.lock`, `.pnpm-store`) **TUYỆT ĐỐI KHÔNG** được add/commit lên remote để tránh gây lỗi build CI/CD.
- **Tránh Force Push:** Hạn chế tối đa force push (`-f`). Ưu tiên `pull --rebase` hoặc nếu bắt buộc phải đẩy đè lịch sử nhánh nháp, sử dụng `git push --force-with-lease` hoặc xóa nhánh remote cũ rồi push lại nhánh mới (nếu được người dùng cho phép).

### Định dạng Commit & PR
- **Commit message (Tiếng Việt):** `fix([JIRA-KEY]): <mô tả ngắn gọn lỗi đã sửa>` hoặc `fix(BUG-123): <mô tả>`
- **Quy trình Notion:** Khi chuyển trạng thái task sang **Review** hoặc **Resolved**, **BẮT BUỘC điền URL Pull Request** vào property **Pull Request** trên Notion.
- **PR Description Template:**
  ```markdown
  ## Tóm tắt
  [Mô tả ngắn gọn fix này làm gì, tại sao cần fix]

  ## Problem
  [Input gây lỗi + ví dụ output sai]

  ## Root Cause
  [Nguyên nhân gốc rễ — file, function, path runtime]

  ## Changes
  [Danh sách thay đổi cụ thể theo file]

  ## Expected Behavior
  [Output mong muốn sau fix, có ví dụ]

  ## Test
  [Lệnh test cụ thể + kết quả `X passed`]
  ```

---

## 2. Thiết kế Prompt & Tối ưu LLM (Đặc biệt cho 7B)

### Xác định đúng Path Runtime
- Đối với phân tách Metadata: Môi trường production luôn chạy theo cơ chế **`field_by_field`** (thông qua provider `anai-metadata`).
- File cấu hình thực tế nằm ở `metadata_local_7b.py` (`COLUMN_PROMPTS` + `COT_HINTS`). Sửa đổi ở `constants.py` hoặc các file group mode khác sẽ không có hiệu lực trên production.

### Kỹ thuật viết Prompt
- **Reasoning block cho 7B:** Model nhỏ 7B cần đặt các rule logic cốt lõi/quan trọng vào `COT_HINTS` (nằm trong `<thought>` block để model suy nghĩ trước khi output JSON). Tránh để dồn ở base prompt.
- **Tránh ký hiệu mơ hồ:** Không dùng dấu `/` trong mapping logic pronoun (ví dụ: cấm dùng `anh/chị`, `em/anh`). Thay thế bằng câu điều kiện tường minh: `Nếu khách xưng "anh" hoặc "chị" thì...`
- **Ví dụ Positive & Negative:** Mỗi prompt hint cần đi kèm ví dụ cụ thể để định hướng output.
- **Tránh trùng lặp từ khóa (Negative Collisions):** Không dùng các từ khóa/tên nước trùng với bộ test case tích cực trong các ví dụ phủ định (ví dụ: dùng các nước không test như `Trung Quốc`, `Đức` để làm ví dụ `Return null` thay vì dùng `Nhật`, `Hàn` vốn là các case cần trích xuất).
- **Viết cho model local nhỏ/tắt suy luận:** Không giả định model tự suy luận nhiều bước. Mỗi rule phải là mệnh lệnh ngắn, một intent, nêu rõ điều kiện và output (`null` nếu thiếu bằng chứng), kèm ví dụ `Input → Output` và một ví dụ phủ định gần giống.
- **Đẩy logic xác định về code:** Routing, mapping, allow/deny và điều kiện có thể kiểm tra tất định phải xử lý bằng code; prompt chỉ đảm nhiệm phần hiểu ngữ nghĩa. Không giải quyết overflow bằng cách tiếp tục nối thêm hướng dẫn vào prompt.
- **Không tuyệt đối hóa prompt:** Cùng một prompt có thể được model khác hiểu khác hoặc cùng model cho kết quả không ổn định. Review phải yêu cầu eval nhiều biến thể và regression, không approve chỉ vì một output đúng.
- **Prompt phải tường minh:** Tránh mô tả chung chung hoặc bắt model suy luận nhiều lượt. Ưu tiên dạng `Nếu A, B và C đều đúng thì D; nếu thiếu điều kiện thì null/không làm D`; logic xác định được bằng code thì không để prompt tự đoán.
- **Mỗi rule một intent:** Nếu một bullet bắt model nhận diện cấu trúc, tìm nguồn dữ liệu, map giá trị, chọn nhánh và sinh output thì tách thành `IF`/`AND`/`THEN`; để ví dụ ở dòng riêng.
- **XML chỉ đánh dấu nguồn/ranh giới dữ liệu:** Trỏ thẳng tới tag có thật như `<user_metadata>`. Không dùng tag nghiệp vụ như `<key>` làm trang trí hoặc ví dụ nếu source document không có tag đó; model có thể hiểu nhầm thành yêu cầu output.
- **Prompt PR phải có behavioral evidence:** Test YAML/cache chỉ chứng minh template hợp lệ. Yêu cầu eval/replay đúng input và precondition của bug, kèm output thể hiện hành vi mong muốn; không viết change-detector test assert nguyên văn prompt.
- **Review theo contract toàn field/project:** Không dừng ở câu reproduction. Đọc schema/allowed values, lập coverage matrix cho toàn bộ enum (mỗi giá trị cần happy case), và rà caller/flow/field dùng chung.
- **Absent phải có present-mirror:** Mỗi case loại trừ hoặc trả `null/absent` phải có case đối chứng với tín hiệu hợp lệ gần nhất; nếu không, prompt mới có thể over-correct.
- **Edge phải chứng minh ranh giới:** Với bug “tài chính bị suy diễn thành nghề”, case “tài chính + nghề thật” phải dùng nghề hợp lệ khác với giá trị suy diễn sai; lặp lại đúng giá trị sai không đủ chứng minh fix.
- **Không approve theo wording:** Test assert từ khóa trong prompt chỉ là change-detector; ưu tiên eval/integration chạy hành vi thật và ghi rõ những test chỉ report-only/không block.
- **Mixed case không dùng `contains` đơn độc:** Khi expected loại trừ một giá trị quá khứ nhưng giữ giá trị hiện tại, phải assert exact-set/`allowed_subset` hoặc `not_contains` giá trị bị loại.
- **Bảo toàn alias khi sửa mapping:** So sánh alias trước/sau diff và thêm eval cho alias cũ; không xóa mapping chỉ vì đang thêm guard lịch sử.
- **Present-mirror cùng giá trị:** Test cả “đã đi Japan, nay lại muốn đi Japan” để chứng minh guard phân biệt thời điểm chứ không denylist theo quốc gia.
- **Evidence phải có trạng thái thực:** 401, timeout, skip hoặc `llm_error` là `BLOCKED`, không được báo là pass/fail behavior.
- **PR description phải khớp HEAD:** Đếm lại case/regression từ module đã register, không tin số liệu cũ trong body.

---

## 3. Xử lý Stream & Tiền xử lý (Sanitize)

- **Sanitize Per-Chunk:** Kiểm tra xem bộ lọc sanitize có được áp dụng cho từng chunk stream hay không.
- **Regex Safe-cut:** Không dùng regex tham lam bắt các ký tự toán học hoặc định dạng dễ bị cắt đôi ở ranh giới các chunk (như `\rightarrow`, `->`).
- **Stream-Safe Buffer:** Duy trì bộ đệm khoảng 32 ký tự cuối trước khi emit để đảm bảo pattern không bị cắt ngang giữa 2 chunk.
- **Đồng bộ Regex:** Đảm bảo biểu thức chính quy (regex) lọc khoảng trắng giữa stream và non-stream là đồng nhất (ví dụ: dùng `[ ]*` thay vì `\s*` để tránh nuốt nhầm newline).
- **Flush cuối stream:** Luôn thực hiện flush bộ đệm khi kết thúc stream.

---

## 4. Quy tắc Viết Test & Assert

- **Assert cấu trúc, tránh assert chi tiết:** Khi viết test prompt, chỉ assert cấu trúc output (ví dụ: sự tồn tại của section header, format JSON) thay vì assert đoạn text chi tiết dễ thay đổi để tránh tình trạng test dễ vỡ (change-detector).
  - *Đúng:* `assert "## RESPONSE STYLE" in output`
  - *Sai:* `assert "Dựa trên thông tin anh/chị cung cấp" in output`
- **Dọn dẹp test cũ:** Khi xóa bỏ các hàm guard hoặc function nghiệp vụ cũ, bắt buộc phải xóa hoặc cập nhật các test case tương ứng để tránh rác linter.

## 4b. Checklist L1–L9 trước khi duyệt

- **L1 — Đúng tầng:** yêu cầu trace `tool-100 → rule/group → FBF/COT_HINTS → docs → response`; không duyệt prompt patch khi tool đã sai. Tham khảo AI #171, #154, #148, #165.
- **L2 — Xanh giả:** test phải fail khi logic sai; không chấp nhận assert business copy, hạ lowercase làm mất casing hoặc SQL mock thay integration behavior. Khi casing là nghiệp vụ, dùng `contains`/regex phù hợp; khi cần loại trừ giá trị, không dùng `contains` đơn độc. Tham khảo AI #150, #146, #160, #126, BE #32.
- **L3 — Đủ nhánh:** cần happy, absent/present-mirror và variant/edge case, không chỉ câu bug gốc.
- **L4 — Guard hẹp:** denylist phải có anchor/context; yêu cầu negative case và context hợp lệ để tránh xoá oan. Tham khảo AI #162, tool100 #17.
- **L5 — Đúng field:** đọc schema, `COLUMN_PROMPTS` và extractor trước khi xác nhận expected; kiểm tra field có scope theo nước đích, thời điểm hay lịch sử. Tham khảo AI #162.
- **L6 — Quét ngang:** rà soát alias/module/pattern tương tự và ghi phạm vi đã kiểm tra. Tham khảo AI #143.
- **L7 — Prompt gọn:** mỗi rule một intent, có nhãn `Ví dụ:`, cắt token thừa, không duplicate và không sửa `COLUMN_PROMPTS` frozen. Tham khảo AI #126, #122, #166, #137.
- **L8 — Hygiene:** fixture có ticket, không commit local/cache; phải hiểu vì sao code tồn tại trước khi xóa (Chesterton's fence); review phải có command, exit code và output/ảnh/evidence. Tham khảo AI #142, tool100 #18, #19, #22, #23.
- **L9 — Input/vận hành:** search phải escape wildcard và behavior phụ thuộc DB phải có integration test phù hợp. Tham khảo BE #32.

> Với metadata/prompt, evidence tối thiểu theo README là `lisa-ai-agent: task test + task code:check-strict + eval metadata`; với `tool-100` là `task ci`. Thiếu exit code/output hoặc chưa đạt 100% thì chưa đủ điều kiện approve.

---

## 5. Quy trình Kiểm thử Regression cho `tool-100`

Khi sửa đổi bất kỳ logic/rule nào trong `tool-100` (nằm ở `d:\TranNgocHuyen\lisa-visa-ai\tool-100`), bắt buộc phải tuân thủ quy trình kiểm tra regression trước và sau khi fix:

1. **Tạo Baseline (trước khi sửa code):**
   Chạy lệnh lưu lại kết quả phân tích cũ:
   ```bash
   uv run tool100 audit run -i <INPUT.xlsx> -o output/<TASK>_before.xlsx --rule-trace
   ```
2. **Sửa code & Chạy Unit Test:**
   Sửa logic và đảm bảo chạy pass:
   ```bash
   task test:unit
   ```
3. **Tạo kết quả sau khi sửa (After):**
   Chạy lệnh lưu kết quả phân tích mới:
   ```bash
   uv run tool100 audit run -i <INPUT.xlsx> -o output/<TASK>_after.xlsx --rule-trace
   ```
4. **So sánh Diff & Đánh giá Verdict:**
   So sánh kết quả trước/sau:
   ```bash
   uv run tool100 audit diff -b output/<TASK>_before.xlsx -a output/<TASK>_after.xlsx --rules
   ```
   - **Đạt yêu cầu:** Verdict là `IMPROVED` (tốt lên) hoặc `UNCHANGED` (không đổi).
   - **Không đạt yêu cầu:** Verdict là `REGRESSED` (xấu đi) hoặc `MIXED` (hỗn hợp) -> Bắt buộc phải tiếp tục tối ưu hoặc rollback, tuyệt đối KHÔNG được merge.
5. **Xuất báo cáo đính kèm PR:**
   Nếu kết quả tốt lên, xuất file báo cáo Markdown để đính kèm vào phần mô tả PR:
   ```bash
   uv run tool100 audit diff -b output/<TASK>_before.xlsx -a output/<TASK>_after.xlsx --rules --out output/<TASK>_diff.md
   ```
