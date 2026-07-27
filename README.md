# QA Report Dashboard

Dashboard tổng hợp dữ liệu QA từ Notion và GitHub, cung cấp báo cáo theo tuần,
thống kê cá nhân, vòng đời bug và checklist bài học từ quá trình review.

Ứng dụng gồm:

- React + Vite cho giao diện.
- Express cho API.
- Notion API để tải danh sách bug.
- GitHub API để bổ sung dữ liệu pull request và comment.
- Nginx phục vụ frontend và reverse proxy API khi chạy bằng Docker.

## Yêu cầu

### Chạy local

- Node.js 22 trở lên.
- npm.

### Chạy bằng Docker

- Docker Engine.
- Docker Compose v2.

## Cấu hình môi trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Sau đó cập nhật token và ID tương ứng:

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `APP_PORT` | `8080` | Cổng public khi chạy bằng Docker Compose. |
| `PORT` | `8788` | Cổng API khi chạy local. |
| `NOTION_TOKEN` | Trống | Integration token dùng để đọc dữ liệu Notion. |
| `NOTION_VERSION` | `2026-03-11` | Phiên bản Notion API. |
| `NOTION_BUG_DATA_SOURCE_ID` | Trống | ID data source chứa danh sách bug. |
| `GITHUB_TOKEN` | Trống | Token dùng để đọc PR và comment trên GitHub. |
| `REFRESH_INTERVAL_SECONDS` | `300` | Chu kỳ đồng bộ dữ liệu, tính bằng giây. |
| `CHECKLIST_PATH` | `.cache/checklist.json` | File lưu checklist khi chạy local. |

Không commit file `.env` hoặc token thật lên Git.

## Chạy local

Cài dependency:

```bash
npm ci
```

Khởi động frontend và API ở chế độ development:

```bash
npm run dev
```

Truy cập:

- Dashboard: <http://localhost:5173>
- API health check: <http://localhost:8788/api/health>

Vite tự động proxy các request `/api` sang Express.

## Chạy bằng Dev Container

Mở Command Palette trong VS Code và chọn:

```text
Dev Containers: Reopen in Container
```

Dev Container sẽ tự chạy `npm ci` và forward hai cổng `5173`, `8788`. Sau khi
container sẵn sàng, chạy:

```bash
npm run dev
```

## Deploy bằng Docker Compose

Build và khởi động:

```bash
docker compose up -d --build --wait
```

Dashboard mặc định có tại:

```text
http://localhost:8080
```

Để sử dụng cổng khác:

```bash
APP_PORT=80 docker compose up -d --build --wait
```

Kiểm tra trạng thái và log:

```bash
docker compose ps
docker compose logs -f
```

Dừng ứng dụng:

```bash
docker compose down
```

Docker Compose tạo hai service:

- `web`: Nginx phục vụ React và chuyển tiếp `/api` sang service `api`.
- `api`: Express API chạy trên cổng nội bộ `8788`.

Dữ liệu runtime trong `.cache` được lưu ở named volume
`qa-report-dashboard_qa-cache`, nên vẫn còn khi container được recreate.

Để dừng ứng dụng và xóa cả dữ liệu runtime:

```bash
docker compose down --volumes
```

Lệnh này xóa dữ liệu checklist, conclusions và bug cache đang lưu trong volume.

## Build production không dùng Docker

```bash
npm run build
npm start
```

Lệnh build tạo:

- Frontend trong `dist/`.
- API server trong `dist/server/`.

Khi deploy theo cách này, cần cấu hình web server riêng để phục vụ frontend và
proxy `/api` tới Express.

## API health check

```bash
curl http://localhost:8080/api/health
```

Kết quả mong đợi:

```json
{"ok":true}
```

---

## 🖥️ Hướng dẫn kết nối SSH vào Máy Ảo bằng VS Code (Remote - SSH)

Để phát triển, chỉnh sửa file `.env` hoặc quản lý ứng dụng trực tiếp trên máy ảo thông qua giao diện VS Code:

### Bước 1: Cài đặt Extension Remote - SSH
1. Mở VS Code trên máy tính cá nhân.
2. Mở cửa sổ Extension bằng phím tắt `Ctrl + Shift + X` (hoặc `Cmd + Shift + X` trên Mac).
3. Tìm kiếm với từ khóa **`Remote - SSH`** (phát hành bởi Microsoft) và chọn **Install**.

### Bước 2: Kết nối tới Máy Ảo (Virtual Machine)
1. Bật ứng dụng **Tailscale** trên máy tính để kết nối vào mạng nội bộ với máy ảo.
2. Nhấn `F1` (hoặc `Ctrl + Shift + P`) trên VS Code để mở **Command Palette**.
3. Nhập từ khóa: `Remote-SSH: Connect to Host...` và chọn lệnh này.
4. Nhập cú pháp SSH kết nối:
   ```text
   ssh ubuntu@bug-report-app
   ```
   *(Hoặc `ssh ubuntu@<IP_TAILSCALE_CỦA_MÁY_ẢO>`)*.
5. Nhấn `Enter`, chọn Platform của máy chủ là **Linux**.
6. Nếu được yêu cầu, chọn **Continue** và nhập mật khẩu của máy ảo.

### Bước 3: Mở Thư Mục Dự Án Trên Máy Ảo
1. Khi kết nối thành công, góc dưới bên trái của VS Code sẽ hiển thị nhãn màu xanh: `SSH: ubuntu@bug-report-app`.
2. Vào menu **File** ➔ chọn **Open Folder...**.
3. Điền đường dẫn thư mục dự án:
   ```text
   /home/ubuntu/qa-report-dashboard
   ```
   và bấm **OK**.
4. Mở Terminal trong VS Code bằng `Ctrl + ~` để chạy các lệnh quản lý `pm2`, `git pull`, `npm run build` trực tiếp trên máy ảo.

