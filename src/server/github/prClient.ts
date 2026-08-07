import type { BugRecord } from "../../shared/types";

interface GHReview { author: string; state: string; submittedAt: string; }

export async function enrichBugWithGitHub(bug: BugRecord, token?: string): Promise<BugRecord> {
  const prUrl = bug.pullRequestUrl || (() => {
    const match = (bug.note ?? "").match(/https:\/\/github\.com\/[^\s\)]+\/pull\/\d+/i);
    return match ? match[0] : undefined;
  })();
  if (!prUrl) return { ...bug, ghReviewStatus: "No PR" as const, ghReviewCount: 0, ghReviews: [] };
  const matches = Array.from(prUrl.matchAll(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/gi));
  if (matches.length === 0) return { ...bug, ghReviewStatus: "No PR" as const, ghReviewCount: 0, ghReviews: [] };
  if (!token) return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };

  const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github+json" };

  let firstPrAuthor = "";
  let firstPrCreatedAt = "";
  let totalCommitsCount = 0;
  const allLabels = new Set<string>();
  const allReviews: GHReview[] = [];
  let commentsAuthor = 0;
  let commentsTruong = 0;
  let commentsHuyen = 0;
  const huyenTimestamps: number[] = [];
  let huyenReviewRounds = 0;
  let huyenHasApproveWithNote = false;
  let huyenHasChangesRequested = false;

  const isHuyen = (login: string) => {
    const l = (login ?? "").toLowerCase();
    return l === "tranngochuyen1909" || l === "huyentn";
  };

  const isTruong = (login: string) => {
    const l = (login ?? "").toLowerCase();
    return l === "truongtc" || l === "dract";
  };

  for (let idx = 0; idx < matches.length; idx++) {
    const [, owner, repo, pr] = matches[idx];
    try {
      // PR details
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}`, { headers, signal: AbortSignal.timeout(4000) });
      if (prRes.ok) {
        const d = await prRes.json() as any;
        if (idx === 0) {
          firstPrAuthor = d.user?.login ?? "";
          firstPrCreatedAt = d.created_at ?? "";
        }
        totalCommitsCount += Number(d.commits) || 1;
        if (Array.isArray(d.labels)) {
          d.labels.forEach((l: any) => { if (l.name) allLabels.add(String(l.name)); });
        }
      } else if (idx === 0 && (prRes.status === 401 || prRes.status === 403)) {
        return { ...bug, ghReviewStatus: "Error" as const, ghReviewCount: 0, ghReviews: [] };
      }

      // Reviews
      const revRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/reviews`, { headers, signal: AbortSignal.timeout(4000) });
      const revData: any[] = revRes.ok ? await revRes.json() as any[] : [];
      revData.forEach((r: any) => {
        allReviews.push({
          author: r.user?.login ?? "unknown",
          state: String(r.state),
          submittedAt: r.submitted_at ?? "",
        });
      });

      // Comments (inline diff comments)
      const comRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/comments`, { headers, signal: AbortSignal.timeout(4000) });
      const comData: any[] = comRes.ok ? await comRes.json() as any[] : [];

      // Issue comments (general PR thread comments)
      const issueComRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${pr}/comments`, { headers, signal: AbortSignal.timeout(4000) });
      const issueComData: any[] = issueComRes.ok ? await issueComRes.json() as any[] : [];

      const allComments = [...comData, ...issueComData];
      commentsAuthor += allComments.filter(c => (c.user?.login ?? "") === (firstPrAuthor || bug.prAuthor)).length;
      commentsTruong += allComments.filter(c => isTruong(c.user?.login ?? "")).length;
      commentsHuyen += allComments.filter(c => isHuyen(c.user?.login ?? "")).length;

      const huyenRevs = revData.filter(r => isHuyen(r.user?.login ?? ""));
      const huyenInlines = comData.filter(c => isHuyen(c.user?.login ?? ""));
      const huyenIssues = issueComData.filter(c => isHuyen(c.user?.login ?? ""));

      const allHuyenBodies = [
        ...huyenInlines.map(c => String(c.body ?? "").toLowerCase()),
        ...huyenIssues.map(c => String(c.body ?? "").toLowerCase()),
        ...huyenRevs.map(r => String(r.body ?? "").toLowerCase()),
      ];

      if (allHuyenBodies.some(b => b.includes("approve with note"))) {
        huyenHasApproveWithNote = true;
      }
      if (
        allHuyenBodies.some(b =>
          b.includes("medium") ||
          b.includes("high") ||
          b.includes("low") ||
          b.includes("critical") ||
          b.includes("blocker") ||
          b.includes("request changes") ||
          b.includes("repro:") ||
          b.includes("root cause:")
        )
      ) {
        huyenHasChangesRequested = true;
      }

      huyenReviewRounds += huyenRevs.length;

      const prHuyenTimestamps = [
        ...huyenRevs.map(r => r.submitted_at ? new Date(r.submitted_at).getTime() : 0),
        ...huyenInlines.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
        ...huyenIssues.map(c => c.created_at ? new Date(c.created_at).getTime() : 0),
      ].filter(t => t > 0);

      huyenTimestamps.push(...prHuyenTimestamps);

      if (huyenRevs.length === 0 && prHuyenTimestamps.length > 0) {
        prHuyenTimestamps.sort((a, b) => a - b);
        let sessions = 0;
        let lastTime = 0;
        for (const ts of prHuyenTimestamps) {
          if (ts - lastTime > 60 * 60 * 1000) {
            sessions++;
            lastTime = ts;
          }
        }
        huyenReviewRounds += sessions;
      }
    } catch { }
  }

  huyenTimestamps.sort((a, b) => a - b);

  const huyenFirstCommentAt = huyenTimestamps.length > 0
    ? new Date(huyenTimestamps[0]).toISOString()
    : undefined;
  const huyenLastCommentAt = huyenTimestamps.length > 0
    ? new Date(huyenTimestamps[huyenTimestamps.length - 1]).toISOString()
    : undefined;

  let status: BugRecord["ghReviewStatus"] = "No review";
  if (huyenHasApproveWithNote) {
    status = "Approved with Note";
  } else if (
    allReviews.some(r => r.state === "CHANGES_REQUESTED") ||
    Array.from(allLabels).some(l => l.toLowerCase().includes("change")) ||
    huyenHasChangesRequested
  ) {
    status = "Changes Requested";
  } else if (allReviews.some(r => r.state === "APPROVED")) {
    const hasNotes = commentsHuyen > 0 || commentsTruong > 0;
    status = hasNotes ? "Approved with Note" : "Approved";
  } else if (allReviews.some(r => r.state === "COMMENTED")) {
    status = "Commented";
  }

  return {
    ...bug,
    ghReviewStatus: status,
    ghReviewCount: allReviews.length,
    ghReviews: allReviews,
    ghCommitsCount: totalCommitsCount || 1,
    prAuthor: firstPrAuthor || bug.prAuthor,
    prCreatedAt: firstPrCreatedAt || bug.prCreatedAt,
    prCommentsByAuthor: commentsAuthor,
    prCommentsByTruong: commentsTruong,
    prCommentsByHuyen: commentsHuyen,
    huyenFirstCommentAt,
    huyenLastCommentAt,
    huyenReviewRounds,
    huyenHasApproveWithNote,
    huyenHasChangesRequested,
    ghLabels: Array.from(allLabels),
  };
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
