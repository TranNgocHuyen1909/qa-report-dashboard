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
  const [subTab, setSubTab] = useState<"all" | "truong" | "huyen">("all");
  const [selectedDevFilter, setSelectedDevFilter] = useState<string>("all");
  const [huyenCommentFilter, setHuyenCommentFilter] = useState<
    | "all"
    | "comments"
    | "nocomments"
    | "multiround"
    | "dev_replied"
    | "pending_reply"
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
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination when any filter changes
  useEffect(() => {
    setPageReviewed(1);
    setPagePending(1);
  }, [
    selectedDevFilter,
    huyenCommentFilter,
    selectedLocFilter,
    pauseFilter,
    detailSubTab,
  ]);

  // Extract all unique bug locations for filter
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    view.bugs.forEach((b) => {
      (b.location ?? []).forEach((l) => locSet.add(l));
    });
    return Array.from(locSet).sort();
  }, [view.bugs]);

  // Notion Location tag color map (High contrast for max readability)
  const getLocationTagStyle = (loc: string) => {
    const l = loc.toLowerCase();
    if (l.includes("metadata")) {
      return { bg: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" };
    }
    if (l.includes("flow")) {
      return { bg: "#ccfbf1", color: "#115e59", border: "1px solid #99f6e4" };
    }
    if (l.includes("doc")) {
      return { bg: "#ffe4e6", color: "#9f1239", border: "1px solid #fecdd3" };
    }
    if (l.includes("ui") || l.includes("ux")) {
      return { bg: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" };
    }
    if (l.includes("prompt")) {
      return { bg: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" };
    }
    if (l.includes("performance") || l.includes("tool")) {
      return { bg: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" };
    }
    return { bg: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
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
            background: "#fff7ed",
            color: "#c2410c",
            border: "1px solid #ffedd5",
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
            let bg = "#f3f4f6";
            let color = "#374151";
            let border = "1px solid #e5e7eb";

            if (lLower.includes("wait")) {
              bg = "#dcfce7";
              color = "#166534";
              border = "1px solid #bbf7d0";
            } else if (lLower.includes("ready")) {
              bg = "#e0f2fe";
              color = "#0369a1";
              border = "1px solid #bae6fd";
            } else if (lLower.includes("change")) {
              bg = "#fee2e2";
              color = "#991b1b";
              border = "1px solid #fca5a5";
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
            background: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
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
            background: "#dcfce7",
            color: "#166534",
            border: "1px solid #bbf7d0",
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
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
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
            background: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
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
            background: "#f3e8ff",
            color: "#6b21a8",
            border: "1px solid #e9d5ff",
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

  // ── TRUONG REVIEW TAB DATA ──
  // Bugs reviewed by Truong (pullRequestUrl is present, filter by T's review status or comments)
  const truongReviewedBugs = useMemo(() => {
    return periodFixedBugs.filter((b) => {
      if (!b.pullRequestUrl) return false;
      // Reviewed if status is Approved, Changes Requested, Commented, or has comments by Truong
      return (
        ["approved", "changes requested", "commented"].includes(
          (b.ghReviewStatus ?? "").toLowerCase(),
        ) || (b.prCommentsByTruong ?? 0) > 0
      );
    });
  }, [periodFixedBugs]);

  // PRs waiting for Tech Lead Truong (checking ALL active bugs in view.bugs with PRs having labels 'wait for deployment/dev', 'ready for re-review/review')
  const truongPendingBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      if ((b.status ?? "").toLowerCase() === "cancel") return false;
      if (!b.pullRequestUrl) return false;

      const st = (b.status ?? "").toLowerCase();
      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());

      const isWait =
        st === "wait for development" ||
        st.includes("wait") ||
        ghLbls.some((l) => l.includes("wait"));

      const isReady =
        st === "ready for review" ||
        st.includes("ready") ||
        ghLbls.some((l) => l.includes("ready"));

      return isWait || isReady;
    });
  }, [view.bugs]);

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
          {/* Dual KPI Cards for Huyền & Trường */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="card" style={{ borderLeft: "4px solid #a855f7" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--accent-2)",
                  marginBottom: "12px",
                }}
              >
                💜 Huyền Review (Hoàng, Hồ, Huy)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    ĐÃ DUYỆT
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "var(--green)",
                    }}
                  >
                    {huyenReviewedBugs.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    ĐANG CHỜ DUYỆT
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "var(--yellow)",
                    }}
                  >
                    {pendingHuyenReviewBugs.length}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  marginTop: "8px",
                  fontStyle: "italic",
                }}
              >
                * Quyết định trạng thái: Đổi sang{" "}
                <span style={{ color: "var(--yellow)" }}>
                  wait for development
                </span>{" "}
                khi test đạt.
              </div>
            </div>

            <div
              className="card"
              style={{ borderLeft: "4px solid var(--cyan)" }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--cyan)",
                  marginBottom: "12px",
                }}
              >
                🛡️ Anh Trường Review (Huyền &amp; 3 Devs)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    APPROVED
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "var(--green)",
                    }}
                  >
                    {
                      periodFixedBugs.filter(
                        (b) => b.ghReviewStatus === "Approved",
                      ).length
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    CHANGE REQ
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "var(--red)",
                    }}
                  >
                    {
                      periodFixedBugs.filter(
                        (b) => b.ghReviewStatus === "Changes Requested",
                      ).length
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    CHỜ REVIEW
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "var(--yellow)",
                    }}
                  >
                    {truongPendingBugs.length}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  marginTop: "8px",
                  fontStyle: "italic",
                }}
              >
                * Kiểm thử &amp; duyệt PR cuối cùng. Ra lỗi đổi sang{" "}
                <span style={{ color: "var(--red)" }}>change requested</span>.
              </div>
            </div>
          </div>

          {/* Matrix table showing PR status for all bugs in the period */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text)",
                }}
              >
                📋 Ma Trận Trạng Thái PR &amp; Review Chi Tiết
              </div>
              {/* Personnel Quick Filter */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className={`ctrl ${selectedDevFilter === "all" ? "ctrl-primary" : ""}`}
                  style={{ fontSize: "11px", padding: "3px 8px" }}
                  onClick={() => setSelectedDevFilter("all")}
                >
                  Tất cả
                </button>
                {all4People.map((p) => (
                  <button
                    key={p.code}
                    className={`ctrl ${selectedDevFilter === p.code ? "ctrl-primary" : ""}`}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                    onClick={() => setSelectedDevFilter(p.code)}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  textAlign: "left",
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
                    <th style={{ padding: "10px", width: "90px" }}>BUG ID</th>
                    <th style={{ padding: "10px", width: "70px" }}>Tác giả</th>
                    <th style={{ padding: "10px" }}>Tiêu đề lỗi</th>
                    <th
                      style={{
                        padding: "10px",
                        width: "140px",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Huyền Review (Notion)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        width: "150px",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Trường Review (PR)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        width: "210px",
                        textAlign: "center",
                      }}
                    >
                      LABEL PR (NOTION)
                    </th>
                    <th style={{ padding: "10px", width: "120px" }}>
                      GitHub PR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {periodFixedBugs
                    .filter(
                      (b) =>
                        selectedDevFilter === "all" ||
                        getDevNameByBug(b) === selectedDevFilter,
                    )
                    .map((bug, index) => {
                      const author = getDevNameByBug(bug);
                      const isHuyenReviewed = isReviewedByHuyen(bug);
                      const tComments = bug.prCommentsByTruong ?? 0;

                      return (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid var(--border-3)",
                            background:
                              index % 2 === 0
                                ? "rgba(255,255,255,0.01)"
                                : "transparent",
                          }}
                        >
                          <td style={{ padding: "10px", fontWeight: "bold" }}>
                            {bug.url ? (
                              <a
                                href={bug.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "var(--accent)",
                                  textDecoration: "underline",
                                }}
                              >
                                {bug.bugId || bug.id}
                              </a>
                            ) : (
                              bug.bugId || bug.id
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              fontWeight: "600",
                              color: "var(--text-2)",
                            }}
                          >
                            {author}
                          </td>
                          <td
                            style={{ padding: "10px", color: "var(--text-1)" }}
                          >
                            {bug.title}
                          </td>
                          {/* Huyen Review Status */}
                          <td style={{ padding: "10px" }}>
                            {isHuyenReviewed ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                  alignItems: "flex-start",
                                }}
                              >
                                <span
                                  className="tag tag-green"
                                  style={{ fontSize: "10px" }}
                                >
                                  ✔️ Đã duyệt (Lead)
                                </span>
                                {(bug.prCommentsByHuyen ?? 0) > 0 && (
                                  <span
                                    className="tag tag-yellow"
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    💬 {bug.prCommentsByHuyen} comment(s)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                className="tag tag-yellow"
                                style={{ fontSize: "10px" }}
                              >
                                ⏳ Chờ Huyen review
                              </span>
                            )}
                          </td>
                          {/* Truong Review Status */}
                          <td style={{ padding: "10px" }}>
                            {!bug.pullRequestUrl ? (
                              <span
                                className="tag tag-gray"
                                style={{ fontSize: "10px" }}
                              >
                                Không có PR
                              </span>
                            ) : bug.ghReviewStatus === "Approved" ? (
                              <span
                                className="tag tag-green"
                                style={{ fontSize: "10px" }}
                              >
                                ✔️ Approved
                              </span>
                            ) : bug.ghReviewStatus === "Changes Requested" ? (
                              <span
                                className="tag tag-red"
                                style={{ fontSize: "10px" }}
                              >
                                ❌ Change Requested
                              </span>
                            ) : bug.ghReviewStatus === "Commented" ||
                              tComments > 0 ? (
                              <span
                                className="tag tag-yellow"
                                style={{ fontSize: "10px" }}
                              >
                                💬 Commented ({tComments})
                              </span>
                            ) : (
                              <span
                                className="tag tag-blue"
                                style={{ fontSize: "10px" }}
                              >
                                ⏳ Chờ T review
                              </span>
                            )}
                          </td>
                          {/* Notion Status / Label PR */}
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            {renderLabelBadge(bug)}
                          </td>
                          {/* GitHub Link */}
                          <td style={{ padding: "10px" }}>
                            {bug.pullRequestUrl ? (
                              <a
                                href={bug.pullRequestUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="tag tag-blue"
                                style={{
                                  textDecoration: "none",
                                  fontSize: "10px",
                                }}
                              >
                                PR #{bug.pullRequestUrl.split("/").pop()} 🔗
                              </a>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-3)",
                                  fontSize: "11px",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {periodFixedBugs.filter(
                    (b) =>
                      selectedDevFilter === "all" ||
                      getDevNameByBug(b) === selectedDevFilter,
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "var(--text-3)",
                        }}
                      >
                        Không có dữ liệu PR trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: ANH TRUONG REVIEW DETAILED */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "truong" && (
        <>
          {/* Mr Truong's KPI Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              className="card"
              style={{ borderLeft: "4px solid var(--green)" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                TỔNG PR ANH TRƯỜNG REVIEW
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "var(--green)",
                }}
              >
                {truongReviewedBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                PR có phản hồi hoặc comment duyệt
              </div>
            </div>
            <div
              className="card"
              style={{ borderLeft: "4px solid var(--cyan)" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                PR APPROVED
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "var(--cyan)",
                }}
              >
                {
                  periodFixedBugs.filter((b) => b.ghReviewStatus === "Approved")
                    .length
                }
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Được duyệt hoàn chỉnh
              </div>
            </div>
            <div
              className="card"
              style={{ borderLeft: "4px solid var(--red)" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                YÊU CẦU SỬA (CHANGES REQUESTED)
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "var(--red)",
                }}
              >
                {
                  periodFixedBugs.filter(
                    (b) => b.ghReviewStatus === "Changes Requested",
                  ).length
                }
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                PR bị yêu cầu code review sửa lại
              </div>
            </div>
            <div
              className="card"
              style={{ borderLeft: "4px solid var(--yellow)" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                CHỜ ANH TRƯỜNG REVIEW
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "var(--yellow)",
                }}
              >
                {truongPendingBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                PR chưa ghi nhận hoạt động check
              </div>
            </div>
          </div>

          {/* Distribution card for Truong review */}
          <div className="card">
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              📊 Phân Phối Trạng Thái PR theo Thành Viên (Người review: Anh
              Trường)
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {all4People.map((person) => {
                const personBugs = periodFixedBugs.filter(
                  (b) => bugBelongsToPerson(b, person) && b.pullRequestUrl,
                );
                const approvedCount = personBugs.filter(
                  (b) => b.ghReviewStatus === "Approved",
                ).length;
                const changeReqCount = personBugs.filter(
                  (b) => b.ghReviewStatus === "Changes Requested",
                ).length;
                const commentedCount = personBugs.filter(
                  (b) =>
                    b.ghReviewStatus === "Commented" ||
                    (b.prCommentsByTruong ?? 0) > 0,
                ).length;
                const pendingCount =
                  personBugs.length -
                  approvedCount -
                  changeReqCount -
                  commentedCount;

                const maxCount = Math.max(
                  ...all4People.map(
                    (p) =>
                      periodFixedBugs.filter(
                        (b) => bugBelongsToPerson(b, p) && b.pullRequestUrl,
                      ).length,
                  ),
                  1,
                );

                const approvedPct = (approvedCount / maxCount) * 100;
                const changeReqPct = (changeReqCount / maxCount) * 100;
                const commentedPct = (commentedCount / maxCount) * 100;
                const pendingPct = (pendingCount / maxCount) * 100;

                return (
                  <div
                    key={person.code}
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
                      {person.code}
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
                      {approvedCount > 0 && (
                        <div
                          style={{
                            width: `${approvedPct}%`,
                            background:
                              "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                          }}
                          title={`${approvedCount} PR Approved`}
                        />
                      )}
                      {changeReqCount > 0 && (
                        <div
                          style={{
                            width: `${changeReqPct}%`,
                            background:
                              "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                          }}
                          title={`${changeReqCount} PR Changes Requested`}
                        />
                      )}
                      {commentedCount > 0 && (
                        <div
                          style={{
                            width: `${commentedPct}%`,
                            background:
                              "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                          }}
                          title={`${commentedCount} PR Commented`}
                        />
                      )}
                      {pendingCount > 0 && (
                        <div
                          style={{
                            width: `${pendingPct}%`,
                            background:
                              "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                          }}
                          title={`${pendingCount} PR Pending Review`}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        width: "160px",
                        fontSize: "12px",
                        color: "var(--text-3)",
                      }}
                    >
                      <strong style={{ color: "var(--text)" }}>
                        {personBugs.length} PR
                      </strong>{" "}
                      (
                      <span style={{ color: "var(--green)" }}>
                        {approvedCount}✔️
                      </span>
                      /
                      <span style={{ color: "var(--red)" }}>
                        {changeReqCount}❌
                      </span>
                      /
                      <span style={{ color: "var(--yellow)" }}>
                        {commentedCount}💬
                      </span>
                      /
                      <span style={{ color: "var(--blue)" }}>
                        {pendingCount}⏳
                      </span>
                      )
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Lists */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {/* Approved & Commented */}
            <div className="card">
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  color: "var(--green)",
                  marginBottom: "12px",
                }}
              >
                ✔️ PR Đã Phê Duyệt &amp; Có Thảo Luận (
                {truongReviewedBugs.length})
              </div>
              <div
                style={{
                  maxHeight: "350px",
                  overflowY: "auto",
                  border: "1px solid var(--border-2)",
                  borderRadius: "6px",
                  background: "var(--surface-2)",
                }}
              >
                {truongReviewedBugs.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      color: "var(--text-3)",
                      textAlign: "center",
                      fontSize: "12px",
                    }}
                  >
                    Không có PR nào.
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
                          borderBottom: "1px solid var(--border-2)",
                          color: "var(--text-2)",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            width: "85px",
                          }}
                        >
                          BUG ID
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            width: "70px",
                          }}
                        >
                          Tác giả
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          PR Review
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            width: "140px",
                          }}
                        >
                          Trạng Thái Label
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            width: "100px",
                          }}
                        >
                          Comments T
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {truongReviewedBugs.map((b, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid var(--border-3)",
                            background: "var(--surface-1)",
                          }}
                        >
                          <td style={{ padding: "8px", fontWeight: "bold" }}>
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
                              padding: "8px",
                              fontWeight: "600",
                              color: "var(--text-2)",
                            }}
                          >
                            {getDevNameByBug(b)}
                          </td>
                          <td style={{ padding: "8px" }}>
                            <div
                              style={{
                                fontWeight: "500",
                                color: "var(--text-1)",
                              }}
                            >
                              {b.title}
                            </div>
                            {b.pullRequestUrl && (
                              <a
                                href={b.pullRequestUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: "10px",
                                  color: "var(--cyan)",
                                  textDecoration: "underline",
                                }}
                              >
                                Github PR Link
                              </a>
                            )}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {renderLabelBadge(b)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <span
                              className={
                                b.ghReviewStatus === "Approved"
                                  ? "tag tag-green"
                                  : "tag tag-yellow"
                              }
                              style={{ fontSize: "10px" }}
                            >
                              {b.ghReviewStatus} ({b.prCommentsByTruong ?? 0})
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Waiting for T Review */}
            <div className="card">
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  color: "var(--yellow)",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>
                  ⏳ PR Đang Chờ Anh Trường Duyệt Vòng 2 (
                  {truongPendingBugs.length})
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "normal",
                    color: "var(--text-2)",
                    background: "var(--surface-3)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                  }}
                >
                  📌 Chỉ bao gồm nhãn{" "}
                  <strong style={{ color: "var(--green)" }}>
                    wait for development
                  </strong>{" "}
                  &amp;{" "}
                  <strong style={{ color: "var(--blue)" }}>
                    ready for review
                  </strong>
                </span>
              </div>
              <div
                style={{
                  maxHeight: "350px",
                  overflowY: "auto",
                  border: "1px solid var(--border-2)",
                  borderRadius: "6px",
                  background: "var(--surface-2)",
                }}
              >
                {truongPendingBugs.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      color: "var(--text-3)",
                      textAlign: "center",
                      fontSize: "12px",
                    }}
                  >
                    🎉 Tuyệt vời! Không có PR nào đang chờ review (nhãn wait for
                    development / ready for review).
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
                          borderBottom: "1px solid var(--border-2)",
                          color: "var(--text-2)",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            width: "85px",
                          }}
                        >
                          BUG ID
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            width: "70px",
                          }}
                        >
                          Tác giả
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Nội dung PR
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            width: "210px",
                          }}
                        >
                          TRẠNG THÁI NOTION (STATUS/LABEL)
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            width: "85px",
                          }}
                        >
                          GitHub
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {truongPendingBugs.map((b, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid var(--border-3)",
                            background: "var(--surface-1)",
                          }}
                        >
                          <td style={{ padding: "8px", fontWeight: "bold" }}>
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
                              padding: "8px",
                              fontWeight: "600",
                              color: "var(--text-2)",
                            }}
                          >
                            {getDevNameByBug(b)}
                          </td>
                          <td
                            style={{ padding: "8px", color: "var(--text-1)" }}
                          >
                            {b.title}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {renderLabelBadge(b)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {b.pullRequestUrl ? (
                              <a
                                href={b.pullRequestUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="tag tag-blue"
                                style={{
                                  textDecoration: "none",
                                  fontSize: "10px",
                                }}
                              >
                                PR Link 🔗
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
                                          background: "#e0f2fe",
                                          color: "#0369a1",
                                          border: "1px solid #bae6fd",
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
                                          background: "#ffe4e6",
                                          color: "#9f1239",
                                          border: "1px solid #fecdd3",
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
                                        background: "#dcfce7",
                                        color: "#166534",
                                        border: "1px solid #bbf7d0",
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
