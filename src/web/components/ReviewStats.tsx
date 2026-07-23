import { useMemo, useState } from "react";
import type {
  DashboardView,
  BugRecord,
  PeriodInfo,
  Person,
} from "../../shared/types";

// Helper to extract date key YYYY-MM-DD
function dateKey(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const k = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined;
}

// Helper to check if a date is within a range
function dateInRange(
  d: string | undefined,
  start: string,
  end: string,
): boolean {
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
  const [huyenCommentFilter, setHuyenCommentFilter] = useState<"all" | "comments" | "nocomments">("all");

  // Find active period details from topbar filters
  const activePeriod = useMemo(() => {
    if (periodKey) {
      return view.availablePeriods.find((p) => p.key === periodKey);
    }
    return view.availablePeriods[0];
  }, [view.availablePeriods, periodKey]);

  // Personnel lists
  const all4People = useMemo(() => {
    // Huyền, Hoàng, Hồ, Huy
    return view.personnel.filter(
      (p) =>
        p.role !== "benchmark" &&
        (!p.startDate || p.startDate <= (activePeriod?.endDate ?? "")),
    );
  }, [view.personnel, activePeriod]);

  const dev3People = useMemo(() => {
    // Hoàng, Hồ, Huy
    return view.personnel.filter(
      (p) =>
        p.role !== "benchmark" &&
        p.role !== "lead" &&
        (!p.startDate || p.startDate <= (activePeriod?.endDate ?? "")),
    );
  }, [view.personnel, activePeriod]);

  // Helper to match a bug to a person
  const bugBelongsToPerson = (bug: BugRecord, person: Person) => {
    if (bug.pullRequestUrl && bug.prAuthor) {
      if (
        person.githubUsername &&
        bug.prAuthor.toLowerCase() === person.githubUsername.toLowerCase()
      )
        return true;
      if (
        view.personnel.some(
          (p) =>
            p.code !== person.code &&
            p.githubUsername &&
            p.githubUsername.toLowerCase() === bug.prAuthor.toLowerCase(),
        )
      )
        return false;
    }
    const notionIds = person.notionIds || [];
    return (bug.fixedByIds ?? []).some((id) => notionIds.includes(id));
  };

  const isNoRepro = (b: BugRecord) => {
    const note = (b.note ?? "").toLowerCase();
    return note.includes("không tái hiện") || note.includes("ko tái hiện");
  };

  const isFixed = (b: BugRecord) => {
    const st = (b.status ?? "").toLowerCase();
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    return (
      [
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
      ghLbls.length > 0
    ) && !isNoRepro(b);
  };

  const renderLabelBadge = (bug: BugRecord) => {
    // 1. Render GitHub PR Labels if available
    if (bug.ghLabels && bug.ghLabels.length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
          {bug.ghLabels.map((lbl, idx) => {
            const lLower = lbl.toLowerCase();
            let bg = "rgba(107, 114, 128, 0.15)";
            let color = "var(--text-2)";
            if (lLower.includes("wait")) {
              bg = "rgba(185, 28, 28, 0.25)";
              color = "#f87171";
            } else if (lLower.includes("ready")) {
              bg = "rgba(161, 98, 7, 0.25)";
              color = "#facc15";
            } else if (lLower.includes("change")) {
              bg = "rgba(239, 68, 68, 0.25)";
              color = "#ef4444";
            }
            return (
              <span key={idx} className="tag" style={{ background: bg, color, fontSize: "10px", fontWeight: "bold" }}>
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
        <span className="tag tag-yellow" style={{ fontSize: "10px", fontWeight: "bold" }}>
          ⚡ Resolved (chờ Huyền review)
        </span>
      );
    }
    if (status === "wait for development" || status.includes("wait")) {
      return (
        <span className="tag tag-green" style={{ fontSize: "10px", fontWeight: "bold" }}>
          ⏳ wait for dev (Huyền review xong)
        </span>
      );
    }
    if (status === "change requested" || status.includes("change")) {
      return (
        <span className="tag tag-red" style={{ fontSize: "10px", fontWeight: "bold" }}>
          🔴 change requested (Anh T review ra lỗi)
        </span>
      );
    }
    if (status === "ready for review" || status.includes("ready")) {
      return (
        <span className="tag tag-blue" style={{ fontSize: "10px", fontWeight: "bold" }}>
          🔵 ready for review (Dev sửa xong lỗi Anh T)
        </span>
      );
    }
    if (status === "deployed") {
      return (
        <span className="tag" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "10px", fontWeight: "bold" }}>
          🚀 Deployed (Anh T merge PR)
        </span>
      );
    }
    if (status === "closed") {
      return (
        <span className="tag tag-green" style={{ fontSize: "10px", fontWeight: "bold" }}>
          🟢 Closed (Notion)
        </span>
      );
    }
    if (status === "reopened" || status.includes("reopen")) {
      return (
        <span className="tag tag-red" style={{ fontSize: "10px", fontWeight: "bold" }}>
          🔴 Reopened (Notion)
        </span>
      );
    }
    return (
      <span className="tag tag-gray" style={{ fontSize: "10px", fontWeight: "bold" }}>
        {bug.status || "Chưa có Status"}
      </span>
    );
  };

  // Check if bug was reviewed by HuyenTN (Notion Reviewers = Huyen, Notion Status = wait for development/deployed/closed, OR GitHub comments by TranNgocHuyen1909)
  const isReviewedByHuyen = (b: BugRecord) => {
    const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
    const status = (b.status ?? "").toLowerCase();
    const huyenComments = b.prCommentsByHuyen ?? 0;
    return (
      (b.reviewerIds ?? []).includes(huyenNotionId) ||
      status === "wait for development" ||
      status.includes("wait") ||
      status === "deployed" ||
      status === "closed" ||
      huyenComments > 0
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
    if (!activePeriod) return [];
    return view.bugs.filter((b) => {
      const fDate = bugFixedDate(b);
      return (
        fDate &&
        dateInRange(fDate, activePeriod.startDate, activePeriod.endDate) &&
        isFixed(b) &&
        (b.status ?? "").toLowerCase() !== "cancel"
      );
    });
  }, [view.bugs, activePeriod]);

  // ── HUYEN REVIEW TAB DATA ──
  // Filter bugs reviewed by HuyenTN in active period
  const huyenReviewedBugs = useMemo(() => {
    if (!activePeriod) return [];
    return view.bugs.filter((b) => {
      if ((b.status ?? "").toLowerCase() === "cancel") return false;
      if (!isReviewedByHuyen(b)) return false;
      const rDate =
        b.confirmedDate || dateKey(b.prCreatedAt) || dateKey(b.lastEditedTime);
      return (
        rDate &&
        dateInRange(rDate, activePeriod.startDate, activePeriod.endDate)
      );
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

  // Filter bugs waiting for Huyen review
  const pendingHuyenReviewBugs = useMemo(() => {
    if (!activePeriod) return [];
    return view.bugs.filter((b) => {
      if ((b.status ?? "").toLowerCase() !== "resolved") return false;
      if (isReviewedByHuyen(b)) return false;

      const rDate = dateKey(b.lastEditedTime) ?? dateKey(b.createdTime);
      return (
        rDate &&
        dateInRange(rDate, activePeriod.startDate, activePeriod.endDate)
      );
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
    return dev3People.map(dev => {
      const devBugs = huyenReviewedBugs.filter(b => bugBelongsToPerson(b, dev));
      const fixedCount = periodFixedBugs.filter(b => bugBelongsToPerson(b, dev)).length;
      const reviewedCount = devBugs.length;
      const withCommentCount = devBugs.filter(isHuyenBugWithComment).length;
      const noCommentCount = devBugs.length - withCommentCount;
      const pendingCount = pendingHuyenReviewBugs.filter(b => bugBelongsToPerson(b, dev)).length;
      const reviewRate = fixedCount > 0 ? (reviewedCount / fixedCount) * 100 : 0;
      return {
        dev,
        fixedCount,
        reviewedCount,
        withCommentCount,
        noCommentCount,
        pendingCount,
        reviewRate
      };
    });
  }, [dev3People, periodFixedBugs, huyenReviewedBugs, pendingHuyenReviewBugs]);

  // Filter Huyen reviewed bugs by selected developer and comment filter
  const displayedReviewed = useMemo(() => {
    return huyenReviewedBugs.filter(b => {
      if (selectedDevFilter !== "all") {
        const dev = dev3People.find(p => p.code === selectedDevFilter);
        if (!dev || !bugBelongsToPerson(b, dev)) return false;
      }
      if (huyenCommentFilter === "comments") return isHuyenBugWithComment(b);
      if (huyenCommentFilter === "nocomments") return !isHuyenBugWithComment(b);
      return true;
    });
  }, [huyenReviewedBugs, selectedDevFilter, huyenCommentFilter, dev3People]);

  // Filter Huyen pending bugs by selected developer
  const displayedPending = useMemo(() => {
    return pendingHuyenReviewBugs.filter(b => {
      if (selectedDevFilter === "all") return true;
      const dev = dev3People.find(p => p.code === selectedDevFilter);
      return dev ? bugBelongsToPerson(b, dev) : false;
    });
  }, [pendingHuyenReviewBugs, selectedDevFilter, dev3People]);

  // Combined stats
  const getDevNameByBug = (bug: BugRecord) => {
    const matched = all4People.find((p) => bugBelongsToPerson(bug, p));
    return matched ? matched.code : "—";
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
            🔍 Hoạt động Review &amp; Trạng thái PR (
            {activePeriod?.label ?? "Tất cả kỳ"})
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Quản trị luồng QA: Hoàng, Hồ, Huy → <strong>Huyền review</strong>{" "}
            (ready for review → wait for development) →{" "}
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
            🌐 Tất cả (Tổng quan)
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
            🛡️ Anh Trường Review
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
            🔍 Huyền Review
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
                    {p.displayName}
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
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                                <span className="tag tag-green" style={{ fontSize: "10px" }}>
                                  ✔️ Đã duyệt (Lead)
                                </span>
                                {(bug.prCommentsByHuyen ?? 0) > 0 && (
                                  <span className="tag tag-yellow" style={{ fontSize: "10px", fontWeight: "bold" }}>
                                    💬 {bug.prCommentsByHuyen} comment(s)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="tag tag-yellow" style={{ fontSize: "10px" }}>
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
                <span>⏳ PR Đang Chờ Anh Trường Duyệt Vòng 2 ({truongPendingBugs.length})</span>
                <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-2)", background: "var(--surface-3)", padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  📌 Chỉ bao gồm nhãn <strong style={{ color: "var(--green)" }}>wait for development</strong> &amp; <strong style={{ color: "var(--blue)" }}>ready for review</strong>
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
                    🎉 Tuyệt vời! Không có PR nào đang chờ review (nhãn wait for development / ready for review).
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
          {/* KPI Cards (Split into 4 key metrics: Total, With Comment, No Comment, Pending) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderLeft: "4px solid #a855f7",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                TỔNG BUG ĐÃ REVIEW
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
                Trên tổng số{" "}
                <strong>
                  {
                    periodFixedBugs.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                </strong>{" "}
                bug dev đã sửa trong kỳ
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderLeft: "4px solid #ef4444",
                background: "rgba(239,68,68,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  fontWeight: "bold",
                }}
              >
                💬 REVIEW CÓ COMMENT (RA LỖI)
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
                Dev bắt buộc reply comment &amp; Resolve conversation
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderLeft: "4px solid #10b981",
                background: "rgba(16,185,129,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#10b981",
                  fontWeight: "bold",
                }}
              >
                ✨ REVIEW KHÔNG COMMENT (PASS NGAY)
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
                Test đạt 100% không phát hiện thêm lỗi
              </div>
            </div>

            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderLeft: "4px solid var(--yellow)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontWeight: "bold",
                }}
              >
                ⏳ BUG CHỜ REVIEW
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
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>
                Các bug đã Resolved từ dev nhưng chưa gán reviewer
              </div>
            </div>
          </div>

          {/* Distribution Chart Card */}
          <div className="card">
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              📊 Phân Phối Bug Đã Review theo Nhân Sự (Lead Reviewer: HuyenTN)
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {devReviewStats.map((row) => {
                const maxVal = Math.max(
                  ...devReviewStats.map((r) => r.fixedCount),
                  1,
                );
                const reviewedWidth = (row.reviewedCount / maxVal) * 100;
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
                      <div
                        style={{
                          width: `${reviewedWidth}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "bold",
                          transition: "width 0.4s ease-out",
                        }}
                        title={`${row.reviewedCount} bug đã review`}
                      >
                        {row.reviewedCount > 0 &&
                          `${row.reviewedCount} Đã Review`}
                      </div>

                      <div
                        style={{
                          width: `${pendingWidth}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "bold",
                          transition: "width 0.4s ease-out",
                        }}
                        title={`${row.pendingCount} bug chờ review`}
                      >
                        {row.pendingCount > 0 && `${row.pendingCount} Chờ`}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "160px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{ fontWeight: "bold", color: "var(--cyan)" }}
                      >
                        {row.reviewedCount} / {row.fixedCount}
                      </span>
                      <span style={{ color: "var(--text-3)" }}>
                        bug ({row.reviewRate.toFixed(0)}% đã review)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Tables for Huyen */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text)",
                }}
              >
                📋 Chi Tiết Lỗi Theo Trạng Thái Review (Lead: HuyenTN)
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Phễu lọc Có comment / Không comment */}
                <div style={{ display: "flex", gap: "3px", background: "var(--surface-3)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <button
                    className={`ctrl ${huyenCommentFilter === "all" ? "ctrl-primary" : ""}`}
                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}
                    onClick={() => setHuyenCommentFilter("all")}
                  >
                    🌐 Tất cả ({huyenReviewedBugs.length})
                  </button>
                  <button
                    className={`ctrl ${huyenCommentFilter === "comments" ? "ctrl-primary" : ""}`}
                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}
                    onClick={() => setHuyenCommentFilter("comments")}
                  >
                    💬 Có comment / Ra lỗi ({huyenReviewedWithComments.length})
                  </button>
                  <button
                    className={`ctrl ${huyenCommentFilter === "nocomments" ? "ctrl-primary" : ""}`}
                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}
                    onClick={() => setHuyenCommentFilter("nocomments")}
                  >
                    ✨ Pass ngay ({huyenReviewedNoComments.length})
                  </button>
                </div>

                {/* Filter theo Dev */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className={`ctrl ${selectedDevFilter === "all" ? "ctrl-primary" : ""}`}
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                    onClick={() => setSelectedDevFilter("all")}
                  >
                    Tất cả Dev
                  </button>
                  {dev3People.map((d) => (
                    <button
                      key={d.code}
                      className={`ctrl ${selectedDevFilter === d.code ? "ctrl-primary" : ""}`}
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      onClick={() => setSelectedDevFilter(d.code)}
                    >
                      {d.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Left Column: Reviewed */}
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    color: "var(--green)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✔️</span> Đã Review Thành Công (
                  {
                    displayedReviewed.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                  )
                </div>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid var(--border-2)",
                    borderRadius: "6px",
                    background: "var(--surface-2)",
                  }}
                >
                  {displayedReviewed.filter(
                    (b) => getDevNameByBug(b) !== "HuyenTN",
                  ).length === 0 ? (
                    <div
                      style={{
                        padding: "16px",
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
                            borderBottom: "1px solid var(--border-2)",
                            color: "var(--text-2)",
                          }}
                        >
                          <th
                            style={{
                              padding: "8px",
                              textAlign: "left",
                              width: "80px",
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
                            Dev
                          </th>
                          <th style={{ padding: "8px", textAlign: "left" }}>
                            Tiêu đề lỗi
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              textAlign: "center",
                              width: "80px",
                            }}
                          >
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedReviewed
                          .filter((b) => getDevNameByBug(b) !== "HuyenTN")
                          .map((b, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: "1px solid var(--border-3)",
                                background: "var(--surface-1)",
                              }}
                            >
                              <td
                                style={{ padding: "8px", fontWeight: "bold" }}
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
                                  padding: "8px",
                                  fontWeight: "600",
                                  color: "var(--text-2)",
                                }}
                              >
                                {getDevNameByBug(b)}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  color: "var(--text-1)",
                                }}
                              >
                                {b.title}
                              </td>
                              <td
                                style={{ padding: "8px", textAlign: "center" }}
                              >
                                {isHuyenBugWithComment(b) ? (
                                  <span
                                    className="tag tag-red"
                                    style={{ fontSize: "10px", padding: "2px 6px" }}
                                    title="Huyền review phát hiện lỗi / có comment thảo luận"
                                  >
                                    💬 Có comment
                                  </span>
                                ) : (
                                  <span
                                    className="tag tag-green"
                                    style={{ fontSize: "10px", padding: "2px 6px" }}
                                    title="Huyền test đạt ngay 100%, không phát hiện lỗi"
                                  >
                                    ✨ Pass ngay
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Column: Pending */}
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    color: "var(--yellow)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>⏳</span> Đang Chờ Huyền Review (Vòng 1 - QC Lead) (
                  {
                    displayedPending.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                  )
                </div>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid var(--border-2)",
                    borderRadius: "6px",
                    background: "var(--surface-2)",
                  }}
                >
                  {displayedPending.filter(
                    (b) => getDevNameByBug(b) !== "HuyenTN",
                  ).length === 0 ? (
                    <div
                      style={{
                        padding: "16px",
                        color: "var(--text-3)",
                        textAlign: "center",
                        fontSize: "12px",
                      }}
                    >
                      ✔️ Tuyệt vời! Không có bug nào đang chờ review.
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
                              width: "80px",
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
                            Dev
                          </th>
                          <th style={{ padding: "8px", textAlign: "left" }}>
                            Tiêu đề lỗi
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
                        </tr>
                      </thead>
                      <tbody>
                        {displayedPending
                          .filter((b) => getDevNameByBug(b) !== "HuyenTN")
                          .map((b, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: "1px solid var(--border-3)",
                                background: "var(--surface-1)",
                              }}
                            >
                              <td
                                style={{ padding: "8px", fontWeight: "bold" }}
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
                                  padding: "8px",
                                  fontWeight: "600",
                                  color: "var(--text-2)",
                                }}
                              >
                                {getDevNameByBug(b)}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  color: "var(--text-1)",
                                }}
                              >
                                {b.title}
                              </td>
                              <td
                                style={{ padding: "8px", textAlign: "center" }}
                              >
                                {renderLabelBadge(b)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
