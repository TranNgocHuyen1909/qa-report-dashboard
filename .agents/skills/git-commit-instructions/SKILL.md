---
name: git-commit-instructions
description: >-
  OVERRIDES all other git commit skills. Vietnamese conventional commits
  with emoji icons. Activate before any git commit, push, or PR.
---

# Hướng dẫn Viết Commit & Quy Tắc An Toàn Git (BẮT BUỘC)

> [!IMPORTANT]
> **Quy tắc an toàn Git bắt buộc áp dụng trước khi commit/push:**
> 1. **KHÔNG tự ý commit/push** khi chưa được người dùng yêu cầu rõ ràng bằng lời (ví dụ: "commit đi", "push đi").
> 2. **KHÔNG add/commit các file cấu hình local phát triển:** `.devcontainer/*` (ví dụ: các thay đổi sửa `/dev/null` thành `/null` trên Windows để chạy local), `pyproject.toml` (đặc biệt là các thay đổi liên kết local path như `editable = true` cho `tool-100` hoặc local paths), `uv.lock`, `.pnpm-store`. Trước khi commit, bắt buộc kiểm tra trạng thái lơ lửng (`git status`) và chỉ stage những thay đổi code nghiệp vụ thật sự cần thiết. Nếu có thay đổi ở các file này để chạy được local, hãy giữ lại ở local (unstage/restore) chứ không commit lên remote.
> 3. **TUYỆT ĐỐI CẤM commit secrets:** Không commit `.env`, token, credentials, API keys. Hãy kiểm tra kỹ `.gitignore` trước khi commit.
> 4. **TUYỆT ĐỐI CẤM force push** (`-f`, `--force`, `--force-with-lease`). Nếu lịch sử nhánh bị lệch hoặc phân rã (diverged): ưu tiên sử dụng `git pull --rebase` rồi push bình thường, hoặc xóa nhánh remote cũ trên GitHub trước rồi mới push nhánh mới (nếu được người dùng cho phép).
> 5. **CHỈ commit khi pass test và lint/type check 100%:** Chỉ được phép commit khi toàn bộ các kiểm thử (evaluation/test cases, unit tests) đã chạy vượt qua 100% VÀ các công cụ kiểm tra tĩnh (như `task code:check-strict` hoặc `task code:check` chứa Ruff linter/formatter & Mypy) không còn báo lỗi nào. Sửa prompt và code tới khi nào pass hết rồi mới được commit.
> 6. **KHÔNG rewrite commit đã đẩy:** Khi đã push commit lên remote thì TUYỆT ĐỐI không dùng `git commit --amend` hoặc `git reset` để thay đổi lịch sử commit của nhánh đó nữa.
> 7. **Định dạng đặt tên branch:** Checkout từ code gốc sạch mới nhất, đặt tên theo format `feature/<task-id>-mo-ta-ngan` / `fix/<bug-id>-mo-ta-ngan` (hoặc `huyen/{JIRA-KEY}-{mô-tả-ngắn}`).
> 8. **Quy trình Notion:** Khi chuyển trạng thái task sang Review/Resolved, **bắt buộc điền PR URL** vào property Pull Request trên Notion.
> 9. **Triết lý LISA:** "Cái gì code xử lý được thì để code xử lý". Chỉ dùng LLM khi thật sự cần. Sửa prompt metadata: **CHỈ sửa `COT_HINTS`**, **KHÔNG đụng `COLUMN_PROMPTS`**.

---

## Hướng dẫn Viết Commit Message

