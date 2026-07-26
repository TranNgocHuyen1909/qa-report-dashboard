import type { BugRecord } from "../../shared/types";

interface GHReview { author: string; state: string; submittedAt: string; }

export async function enrichBugWithGitHub(bug: BugRecord, token?: string): Promise<BugRecord> {
  if (!bug.pullRequestUrl) return { ...bug, ghReviewStatus: "No PR" as const, ghReviewCount: 0, ghReviews: [] };
  const m = bug.pullRequestUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (!m) return { ...bug, ghReviewStatus: "No PR" as const, ghReviewCount: 0, ghReviews: [] };
  if (!token) return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };

  const [, owner, repo, pr] = m;
  const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github+json" };

  try {
    // PR details
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}`, { headers, signal: AbortSignal.timeout(4000) });
    let prAuthor = "", prCreatedAt = "";
    let ghLabels: string[] = [];
    let ghCommitsCount = 1;
    if (prRes.ok) {
      const d = await prRes.json() as any;
      prAuthor = d.user?.login ?? "";
      prCreatedAt = d.created_at ?? "";
      ghCommitsCount = Number(d.commits) || 1;
      if (Array.isArray(d.labels)) {
        ghLabels = d.labels.map((l: any) => String(l.name ?? "")).filter(Boolean);
      }
    } else if (prRes.status === 401 || prRes.status === 403) {
      return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };
    }

    // Commits list to get last commit date
    let prLastCommitAt = prCreatedAt;
    if (ghCommitsCount > 0) {
      try {
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/commits?per_page=100`, { headers, signal: AbortSignal.timeout(3000) });
        if (commitRes.ok) {
          const commitsList = await commitRes.json() as any[];
          if (Array.isArray(commitsList) && commitsList.length > 0) {
            const lastC = commitsList[commitsList.length - 1];
            prLastCommitAt = lastC.commit?.committer?.date || lastC.commit?.author?.date || prCreatedAt;
          }
        }
      } catch {}
    }

    // Reviews
    const revRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/reviews`, { headers, signal: AbortSignal.timeout(4000) });
    const revData: any[] = revRes.ok ? await revRes.json() as any[] : [];
    const reviews: GHReview[] = revData.map((r: any) => ({
      author: r.user?.login ?? "unknown",
      state: String(r.state),
      submittedAt: r.submitted_at ?? "",
    }));

    // Comments (inline diff comments)
    const comRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/comments`, { headers, signal: AbortSignal.timeout(4000) });
    const comData: any[] = comRes.ok ? await comRes.json() as any[] : [];

    // Issue comments (general PR thread comments)
    const issueComRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${pr}/comments`, { headers, signal: AbortSignal.timeout(4000) });
    const issueComData: any[] = issueComRes.ok ? await issueComRes.json() as any[] : [];

    const isHuyen = (login: string) => {
      const l = (login ?? "").toLowerCase();
      return l === "tranngochuyen1909" || l === "huyentn";
    };

    const isTruong = (login: string) => {
      const l = (login ?? "").toLowerCase();
      return l === "truongtc" || l === "dract";
    };

    // Calculate actual comments by author
    const prCommentsByAuthor = [...comData, ...issueComData].filter(c => (c.user?.login ?? "") === prAuthor).length;
    const prCommentsByTruong = [...comData, ...issueComData].filter(c => isTruong(c.user?.login ?? "")).length;
    const prCommentsByHuyen = [...comData, ...issueComData].filter(c => isHuyen(c.user?.login ?? "")).length;

    // Collect activity timestamps for Huyen
    const huyenReviews = revData.filter(r => isHuyen(r.user?.login ?? ""));
    const huyenInlineComments = comData.filter(c => isHuyen(c.user?.login ?? ""));
    const huyenIssueComments = issueComData.filter(c => isHuyen(c.user?.login ?? ""));

    // Number of review rounds = Number of distinct GitHub Review submissions by Huyen
    // If no formal review submission exists but comments exist, fallback to distinct comment sessions (> 1 hour apart)
    let huyenReviewRounds = huyenReviews.length;
    if (huyenReviewRounds === 0) {
      const commentTimestamps = [
        ...huyenInlineComments.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
        ...huyenIssueComments.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
      ].filter(t => t > 0).sort((a, b) => a - b);

      let sessions = 0;
      let lastTime = 0;
      for (const ts of commentTimestamps) {
        if (ts - lastTime > 60 * 60 * 1000) {
          sessions++;
          lastTime = ts;
        }
      }
      huyenReviewRounds = sessions;
    }

    const huyenTimestamps: number[] = [
      ...huyenReviews.map(r => r.submitted_at ? new Date(r.submitted_at).getTime() : 0),
      ...huyenInlineComments.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
      ...huyenIssueComments.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
    ].filter(t => t > 0).sort((a, b) => a - b);

    const huyenLastCommentAt = huyenTimestamps.length > 0
      ? new Date(huyenTimestamps[huyenTimestamps.length - 1]).toISOString()
      : undefined;

    let status: BugRecord["ghReviewStatus"] = "No review";
    if (reviews.some(r => r.state === "CHANGES_REQUESTED")) status = "Changes Requested";
    else if (reviews.some(r => r.state === "APPROVED")) status = "Approved";
    else if (reviews.some(r => r.state === "COMMENTED")) status = "Commented";

    return {
      ...bug,
      ghReviewStatus: status,
      ghReviewCount: reviews.length,
      ghReviews: reviews,
      ghCommitsCount,
      prAuthor,
      prCreatedAt,
      prLastCommitAt,
      prCommentsByAuthor,
      prCommentsByTruong,
      prCommentsByHuyen,
      huyenLastCommentAt,
      huyenReviewRounds,
      ghLabels,
    };
  } catch {
    return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };
  }
}

export async function enrichAllBugs(bugs: BugRecord[], token?: string): Promise<BugRecord[]> {
  // Process in batches of 5 to avoid rate limits
  const result: BugRecord[] = [];
  for (let i = 0; i < bugs.length; i += 5) {
    const batch = bugs.slice(i, i + 5);
    const enriched = await Promise.all(batch.map(b => enrichBugWithGitHub(b, token)));
    result.push(...enriched);
  }
  return result;
}
