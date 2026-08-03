import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { loadConfig } from "./config";
import { createApi } from "./api";
import { NotionBugClient } from "./notion/bugClient";
import { enrichAllBugs } from "./github/prClient";
// QA Report Dashboard API Server Entrypoint
import { useMemo } from "react"; // Unused import but triggers watch
import type { BugRecord, ChecklistItem } from "../shared/types";

const config = loadConfig();
let cachedBugs: BugRecord[] = [];
const CACHE_PATH = ".cache/bugs.json";
const CHECKLIST_PATH = config.checklistPath;

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadCache(): BugRecord[] {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")); } catch { return []; }
}

function saveCache(bugs: BugRecord[]) {
  ensureDir(CACHE_PATH);
  fs.writeFileSync(CACHE_PATH, JSON.stringify(bugs));
}

function loadChecklist(): ChecklistItem[] {
  try { return JSON.parse(fs.readFileSync(CHECKLIST_PATH, "utf-8")); } catch { return getDefaultChecklist(); }
}

function saveChecklist(items: ChecklistItem[]) {
  ensureDir(CHECKLIST_PATH);
  fs.writeFileSync(CHECKLIST_PATH, JSON.stringify(items, null, 2));
}

function getDefaultChecklist(): ChecklistItem[] {
  return [
    { id: "default-1", code: "L1", title: "Sửa sai tầng — vá triệu chứng", description: "Sửa prompt AI cho bug nhưng lỗi thật ở tool extract sai", example: "PR#171 vá prompt khi chưa kiểm docs nào được load ra", lesson: "Trace đúng tầng trước khi sửa: tool > AI", prs: ["lisa-ai-agent/pull/171"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-2", code: "L2", title: "Test \"xanh giả\" — không fail khi logic sai", description: "Assert nguyên văn string thay vì test logic nghiệp vụ", example: "eval equals hạ lowercase nên 'du lịch' pass mà production drop", lesson: "Test phải fail khi nghiệp vụ sai, không phải khi câu chữ đổi", prs: ["lisa-ai-agent/pull/150"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-3", code: "L3", title: "Test thiếu — chỉ vá đúng câu bug", description: "Chỉ fix đúng case bug gốc mà không cover các case liên quan", example: "Fix 'Bỉ 45 ngày' không kèm test case khác", lesson: "Sửa 1 nhánh → cover cả nhánh: happy + absent + biến thể", prs: ["lisa-ai-agent/pull/146"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-4", code: "L4", title: "Guard/regex allowlist rộng — xoá oan", description: "Guard chặn quá rộng xoá mất data hợp lệ", example: "Guard O9004 xoá oan câu 'visa Nhật được cấp năm ngoái'", lesson: "Denylist hẹp — chặn đúng cái sai đã kiểm chứng", prs: ["lisa-ai-agent/pull/162"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-5", code: "L5", title: "Hiểu sai định nghĩa field / nghiệp vụ", description: "Hiểu sai scope nghiệp vụ dẫn tới test sai", example: "O9004 scoped theo NƯỚC ĐÍCH, test gán sai scope", lesson: "Bám nguồn chuẩn trước khi viết expected", prs: ["lisa-ai-agent/pull/162"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-6", code: "L6", title: "Sửa 1 chỗ, sót N chỗ cùng pattern", description: "Fix một chỗ nhưng quên các chỗ khác cùng pattern", example: "Fix mapping Schengen nhưng thiếu Iceland/Switzerland", lesson: "Grep toàn project tìm các chỗ cùng pattern trước khi commit", prs: ["lisa-ai-agent/pull/143"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-7", code: "L7", title: "Prompt mơ hồ / dài dòng", description: "Viết prompt thiếu rõ ràng khiến model hiểu nhầm", example: "Rule THÁI ĐỘ ~1k token, thiếu nhãn 'Ví dụ:' khiến model lẫn lộn", lesson: "Prompt ngắn gọn, có ví dụ rõ ràng", prs: ["lisa-ai-agent/pull/126"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
    { id: "default-8", code: "L9", title: "An toàn input & vận hành", description: "Thiếu sanitize input hoặc thiếu kiểm tra quyền khi deploy", example: "Search ghép f\"%{q}%\" vào ILIKE → wildcard injection", lesson: "Luôn sanitize input, kiểm tra quyền trước khi deploy", prs: ["lisa-visa-web-backend/pull/32"], createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z" },
  ];
}

const CONCLUSIONS_PATH = ".cache/conclusions.json";
const CUSTOM_TARGETS_PATH = ".cache/custom_targets.json";

function loadConclusions(): Record<string, any> {
  try { return JSON.parse(fs.readFileSync(CONCLUSIONS_PATH, "utf-8")); } catch { return {}; }
}

function saveConclusions(data: Record<string, any>) {
  ensureDir(CONCLUSIONS_PATH);
  fs.writeFileSync(CONCLUSIONS_PATH, JSON.stringify(data, null, 2));
}

function loadCustomTargets(): Record<string, number[]> {
  try { return JSON.parse(fs.readFileSync(CUSTOM_TARGETS_PATH, "utf-8")); } catch { 
    return { HuyenTN: [0, 10, 18, 25, 30, 35, 40, 42, 45, 45] }; 
  }
}

function saveCustomTargets(data: Record<string, number[]>) {
  ensureDir(CUSTOM_TARGETS_PATH);
  fs.writeFileSync(CUSTOM_TARGETS_PATH, JSON.stringify(data, null, 2));
}

let refreshing = false;
async function refreshBugs() {
  if (refreshing) { console.log("Refresh already in progress, skipping."); return; }
  if (!config.notionToken || !config.notionBugDataSourceId) {
    console.warn("Notion not configured, using cached data");
    return;
  }
  refreshing = true;
  try {
    console.log("Fetching bugs from Notion...");
    const client = new NotionBugClient(config.notionToken, config.notionVersion, config.notionBugDataSourceId);
    let bugs = await client.listBugs();
    console.log(`Fetched ${bugs.length} bugs. Merging cached GitHub fields...`);

    const existingMap = new Map<string, BugRecord>();
    cachedBugs.forEach(b => existingMap.set(b.id, b));
    bugs = bugs.map(b => {
      const prev = existingMap.get(b.id);
      if (prev) {
        return {
          ...b,
          pullRequestUrl: b.pullRequestUrl || prev.pullRequestUrl,
          prAuthor: prev.prAuthor || b.prAuthor,
          prCreatedAt: prev.prCreatedAt || b.prCreatedAt,
          ghReviewStatus: prev.ghReviewStatus || b.ghReviewStatus,
          ghReviewCount: prev.ghReviewCount ?? b.ghReviewCount,
          ghReviews: prev.ghReviews || b.ghReviews,
          ghCommitsCount: prev.ghCommitsCount ?? b.ghCommitsCount,
          prCommentsByAuthor: prev.prCommentsByAuthor ?? b.prCommentsByAuthor,
          prCommentsByTruong: prev.prCommentsByTruong ?? b.prCommentsByTruong,
          prCommentsByHuyen: prev.prCommentsByHuyen ?? b.prCommentsByHuyen,
          huyenFirstCommentAt: prev.huyenFirstCommentAt || b.huyenFirstCommentAt,
          huyenLastCommentAt: prev.huyenLastCommentAt || b.huyenLastCommentAt,
          huyenReviewRounds: prev.huyenReviewRounds ?? b.huyenReviewRounds,
          ghLabels: prev.ghLabels || b.ghLabels,
        };
      }
      return b;
    });

    cachedBugs = bugs;
    saveCache(bugs);

    console.log(`Enriching ${bugs.length} bugs with GitHub...`);
    bugs = await enrichAllBugs(bugs, config.githubToken);
    console.log(`Enriched ${bugs.length} bugs with GitHub data.`);
    cachedBugs = bugs;
    saveCache(bugs);
  } finally {
    refreshing = false;
  }
}

// Boot
cachedBugs = loadCache();
let checklistData = loadChecklist();
let conclusionsData = loadConclusions();
let customTargetsData = loadCustomTargets();

const app = createApi({
  getBugs: () => loadCache(),
  getChecklist: () => checklistData,
  saveChecklist: (items) => { checklistData = items; saveChecklist(items); },
  refresh: refreshBugs,
  getConclusions: () => conclusionsData,
  saveConclusions: (data) => { conclusionsData = data; saveConclusions(data); },
  getCustomTargets: () => customTargetsData,
  saveCustomTargets: (data) => { customTargetsData = data; saveCustomTargets(data); },
  githubToken: config.githubToken,
});

// Serve Vite build or root index.html
const projectRoot = process.cwd();
const indexHtml = fs.existsSync(path.join(projectRoot, "dist", "index.html"))
  ? path.join(projectRoot, "dist", "index.html")
  : path.join(projectRoot, "index.html");
const webRoot = path.dirname(indexHtml);
if (fs.existsSync(indexHtml)) {
  app.use((req, res, next) => {
    if (req.path.startsWith("/server")) {
      res.status(404).end();
      return;
    }
    next();
  });
  app.use(express.static(webRoot));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });
} else {
  console.warn(`Web UI not found at ${indexHtml}; serving API only`);
}

app.listen(config.port, "0.0.0.0", () => {
  console.log(`QA Report running on http://0.0.0.0:${config.port}`);
  // Auto-refresh on start if cache is empty
  if (cachedBugs.length === 0) {
    refreshBugs().catch(e => console.error("Initial refresh failed:", e));
  }
});

// Timezone-aware Daily Scheduler (6:00 PM ICT - Asia/Ho_Chi_Minh)
function scheduleDailyGrab() {
  console.log("[Scheduler] Initialized daily 6:00 PM checklist grab job.");
  setInterval(async () => {
    const now = new Date();
    const ictString = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
    const ictDate = new Date(ictString);
    const hour = ictDate.getHours();
    const minute = ictDate.getMinutes();

    // Trigger exactly at 18:00
    if (hour === 18 && minute === 0) {
      console.log("[Scheduler] Daily 6:00 PM grab starting...");
      try {
        const { grabTruongComments } = await import("./github/commentGrabber");
        const currentList = loadChecklist();
        const result = await grabTruongComments(cachedBugs, currentList, config.githubToken);
        if (result.addedCount > 0 || result.updatedCount > 0) {
          const updatedList = [...currentList, ...result.newItems];
          checklistData = updatedList;
          saveChecklist(updatedList);
          console.log(`[Scheduler] Daily grab complete: added ${result.addedCount} new, merged/updated ${result.updatedCount} items.`);
        } else {
          console.log("[Scheduler] Daily grab complete: no new comments or updates found.");
        }
      } catch (err) {
        console.error("[Scheduler] Error during daily comment grab:", err);
      }
    }
  }, 60 * 1000); // check every minute
}
scheduleDailyGrab();

// Periodic refresh (default 30 min)
setInterval(() => {
  refreshBugs().catch(e => console.error("Periodic refresh failed:", e));
}, Math.max(config.refreshIntervalSeconds, 1800) * 1000);
