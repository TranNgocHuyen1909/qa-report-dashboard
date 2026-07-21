# 📋 REPO-SPECIFIC CODE REVIEW & QUALITY CHECKLISTS
*Bộ Checklist kiểm thử và Code Review phân loại theo 4 Repositories chính (Hệ sinh thái LISA)*

Tài liệu này đúc kết toàn bộ quy định kiểm thử, bài học thực tế, chỉ thị trực tiếp từ **Anh Trường (`truongtc`)** và lệnh chạy test bắt buộc cho từng repository.

---

## 🛠️ 1. REPO: `tool-100` (Trích Xuất Metadata: Extractor, Regex & Guards)
> **Repository:** `https://github.com/truongtc/tool-100`  
> **Phạm vi:** Các module trích xuất thông tin khách hàng (`src/tool100/extractors/`: Duration, Visa Type, Purpose, Financial, Travel History,...).

### ✅ Checklist Kiểm Tra (Chỉ thị Anh Trường)
- [ ] **1. Scope Matcher Duration (`M0003`):**
  - [ ] KHÔNG dùng từ khóa `tự túc` đơn lẻ làm tín hiệu trích xuất duration `M0003` (vì `tự túc` có thể chỉ về nguồn chi phí).
  - [ ] Pattern duration chỉ được match khi có intent lưu trú rõ ràng (ví dụ: *"dự định xin visa tự túc khoảng 45 ngày"*).
- [ ] **2. Phân Bộ Fixtures (Positive & Negative Fixtures):**
  - [ ] Bắt buộc có negative fixture cho các câu hỏi về thời gian xử lý: *"thời gian xét duyệt bao lâu"*, *"có lâu không"*, *"à / đúng không"*.
  - [ ] Bắt buộc có positive fixture đa lượt hội thoại (ví dụ: Lượt 1 *"Dự định làm visa tự túc"*, Lượt 2 *"Cụ thể là đi Bỉ 45 ngày"*).
- [ ] **3. Tránh Tự Gán Mã Visa (`M0004`):**
  - [ ] Phân biệt rõ `M0004` do tool trả về và mã visa do LLM tự sinh. Không có `M0004` thì KHÔNG sửa extractor visa.
  - [ ] Nếu input chỉ có mục đích chung (`thăm bạn`), KHÔNG approve logic gán thẳng mã visa có điều kiện khi chưa kiểm tra thông tin người mời.
- [ ] **4. Robustness Regex:**
  - [ ] Tránh regex tham lam (greedy) gây nuốt nhầm từ hoặc treo CPU (ReDoS).

### 🧪 Lệnh Chạy Test Bắt Buộc Trước Khi Commit
```bash
# 1. Chạy unit test riêng cho extractors
pytest tests/test_extractors.py -vv

# 2. Chạy fixture tests kiểm tra regression
pytest tests/test_fixtures.py -k "duration or visa_type"

# 3. Dry-run CLI trực tiếp với câu thoại nghiệp vụ
python -m tool100.cli extract --input "Dự định làm visa đi Bỉ 45 ngày tự túc"
```

---

## 🤖 2. REPO: `lisa-ai-agent` (Graph Nodes, Routing, Prompts & CoT)
> **Repository:** `https://github.com/truongtc/lisa-ai-agent`  
> **Phạm vi:** Graph nodes (`src/agent/nodes/`), Routing, `COT_HINTS`, Prompt Metadata (`metadata_local_7b.py`), Doc RAG Loader.

### ✅ Checklist Kiểm Tra (Chỉ thị Anh Trường)
- [ ] **1. Quy tắc Sửa Prompt 7B:**
  - [ ] **CHỈ sửa `COT_HINTS`** (nằm trong `<thought>` reasoning block), **KHÔNG sửa `COLUMN_PROMPTS`**.
  - [ ] Không dùng ký hiệu mơ hồ `anh/chị`, `em/anh` trong prompt. Dùng câu điều kiện tường minh: *"Nếu xưng anh/chị thì..."*.
- [ ] **2. Phân Loại Định Vị Finding Chi Tiết:**
  - [ ] Phân biệt rõ vị trí lỗi: `Metadata LLM` vs `Prompt` vs `Docs` vs `Metadata Tool`. Không ghi chung chung *"model hallucinate"*.
  - [ ] Nếu nghi ngờ thiếu kiến thức, phải đối chiếu file doc `storage/private/market_data/<MARKET>/<PAIR>.md` trước khi sửa prompt.
