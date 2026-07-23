# 🚀 Hướng Dẫn Deploy QA Report Dashboard Cho Người Mới (Newbie Guide từ A-Z)

Tài liệu này giải thích chi tiết toàn bộ khái niệm, kiến thức cơ bản và quy trình từng bước để phát triển, đóng gói và đưa bảng điều khiển **QA Report Dashboard** lên môi trường Production (cPanel).

---

## 📌 1. Thông Tin Môi Trường & Đăng Nhập

* **Website Domain**: `https://bugreport.anai.io.vn/`
* **Tài khoản Bảo vệ (Basic Auth)**:
  * **Username**: `anai`
  * **Password**: `Anai12345^&`
* **Link truy cập nhanh (Bypass form gõ pass)**:
  * [https://anai:Anai12345%5E%26@bugreport.anai.io.vn/](https://anai:Anai12345%5E%26@bugreport.anai.io.vn/)
  * *(Đoạn `%5E%26` là mã hóa URL của ký tự đặc biệt `^&` trong mật khẩu)*

---

## 📚 2. Giải Thích Từ Khóa & Thuật Ngữ Kỹ Thuật (Từ A đến Z)

### 🔹 cPanel là gì?
**cPanel** là một bảng điều khiển (Control Panel) quản lý máy chủ web (Hosting). Tại đây, Tech Lead (Anh Trường) đã cài đặt môi trường chạy cho Node.js ứng dụng Dashboard của team.

### 🔹 Thư mục `dist/` (Distribution) là gì?
Khi lập trình ở máy cá nhân (Local), mã nguồn gồm nhiều file React, TypeScript, CSS... chưa được nén. 
Khi chạy lệnh `npm run build`, hệ thống sẽ nén, tối ưu hóa và biên dịch toàn bộ dự án thành các file tĩnh gọn nhẹ đặt trong thư mục **`dist/`**. Đây là **sản phẩm duy nhất** cần đưa lên server cPanel để chạy trang web.

### 🔹 FTP (File Transfer Protocol) là gì?
FTP là giao thức truyền file qua lại giữa máy tính cá nhân của bạn và máy chủ cPanel trên Internet. Bạn có thể tưởng tượng FTP như một **"chiếc xe tải chở file"** đi từ máy bạn tới máy chủ cPanel.

### 🔹 FileZilla là gì?
**FileZilla** là một phần mềm miễn phí có giao diện đồ họa giúp bạn quản lý kết nối FTP. 
Giao diện FileZilla chia làm 2 bên:
* **Bên trái (Local site)**: Máy tính cá nhân của bạn.
* **Bên phải (Remote site)**: Máy chủ cPanel.

### 🔹 "Kéo chay" là gì?
"Kéo chay" là thuật ngữ chỉ việc thao tác hoàn toàn bằng tay: Mở FileZilla ➔ Tìm đến thư mục `dist/` bên máy local ➔ Dùng chuột bôi đen ➔ **Kéo thả** sang thư mục bên cPanel để chép đè.
* *Nhược điểm*: Tốn thời gian, thao tác thủ công nhiều bước, dễ thiếu hoặc sót file.

### 🔹 "Script FTP" (Auto Deploy Script) là gì?
Là một đoạn code tự động (thường viết bằng Node.js). Khi bạn gõ 1 câu lệnh ngắn (ví dụ: `npm run deploy`), đoạn script này sẽ tự mở kết nối FTP và đẩy sạch sẽ toàn bộ nội dung `dist/` mới lên cPanel chỉ trong vài giây mà bạn không cần mở FileZilla hay kéo thả tay.

---

## 🛠️ 3. Quy Trình Cập Nhật & Deploy Dự Án (Các Bước Thực Hiện)

```
[Chỉnh sửa code tại máy Local] 
            │
            ▼
 [npm run build] ➔ Tạo thư mục dist/ mới nhất
            │
            ▼
 [Upload dist/ lên cPanel] ➔ (Dùng FileZilla HOẶC Script FTP)
            │
            ▼
 [Yêu cầu Restart Node.js] ➔ (Nhắn anh Trường restart nếu sửa code Backend)
```

### 🔹 Bước 1: Kiểm tra & Build code ở máy Local
Trước khi đẩy code, mở Terminal tại thư mục dự án và chạy:
```bash
npm run build
```
Nếu Terminal báo `Build success` / `built in ...ms` là thành công. Thư mục `dist/` trên máy bạn đã có bản code mới nhất.

---

### 🔹 Bước 2: Upload mã nguồn lên Server cPanel

#### 🔴 Cách 1: Tải thủ công bằng FileZilla ("Kéo chay")
1. Tải và mở phần mềm **FileZilla**.
2. Điền thông tin kết nối FTP do anh Trường cung cấp:
   * **Host**: `bugreport.anai.io.vn` (hoặc IP Server)
   * **Username**: Tài khoản FTP cPanel
   * **Password**: Mật khẩu FTP cPanel
   * **Port**: `21`
3. Nhấn **Quickconnect**.
4. Ở ô bên trái (Local), tìm tới thư mục `dist/` của dự án.
5. Ở ô bên phải (Remote), mở thư mục root ứng dụng trên cPanel.
6. Bôi đen toàn bộ các file/folder trong `dist/` ➔ Chuột phải chọn **Upload** (hoặc kéo thả qua).

#### 🟢 Cách 2: Tự động hóa bằng Script FTP (Khuyên dùng)
1. Thêm đoạn script tự động vào dự án (Xem chi tiết ở **Mục 4** bên dưới).
2. Khi muốn deploy, chỉ cần gõ 1 câu lệnh duy nhất:
   ```bash
   npm run deploy
   ```
   *Script sẽ tự động build và đẩy lên cPanel chuẩn xác 100%!*

---

### 🔹 Bước 3: Khởi động lại Server (Restart Node.js)
* **Nếu chỉ sửa giao diện (Frontend React/CSS)**: Bạn chỉ cần mở web `https://bugreport.anai.io.vn/` và nhấn `Ctrl + F5` để xóa cache trình duyệt là thấy thay đổi ngay.
* **Nếu có sửa logic server / API backend (`src/server/`)**: Cần báo anh Trường restart lại Node.js App trên cPanel thì code backend mới có hiệu lực.

---

## 💻 4. Hướng Dẫn Tự Cài Đặt Script Auto Deploy FTP

Để không phải "kéo chay" bằng FileZilla, bạn có thể thiết lập Script tự động theo các bước sau:

### Bước 4.1: Cài đặt thư viện `basic-ftp`
Mở terminal dự án và chạy:
```bash
npm install -D basic-ftp
```

### Bước 4.2: Tạo file `scripts/deploy-ftp.js`
Tạo một file mới tại đường dẫn `scripts/deploy-ftp.js` với nội dung:

```javascript
import * as ftp from "basic-ftp";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log("🔌 Đang kết nối tới FTP cPanel...");
    await client.access({
      host: process.env.FTP_HOST || "bugreport.anai.io.vn",
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: Number(process.env.FTP_PORT) || 21,
      secure: false
    });

    console.log("🚀 Đang đẩy thư mục dist/ lên cPanel...");
    // Upload toàn bộ thư mục dist/ lên thư mục đích trên cPanel
    await client.uploadFromDir(
      path.resolve(process.cwd(), "dist"),
      process.env.FTP_REMOTE_DIR || "/public_html"
    );

    console.log("✅ DEPLOY THÀNH CÔNG LÊN CPANEL!");
  } catch (err) {
    console.error("❌ LỖI DEPLOY FTP:", err);
  } finally {
    client.close();
  }
}

deploy();
```

### Bước 4.3: Điền thông tin FTP vào `.env`
Mở file `.env` ở máy bạn và bổ sung các biến:
```env
FTP_HOST=bugreport.anai.io.vn
FTP_USER=your_ftp_username
FTP_PASSWORD=your_ftp_password
FTP_REMOTE_DIR=/path/to/cpanel/app
```

### Bước 4.4: Thêm lệnh `"deploy"` vào `package.json`
Mở `package.json` và bổ sung lệnh `"deploy"` trong phần `"scripts"`:
```json
"scripts": {
  "build": "vite build && tsup --config tsup.config.ts",
  "deploy": "npm run build && node scripts/deploy-ftp.js"
}
```

Từ giờ, bất cứ khi nào cần cập nhật web, bạn chỉ cần gõ:
```bash
npm run deploy
```

---

## ⏱️ 5. Cấu Hình Tần Suất Auto Sync & Nguyên Tắc Review

1. **Auto Sync Tần Suất 30 - 60 Phút/lần**:
   * Hệ thống tự động thu thập bug từ Notion API và PR từ GitHub API.
   * Để 30–60 phút/lần nhằm tránh bị dính **Rate Limit** (giới hạn truy cập API) của Notion/GitHub và giảm tải cho server.
2. **Quy Trình Review 2 Vòng**:
   * **Vòng 1 (QC Lead Huyền - `@TranNgocHuyen1909`)**: Test thực tế môi trường ➔ Duyệt Pass ➔ Đổi nhãn `wait for development`.
   * **Vòng 2 (Tech Lead Trường - `@dract`)**: Review code logic các PR có nhãn `wait for development` / `ready for re-review` ➔ Approve & Merge PR ➔ Chuyển `Deployed`.
   * **Nghệm thu (OP Thương & Linh)**: OP kiểm tra lại ➔ Đổi `Status = Closed` trên thẻ Notion card (OP không close PR trên GitHub).

---
*Tài liệu được lưu trữ trực tiếp tại file [`DEPLOY_GUIDE.md`](file:///d:/ANAI/qa-report-dashboard/DEPLOY_GUIDE.md) trong thư mục gốc của dự án.*
