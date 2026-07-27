import * as ftp from "basic-ftp";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const FTP_HOST = process.env.FTP_HOST || "pbv-epyc-24929.azdigihost.com";
const FTP_USER = process.env.FTP_USER || "huyen@bugreport.anai.io.vn";
const FTP_PASSWORD = process.env.FTP_PASSWORD || "";
const FTP_PORT = parseInt(process.env.FTP_PORT || "21", 10);
const FTP_REMOTE_DIR = process.env.FTP_REMOTE_DIR || "/";

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  const localDistPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(localDistPath)) {
    console.error("❌ Thư mục dist/ chưa tồn tại! Hãy chạy 'npm run build' trước khi deploy.");
    process.exit(1);
  }

  console.log("🚀 Bắt đầu quá trình tự động FTP Deploy...");
  console.log(`📡 Đang kết nối tới FTP Server: ${FTP_HOST}:${FTP_PORT} với user '${FTP_USER}'...`);

  try {
    await client.access({
      host: FTP_HOST,
      port: FTP_PORT,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });

    console.log("✅ Kết nối FTP thành công!");
    console.log(`📁 Đang đồng bộ hóa thư mục dist/ lên thư mục từ xa '${FTP_REMOTE_DIR}'...`);

    await client.ensureDir(FTP_REMOTE_DIR);
    await client.uploadFromDir(localDistPath, FTP_REMOTE_DIR);

    // Đồng bộ file .env lên server root để backend Node.js đọc được GITHUB_TOKEN & NOTION_TOKEN
    const localEnvPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(localEnvPath)) {
      console.log("🔑 Đang đồng bộ file .env chứa GITHUB_TOKEN & NOTION_TOKEN lên server...");
      await client.uploadFrom(localEnvPath, ".env");
    }

    // Đồng bộ file .cache/bugs.json lên server để live server có đầy đủ dữ liệu Notion & GitHub
    const localCachePath = path.resolve(process.cwd(), ".cache/bugs.json");
    if (fs.existsSync(localCachePath)) {
      console.log("📦 Đang đồng bộ file .cache/bugs.json dữ liệu lên server...");
      await client.ensureDir(".cache");
      await client.uploadFrom(localCachePath, "bugs.json");
    }

    console.log("🎉 DEPLOY THÀNH CÔNG 100%!");
    console.log(`🌐 Kiểm tra trang web tại: https://${FTP_USER}:${encodeURIComponent(FTP_PASSWORD)}@${FTP_HOST}/`);
  } catch (err) {
    console.error("❌ Lỗi trong quá trình FTP Deploy:", err);
  } finally {
    client.close();
  }
}

deploy();
