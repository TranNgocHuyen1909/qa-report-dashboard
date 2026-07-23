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
    if (prRes.ok) {
      const d = await prRes.json() as any;
      prAuthor = d.user?.login ?? "";
      prCreatedAt = d.created_at ?? "";
      if (Array.isArray(d.labels)) {
        ghLabels = d.labels.map((l: any) => String(l.name ?? "")).filter(Boolean);
      }
    } else if (prRes.status === 401 || prRes.status === 403) {
      return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };
    }

    // Reviews
    const revRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/reviews`, { headers, signal: AbortSignal.timeout(4000) });
    const revData: any[] = revRes.ok ? await revRes.json() as any[] : [];
    const reviews: GHReview[] = revData.map((r: any) => ({
      author: r.user?.login ?? "unknown",
      state: String(r.state),
      submittedAt: r.submitted_at ?? "",
    }));

    // Comments
    const comRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/comments`, { headers, signal: AbortSignal.timeout(4000) });
    const comData: any[] = comRes.ok ? await comRes.json() as any[] : [];
    const allAuthors = [...revData.map((r: any) => r.user?.login ?? ""), ...comData.map((c: any) => c.user?.login ?? "")].filter(Boolean);
    const prCommentsByAuthor = allAuthors.filter(a => a === prAuthor).length;
    const prCommentsByTruong = allAuthors.filter(a => a.toLowerCase() === "truongtc" || a.toLowerCase() === "dract").length;
    const prCommentsByHuyen = allAuthors.filter(a => a.toLowerCase() === "tranngochuyen1909" || a.toLowerCase() === "huyentn").length;

    // Extract timestamps of Huyen's review activities
    const huyenActivityDates: string[] = [];
    revData.forEach((r: any) => {
      const a = (r.user?.login ?? "").toLowerCase();
      if ((a === "tranngochuyen1909" || a === "huyentn") && r.submitted_at) {
        huyenActivityDates.push(r.submitted_at);
      }
    });
    comData.forEach((c: any) => {
      const a = (c.user?.login ?? "").toLowerCase();
      if ((a === "tranngochuyen1909" || a === "huyentn") && c.created_at) {
        huyenActivityDates.push(c.created_at);
      }
    });
    huyenActivityDates.sort();

    const huyenLastCommentAt = huyenActivityDates.length > 0 ? huyenActivityDates[huyenActivityDates.length - 1] : undefined;
    const huyenReviewRounds = huyenActivityDates.length;

    let status: BugRecord["ghReviewStatus"] = "No review";
    if (reviews.some(r => r.state === "CHANGES_REQUESTED")) status = "Changes Requested";
    else if (reviews.some(r => r.state === "APPROVED")) status = "Approved";
    else if (reviews.some(r => r.state === "COMMENTED")) status = "Commented";

    return {
      ...bug,
      ghReviewStatus: status,
      ghReviewCount: reviews.length,
      ghReviews: reviews,
      prAuthor,
      prCreatedAt,
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
