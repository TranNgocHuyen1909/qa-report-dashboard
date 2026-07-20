import type { BugRecord, ChecklistItem } from "../../shared/types";

interface GHComment {
  id: number;
  body: string;
  user: { login: string };
  html_url: string;
  created_at: string;
}

// Format ISO date to Vietnamese ICT timezone (DD/MM/YYYY HH:MM)
function formatCommentDate(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const date = new Date(isoStr);
    const ict = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = ict.getUTCFullYear();
    const mm = String(ict.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(ict.getUTCDate()).padStart(2, '0');
    const hh = String(ict.getUTCHours()).padStart(2, '0');
    const min = String(ict.getUTCMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return String(isoStr).slice(0, 16).replace("T", " ");
  }
}

// Keyword-based classification helper
function getCategoryAndKeywords(text: string): { category: string; keywords: string[] } {
  const lower = text.toLowerCase();
  
  if (lower.includes("prompt") || lower.includes("system prompt") || lower.includes("llm") || lower.includes("gpt") || lower.includes("claude")) {
    return { category: "AI/Prompt Logic", keywords: ["prompt", "ai", "model", "system"] };
  }
  if (lower.includes("test") || lower.includes("assert") || lower.includes("testcase") || lower.includes("eval") || lower.includes("mock")) {
    return { category: "Testing & Validation", keywords: ["test", "eval", "assert", "mock"] };
  }
  if (lower.includes("duplicate") || lower.includes("trùng") || lower.includes("refactor") || lower.includes("lặp") || lower.includes("hardcode")) {
    return { category: "Code Quality & Refactoring", keywords: ["duplicate", "trùng", "refactor", "lặp", "hardcode"] };
  }
  if (lower.includes("sanitize") || lower.includes("wildcard") || lower.includes("guard") || lower.includes("regex") || lower.includes("validate") || lower.includes("quyền")) {
    return { category: "Security & Validation", keywords: ["guard", "regex", "validate", "sanitize", "quyền"] };
  }
  if (lower.includes("font") || lower.includes("hiển thị") || lower.includes("lowercase") || lower.includes("chữ hoa") || lower.includes("css") || lower.includes("layout") || lower.includes("màu")) {
    return { category: "UI/UX & Formatting", keywords: ["ui", "layout", "format", "hiển thị", "font", "css", "lowercase"] };
  }
  return { category: "Business Logic", keywords: ["logic", "nghiệp vụ", "scope", "thiết kế"] };
}

export async function grabTruongComments(
  bugs: BugRecord[],
  currentChecklist: ChecklistItem[],
  token?: string
): Promise<{ addedCount: number; updatedCount: number; newItems: ChecklistItem[] }> {
  if (!token) {
    console.warn("No GitHub token provided for grabTruongComments");
    return { addedCount: 0, updatedCount: 0, newItems: [] };
  }

  // Filter trackable bugs with valid GitHub PR URLs
  const prBugs = bugs.filter(b => {
    if (!b.pullRequestUrl) return false;
    const status = (b.status ?? "").toLowerCase();
    if (status === "cancel") return false;
    return true;
  });

  const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github+json" };
  
  // Track IDs of all comments already imported (to prevent double processing in the same run)
  const addedIds = new Set(currentChecklist.map(item => item.id));
  const newItems: ChecklistItem[] = [];
  let updatedCount = 0;

  // Determine starting index for new codes like T-101
  const tCodes = currentChecklist
    .map(item => item.code)
    .filter(code => code.startsWith("T-"))
    .map(code => parseInt(code.replace("T-", ""), 10))
    .filter(num => !isNaN(num));
  let nextIndex = tCodes.length > 0 ? Math.max(...tCodes) + 1 : 101;

  for (const bug of prBugs) {
    const prUrl = bug.pullRequestUrl!;
    const m = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
    if (!m) continue;
    const [, owner, repo, prNumber] = m;
    const repoName = repo; // e.g. "lisa-ai-agent"
    const prPath = `${owner}/${repo}/pull/${prNumber}`;

    try {
      // 1. Fetch Review Comments (inline code comments)
      const reviewCommentsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        { headers, signal: AbortSignal.timeout(4000) }
      );
      const reviewComments: GHComment[] = reviewCommentsRes.ok ? await reviewCommentsRes.json() as GHComment[] : [];

      // 2. Fetch Issue Comments (PR timeline thread comments)
      const issueCommentsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        { headers, signal: AbortSignal.timeout(4000) }
      );
      const issueComments: GHComment[] = issueCommentsRes.ok ? await issueCommentsRes.json() as GHComment[] : [];

      const allComments = [...reviewComments, ...issueComments];

      for (const com of allComments) {
        const author = (com.user?.login ?? "").toLowerCase();
        if (author !== "truongtc" && author !== "dract") continue;

        const body = (com.body ?? "").trim();
        // Skip short comments or simple approvals
        if (body.length < 15) continue;
        if (body.toLowerCase().includes("lgtm") || body.toLowerCase().includes("approved")) continue;

        const itemId = `truong-com-${com.id}`;
        if (addedIds.has(itemId)) continue;

        // Classify the comment to find keywords
        const classification = getCategoryAndKeywords(body);

        // Try to find a matching checklist item in the same repo to MERGE / GROUP
        const existingMatch = [...currentChecklist, ...newItems].find(item => {
          let itemRepo = item.repo || "";
          if (!itemRepo && item.prs[0]) {
            const cleanPath = item.prs[0].replace("https://github.com/", "");
            const parts = cleanPath.split("/");
            itemRepo = parts.length > 1 ? parts[1] : parts[0];
          }
          if (itemRepo.toLowerCase() !== repoName.toLowerCase()) return false;

          // Check if item matches keywords or has the same general category in title/description
          const titleLower = item.title.toLowerCase();
          const descLower = item.description.toLowerCase();
          return classification.keywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
        });

        if (existingMatch) {
          // Merge into existing item
          let modified = false;
          if (!existingMatch.prs.includes(prPath)) {
            existingMatch.prs.push(prPath);
            modified = true;
          }
          
          // Append comment to examples if it's not already in it
          const createdDate = formatCommentDate(com.created_at);
          const commentExample = `[PR #${prNumber} - ${createdDate}]: "${body}"`;
          if (existingMatch.example && !existingMatch.example.includes(body)) {
            existingMatch.example = existingMatch.example + "\n\n" + commentExample;
            modified = true;
          } else if (!existingMatch.example) {
            existingMatch.example = commentExample;
            modified = true;
          }

          if (modified) {
            existingMatch.updatedAt = new Date().toISOString();
            updatedCount++;
          }
          addedIds.add(itemId);
        } else {
          // Create new checklist item
          let title = body.split("\n")[0].trim();
          if (title.length > 60) title = title.slice(0, 57) + "...";

          const createdDate = formatCommentDate(com.created_at);
          const newItem: ChecklistItem = {
            id: itemId,
            code: `T-${nextIndex++}`,
            title: `[T] ${title}`,
            description: body,
            example: `Phát hiện bởi anh Trường lúc ${createdDate} trên PR: ${com.html_url}`,
            lesson: "Review kỹ checklist chung và tự test lại phần liên quan trước khi gửi review.",
            prs: [prPath],
            repo: repoName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          newItems.push(newItem);
          addedIds.add(itemId);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch comments for PR ${prPath}:`, err);
    }
  }

  return { addedCount: newItems.length, updatedCount, newItems };
}