- [ ] **3. An Toàn Chuỗi Stream (Sanitize Stream):**
  - [ ] Regex sanitize chạy per-chunk stream không dùng pattern dễ bị cắt đôi ở ranh giới chunk (`\rightarrow`).
  - [ ] Duy trì bộ đệm (buffer) 32 ký tự trước khi emit để tránh rách pattern.
- [ ] **4. Thẩm Quyền Đóng Bug & Re-open:**
  - [ ] Chỉ Anh Trường mới có thẩm quyền `Close` bug. Bug bị Re-open bắt buộc giải trình Root Cause.

### 🧪 Lệnh Chạy Test Bắt Buộc Trước Khi Commit
```bash
# 1. Chạy test suite cho Prompts & CoT reasoning
pytest tests/test_prompts.py -vv

# 2. Chạy test routing node & deterministic layer
pytest tests/test_routing_nodes.py

# 3. Running chat flow evaluation script
python scripts/eval_chat_flow.py --market JAPAN --pair VIETNAM
```

---

## 🌐 3. REPO: `lisa-visa-web-backend` (REST API, Migration, Audit & Persistent Storage)
> **Repository:** `https://github.com/truongtc/lisa-visa-web-backend`  
> **Phạm vi:** Server API endpoints, Database models, Authentication, Cache storage, Cron Jobs.

### ✅ Checklist Kiểm Tra (Chỉ thị Anh Trường)
- [ ] **1. Tối Ưu Truy Vấn & Database:**
  - [ ] Tránh dùng `LIKE '%keyword%'` trên các bảng dữ liệu lớn gây full table scan.
  - [ ] Đảm bảo có Index cho các trường lọc thường xuyên (`periodKey`, `bugId`, `githubUsername`).
- [ ] **2. An Toàn Migration & Rollback:**
  - [ ] Mọi script migration (Alembic / SQL) bắt buộc có hàm `down()` / `rollback()` hoạt động bình thường.
- [ ] **3. Ghi vết Thao tác (Audit Log) & Save API:**
  - [ ] Endpoint `/api/conclusions` phải lưu bền vững cả ngày công Man-Days và ô giải trình cá nhân (`explanations`).
  - [ ] Lọc triệt để bug trùng lặp (`duplicate`) khỏi thống kê sản lượng thực tế.

### 🧪 Lệnh Chạy Test Bắt Buộc Trước Khi Commit
```bash
# 1. Chạy API integration test suite
npm test
# hoặc đối với server Python: pytest tests/api/

# 2. Kiểm tra kiêm tra DB Migration dry-run
npx alembic upgrade head --dry-run
```

---

## 🖥️ 4. REPO: `lisa-visa-web` (Frontend Dashboard, UI/UX & PR Template)
> **Repository:** `https://github.com/truongtc/lisa-visa-web`  
> **Phạm vi:** React 19 UI, Vite build, Tailwind/Vanilla CSS, Dashboard Visual Charts, PR Template Checklist.

### ✅ Checklist Kiểm Tra (Chỉ thị Anh Trường)
- [ ] **1. Chuẩn Hóa Tên Nhân Sự:**
  - [ ] Đã chuyển toàn bộ mã code (`HuyenTN`, `HoNX`, `HoangGV`, `HuyDH`) sang **Tên tiếng Việt đầy đủ** (*Nguyễn Xuân Hồ*, *Hoàng Giáp Việt*, *Huyền Trần Ngọc*, *Huy Dương Hoàng*).
- [ ] **2. Kiểm Thử UI/UX Responsive & Cross-Browser:**
  - [ ] Test hiển thị chuẩn trên Chrome, Firefox, Safari và giao diện Mobile Layout (không tràn khung x-scroll).
- [ ] **3. Zero Browser Console Errors:**
  - [ ] Mở F12 Debug Console kiểm tra 100% KHÔNG còn lỗi JavaScript Uncaught Exception hoặc Warning `missing key`.
- [ ] **4. Tích Hợp PR Template Checklist:**
  - [ ] Developer bắt buộc tick chọn 6 mục kiểm tra tự động trước khi gửi PR (Test metadata, UI/UX, JS Console, Retest local, Lỗi ảnh hưởng ngang, Review chéo testcase).

### 🧪 Lệnh Chạy Test Bắt Buộc Trước Khi Commit
```bash
# 1. Chạy typecheck và linter
npm run lint && npx tsc --noEmit

# 2. Kiểm tra production bundle build
npm run build

# 3. Khởi chạy môi trường test local
npm run dev
```
