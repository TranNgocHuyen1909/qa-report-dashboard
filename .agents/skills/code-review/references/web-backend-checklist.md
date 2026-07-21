# Checklist Review Code — lisa-visa-web-backend

Checklist này tập trung vào các quy tắc lập trình Backend, cơ sở dữ liệu SQLAlchemy/SQLModel, migrations Alembic và thiết kế API trong dự án Web Backend.

---

## 🔒 1. Bảo mật & Tìm kiếm dữ liệu (SQL Wildcard Injection)

> 📌 **Bài học từ PR #32:** "ILIKE ở đây nhận thẳng pattern chưa escape, nên ký tự % _ \ trong từ khoá người dùng sẽ bị hiểu là wildcard."

- **Escape Wildcard khi dùng LIKE/ILIKE:**
  Khi người dùng nhập các ký tự đặc biệt như `%`, `_`, `\`, SQL sẽ hiểu đó là wildcard.
  - Vd: search `"50%"` sẽ khớp với mọi thứ, hay `"a_b"` khớp với `"aXb"`.
  - **Quy tắc:** Bắt buộc escape input trước khi ghép `%...%` và khai báo `escape` character.
  - **Cách xử lý chuẩn trong Python:**
    ```python
    # 1. Escape các ký tự đặc biệt
    escaped_query = (
        search_query
        .replace("/", "//")
        .replace("\\", "/\\")
        .replace("%", "/%")
        .replace("_", "/_")
    )
    search_pattern = f"%{escaped_query}%"
    
    # 2. Sử dụng helper _unaccent_ilike với escape mặc định là "/"
    def _unaccent_ilike(column, pattern: str, escape: str | None = "/"):
        return func.unaccent(column).ilike(func.unaccent(pattern), escape=escape)
    ```

---

## 💾 2. Alembic Migrations & PostgreSQL Extensions

- **Kiểm tra tính tương thích của Extensions:**
  - Tránh tạo các migrations tự động kích hoạt các extension như `unaccent` mà không có sự thống nhất hoặc chưa được test cấu hình đầy đủ trên Database local/Docker.
  - Nếu Team Lead yêu cầu bỏ các file tạo/enable extension tự động bằng Python script, hãy gỡ bỏ file migration tương ứng.

---

## 🧪 3. Unit Tests & Mocks

> 📌 **Bài học từ PR #32:** "Test hiện tại chỉ kiểm tra chuỗi SQL sinh ra ở tầng Python... Nó không gửi câu SQL đó xuống database, nên không kiểm chứng được kết quả thực tế."

- **Tránh viết Change-Detector Tests cho SQL Builder:**
  - Không viết các test chỉ để xác nhận SQLAlchemy build ra câu query có chuỗi string đúng syntax `unaccent(col) ILIKE unaccent(pattern)` mà không thực sự chạy trên DB thật.
  - Nếu dự án chưa có Integration test setup sẵn với Database thật (PostgreSQL), hãy tạm thời bỏ qua test code thay vì viết unit test mock SQL builder vô nghĩa.

---

## 🏗️ 4. Code Quality & Formatting

- **Linter & Formatter:**
  - Luôn chạy check ruff trước khi commit:
    ```bash
    uv run ruff check app/
    uv run ruff format --check app/
    ```
