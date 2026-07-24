import React, { useMemo, useState, useEffect, Fragment } from "react";
import type { DashboardView, BugRecord, Person } from "../../shared/types";

// Helper to extract date key YYYY-MM-DD
function dateKey(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const k = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined;
}

// Helper to check if a date is within a range
function dateInRange(
  d: string | undefined,
  start?: string,
  end?: string,
): boolean {
  if (!start || !end) return true;
  return !!d && d >= start && d <= end;
}

export function ReviewStats({
  view,
  periodType,
  periodKey,
}: {
  view: DashboardView;
  periodType?: string;
  periodKey?: string;
}) {
  const [subTab, setSubTab] = useState<"all" | "truong" | "huyen">("huyen");
  const [selectedDevFilter, setSelectedDevFilter] = useState<string>("all");
  const [huyenCommentFilter, setHuyenCommentFilter] = useState<
    | "all"
    | "comments"
    | "nocomments"
    | "multiround"
    | "dev_replied"
    | "pending_reply"
  >("all");
  const [truongCommentFilter, setTruongCommentFilter] = useState<
    "all" | "approved" | "changes_requested" | "commented" | "wait_dev" | "fresh_pending"
  >("all");
  const [allCommentFilter, setAllCommentFilter] = useState<
    "all" | "huyen" | "truong" | "completed"
  >("all");

  const [selectedLocFilter, setSelectedLocFilter] = useState<string>("all");
  const [detailSubTab, setDetailSubTab] = useState<
    "pending" | "reviewed" | "sidebyside"
  >("pending");
  const [pauseFilter, setPauseFilter] = useState<"all" | "active" | "paused">(
    "all",
  );

  const detailsTableRef = React.useRef<HTMLDivElement>(null);

  const scrollToDetails = () => {
    setTimeout(() => {
      if (detailsTableRef.current) {
        detailsTableRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  // Pagination states
  const [pageReviewed, setPageReviewed] = useState<number>(1);
  const [pagePending, setPagePending] = useState<number>(1);
  const [pageTruongReviewed, setPageTruongReviewed] = useState<number>(1);
  const [pageTruongPending, setPageTruongPending] = useState<number>(1);
  const [pageAllReviewed, setPageAllReviewed] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination when any filter changes
  useEffect(() => {
    setPageReviewed(1);
    setPagePending(1);
    setPageTruongReviewed(1);
    setPageTruongPending(1);
    setPageAllReviewed(1);
  }, [
    selectedDevFilter,
    huyenCommentFilter,
    truongCommentFilter,
    allCommentFilter,
    selectedLocFilter,
    pauseFilter,
    detailSubTab,
    subTab,
  ]);

  // Extract all unique bug locations for filter
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    view.bugs.forEach((b) => {
      (b.location ?? []).forEach((l) => locSet.add(l));
    });
    return Array.from(locSet).sort();
  }, [view.bugs]);

  // Notion Location tag color map (Subtle dark glassmorphism)
  const getLocationTagStyle = (loc: string) => {
    const l = loc.toLowerCase();
    if (l.includes("metadata")) {
      return { bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)" };
    }
    if (l.includes("flow")) {
      return { bg: "rgba(20, 184, 166, 0.15)", color: "#2dd4bf", border: "1px solid rgba(20, 184, 166, 0.3)" };
    }
    if (l.includes("doc")) {
      return { bg: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.3)" };
    }
    if (l.includes("ui") || l.includes("ux")) {
      return { bg: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)" };
    }
    if (l.includes("prompt")) {
      return { bg: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", border: "1px solid rgba(148, 163, 184, 0.3)" };
    }
    if (l.includes("performance") || l.includes("tool")) {
      return { bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" };
    }
    return { bg: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", border: "1px solid rgba(255, 255, 255, 0.1)" };
  };

  // Find active period details from topbar filters
  const activePeriod = useMemo(() => {
    if (periodKey) {
      return view.availablePeriods.find((p) => p.key === periodKey);
    }
    return undefined; // undefined = Tất cả các kỳ (All time)
  }, [view.availablePeriods, periodKey]);

  // Personnel lists
  const all4People = useMemo(() => {
    // Huyền, Hoàng, Hồ, Huy
    return view.personnel.filter(
      (p) =>
        p.role !== "benchmark" &&
        (!p.startDate ||
          !activePeriod?.endDate ||
          p.startDate <= activePeriod.endDate),
    );
  }, [view.personnel, activePeriod]);

  const dev3People = useMemo(() => {
    // Hoàng, Hồ, Huy
    return view.personnel.filter(
      (p) =>
        p.role !== "benchmark" &&
        p.role !== "lead" &&
        (!p.startDate ||
          !activePeriod?.endDate ||
          p.startDate <= activePeriod.endDate),
    );
  }, [view.personnel, activePeriod]);

  // Helper to match a bug to a person
  const bugBelongsToPerson = (bug: BugRecord, person: Person) => {
    if (bug.pullRequestUrl && bug.prAuthor) {
      const prAuthorLower = bug.prAuthor.toLowerCase();
      if (
        person.githubUsername &&
        prAuthorLower === person.githubUsername.toLowerCase()
      )
        return true;
      if (
        view.personnel.some(
          (p) =>
            p.code !== person.code &&
            p.githubUsername &&
            p.githubUsername.toLowerCase() === prAuthorLower,
        )
      )
        return false;
    }
    const notionIds = person.notionIds || [];
    return (bug.fixedByIds ?? []).some((id) => notionIds.includes(id));
  };

  // Helper to get dev code by bug
  const getDevNameByBug = (bug: BugRecord) => {
    const matched = all4People.find((p) => bugBelongsToPerson(bug, p));
    return matched ? matched.code : "—";
  };

  const isNoRepro = (b: BugRecord) => {
    const note = (b.note ?? "").toLowerCase();
    return note.includes("không tái hiện") || note.includes("ko tái hiện");
  };

  const isFixed = (b: BugRecord) => {
    const st = (b.status ?? "").toLowerCase();
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    return (
      ([
        "closed",
        "deployed",
        "resolved",
        "wait for development",
        "wait for deployment",
        "ready for review",
        "ready for re-review",
        "change requested",
        "changes requested",
      ].includes(st) ||
        st.includes("wait") ||
        st.includes("ready") ||
        st.includes("change") ||
        ghLbls.length > 0) &&
      !isNoRepro(b)
    );
  };

  const renderLabelBadge = (bug: BugRecord) => {
    if (isBugPausedFix(bug)) {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Tạm dừng fix
        </span>
      );
    }
    // 1. Render GitHub PR Labels if available
    if (bug.ghLabels && bug.ghLabels.length > 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            alignItems: "center",
          }}
        >
          {bug.ghLabels.map((lbl, idx) => {
            const lLower = lbl.toLowerCase();
            let bg = "rgba(255, 255, 255, 0.06)";
            let color = "#cbd5e1";
            let border = "1px solid rgba(255, 255, 255, 0.12)";

            if (lLower.includes("wait")) {
              bg = "rgba(56, 189, 248, 0.15)";
              color = "#38bdf8";
              border = "1px solid rgba(56, 189, 248, 0.3)";
            } else if (lLower.includes("ready")) {
              bg = "rgba(14, 165, 233, 0.15)";
              color = "#38bdf8";
              border = "1px solid rgba(14, 165, 233, 0.3)";
            } else if (lLower.includes("change")) {
              bg = "rgba(244, 63, 94, 0.15)";
              color = "#fb7185";
              border = "1px solid rgba(244, 63, 94, 0.3)";
            } else if (
              lLower.includes("resolved") ||
              lLower.includes("close") ||
              lLower.includes("merge")
            ) {
              bg = "rgba(34, 197, 94, 0.15)";
              color = "#4ade80";
              border = "1px solid rgba(34, 197, 94, 0.3)";
            }
            return (
              <span
                key={idx}
                className="tag"
                style={{
                  background: bg,
                  color,
                  border,
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {lbl}
              </span>
            );
          })}
        </div>
      );
    }

    // 2. Fallback to Notion Status
    const status = (bug.status ?? "").toLowerCase();
    if (status === "resolved") {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(56, 189, 248, 0.15)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Resolved
        </span>
      );
    }
    if (status === "wait for development" || status.includes("wait")) {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            color: "#4ade80",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Wait for dev
        </span>
      );
    }
    if (status === "change requested" || status.includes("change")) {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(244, 63, 94, 0.15)",
            color: "#fb7185",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Changes requested
        </span>
      );
    }
    if (status === "ready for review" || status.includes("ready")) {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(14, 165, 233, 0.15)",
            color: "#38bdf8",
            border: "1px solid rgba(14, 165, 233, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Ready for review
        </span>
      );
    }
    if (status === "deployed" || status.includes("deploy")) {
      return (
        <span
          className="tag"
          style={{
            background: "rgba(168, 85, 247, 0.15)",
            color: "#c084fc",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Deployed
        </span>
      );
    }
    if (status === "closed") {
      return (
        <span
          className="tag"
          style={{
            background: "#dcfce7",
            color: "#166534",
            border: "1px solid #bbf7d0",
            fontSize: "10px",
            fontWeight: "600",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Closed
        </span>
      );
    }
    if (status === "reopened" || status.includes("reopen")) {
      return (
        <span
          className="tag"
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            fontSize: "10px",
            fontWeight: "bold",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          🔴 Reopened
        </span>
      );
    }
    return (
      <span
        className="tag"
        style={{
          background: "#f3f4f6",
          color: "#374151",
          border: "1px solid #e5e7eb",
          fontSize: "10px",
          fontWeight: "bold",
          padding: "2px 6px",
          borderRadius: "4px",
        }}
      >
        {bug.status || "Chưa có Status"}
      </span>
    );
  };

  // Check if bug was reviewed by HuyenTN:
  // 1. Review có comment: Có comment của TranNgocHuyen1909 trên GitHub PR
  // 2. Review không comment (Pass 100%): Đã gắn Label PR 'wait for deployment' / 'wait for dev' trên GitHub HOẶC Notion Status
  // 3. Notion Reviewers field có chứa ID của Huyền
  const isReviewedByHuyen = (b: BugRecord) => {
    const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
    const status = (b.status ?? "").toLowerCase();
    const huyenComments = b.prCommentsByHuyen ?? 0;
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    const isWaitLabelOnPR = ghLbls.some((l) => l.includes("wait"));

    return (
      huyenComments > 0 ||
      isWaitLabelOnPR ||
      (b.reviewerIds ?? []).includes(huyenNotionId) ||
      status === "wait for development" ||
      status.includes("wait") ||
      status === "deployed" ||
      status === "closed"
    );
  };

  // Helper to get bug fixed date
  const bugFixedDate = (b: BugRecord) => {
    if (b.pullRequestUrl && b.prCreatedAt) {
      return dateKey(b.prCreatedAt);
    }
    return dateKey(b.lastEditedTime) ?? dateKey(b.confirmedDate);
  };

  // Bugs fixed in active period
  const periodFixedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const fDate = bugFixedDate(b);
      return (
        dateInRange(fDate, activePeriod?.startDate, activePeriod?.endDate) &&
        isFixed(b) &&
        (b.status ?? "").toLowerCase() !== "cancel"
      );
    });
  }, [view.bugs, activePeriod]);

  // ── HUYEN REVIEW TAB DATA ──
  // Filter bugs reviewed by HuyenTN in active period (prioritizing exact GitHub comment timestamp by TranNgocHuyen1909)
  const huyenReviewedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      if ((b.status ?? "").toLowerCase() === "cancel") return false;
      if (!isReviewedByHuyen(b)) return false;
      const rDate =
        dateKey(b.huyenLastCommentAt) ||
        b.confirmedDate ||
        dateKey(b.prCreatedAt) ||
        dateKey(b.lastEditedTime);
      return dateInRange(rDate, activePeriod?.startDate, activePeriod?.endDate);
    });
  }, [view.bugs, activePeriod]);

  // Check if Huyen commented on this PR on GitHub (user TranNgocHuyen1909) OR left a note on Notion
  // NOTE: Counting rule: 1 PR with 1 or 10 comments by TranNgocHuyen1909 is counted as 1 PR (1 Bug) in summary stats!
  const isHuyenBugWithComment = (b: BugRecord) => {
    const huyenComments = b.prCommentsByHuyen ?? 0;
    const hasNotionNote = (b.note ?? "").trim().length > 0 && !isNoRepro(b);
    return huyenComments > 0 || hasNotionNote;
  };

  const huyenReviewedWithComments = useMemo(() => {
    return huyenReviewedBugs.filter(isHuyenBugWithComment);
  }, [huyenReviewedBugs]);

  const huyenReviewedNoComments = useMemo(() => {
    return huyenReviewedBugs.filter((b) => !isHuyenBugWithComment(b));
  }, [huyenReviewedBugs]);

  // PRs requiring >1 review round (Multi-turn recheck by TranNgocHuyen1909)
  const huyenMultiRoundBugs = useMemo(() => {
    return huyenReviewedBugs.filter((b) => (b.huyenReviewRounds ?? 0) > 1);
  }, [huyenReviewedBugs]);

  // Filter bugs waiting for Huyen review (Only bugs where dev HAS fixed it e.g. status 'Resolved' or ready labels, and NOT New, In Progress, Cancel, Closed, or Merged)
  const pendingHuyenReviewBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const st = (b.status ?? "").toLowerCase();
      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
      const isClosedOrMerged =
        st.includes("close") ||
        st.includes("merge") ||
        ghLbls.some((l) => l.includes("close") || l.includes("merge"));

      if (isClosedOrMerged) return false; // Vứt đi nếu Notion status hay PR status là Close / Merged (Anh Trường đã review/merge trước)
      if (st === "cancel" || st === "new" || st === "in progress") return false;
      if (!isFixed(b)) return false; // Exclude unfixed bugs
      if (isReviewedByHuyen(b)) return false; // Exclude already reviewed bugs

      const rDate =
        dateKey(b.prCreatedAt) ??
        dateKey(b.lastEditedTime) ??
        dateKey(b.createdTime);
      return dateInRange(rDate, activePeriod?.startDate, activePeriod?.endDate);
    });
  }, [view.bugs, activePeriod]);



  // Compute breakdown for developers under Huyen
  const devReviewStats = useMemo(() => {
    return dev3People.map((dev) => {
      const devBugs = huyenReviewedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      );
      const fixedCount = periodFixedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const reviewedCount = devBugs.length;
      const withCommentCount = devBugs.filter(isHuyenBugWithComment).length;
      const noCommentCount = devBugs.length - withCommentCount;
      const pendingCount = pendingHuyenReviewBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const reviewRate =
        fixedCount > 0 ? (reviewedCount / fixedCount) * 100 : 0;
      return {
        dev,
        fixedCount,
        reviewedCount,
        withCommentCount,
        noCommentCount,
        pendingCount,
        reviewRate,
      };
    });
  }, [dev3People, periodFixedBugs, huyenReviewedBugs, pendingHuyenReviewBugs]);

  const isDevRepliedBug = (b: BugRecord) => {
    if (!isHuyenBugWithComment(b)) return false;
    const stLower = (b.status ?? "").toLowerCase();

    // Nếu đã chuyển sang wait for dev / closed / deployed thì bước re-review đổi label đã hoàn tất
    if (
      stLower === "wait for development" ||
      stLower.includes("wait") ||
      stLower === "closed" ||
      stLower === "deployed"
    ) {
      return false;
    }

    const hasDevComment =
      (b.prCommentsByAuthor ?? 0) > 0 || (b.huyenReviewRounds ?? 0) > 1;
    const isResolvedByDev = stLower === "resolved" || stLower.includes("ready");

    return hasDevComment || isResolvedByDev;
  };

  const huyenDevRepliedBugs = useMemo(() => {
    return huyenReviewedBugs.filter(isDevRepliedBug);
  }, [huyenReviewedBugs]);

  const huyenPendingReplyBugs = useMemo(() => {
    return huyenReviewedBugs.filter(
      (b) => isHuyenBugWithComment(b) && !isDevRepliedBug(b),
    );
  }, [huyenReviewedBugs]);

  // ── TRUONG REVIEW TAB DATA ──
  const truongTotalPrs = useMemo(() => {
    return periodFixedBugs.filter(
      (b) => !!b.pullRequestUrl && (b.status ?? "").toLowerCase() !== "cancel",
    );
  }, [periodFixedBugs]);

  const truongReviewedBugs = useMemo(() => {
    return periodFixedBugs.filter(
      (b) =>
        !!b.pullRequestUrl &&
        (b.ghReviewStatus === "Approved" ||
          b.ghReviewStatus === "Changes Requested" ||
          b.ghReviewStatus === "Commented" ||
          (b.prCommentsByTruong ?? 0) > 0),
    );
  }, [periodFixedBugs]);

  const isTruongApprovedBug = (b: BugRecord) => {
    if (!b.pullRequestUrl) return false;
    const st = (b.status ?? "").toLowerCase();
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    return (
      b.ghReviewStatus === "Approved" ||
      st === "closed" ||
      st === "deployed" ||
      ghLbls.some((l) => l.includes("close") || l.includes("merge"))
    );
  };

  const truongApprovedBugs = useMemo(() => {
    return periodFixedBugs.filter(isTruongApprovedBug);
  }, [periodFixedBugs]);

  const truongChangesReqBugs = useMemo(() => {
    return truongReviewedBugs.filter(
      (b) => b.ghReviewStatus === "Changes Requested",
    );
  }, [truongReviewedBugs]);

  const truongPendingBugs = useMemo(() => {
    return periodFixedBugs.filter(
      (b) =>
        !!b.pullRequestUrl &&
        b.ghReviewStatus !== "Approved" &&
        (b.prCommentsByTruong ?? 0) === 0 &&
        (b.status ?? "").toLowerCase() !== "cancel",
    );
  }, [periodFixedBugs]);

  const truongDevStats = useMemo(() => {
    return all4People.map((dev) => {
      const devPrs = truongTotalPrs.filter((b) => bugBelongsToPerson(b, dev));
      const reviewedCount = truongReviewedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const approvedCount = truongApprovedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const changeReqCount = truongChangesReqBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const pendingCount = truongPendingBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;

      const changeReqRatePersonal =
        reviewedCount > 0
          ? ((changeReqCount / reviewedCount) * 100).toFixed(0)
          : "0";
      const totalTeamChangeReq = truongChangesReqBugs.length;
      const changeReqRateTeamShare =
        totalTeamChangeReq > 0
          ? ((changeReqCount / totalTeamChangeReq) * 100).toFixed(0)
          : "0";
      const approveRate =
        devPrs.length > 0 ? (approvedCount / devPrs.length) * 100 : 0;

      return {
        dev,
        totalPrs: devPrs.length,
        reviewedCount,
        approvedCount,
        changeReqCount,
        pendingCount,
        changeReqRatePersonal,
        changeReqRateTeamShare,
        approveRate,
      };
    });
  }, [
    all4People,
    truongTotalPrs,
    truongReviewedBugs,
    truongApprovedBugs,
    truongChangesReqBugs,
    truongPendingBugs,
  ]);

  // ── ALL TAB DATA ──
  const allCompletedBugs = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      const st = (b.status ?? "").toLowerCase();
      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
      return (
        st === "closed" ||
        st === "deployed" ||
        ghLbls.some((l) => l.includes("close") || l.includes("merge"))
      );
    });
  }, [periodFixedBugs]);

  const allDevStats = useMemo(() => {
    return all4People.map((dev) => {
      const devFixed = periodFixedBugs.filter((b) => bugBelongsToPerson(b, dev));
      const huyenRevCount = huyenReviewedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const truongRevCount = truongReviewedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const completedCount = allCompletedBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;

      const huyenCommentCount = huyenReviewedWithComments.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const errRateHuyen =
        huyenRevCount > 0
          ? ((huyenCommentCount / huyenRevCount) * 100).toFixed(0)
          : "0";

      const truongChangeReqCount = truongChangesReqBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const errRateTruong =
        truongRevCount > 0
          ? ((truongChangeReqCount / truongRevCount) * 100).toFixed(0)
          : "0";

      const overallProgress =
        devFixed.length > 0 ? (completedCount / devFixed.length) * 100 : 0;

      return {
        dev,
        fixedCount: devFixed.length,
        huyenRevCount,
        truongRevCount,
        completedCount,
        errRateHuyen,
        errRateTruong,
        overallProgress,
      };
    });
  }, [
    all4People,
    periodFixedBugs,
    huyenReviewedBugs,
    truongReviewedBugs,
    huyenReviewedWithComments,
    truongChangesReqBugs,
    allCompletedBugs,
  ]);

  const truongWaitDevBugs = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      if (!b.pullRequestUrl) return false;
      const st = (b.status ?? "").toLowerCase();
      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
      return (
        st === "wait for development" ||
        st.includes("wait") ||
        ghLbls.some((l) => l.includes("wait"))
      );
    });
  }, [periodFixedBugs]);

  const truongCommentedBugs = useMemo(() => {
    return periodFixedBugs.filter(
      (b) => !!b.pullRequestUrl && (b.prCommentsByTruong ?? 0) > 0,
    );
  }, [periodFixedBugs]);

  const truongFreshPendingBugs = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      if (!b.pullRequestUrl) return false;
      const st = (b.status ?? "").toLowerCase();
      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
      const isWait =
        st === "wait for development" ||
        st.includes("wait") ||
        ghLbls.some((l) => l.includes("wait"));
      const isApproved = isTruongApprovedBug(b);
      const isChangesReq = b.ghReviewStatus === "Changes Requested";
      const hasTruongComment = (b.prCommentsByTruong ?? 0) > 0;
      return (
        !isWait &&
        !isApproved &&
        !isChangesReq &&
        !hasTruongComment &&
        st !== "cancel"
      );
    });
  }, [periodFixedBugs]);

  // Displayed filter helpers for Truong tab & All tab
  const displayedTruongReviewed = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      if (!b.pullRequestUrl) return false;
      if (selectedDevFilter !== "all") {
        const dev = all4People.find((p) => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (selectedLocFilter !== "all") {
        if (!(b.location ?? []).includes(selectedLocFilter)) return false;
      }
      if (truongCommentFilter === "approved")
        return isTruongApprovedBug(b);
      if (truongCommentFilter === "changes_requested")
        return b.ghReviewStatus === "Changes Requested";
      if (truongCommentFilter === "commented")
        return (b.prCommentsByTruong ?? 0) > 0;
      if (truongCommentFilter === "wait_dev") {
        const st = (b.status ?? "").toLowerCase();
        const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
        return (
          st === "wait for development" ||
          st.includes("wait") ||
          ghLbls.some((l) => l.includes("wait"))
        );
      }
      if (truongCommentFilter === "fresh_pending") {
        const st = (b.status ?? "").toLowerCase();
        const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
        const isWait =
          st === "wait for development" ||
          st.includes("wait") ||
          ghLbls.some((l) => l.includes("wait"));
        const isApproved = isTruongApprovedBug(b);
        const isChangesReq = b.ghReviewStatus === "Changes Requested";
        const hasTruongComment = (b.prCommentsByTruong ?? 0) > 0;
        return (
          !isWait &&
          !isApproved &&
          !isChangesReq &&
          !hasTruongComment &&
          st !== "cancel"
        );
      }
      return true;
    });
  }, [
    periodFixedBugs,
    selectedDevFilter,
    selectedLocFilter,
    truongCommentFilter,
    all4People,
  ]);

  const displayedTruongPending = useMemo(() => {
    return truongPendingBugs.filter((b) => {
      if (selectedDevFilter !== "all") {
        const dev = all4People.find((p) => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (selectedLocFilter !== "all") {
        if (!(b.location ?? []).includes(selectedLocFilter)) return false;
      }
      return true;
    });
  }, [truongPendingBugs, selectedDevFilter, selectedLocFilter, all4People]);

  const displayedAllBugs = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      if (selectedDevFilter !== "all") {
        const dev = all4People.find((p) => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (selectedLocFilter !== "all") {
        if (!(b.location ?? []).includes(selectedLocFilter)) return false;
      }
      if (allCommentFilter === "huyen") return isReviewedByHuyen(b);
      if (allCommentFilter === "truong")
        return !!b.pullRequestUrl && b.ghReviewStatus === "Approved";
      if (allCommentFilter === "completed") {
        const st = (b.status ?? "").toLowerCase();
        const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
        return (
          st === "closed" ||
          st === "deployed" ||
          ghLbls.some((l) => l.includes("close") || l.includes("merge"))
        );
      }
      return true;
    });
  }, [
    periodFixedBugs,
    selectedDevFilter,
    selectedLocFilter,
    allCommentFilter,
    all4People,
  ]);

  // Paged items for Truong tab
  const pagedTruongReviewedBugs = useMemo(() => {
    const start = (pageTruongReviewed - 1) * pageSize;
    return displayedTruongReviewed.slice(start, start + pageSize);
  }, [displayedTruongReviewed, pageTruongReviewed, pageSize]);

  const pagedTruongPendingBugs = useMemo(() => {
    const start = (pageTruongPending - 1) * pageSize;
    return displayedTruongPending.slice(start, start + pageSize);
  }, [displayedTruongPending, pageTruongPending, pageSize]);

  // Paged items for All tab
  const pagedAllBugs = useMemo(() => {
    const start = (pageAllReviewed - 1) * pageSize;
    return displayedAllBugs.slice(start, start + pageSize);
  }, [displayedAllBugs, pageAllReviewed, pageSize]);

  // Filter Huyen reviewed bugs by selected developer, location, and comment filter
  const displayedReviewed = useMemo(() => {
    return huyenReviewedBugs.filter((b) => {
      if (selectedDevFilter !== "all") {
        const dev = dev3People.find((p) => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (selectedLocFilter !== "all") {
        if (!(b.location ?? []).includes(selectedLocFilter)) return false;
      }
      if (huyenCommentFilter === "comments") return isHuyenBugWithComment(b);
      if (huyenCommentFilter === "nocomments") return !isHuyenBugWithComment(b);
      if (huyenCommentFilter === "multiround")
        return (b.huyenReviewRounds ?? 0) > 1;
      if (huyenCommentFilter === "dev_replied") return isDevRepliedBug(b);
      if (huyenCommentFilter === "pending_reply")
        return isHuyenBugWithComment(b) && !isDevRepliedBug(b);
      return true;
    });
  }, [
    huyenReviewedBugs,
    selectedDevFilter,
    selectedLocFilter,
    huyenCommentFilter,
    dev3People,
  ]);

  // Helper to check if bug fix is paused (Tạm dừng fix)
  const isBugPausedFix = (b: BugRecord) => {
    if (b.isPausedFix === true) return true;
    const st = (b.status ?? "").toLowerCase();
    const note = (b.note ?? "").toLowerCase();
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());

    return (
      st.includes("tạm dừng") ||
      st.includes("pause") ||
      st.includes("on hold") ||
      st.includes("hold") ||
      ghLbls.some(
        (l) =>
          l.includes("pause") || l.includes("hold") || l.includes("tạm dừng"),
      ) ||
      note.includes("tạm dừng fix") ||
      note.includes("tạm dừng")
    );
  };

  // Filter Huyen pending bugs by selected developer, location, and pause status
  const displayedPending = useMemo(() => {
    return pendingHuyenReviewBugs.filter((b) => {
      if (selectedDevFilter !== "all") {
        const dev = dev3People.find((p) => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (selectedLocFilter !== "all") {
        if (!(b.location ?? []).includes(selectedLocFilter)) return false;
      }
      if (pauseFilter === "active" && isBugPausedFix(b)) return false;
      if (pauseFilter === "paused" && !isBugPausedFix(b)) return false;
      return true;
    });
  }, [
    pendingHuyenReviewBugs,
    selectedDevFilter,
    selectedLocFilter,
    pauseFilter,
    dev3People,
  ]);

  // Count pending bugs by pause status
  const pendingActiveCount = useMemo(() => {
    return pendingHuyenReviewBugs.filter((b) => !isBugPausedFix(b)).length;
  }, [pendingHuyenReviewBugs]);

  const pendingPausedCount = useMemo(() => {
    return pendingHuyenReviewBugs.filter((b) => isBugPausedFix(b)).length;
  }, [pendingHuyenReviewBugs]);

  // Paged Reviewed Bugs
  const reviewedFilteredNoHuyen = useMemo(() => {
    return displayedReviewed.filter((b) => getDevNameByBug(b) !== "HuyenTN");
  }, [displayedReviewed]);

  const totalPagesReviewed =
    Math.ceil(reviewedFilteredNoHuyen.length / pageSize) || 1;

  const pagedReviewedBugs = useMemo(() => {
    const start = (pageReviewed - 1) * pageSize;
    return reviewedFilteredNoHuyen.slice(start, start + pageSize);
  }, [reviewedFilteredNoHuyen, pageReviewed, pageSize]);

  // Paged Pending Bugs
  const pendingFilteredNoHuyen = useMemo(() => {
    return displayedPending.filter((b) => getDevNameByBug(b) !== "HuyenTN");
  }, [displayedPending]);

  const totalPagesPending =
    Math.ceil(pendingFilteredNoHuyen.length / pageSize) || 1;

  const pagedPendingBugs = useMemo(() => {
    const start = (pagePending - 1) * pageSize;
    return pendingFilteredNoHuyen.slice(start, start + pageSize);
  }, [pendingFilteredNoHuyen, pagePending, pageSize]);

  // Helper to render pagination footer bar
  const renderPaginationFooter = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (p: number) => void,
  ) => {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "var(--surface-3)",
          borderTop: "1px solid var(--border-3)",
          fontSize: "11px",
          color: "var(--text-2)",
          borderRadius: "0 0 6px 6px",
        }}
      >
        <div>
          Hiển thị{" "}
          <strong>
            {startItem}-{endItem}
          </strong>{" "}
          / <strong>{totalItems}</strong> bug
        </div>

        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button
            className="ctrl"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "default" : "pointer",
            }}
          >
            ◄ Trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
            )
            .map((p, i, arr) => {
              const prev = arr[i - 1];
              const showEllipsis = prev && p - prev > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && (
                    <span style={{ padding: "0 2px" }}>...</span>
                  )}
                  <button
                    className={`ctrl ${currentPage === p ? "ctrl-primary" : ""}`}
                    onClick={() => onPageChange(p)}
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      minWidth: "26px",
                      fontWeight: currentPage === p ? "bold" : "normal",
                    }}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            className="ctrl"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              opacity: currentPage >= totalPages ? 0.5 : 1,
              cursor: currentPage >= totalPages ? "default" : "pointer",
            }}
          >
            Sau ►
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1 className="section-title">
            Hoạt động Review &amp; Trạng thái PR (
            {activePeriod?.label ?? "Tất cả kỳ"})
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Quản trị luồng QA: HoangGV, HoNX, HuyDH →{" "}
            <strong>Huyền review</strong> (rỗng label → wait for development) →{" "}
            <strong>Anh Trường review</strong> (wait for development →
            close/change requested).
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "var(--surface-3)",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          <button
            className={`ctrl ${subTab === "all" ? "ctrl-primary" : ""}`}
            style={{
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              setSubTab("all");
              setSelectedDevFilter("all");
            }}
          >
            Tất cả
          </button>
          <button
            className={`ctrl ${subTab === "truong" ? "ctrl-primary" : ""}`}
            style={{
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              setSubTab("truong");
              setSelectedDevFilter("all");
            }}
          >
            Anh Trường Review
          </button>
          <button
            className={`ctrl ${subTab === "huyen" ? "ctrl-primary" : ""}`}
            style={{
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              setSubTab("huyen");
              setSelectedDevFilter("all");
            }}
          >
            Huyền Review
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: ALL OVERVIEW & MATRIX */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "all" && (
        <>
          {/* 5 Top KPI Cards for All Tab */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
            }}
          >
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--accent)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>TỔNG BUG DỰ ÁN</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--text-1)" }}>{periodFixedBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug đã fix trong kỳ</div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--purple)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>VÒNG 1: HUYỀN REVIEW</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--purple)" }}>{huyenReviewedBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug QC Lead đã test</div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--green)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>VÒNG 2: TRƯỜNG DUYỆT</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--green)" }}>{truongReviewedBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>PR Tech Lead đã check</div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--blue)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>HOÀN THÀNH (CLOSED)</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--blue)" }}>{allCompletedBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug đã đóng hoàn toàn</div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--yellow)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>ĐANG XỬ LÝ (PENDING)</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--yellow)" }}>{Math.max(0, periodFixedBugs.length - allCompletedBugs.length)}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug đang trong luồng QA</div>
            </div>
          </div>

          {/* Dev Breakdown Table for All Tab */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-3)", background: "var(--surface-2)", fontWeight: "600", fontSize: "13px" }}>
              Thống kê Tổng quan cả 2 Vòng Review theo Tác giả (Hoàng, Hồ, Huy, Huyền)
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-3)", color: "var(--text-2)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>TÁC GIẢ</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TỔNG FIX</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>HUYỀN REVIEW</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TRƯỜNG DUYỆT</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TỶ LỆ LỖI VÒNG 1</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TỶ LỆ CẦN SỬA VÒNG 2</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>HOÀN THÀNH</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TIẾN ĐỘ CHUNG</th>
                  </tr>
                </thead>
                <tbody>
                  {allDevStats.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      <td style={{ padding: "8px 12px", fontWeight: "600", cursor: "pointer", color: "var(--accent-2)", textDecoration: "underline" }}
                        onClick={() => { setSelectedDevFilter(row.dev.code); scrollToDetails(); }}
                        title={`Click để lọc tất cả bug của ${row.dev.code}`}
                      >
                        {row.dev.code}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "600", color: "var(--text-1)", cursor: "pointer" }}
                        onClick={() => { setSelectedDevFilter(row.dev.code); scrollToDetails(); }}
                      >
                        {row.fixedCount} bug
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--purple)", fontWeight: "600", cursor: "pointer" }}
                        onClick={() => { setSelectedDevFilter(row.dev.code); setAllCommentFilter("huyen"); scrollToDetails(); }}
                      >
                        {row.huyenRevCount} bug
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--green)", fontWeight: "600", cursor: "pointer" }}
                        onClick={() => { setSelectedDevFilter(row.dev.code); setAllCommentFilter("truong"); scrollToDetails(); }}
                      >
                        {row.truongRevCount} PR
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "700", color: Number(row.errRateHuyen) > 30 ? "var(--red)" : "var(--green)" }}>
                        {row.errRateHuyen}%
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "700", color: Number(row.errRateTruong) > 30 ? "var(--red)" : "var(--green)" }}>
                        {row.errRateTruong}%
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--blue)", fontWeight: "600", cursor: "pointer" }}
                        onClick={() => { setSelectedDevFilter(row.dev.code); setAllCommentFilter("completed"); scrollToDetails(); }}
                      >
                        {row.completedCount} bug
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-2)", fontWeight: "600" }}>
                        {row.overallProgress.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Table Section for All Tab */}
          <div ref={detailsTableRef} className="card" style={{ padding: "18px", borderRadius: "10px", background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid var(--border-3)" }}>
              <select className="ctrl" value={allCommentFilter} onChange={(e) => setAllCommentFilter(e.target.value as any)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả luồng review ({periodFixedBugs.length})</option>
                <option value="huyen">Vòng 1: Huyền Review ({huyenReviewedBugs.length})</option>
                <option value="truong">Vòng 2: Trường Duyệt ({truongApprovedBugs.length})</option>
                <option value="completed">Đã Hoàn Thành ({allCompletedBugs.length})</option>
              </select>

              <select className="ctrl" value={selectedDevFilter} onChange={(e) => setSelectedDevFilter(e.target.value)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả Dev</option>
                {all4People.map((d) => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>

              <select className="ctrl" value={selectedLocFilter} onChange={(e) => setSelectedLocFilter(e.target.value)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả Vị trí ({availableLocations.length})</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Paginated Table for All Tab */}
            <div style={{ border: "1px solid var(--border-3)", borderRadius: "8px", background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-3)", color: "var(--text-2)", textTransform: "uppercase", fontSize: "11px", borderBottom: "1px solid var(--border-3)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "45px" }}>STT</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "110px" }}>BUG ID</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "90px" }}>Dev</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Tiêu đề lỗi</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "140px" }}>Vị trí</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "120px" }}>Vòng 1 (Huyền)</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "120px" }}>Vòng 2 (Trường)</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "140px" }}>Trạng thái PR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAllBugs.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", color: "var(--text-3)", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {(pageAllReviewed - 1) * pageSize + idx + 1}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                          <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
                            {b.bugId || b.id}
                          </a>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: "600", color: "var(--text-2)" }}>
                          {getDevNameByBug(b)}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--text-1)", lineHeight: "1.5" }}>
                          {b.title}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {Array.isArray(b.location) && b.location.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {b.location.map((loc, i) => {
                                const st = getLocationTagStyle(loc);
                                return (
                                  <span key={i} className="tag" style={{ background: st.bg, color: st.color, border: st.border, fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                    {loc}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {isReviewedByHuyen(b) ? (
                            <span className="tag" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Đã Review</span>
                          ) : (
                            <span className="tag" style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Chờ Review</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {b.ghReviewStatus === "Approved" ? (
                            <span className="tag" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Approved</span>
                          ) : b.ghReviewStatus === "Changes Requested" ? (
                            <span className="tag" style={{ background: "rgba(248, 113, 113, 0.15)", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Changes Requested</span>
                          ) : (
                            <span className="tag" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Chờ Review</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {renderLabelBadge(b)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationFooter(
                pageAllReviewed,
                Math.ceil(displayedAllBugs.length / pageSize) || 1,
                displayedAllBugs.length,
                setPageAllReviewed
              )}
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: ANH TRUONG REVIEW DETAILED */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "truong" && (
        <>
          {/* 5 Top KPI Cards for Anh Trường */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
            }}
          >
            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--accent)", cursor: "pointer" }}
              onClick={() => { setTruongCommentFilter("all"); scrollToDetails(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>TỔNG BUG FIX (CÓ PR)</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--text-1)" }}>{truongTotalPrs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug đã gắn PR trong kỳ</div>
            </div>

            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--green)", cursor: "pointer" }}
              onClick={() => { setTruongCommentFilter("approved"); scrollToDetails(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>BUG APPROVED</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--green)" }}>{truongApprovedBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Tech Lead đã Approve PR</div>
            </div>

            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--red)", cursor: "pointer" }}
              onClick={() => { setTruongCommentFilter("changes_requested"); scrollToDetails(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>CHANGES REQUESTED</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--red)" }}>{truongChangesReqBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Yêu cầu sửa code review</div>
            </div>

            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--yellow)", cursor: "pointer" }}
              onClick={() => { setTruongCommentFilter("wait_dev"); scrollToDetails(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>WAIT FOR DEV</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--yellow)" }}>{truongWaitDevBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Trạng thái Wait for dev</div>
            </div>

            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "3px solid var(--blue)", cursor: "pointer" }}
              onClick={() => { setTruongCommentFilter("fresh_pending"); scrollToDetails(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>CHƯA ĐỤNG TỚI (TRẮNG TINH)</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--blue)" }}>{truongFreshPendingBugs.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Bug mới chưa check PR</div>
            </div>
          </div>

          {/* Dev Breakdown Table for Truong Tab */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-3)", background: "var(--surface-2)", fontWeight: "600", fontSize: "13px" }}>
              Thống kê Review Anh Trường theo Tác giả (Hoàng, Hồ, Huy, Huyền)
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-3)", color: "var(--text-2)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>TÁC GIẢ</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TỔNG BUG FIX</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>APPROVED</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>CHANGES REQ</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>WAIT FOR DEV</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>CHƯA ĐỤNG TỚI</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>TIẾN ĐỘ DUYỆT</th>
                  </tr>
                </thead>
                <tbody>
                  {all4People.map((dev, idx) => {
                    const devPrs = truongTotalPrs.filter((b) => bugBelongsToPerson(b, dev));
                    const approved = truongApprovedBugs.filter((b) => bugBelongsToPerson(b, dev)).length;
                    const changeReq = truongChangesReqBugs.filter((b) => bugBelongsToPerson(b, dev)).length;
                    const waitDev = truongWaitDevBugs.filter((b) => bugBelongsToPerson(b, dev)).length;
                    const fresh = truongFreshPendingBugs.filter((b) => bugBelongsToPerson(b, dev)).length;
                    const progress = devPrs.length > 0 ? ((approved / devPrs.length) * 100).toFixed(0) : "0";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "8px 12px", fontWeight: "600", cursor: "pointer", color: "var(--accent-2)", textDecoration: "underline" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("all"); scrollToDetails(); }}
                        >
                          {dev.code}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "600", color: "var(--text-1)", cursor: "pointer" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("all"); scrollToDetails(); }}
                        >
                          {devPrs.length} bug
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--green)", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("approved"); scrollToDetails(); }}
                        >
                          {approved} bug
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: changeReq > 0 ? "var(--red)" : "var(--text-2)", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("changes_requested"); scrollToDetails(); }}
                        >
                          {changeReq} bug
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: waitDev > 0 ? "var(--yellow)" : "var(--text-2)", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("wait_dev"); scrollToDetails(); }}
                        >
                          {waitDev} bug
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: fresh > 0 ? "var(--blue)" : "var(--text-2)", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => { setSelectedDevFilter(dev.code); setTruongCommentFilter("fresh_pending"); scrollToDetails(); }}
                        >
                          {fresh} bug
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-2)", fontWeight: "600" }}>
                          {progress}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Table Section for Truong Tab */}
          <div ref={detailsTableRef} className="card" style={{ padding: "18px", borderRadius: "10px", background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid var(--border-3)" }}>
              <select className="ctrl" value={truongCommentFilter} onChange={(e) => setTruongCommentFilter(e.target.value as any)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả Bug có PR ({truongTotalPrs.length})</option>
                <option value="approved">Bug được Approved ({truongApprovedBugs.length})</option>
                <option value="changes_requested">Bug Yêu cầu sửa - Changes Requested ({truongChangesReqBugs.length})</option>
                <option value="wait_dev">Bug Trạng thái Wait for Dev ({truongWaitDevBugs.length})</option>
                <option value="fresh_pending">Bug Chưa đụng tới - Trắng tinh ({truongFreshPendingBugs.length})</option>
              </select>

              <select className="ctrl" value={selectedDevFilter} onChange={(e) => setSelectedDevFilter(e.target.value)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả Dev</option>
                {all4People.map((d) => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>

              <select className="ctrl" value={selectedLocFilter} onChange={(e) => setSelectedLocFilter(e.target.value)} style={{ fontSize: "13px", fontWeight: "600", height: "38px", padding: "0 14px", background: "var(--surface)", color: "var(--text)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <option value="all">Tất cả Vị trí ({availableLocations.length})</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Paginated Table for Truong Tab */}
            <div style={{ border: "1px solid var(--border-3)", borderRadius: "8px", background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-3)", color: "var(--text-2)", textTransform: "uppercase", fontSize: "11px", borderBottom: "1px solid var(--border-3)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "45px" }}>STT</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "110px" }}>BUG ID</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "90px" }}>Dev</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Tiêu đề lỗi</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "140px" }}>Vị trí</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "150px" }}>Review Anh Trường</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", width: "140px" }}>Trạng thái PR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTruongReviewedBugs.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", color: "var(--text-3)", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {(pageTruongReviewed - 1) * pageSize + idx + 1}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                          <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
                            {b.bugId || b.id}
                          </a>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: "600", color: "var(--text-2)" }}>
                          {getDevNameByBug(b)}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--text-1)", lineHeight: "1.5" }}>
                          {b.title}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {Array.isArray(b.location) && b.location.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {b.location.map((loc, i) => {
                                const st = getLocationTagStyle(loc);
                                return (
                                  <span key={i} className="tag" style={{ background: st.bg, color: st.color, border: st.border, fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                    {loc}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {b.ghReviewStatus === "Approved" ? (
                            <span className="tag" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Approved</span>
                          ) : b.ghReviewStatus === "Changes Requested" ? (
                            <span className="tag" style={{ background: "rgba(248, 113, 113, 0.15)", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Changes Requested</span>
                          ) : (b.prCommentsByTruong ?? 0) > 0 ? (
                            <span className="tag" style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Commented ({b.prCommentsByTruong})</span>
                          ) : (
                            <span className="tag" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px" }}>Chưa đụng tới</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {renderLabelBadge(b)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationFooter(
                pageTruongReviewed,
                Math.ceil(displayedTruongReviewed.length / pageSize) || 1,
                displayedTruongReviewed.length,
                setPageTruongReviewed
              )}
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: HUYEN REVIEW DETAILED */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "huyen" && (
        <>
          {/* KPI Cards (Split into 5 key metrics) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
            }}
          >
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderTop: "4px solid #a855f7",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("reviewed");
                setHuyenCommentFilter("all");
                scrollToDetails();
              }}
              title="Click để xem danh sách bug đã review"
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                TỔNG ĐÃ REVIEW
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#a855f7",
                }}
              >
                {huyenReviewedBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Trên{" "}
                {
                  periodFixedBugs.filter(
                    (b) => getDevNameByBug(b) !== "HuyenTN",
                  ).length
                }{" "}
                bug dev đã sửa
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderTop: "4px solid #ef4444",
                background: "rgba(239,68,68,0.02)",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("reviewed");
                setHuyenCommentFilter("comments");
                scrollToDetails();
              }}
              title="Click để xem danh sách bug có comment"
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  fontWeight: "bold",
                }}
              >
                REVIEW CÓ COMMENT
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#ef4444",
                }}
              >
                {huyenReviewedWithComments.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Tỷ lệ có comment:{" "}
                <strong>
                  {huyenReviewedBugs.length > 0
                    ? `${((huyenReviewedWithComments.length / huyenReviewedBugs.length) * 100).toFixed(0)}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderTop: "4px solid #f59e0b",
                background: "rgba(245,158,11,0.02)",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("reviewed");
                setHuyenCommentFilter("multiround");
                scrollToDetails();
              }}
              title="Click để xem danh sách bug re-check >1 lần"
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#f59e0b",
                  fontWeight: "bold",
                }}
              >
                RE-CHECK LẶP LẠI
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {huyenMultiRoundBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Tỷ lệ re-check:{" "}
                <strong>
                  {huyenReviewedBugs.length > 0
                    ? `${((huyenMultiRoundBugs.length / huyenReviewedBugs.length) * 100).toFixed(0)}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderTop: "4px solid #10b981",
                background: "rgba(16,185,129,0.02)",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("reviewed");
                setHuyenCommentFilter("nocomments");
                scrollToDetails();
              }}
              title="Click để xem danh sách bug test pass"
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#10b981",
                  fontWeight: "bold",
                }}
              >
                REVIEW KHÔNG COMMENT
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                {huyenReviewedNoComments.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Tỷ lệ Pass ngay:{" "}
                <strong>
                  {huyenReviewedBugs.length > 0
                    ? `${((huyenReviewedNoComments.length / huyenReviewedBugs.length) * 100).toFixed(0)}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderTop: "4px solid #64748b",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("pending");
                scrollToDetails();
              }}
              title="Click để xem danh sách bug đang chờ review"
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                BUG CHỜ REVIEW
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#64748b",
                }}
              >
                {pendingHuyenReviewBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Đang chờ gán reviewer
              </div>
            </div>
          </div>

          {/* Distribution Chart Card */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text)",
                }}
              >
                Phân Phối Bug Đã Review Theo Nhân Sự
              </div>
              {/* Legend Bar */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "11px",
                  color: "var(--text-2)",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#10b981",
                    }}
                  ></span>
                  Pass
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#ef4444",
                    }}
                  ></span>
                  Có comment
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#f59e0b",
                    }}
                  ></span>
                  Chờ review
                </span>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {devReviewStats.map((row) => {
                const maxVal = Math.max(
                  ...devReviewStats.map(
                    (r) => r.reviewedCount + r.pendingCount,
                  ),
                  1,
                );
                const noCommentWidth = (row.noCommentCount / maxVal) * 100;
                const withCommentWidth = (row.withCommentCount / maxVal) * 100;
                const pendingWidth = (row.pendingCount / maxVal) * 100;

                return (
                  <div
                    key={row.dev.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        color: "var(--text)",
                        textAlign: "right",
                      }}
                    >
                      {row.dev.code}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        height: "26px",
                        background: "var(--surface-3)",
                        borderRadius: "6px",
                        position: "relative",
                        display: "flex",
                        overflow: "hidden",
                      }}
                    >
                      {/* Segment 1: Pass Ngay (Green) */}
                      {row.noCommentCount > 0 && (
                        <div
                          style={{
                            width: `${noCommentWidth}%`,
                            height: "100%",
                            background: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            transition: "width 0.4s ease-out",
                          }}
                          title={`${row.noCommentCount} bug pass`}
                        >
                          {noCommentWidth > 6 && `${row.noCommentCount} Pass`}
                        </div>
                      )}

                      {/* Segment 2: Ra Lỗi (Red) */}
                      {row.withCommentCount > 0 && (
                        <div
                          style={{
                            width: `${withCommentWidth}%`,
                            height: "100%",
                            background: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            transition: "width 0.4s ease-out",
                          }}
                          title={`${row.withCommentCount} bug có comment`}
                        >
                          {withCommentWidth > 6 &&
                            `${row.withCommentCount} Lỗi`}
                        </div>
                      )}

                      {/* Segment 3: Chờ Review (Yellow) */}
                      {row.pendingCount > 0 && (
                        <div
                          style={{
                            width: `${pendingWidth}%`,
                            height: "100%",
                            background: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            transition: "width 0.4s ease-out",
                          }}
                          title={`${row.pendingCount} bug đang chờ review`}
                        >
                          {pendingWidth > 6 && `${row.pendingCount} Chờ`}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        width: "280px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{ fontWeight: "bold", color: "var(--text-1)" }}
                      >
                        {row.reviewedCount} Đã review
                      </span>
                      <span
                        style={{ color: "var(--text-3)", fontSize: "11px" }}
                      >
                        (🟢 {row.noCommentCount} pass | 🔴{" "}
                        {row.withCommentCount} lỗi | ⏳ {row.pendingCount} chờ)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Dev Review Breakdown Table */}
            <div style={{ marginTop: "20px", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--surface-3)",
                      borderBottom: "1px solid var(--border-2)",
                      color: "var(--text-2)",
                    }}
                  >
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>
                      Tác giả
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Tổng Đã Review
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Pass Ngay
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Review Có Comment
                    </th>
                    <th
                      style={{ padding: "8px 12px", textAlign: "center" }}
                      title="Tỷ lệ bug bị QC Lead comment ra lỗi trên tổng số bug đã review CỦA CHÍNH DEV NÀY"
                    >
                      Tỷ Lệ Lỗi (Cá Nhân)
                    </th>
                    <th
                      style={{ padding: "8px 12px", textAlign: "center" }}
                      title="Tỷ lệ % lỗi của Dev này đóng góp trên TỔNG SỐ BUG RA LỖI CỦA CẢ TEAM"
                    >
                      Đóng Góp Lỗi (Cả Team)
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Re-check
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Đang Chờ Review
                    </th>
                    <th
                      style={{ padding: "8px 12px", textAlign: "center" }}
                      title="Tỷ lệ % bug của Dev này mà QC Lead đã hoàn thành review"
                    >
                      Tiến Độ Review
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devReviewStats.map((row, idx) => {
                    const devBugs = huyenReviewedBugs.filter((b) =>
                      bugBelongsToPerson(b, row.dev),
                    );
                    const multiRoundCount = devBugs.filter(
                      (b) =>
                        (b.prCommentsByHuyen ?? 0) > 1 ||
                        (b.huyenReviewRounds ?? 0) > 1,
                    ).length;
                    const errRatePersonal =
                      row.reviewedCount > 0
                        ? (
                            (row.withCommentCount / row.reviewedCount) *
                            100
                          ).toFixed(0)
                        : "0";
                    const totalTeamWithComments =
                      huyenReviewedWithComments.length;
                    const errRateTeamShare =
                      totalTeamWithComments > 0
                        ? (
                            (row.withCommentCount / totalTeamWithComments) *
                            100
                          ).toFixed(0)
                        : "0";

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid var(--border-3)",
                          background:
                            idx % 2 === 0
                              ? "rgba(255,255,255,0.01)"
                              : "transparent",
                        }}
                      >
                        {/* Dev Code - Click to filter by Dev */}
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            color: "var(--accent)",
                            textDecoration: "underline",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("all");
                            scrollToDetails();
                          }}
                          title={`Click để lọc tất cả bug của ${row.dev.code}`}
                        >
                          {row.dev.code}
                        </td>
                        {/* Tổng đã review */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "var(--text-1)",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("all");
                            scrollToDetails();
                          }}
                          title={`Click để xem danh sách đã review của ${row.dev.code}`}
                        >
                          {row.reviewedCount} bug
                        </td>
                        {/* Pass ngay */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            color: "#10b981",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("nocomments");
                            scrollToDetails();
                          }}
                          title={`Click để xem bug Pass của ${row.dev.code}`}
                        >
                          {row.noCommentCount} bug
                        </td>
                        {/* Review có comment */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            color: row.withCommentCount > 0 ? "#ef4444" : "var(--text-2)",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("dev_replied");
                            scrollToDetails();
                          }}
                          title={`Click để xem bug có comment của ${row.dev.code}`}
                        >
                          {row.withCommentCount} bug
                        </td>
                        {/* 1. Tỷ Lệ Lỗi (Cá Nhân) - Highlighting high error rates */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            fontWeight: "700",
                            color:
                              Number(errRatePersonal) > 30
                                ? "#ef4444"
                                : Number(errRatePersonal) > 15
                                ? "#f59e0b"
                                : "#10b981",
                          }}
                          title={
                            Number(errRatePersonal) > 30
                              ? "⚠️ Tỷ lệ lỗi cá nhân cao (>30%)"
                              : "Tỷ lệ lỗi cá nhân"
                          }
                        >
                          {errRatePersonal}%
                        </td>
                        {/* 2. Đóng Góp Lỗi (Cả Team) - Highlighting major team contributors */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            fontWeight: "700",
                            color:
                              Number(errRateTeamShare) > 40
                                ? "#dc2626"
                                : "var(--text-1)",
                          }}
                          title={
                            Number(errRateTeamShare) > 40
                              ? "🚨 Chiếm trên 40% tổng lỗi của cả team!"
                              : "Tỷ lệ đóng góp lỗi cả team"
                          }
                        >
                          {errRateTeamShare}%
                        </td>
                        {/* Re-check */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            color: "var(--text-2)",
                            fontWeight: "500",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("dev_replied");
                            scrollToDetails();
                          }}
                          title={`Click để xem bug re-check của ${row.dev.code}`}
                        >
                          {multiRoundCount} PR
                        </td>
                        {/* Đang chờ review */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            color: row.pendingCount > 0 ? "#f59e0b" : "var(--text-2)",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("pending");
                            scrollToDetails();
                          }}
                          title={`Click để xem danh sách đang chờ review của ${row.dev.code}`}
                        >
                          {row.pendingCount} bug
                        </td>
                        {/* Tiến độ review */}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            color: "var(--text-2)",
                            fontWeight: "600",
                          }}
                        >
                          {row.reviewRate.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Minimalist & Clean Details Tables for Huyen */}
          <div
            ref={detailsTableRef}
            className="card"
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Top View Mode Selector: Pending vs Reviewed vs Side-by-Side */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  background: "var(--surface-2)",
                  padding: "3px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-3)",
                }}
              >
                <button
                  className={`ctrl ${detailSubTab === "pending" ? "ctrl-primary" : ""}`}
                  style={{
                    fontSize: "12px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontWeight: "600",
                  }}
                  onClick={() => setDetailSubTab("pending")}
                >
                  Đang Chờ Review (
                  {
                    displayedPending.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                  )
                </button>
                <button
                  className={`ctrl ${detailSubTab === "reviewed" ? "ctrl-primary" : ""}`}
                  style={{
                    fontSize: "12px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontWeight: "600",
                  }}
                  onClick={() => setDetailSubTab("reviewed")}
                >
                  Đã Review Thành Công (
                  {
                    displayedReviewed.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                  )
                </button>
                <button
                  className={`ctrl ${detailSubTab === "sidebyside" ? "ctrl-primary" : ""}`}
                  style={{
                    fontSize: "12px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontWeight: "600",
                  }}
                  onClick={() => setDetailSubTab("sidebyside")}
                >
                  Xem Song Song
                </button>
              </div>
            </div>

            {/* Clean Minimalist Filter Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-3)",
              }}
            >
              {/* 1. Review Status / Comment Filter (shown in reviewed tab) */}
              {detailSubTab === "reviewed" && (
                <select
                  className="ctrl"
                  value={huyenCommentFilter}
                  onChange={(e) => setHuyenCommentFilter(e.target.value as any)}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    height: "38px",
                    padding: "0 14px",
                    background: "var(--surface)",
                    color: "var(--text)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="all">
                    Tất cả trạng thái review ({huyenReviewedBugs.length})
                  </option>
                  <option value="dev_replied">
                    Dev đã reply ({huyenDevRepliedBugs.length})
                  </option>
                  <option value="pending_reply">
                    Chờ Dev reply ({huyenPendingReplyBugs.length})
                  </option>
                  <option value="nocomments">
                    Pass ({huyenReviewedNoComments.length})
                  </option>
                </select>
              )}

              {/* 2. Dev Filter */}
              <select
                className="ctrl"
                value={selectedDevFilter}
                onChange={(e) => setSelectedDevFilter(e.target.value)}
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  height: "38px",
                  padding: "0 14px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả Dev</option>
                {dev3People.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>

              {/* 3. Location Filter */}
              <select
                className="ctrl"
                value={selectedLocFilter}
                onChange={(e) => setSelectedLocFilter(e.target.value)}
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  height: "38px",
                  padding: "0 14px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">
                  Tất cả Vị trí ({availableLocations.length})
                </option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* 4. Tạm dừng fix Filter (shown in pending tab) */}
              {detailSubTab === "pending" && (
                <select
                  className="ctrl"
                  value={pauseFilter}
                  onChange={(e) => setPauseFilter(e.target.value as any)}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    height: "38px",
                    padding: "0 14px",
                    background: "var(--surface)",
                    color: "var(--text)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="all">
                    Tất cả Fix ({pendingHuyenReviewBugs.length})
                  </option>
                  <option value="active">
                    Tạm dừng fix = False ({pendingActiveCount})
                  </option>
                  <option value="paused">
                    Tạm dừng fix = True ({pendingPausedCount})
                  </option>
                </select>
              )}
            </div>

            {/* Render Tables according to detailSubTab */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  detailSubTab === "sidebyside" ? "1fr 1fr" : "1fr",
                gap: detailSubTab === "sidebyside" ? "24px" : "0px",
              }}
            >
              {/* Reviewed Table (Render if detailSubTab is 'reviewed' or 'sidebyside') */}
              {(detailSubTab === "reviewed" ||
                detailSubTab === "sidebyside") && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {detailSubTab === "sidebyside" && (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "var(--text-1)",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ color: "#10b981" }}>✔️</span> Đã Review
                      Thành Công (
                      {
                        displayedReviewed.filter(
                          (b) => getDevNameByBug(b) !== "HuyenTN",
                        ).length
                      }
                      )
                    </div>
                  )}

                  <div
                    style={{
                      border: "1px solid var(--border-3)",
                      borderRadius: "8px",
                      background: "var(--surface-2)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        overflowX: "auto",
                        flex: 1,
                      }}
                    >
                      {displayedReviewed.filter(
                        (b) => getDevNameByBug(b) !== "HuyenTN",
                      ).length === 0 ? (
                        <div
                          style={{
                            padding: "20px",
                            color: "var(--text-3)",
                            textAlign: "center",
                            fontSize: "12px",
                          }}
                        >
                          Không có bug nào đã review.
                        </div>
                      ) : (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "12px",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                background: "var(--surface-3)",
                                color: "var(--text-2)",
                                textTransform: "uppercase",
                                fontSize: "11px",
                                borderBottom: "1px solid var(--border-3)",
                              }}
                            >
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "center",
                                  width: "45px",
                                }}
                              >
                                STT
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "95px"
                                      : "110px",
                                }}
                              >
                                BUG ID
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "75px"
                                      : "90px",
                                }}
                              >
                                Dev
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                }}
                              >
                                Tiêu đề lỗi
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "95px"
                                      : "140px",
                                }}
                              >
                                Vị trí
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "center",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "80px"
                                      : "110px",
                                }}
                              >
                                Kết quả
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "center",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "100px"
                                      : "140px",
                                }}
                              >
                                Trạng thái PR
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedReviewedBugs.map((b, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid var(--border-3)",
                                  background:
                                    idx % 2 === 0
                                      ? "rgba(255,255,255,0.01)"
                                      : "transparent",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    color: "var(--text-3)",
                                    fontSize: "11px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {(pageReviewed - 1) * pageSize + idx + 1}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    fontWeight: "bold",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <a
                                    href={b.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "var(--accent)",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {b.bugId || b.id}
                                  </a>
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    fontWeight: "600",
                                    color: "var(--text-2)",
                                  }}
                                >
                                  {getDevNameByBug(b)}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    color: "var(--text-1)",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  {b.title}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  {Array.isArray(b.location) &&
                                  b.location.length > 0 ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "4px",
                                      }}
                                    >
                                      {b.location.map((loc, i) => {
                                        const st = getLocationTagStyle(loc);
                                        return (
                                          <span
                                            key={i}
                                            className="tag"
                                            style={{
                                              background: st.bg,
                                              color: st.color,
                                              border: st.border,
                                              fontSize: "10px",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {loc}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-3)",
                                      }}
                                    >
                                      —
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "center",
                                  }}
                                >
                                  {isHuyenBugWithComment(b) ? (
                                    isDevRepliedBug(b) ? (
                                      <span
                                        className="tag"
                                        style={{
                                          background: "rgba(56, 189, 248, 0.15)",
                                          color: "#38bdf8",
                                          border: "1px solid rgba(56, 189, 248, 0.3)",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                        }}
                                        title="Dev đã comment trả lời dưới comment review - Sẵn sàng cho Huyền Re-check & Switch Label"
                                      >
                                        Dev đã phản hồi
                                      </span>
                                    ) : (
                                      <span
                                        className="tag"
                                        style={{
                                          background: "rgba(244, 63, 94, 0.15)",
                                          color: "#fb7185",
                                          border: "1px solid rgba(244, 63, 94, 0.3)",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                        }}
                                        title="Huyền đã comment ra lỗi - Đang chờ Dev comment phản hồi / sửa"
                                      >
                                        Chờ Dev phản hồi
                                      </span>
                                    )
                                  ) : (
                                    <span
                                      className="tag"
                                      style={{
                                        background: "rgba(34, 197, 94, 0.15)",
                                        color: "#4ade80",
                                        border: "1px solid rgba(34, 197, 94, 0.3)",
                                        fontSize: "10px",
                                        fontWeight: "600",
                                        padding: "3px 8px",
                                        borderRadius: "4px",
                                      }}
                                      title="Huyền test đạt 100%, không comment"
                                    >
                                      Pass
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderLabelBadge(b)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {renderPaginationFooter(
                      pageReviewed,
                      totalPagesReviewed,
                      reviewedFilteredNoHuyen.length,
                      setPageReviewed,
                    )}
                  </div>
                </div>
              )}

              {/* Pending Table (Render if detailSubTab is 'pending' or 'sidebyside') */}
              {(detailSubTab === "pending" ||
                detailSubTab === "sidebyside") && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {detailSubTab === "sidebyside" && (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "var(--text-1)",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ color: "#f59e0b" }}>⏳</span> Đang Chờ
                      Huyền Review (Vòng 1 - QC Lead) (
                      {
                        displayedPending.filter(
                          (b) => getDevNameByBug(b) !== "HuyenTN",
                        ).length
                      }
                      )
                    </div>
                  )}

                  <div
                    style={{
                      border: "1px solid var(--border-3)",
                      borderRadius: "8px",
                      background: "var(--surface-2)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        overflowX: "auto",
                        flex: 1,
                      }}
                    >
                      {displayedPending.filter(
                        (b) => getDevNameByBug(b) !== "HuyenTN",
                      ).length === 0 ? (
                        <div
                          style={{
                            padding: "20px",
                            color: "var(--text-3)",
                            textAlign: "center",
                            fontSize: "12px",
                          }}
                        >
                          Không có bug nào đang chờ review.
                        </div>
                      ) : (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "12px",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                background: "var(--surface-3)",
                                color: "var(--text-2)",
                                textTransform: "uppercase",
                                fontSize: "11px",
                                borderBottom: "1px solid var(--border-3)",
                              }}
                            >
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "center",
                                  width: "45px",
                                }}
                              >
                                STT
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "95px"
                                      : "110px",
                                }}
                              >
                                BUG ID
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "75px"
                                      : "90px",
                                }}
                              >
                                Dev
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                }}
                              >
                                Tiêu đề lỗi
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "95px"
                                      : "140px",
                                }}
                              >
                                Vị trí
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "center",
                                  width:
                                    detailSubTab === "sidebyside"
                                      ? "110px"
                                      : "160px",
                                }}
                              >
                                Trạng thái PR
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedPendingBugs.map((b, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid var(--border-3)",
                                  background:
                                    idx % 2 === 0
                                      ? "rgba(255,255,255,0.01)"
                                      : "transparent",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    color: "var(--text-3)",
                                    fontSize: "11px",
                                  }}
                                >
                                  {(pagePending - 1) * pageSize + idx + 1}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    fontWeight: "bold",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <a
                                    href={b.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "var(--accent)",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {b.bugId || b.id}
                                  </a>
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    fontWeight: "600",
                                    color: "var(--text-2)",
                                  }}
                                >
                                  {getDevNameByBug(b)}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    color: "var(--text-1)",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  {b.title}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  {Array.isArray(b.location) &&
                                  b.location.length > 0 ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "4px",
                                      }}
                                    >
                                      {b.location.map((loc, i) => {
                                        const st = getLocationTagStyle(loc);
                                        return (
                                          <span
                                            key={i}
                                            className="tag"
                                            style={{
                                              background: st.bg,
                                              color: st.color,
                                              border: st.border,
                                              fontSize: "10px",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {loc}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-3)",
                                      }}
                                    >
                                      —
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderLabelBadge(b)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {renderPaginationFooter(
                      pagePending,
                      totalPagesPending,
                      pendingFilteredNoHuyen.length,
                      setPagePending,
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