- Sử dụng tiếng Việt để viết commit message.
- Sử dụng định dạng commit message theo chuẩn conventional commits.
- Commit message nên có mô tả ngắn (50 ký tự hoặc ít hơn) theo sau là dòng trống rồi đến mô tả chi tiết.
- Mô tả ngắn có định dạng: `<type>(<scope>):<icon> <mô tả ngắn>`
  - `type`: Loại thay đổi (ví dụ: feat, fix, docs, style, refactor, test, chore).
    - `feat`: ✨ Tính năng mới
    - `fix`: 🐛 Sửa lỗi
    - `docs`: 📝 Chỉ thay đổi tài liệu
    - `style`: 💄 Thay đổi không ảnh hưởng logic code (formatting, whitespace, thiếu dấu chấm phẩy, v.v.)
    - `refactor`: ♻️ Tái cấu trúc code không sửa lỗi hay thêm tính năng
    - `test`: ✅ Thêm test bị thiếu hoặc sửa test hiện có
    - `chore`: 🔧 Thay đổi quá trình build hoặc công cụ hỗ trợ
    - `perf`: ⚡️ Tối ưu hiệu suất
    - `ci`: 👷 Thay đổi cấu hình CI và scripts
    - `build`: 🏗️ Thay đổi ảnh hưởng hệ thống build hoặc dependencies
    - `revert`: ⏪ Hoàn tác commit trước đó
    - `wip`: 🚧 Đang làm dở
    - `security`: 🔒 Các thay đổi liên quan bảo mật
    - `i18n`: 🌐 Quốc tế hóa và địa phương hóa
    - `a11y`: ♿ Cải thiện khả năng truy cập
    - `ux`: 🎨 Cải thiện trải nghiệm người dùng
    - `ui`: 🖌️ Thay đổi giao diện người dùng
    - `config`: 🔧 Thay đổi file cấu hình
    - `deps`: 📦 Cập nhật dependencies
    - `infra`: 🌐 Thay đổi cơ sở hạ tầng
    - `init`: 🎉 Commit ban đầu
    - `analytics`: 📈 Code analytics hoặc tracking
    - `seo`: 🔍 Cải thiện SEO
    - `legal`: ⚖️ Thay đổi licensing hoặc pháp lý
    - `typo`: ✏️ Sửa lỗi chính tả
    - `comment`: 💬 Thêm hoặc cập nhật comments
    - `example`: 💡 Thêm hoặc cập nhật examples
    - `mock`: 🤖 Thêm hoặc cập nhật mocks
    - `hotfix`: 🚑 Sửa lỗi khẩn cấp
    - `merge`: 🔀 Gộp nhánh
    - `cleanup`: 🧹 Dọn dẹp code
    - `deprecate`: 🗑️ Gỡ bỏ code hoặc tính năng
    - `move`: 🚚 Di chuyển hoặc đổi tên file
    - `rename`: ✏️ Đổi tên file hoặc biến
    - `split`: ✂️ Tách file hoặc hàm
    - `combine`: 🧬 Gộp file hoặc hàm
    - `add`: ➕ Thêm file hoặc tính năng
    - `remove`: ➖ Xóa file hoặc tính năng
    - `update`: ⬆️ Cập nhật file hoặc tính năng
    - `downgrade`: ⬇️ Hạ cấp file hoặc tính năng
    - `patch`: 🩹 Áp dụng patches
    - `optimize`: 🛠️ Tối ưu code
  - `scope`: Phạm vi thay đổi (ví dụ: tên component hoặc file). Bao gồm khi thay đổi cụ thể phần nào của codebase.
- `short description`: Tóm tắt ngắn gọn về thay đổi.
- Mô tả dài nên cung cấp context và chi tiết thêm về thay đổi.
  - Giải thích tại sao thực hiện thay đổi.
  - Mô tả những gì được sử dụng và tại sao.
  - Bao gồm thông tin liên quan hữu ích cho việc hiểu thay đổi trong tương lai.
  - Tham chiếu đến issues hoặc pull requests liên quan ở cuối mô tả dài.

## Ví dụ

### Ví dụ Commit Message

```
feat(auth): ✨ Thêm xác thực người dùng

Thêm xác thực người dùng sử dụng JWT. Bao gồm login, đăng ký, và xác thực token.

- Implement xác thực dựa trên JWT.
- Thêm endpoints login và đăng ký.
- Thêm middleware xác thực token.
```

### Ví dụ Bug Fix (Chuẩn dratct — BẮT BUỘC cho commit fix)

Mỗi commit sửa lỗi **BẮT BUỘC** phải có đủ 3 phần trong body:
1. **Root cause** — Tại sao logic cũ chạy sai? (nêu rõ input gây lỗi, output sai, path code lỗi)
2. **Fix** — Thay đổi những gì? Tại sao chọn hướng đi này?
3. **Kiểm chứng** — Kết quả test cụ thể (fixture xanh, task CI pass, audit diff không regression)

```
fix(metadata): 🐛 [BSVA-861] tối ưu COT_HINTS tránh nhận nhầm du lịch tự túc

Root cause:
- Input: "Mình đi Đức tự túc, cho hỏi cần chuẩn bị giấy tờ gì"
- Output sai: O5001 = "Germany" (nhận nhầm điểm đến hiện tại thành lịch sử)
- Path: prod chạy field_by_field → COT_HINTS["Lịch sử du lịch"] trong metadata_local_7b.py
- Nguyên nhân: Rule 2 thiếu pattern "đi [nước] tự túc" và câu hỏi chuẩn bị hồ sơ

Fix:
- Bổ sung pattern loại trừ "đi [nước] tự túc" vào Rule 2
- Thêm ví dụ phủ định toàn cục vs. phủ định một nước (Rule 1)
- Dùng nước không test (Pháp/Ý) trong ví dụ Rule 4 tránh negative collision

Kiểm chứng:
- task test:eval:metadata → 22/22 passed ✅
- ruff check → All checks passed ✅
```

### Ví dụ Breaking Change

```
refactor(api): ♻️ Cập nhật API endpoints

Tái cấu trúc API endpoints theo chuẩn RESTful. Thay đổi này ảnh hưởng tất cả API calls hiện có.

- Cập nhật URLs endpoints theo chuẩn RESTful.
- Sửa đổi format request và response.

BREAKING CHANGE: Tất cả API calls hiện có cần cập nhật sang URLs endpoints mới.
```

## Deploy Control

- Khi user yêu cầu **"không deploy"**, **"no deploy"**, hoặc **"skip deploy"**: thêm `[no deploy]` vào **cuối commit message body** (dòng cuối cùng, sau một dòng trống).
- CI/CD pipeline sẽ đọc tag này để bỏ qua bước deploy.

### Ví dụ

```
fix(api): 🐛 Sửa lỗi validate input

Sửa lỗi validate input khi user gửi payload rỗng.

[no deploy]
```
