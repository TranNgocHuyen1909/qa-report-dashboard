import { ReviewMetricCards } from "./review/ReviewMetricCards";
import { DevBreakdownTable } from "./review/DevBreakdownTable";
import { ReviewBugsTable } from "./review/ReviewBugsTable";
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
    | "approved_with_note"
    | "changes_requested"
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
  const [selectedPrFilter, setSelectedPrFilter] = useState<string>("all");
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<"dev" | "loc" | "result" | "pr" | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<"pending" | "reviewed">("pending");
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

  // Location tag color map - High contrast & crisp readability for Light & Dark mode
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
      return { bg: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    }
    if (l.includes("prompt")) {
      return { bg: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" };
    }
    if (l.includes("performance") || l.includes("tool")) {
      return { bg: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" };
    }
    return { bg: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
  };

  const extractPrNumber = (url?: string) => {
    if (!url) return null;
    const match = url.match(/\/pull\/(\d+)/);
    return match ? match[1] : null;
  };

  const extractPrBadgeInfo = (
    url?: string,
  ): { repoLabel: string; prNum: string | null } => {
    if (!url) return { repoLabel: "PR", prNum: null };

    const match = url.match(/github\.com\/[^\/]+\/([^\/]+)\/pull\/(\d+)/i);
    if (match) {
      const repoRaw = match[1].toLowerCase();
      const prNum = match[2];

      let repoLabel = "PR";
      if (repoRaw.includes("tool")) {
        repoLabel = "tool";
      } else if (repoRaw.includes("agent") || repoRaw.includes("lisa")) {
        repoLabel = "agent";
      } else if (
        repoRaw.includes("web") ||
        repoRaw.includes("dashboard") ||
        repoRaw.includes("ui")
      ) {
        repoLabel = "web";
      } else if (
        repoRaw.includes("backend") ||
        repoRaw.includes("server") ||
        repoRaw.includes("api")
      ) {
        repoLabel = "backend";
      } else {
        repoLabel = repoRaw.replace(/^(lisa-|qa-)/, "");
      }

      return { repoLabel, prNum };
    }

    const genericMatch = url.match(/\/pull\/(\d+)/);
    return { repoLabel: "PR", prNum: genericMatch ? genericMatch[1] : null };
  };

  const extractAllPrUrls = (
    rawUrl?: string,
  ): { url: string; repoLabel: string; prNum: string | null }[] => {
    if (!rawUrl || !rawUrl.trim()) return [];
    const urlRegex = /(https?:\/\/[^\s,;]+)/g;
    const matches = rawUrl.match(urlRegex) || [];
    const results: { url: string; repoLabel: string; prNum: string | null }[] = [];
    const seen = new Set<string>();

    for (let m of matches) {
      const cleanUrl = m.replace(/[.,;)]+$/, "");
      if (!seen.has(cleanUrl)) {
        seen.add(cleanUrl);
        const { repoLabel, prNum } = extractPrBadgeInfo(cleanUrl);
        results.push({ url: cleanUrl, repoLabel, prNum });
      }
    }

    return results;
  };

  const renderFilterableHeader = (
    type: "dev" | "loc" | "result" | "pr",
    title: string,
    widthStyle: string,
    align: "left" | "center" = "left",
  ) => {
    const isDevActive = type === "dev" && selectedDevFilter !== "all";
    const isLocActive = type === "loc" && selectedLocFilter !== "all";
    const isResActive = type === "result" && huyenCommentFilter !== "all";
    const isPrActive = type === "pr" && selectedPrFilter !== "all";
    const isActive = isDevActive || isLocActive || isResActive || isPrActive;

    const activeLabel = isDevActive
      ? selectedDevFilter
      : isLocActive
      ? selectedLocFilter
      : isResActive
      ? "Lọc"
      : isPrActive
      ? selectedPrFilter
      : "";

    return (
      <th
        style={{
          padding: "10px 12px",
          textAlign: align,
          width: widthStyle,
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          color: isActive ? "var(--accent)" : "inherit",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setActiveHeaderMenu(activeHeaderMenu === type ? null : type);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setActiveHeaderMenu(activeHeaderMenu === type ? null : type);
        }}
        title={`Click hoặc chuột phải để lọc theo ${title}`}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: align === "center" ? "center" : "flex-start",
            width: "100%",
          }}
        >
          <span>{title}</span>
          <span
            style={{
              fontSize: "10px",
              opacity: isActive ? 1 : 0.6,
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "#fff" : "inherit",
              padding: isActive ? "1px 5px" : "0",
              borderRadius: "4px",
              fontWeight: isActive ? 700 : 400,
            }}
          >
            {isActive ? activeLabel : "▾"}
          </span>
        </div>

        {activeHeaderMenu === type && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: align === "left" ? 0 : "auto",
              right: align === "center" ? 0 : "auto",
              zIndex: 1000,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
              padding: "6px 0",
              minWidth: "160px",
              textAlign: "left",
              fontWeight: "normal",
              textTransform: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "6px 12px",
                fontSize: "10px",
                color: "var(--text-3)",
                textTransform: "uppercase",
                fontWeight: 700,
                borderBottom: "1px solid var(--border-3)",
                marginBottom: "4px",
              }}
            >
              Lọc theo {title}
            </div>

            {type === "dev" && (
              <>
                <div
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    background: selectedDevFilter === "all" ? "rgba(59, 130, 246, 0.12)" : "transparent",
                    color: selectedDevFilter === "all" ? "var(--accent)" : "var(--text)",
                    fontWeight: selectedDevFilter === "all" ? 700 : 500,
                  }}
                  onClick={() => { setSelectedDevFilter("all"); setActiveHeaderMenu(null); }}
                >
                  Tất cả Dev
                </div>
                {dev3People.map((d) => (
                  <div
                    key={d.code}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      background: selectedDevFilter === d.code ? "rgba(59, 130, 246, 0.12)" : "transparent",
                      color: selectedDevFilter === d.code ? "var(--accent)" : "var(--text)",
                      fontWeight: selectedDevFilter === d.code ? 700 : 500,
                    }}
                    onClick={() => { setSelectedDevFilter(d.code); setActiveHeaderMenu(null); }}
                  >
                    {d.code}
                  </div>
                ))}
              </>
            )}

            {type === "loc" && (
              <>
                <div
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    background: selectedLocFilter === "all" ? "rgba(59, 130, 246, 0.12)" : "transparent",
                    color: selectedLocFilter === "all" ? "var(--accent)" : "var(--text)",
                    fontWeight: selectedLocFilter === "all" ? 700 : 500,
                  }}
                  onClick={() => { setSelectedLocFilter("all"); setActiveHeaderMenu(null); }}
                >
                  Tất cả Vị trí
                </div>
                {availableLocations.map((loc) => (
                  <div
                    key={loc}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      background: selectedLocFilter === loc ? "rgba(59, 130, 246, 0.12)" : "transparent",
                      color: selectedLocFilter === loc ? "var(--accent)" : "var(--text)",
                      fontWeight: selectedLocFilter === loc ? 700 : 500,
                    }}
                    onClick={() => { setSelectedLocFilter(loc); setActiveHeaderMenu(null); }}
                  >
                    {loc}
                  </div>
                ))}
              </>
            )}

            {type === "result" && (
              <>
                {[
                  { label: "Tất cả Kết quả", val: "all" },
                  { label: "Pass (Không comment)", val: "nocomments" },
                  { label: "Dev đã phản hồi", val: "dev_replied" },
                  { label: "Chờ Dev phản hồi", val: "pending_reply" },
                  { label: "Re-check lặp lại", val: "multiround" },
                ].map((opt) => (
                  <div
                    key={opt.val}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      background: huyenCommentFilter === opt.val ? "rgba(59, 130, 246, 0.12)" : "transparent",
                      color: huyenCommentFilter === opt.val ? "var(--accent)" : "var(--text)",
                      fontWeight: huyenCommentFilter === opt.val ? 700 : 500,
                    }}
                    onClick={() => { setHuyenCommentFilter(opt.val as any); setActiveHeaderMenu(null); }}
                  >
                    {opt.label}
                  </div>
                ))}
              </>
            )}

            {type === "pr" && (
              <>
                {[
                  { label: "Tất cả PR", val: "all" },
                  { label: "tool-100 Repo", val: "tool" },
                  { label: "lisa-ai-agent Repo", val: "agent" },
                  { label: "Web Dashboard Repo", val: "web" },
                  { label: "wait for deployment / dev", val: "wait" },
                  { label: "ready for review", val: "ready" },
                  { label: "Closed / Deployed", val: "closed" },
                ].map((opt) => (
                  <div
                    key={opt.val}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      background: selectedPrFilter === opt.val ? "rgba(59, 130, 246, 0.12)" : "transparent",
                      color: selectedPrFilter === opt.val ? "var(--accent)" : "var(--text)",
                      fontWeight: selectedPrFilter === opt.val ? 700 : 500,
                    }}
                    onClick={() => { setSelectedPrFilter(opt.val); setActiveHeaderMenu(null); }}
                  >
                    {opt.label}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </th>
    );
  };

  const isAnyFilterActive =
    selectedDevFilter !== "all" ||
    selectedLocFilter !== "all" ||
    huyenCommentFilter !== "all" ||
    selectedPrFilter !== "all" ||
    pauseFilter !== "all";

  const resetAllFilters = () => {
    setSelectedDevFilter("all");
    setSelectedLocFilter("all");
    setHuyenCommentFilter("all");
    setSelectedPrFilter("all");
    setPauseFilter("all");
    setActiveHeaderMenu(null);
  };

  // Find active period details from topbar filters
  const activePeriod = useMemo(() => {
    if (periodKey && periodKey !== "all") {
      const found = view.availablePeriods.find((p) => p.key === periodKey);
      if (found) return found;
    }
    if (periodKey === "all") {
      return {
        key: "all",
        label: "Tất cả các kỳ",
        startDate: "2020-01-01",
        endDate: "2099-12-31",
      };
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

  const isDevGithubAuthor = (devCode: string, prAuthor?: string) => {
    if (!prAuthor) return false;
    const a = prAuthor.toLowerCase();
    if (devCode === "HuyDH") return a === "hoanghuy04" || a === "huydh-04" || a === "huydh";
    if (devCode === "HoNX") return a === "xuanho1710" || a === "nguyenxuanho-02" || a === "honx" || a === "xuanho";
    if (devCode === "HoangGV") return a === "mirindaq" || a === "hoanggiapviet" || a === "hoanggv" || a === "hoang.gv314" || a === "viet.hoang";
    if (devCode === "HuyenTN") return a === "tranngochuyen1909" || a === "huyentn";
    return false;
  };

  // Helper to match a bug to a person
  const bugBelongsToPerson = (bug: BugRecord, person: Person) => {
    if (bug.pullRequestUrl && bug.prAuthor) {
      const prAuthorLower = bug.prAuthor.toLowerCase();
      if (
        isDevGithubAuthor(person.code, prAuthorLower) ||
        (person.githubUsername && prAuthorLower === person.githubUsername.toLowerCase())
      )
        return true;
      if (
        view.personnel.some(
          (p) =>
            p.code !== person.code &&
            (isDevGithubAuthor(p.code, prAuthorLower) ||
              (p.githubUsername && p.githubUsername.toLowerCase() === prAuthorLower))
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
    const st = (b.status ?? "").toLowerCase();
    return (
      note.includes("không tái hiện") ||
      note.includes("ko tái hiện") ||
      note.includes("no repro") ||
      note.includes("nobrepro") ||
      note.includes("không phải lỗi") ||
      note.includes("ko phải lỗi") ||
      st.includes("không tái hiện") ||
      st.includes("ko tái hiện") ||
      st.includes("no repro")
    );
  };

  const isFixed = (b: BugRecord) => {
    const st = (b.status ?? "").toLowerCase();
    if (st === "cancel" || st.includes("không lỗi") || st.includes("wontfix")) return false;
    if (isNoRepro(b)) return false;
    if (hasPR(b)) return true;
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
    );
  };

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

  // Render exact GitHub PR Labels & Status badges (High-contrast, elegant colors)
  const renderLabelBadge = (bug: BugRecord) => {
    const ghLbls = bug.ghLabels ?? [];
    if (ghLbls.length > 0) {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            justifyContent: "center",
          }}
        >
          {ghLbls.map((lbl, idx) => {
            const l = lbl.toLowerCase();
            let bg = "#f1f5f9",
              color = "#334155",
              border = "1px solid #cbd5e1";
            if (l.includes("wait")) {
              bg = "#e0f2fe";
              color = "#0369a1";
              border = "1px solid #bae6fd";
            } else if (l.includes("change")) {
              bg = "#fee2e2";
              color = "#b91c1c";
              border = "1px solid #fca5a5";
            } else if (l.includes("ready")) {
              bg = "#e0e7ff";
              color = "#4338ca";
              border = "1px solid #c7d2fe";
            } else if (l.includes("merge")) {
              bg = "#f3e8ff";
              color = "#7e22ce";
              border = "1px solid #d8b4fe";
            } else if (l.includes("close")) {
              bg = "#f1f5f9";
              color = "#334155";
              border = "1px solid #cbd5e1";
            }
            return (
              <span
                key={idx}
                className="tag"
                style={{
                  background: bg,
                  color,
                  border,
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "5px",
                }}
              >
                {lbl}
              </span>
            );
          })}
        </div>
      );
    }

    const status = (bug.status ?? "").toLowerCase();
    if (status === "merged" || status.includes("merge")) {
      return (
        <span
          className="tag"
          style={{
            background: "#f3e8ff",
            color: "#7e22ce",
            border: "1px solid #d8b4fe",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "5px",
          }}
        >
          Merged
        </span>
      );
    }
    if (status === "closed" || status.includes("close")) {
      return (
        <span
          className="tag"
          style={{
            background: "#f1f5f9",
            color: "#334155",
            border: "1px solid #cbd5e1",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "5px",
          }}
        >
          Closed
        </span>
      );
    }

    if (status === "wait for development" || status.includes("wait")) {
      return (
        <span
          className="tag"
          style={{
            background: "#e0f2fe",
            color: "#0369a1",
            border: "1px solid #bae6fd",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "5px",
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
            color: "#b91c1c",
            border: "1px solid #fca5a5",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "5px",
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
            background: "#e0f2fe",
            color: "#0369a1",
            border: "1px solid #bae6fd",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "5px",
          }}
        >
          Ready for review
        </span>
      );
    }

    return (
      <span
        style={{
          color: "var(--text-3)",
          fontSize: "11px",
        }}
      >
        —
      </span>
    );
  };

  const hasPR = (b: BugRecord) => {
    return Boolean(b.pullRequestUrl && b.pullRequestUrl.trim().length > 0);
  };

  // Check if bug was reviewed by HuyenTN:
  // Quy tắc chuẩn từ QC Lead:
  // 1. PHẢI CÓ PR (pullRequestUrl) mới review được!
  // 2. Chắc chắn đã review khi thỏa mãn 1 trong 3 điều kiện:
  //    a) Trường Reviewers trong Notion chứa ID/Tên của Huyền
  //    b) Đã có comment của TranNgocHuyen1909 trên GitHub PR (prCommentsByHuyen > 0)
  //    c) Đã tự chuyển Label/Status sang 'wait for development' / 'wait for dev'
  const isReviewedByHuyen = (b: BugRecord) => {
    if (!hasPR(b)) return false; // Không có PR -> Không thể review!
    if (isNoRepro(b)) return false;

    const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
    const status = (b.status ?? "").toLowerCase();
    const huyenComments = b.prCommentsByHuyen ?? 0;
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    const isWaitLabelOnPR = ghLbls.some((l) => l.includes("wait"));
    const hasHuyenInReviewers = (b.reviewerIds ?? []).includes(huyenNotionId);

    return (
      hasHuyenInReviewers ||
      huyenComments > 0 ||
      isWaitLabelOnPR ||
      status === "wait for development" ||
      status.includes("wait")
    );
  };

  // Helper to get bug fixed date
  const bugFixedDate = (b: BugRecord) => {
    if (b.pullRequestUrl && b.prCreatedAt) {
      return dateKey(b.prCreatedAt);
    }
    return dateKey(b.lastEditedTime) ?? dateKey(b.confirmedDate);
  };

  // Bugs fixed in active period (Must HAVE a PR)
  const periodFixedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      if (!hasPR(b)) return false; // Must have PR to be a fixed task needing QA review!
      const fDate = bugFixedDate(b);
      return (
        dateInRange(fDate, activePeriod?.startDate, activePeriod?.endDate) &&
        isFixed(b) &&
        (b.status ?? "").toLowerCase() !== "cancel"
      );
    });
  }, [view.bugs, activePeriod]);

  // Helper to determine exact review timestamp for Huyen
  // Helper to determine exact review timestamp for Huyen
  const huyenReviewDate = (b: BugRecord) => {
    return (
      dateKey(b.reviewEndDate) ||
      dateKey(b.reviewStartDate) ||
      dateKey(b.huyenLastCommentAt) ||
      dateKey(b.huyenFirstCommentAt) ||
      dateKey(b.lastEditedTime) ||
      b.confirmedDate ||
      dateKey(b.prCreatedAt)
    );
  };

  // ── HUYEN REVIEW TAB DATA ──
  // Quy tắc từ QC Lead (User):
  // 1. Tổng đã review: Notion có Reviewers là Huyền, có Ngày bắt đầu review (reviewStartDate) thuộc khoảng thời gian filter
  // 2. Review pass ngay: Ngày bắt đầu review === Ngày kết thúc review (start && end && start === end)
  // 3. Review có comment: 2 ngày này khác nhau bao gồm ngày kết thúc rỗng (start && end && start !== end, hoặc start && !end)
  // 4. Re-review: Ngày kết thúc review rỗng (start && !end)

  const huyenReviewedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      if ((b.status ?? "").toLowerCase() === "cancel") return false;
      const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
      const hasHuyenReviewer =
        (b.reviewerIds ?? []).includes(huyenNotionId) ||
        (b.prCommentsByHuyen ?? 0) > 0 ||
        Boolean(b.huyenFirstCommentAt) ||
        b.reviewStartDate !== undefined ||
        b.reviewEndDate !== undefined;
      if (!hasHuyenReviewer) return false;

      const rStart = dateKey(b.reviewStartDate);
      const rEnd = dateKey(b.reviewEndDate);
      const fCmt = dateKey(b.huyenFirstCommentAt);
      const lCmt = dateKey(b.huyenLastCommentAt);
      const conf = dateKey(b.confirmedDate);

      return (
        dateInRange(rStart, activePeriod?.startDate, activePeriod?.endDate) ||
        dateInRange(rEnd, activePeriod?.startDate, activePeriod?.endDate) ||
        dateInRange(fCmt, activePeriod?.startDate, activePeriod?.endDate) ||
        dateInRange(lCmt, activePeriod?.startDate, activePeriod?.endDate) ||
        dateInRange(conf, activePeriod?.startDate, activePeriod?.endDate)
      );
    });
  }, [view.bugs, activePeriod]);

  const isHuyenBugApprovedWithNote = (b: BugRecord) => {
    if (b.huyenHasApproveWithNote === true) return true;
    const huyenCommentsCount = b.prCommentsByHuyen ?? 0;
    const huyenApprovedInReview = (b.ghReviews ?? []).some((r) => {
      const a = (r.author || "").toLowerCase();
      return (
        (a === "tranngochuyen1909" || a === "huyentn") &&
        (r.state === "APPROVED" || r.state === "COMMENTED")
      );
    });
    if (huyenApprovedInReview && huyenCommentsCount > 0) return true;
    const note = (b.note ?? "").toLowerCase();
    return huyenCommentsCount > 0 && note.includes("approve with note");
  };

  const isHuyenBugChangesRequested = (b: BugRecord) => {
    if (isHuyenBugApprovedWithNote(b)) return false;

    // Must verify if Huyen (QC) herself commented or requested changes on GitHub PR
    const huyenCommentsCount = b.prCommentsByHuyen ?? 0;
    const huyenChangesReqInReview = (b.ghReviews ?? []).some((r) => {
      const a = (r.author || "").toLowerCase();
      return (
        (a === "tranngochuyen1909" || a === "huyentn") &&
        r.state === "CHANGES_REQUESTED"
      );
    });

    const huyenSpecificallyCommentedOrRequested =
      huyenCommentsCount > 0 ||
      b.huyenHasChangesRequested === true ||
      huyenChangesReqInReview;

    // If Huyen did NOT comment or request changes on GitHub, she passed it without comments (Pass ngay)
    if (!huyenSpecificallyCommentedOrRequested) {
      return false;
    }

    if (b.huyenHasChangesRequested === true || huyenChangesReqInReview) {
      return true;
    }

    const note = (b.note ?? "").toLowerCase();
    const st = (b.status ?? "").toLowerCase();
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    if (
      st.includes("change requested") ||
      st.includes("changes requested") ||
      ghLbls.some((l) => l.includes("change")) ||
      note.includes("request change") ||
      note.includes("có lỗi")
    ) {
      return true;
    }

    return huyenCommentsCount > 0;
  };

  const isHuyenBugPassNgay = (b: BugRecord) => {
    if (isHuyenBugApprovedWithNote(b) || isHuyenBugChangesRequested(b)) return false;
    const start = dateKey(b.reviewStartDate);
    const end = dateKey(b.reviewEndDate);
    if (start && end && start === end) return true;
    if (b.ghReviewStatus === "Approved") return true;
    return true;
  };

  const isHuyenBugWithComment = (b: BugRecord) => {
    return isHuyenBugChangesRequested(b);
  };

  const isHuyenBugReReview = (b: BugRecord) => {
    const start = dateKey(b.reviewStartDate);
    const end = dateKey(b.reviewEndDate);
    if (start && !end) return true;
    return (b.prCommentsByHuyen ?? 0) > 1 || (b.huyenReviewRounds ?? 0) > 1;
  };

  const huyenReviewedChangesRequested = useMemo(() => {
    return huyenReviewedBugs.filter(isHuyenBugChangesRequested);
  }, [huyenReviewedBugs]);

  const huyenReviewedApprovedWithNote = useMemo(() => {
    return huyenReviewedBugs.filter(isHuyenBugApprovedWithNote);
  }, [huyenReviewedBugs]);

  const huyenReviewedWithComments = useMemo(() => {
    return huyenReviewedChangesRequested;
  }, [huyenReviewedChangesRequested]);

  const huyenReviewedNoComments = useMemo(() => {
    return huyenReviewedBugs.filter(isHuyenBugPassNgay);
  }, [huyenReviewedBugs]);

  // PRs requiring re-review trong kỳ (Filter từ huyenReviewedBugs)
  const huyenMultiRoundBugs = useMemo(() => {
    return huyenReviewedBugs.filter(isHuyenBugReReview);
  }, [huyenReviewedBugs]);

  // Filter bugs waiting for Huyen review (Must belong to team devs: HoangGV, HoNX, HuyDH in active period)
  const pendingHuyenReviewBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const belongsToTeamDev = dev3People.some((p) => bugBelongsToPerson(b, p));
      if (!belongsToTeamDev) return false; // Must belong to team dev!

      if (isNoRepro(b)) return false;
      if (isBugPausedFix(b)) return false;

      const st = (b.status ?? "").toLowerCase();
      if (st === "cancel" || st === "new" || st === "in progress") return false;

      const start = dateKey(b.reviewStartDate);
      const end = dateKey(b.reviewEndDate);

      // Nếu đã có cả Ngày kết thúc review -> Đã review xong, không còn chờ nữa!
      if (end) return false;

      // Phải nằm trong kỳ active period (theo ngày bắt đầu review hoặc ngày dev báo sửa bug)
      const fDate = bugFixedDate(b);
      const isPeriodBug =
        dateInRange(start, activePeriod?.startDate, activePeriod?.endDate) ||
        dateInRange(fDate, activePeriod?.startDate, activePeriod?.endDate);
      if (!isPeriodBug) return false;

      const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
      const isClosedOrMerged =
        st.includes("close") ||
        st.includes("merge") ||
        st.includes("deploy") ||
        (b as any).ghState === "closed" ||
        (b as any).ghState === "merged" ||
        (b as any).isMerged === true ||
        ghLbls.some(
          (l) =>
            l.includes("close") ||
            l.includes("merge") ||
            l.includes("deploy"),
        );

      if (isClosedOrMerged) return false;

      return true;
    });
  }, [view.bugs, dev3People, activePeriod]);

  // Bug chưa có PR (chưa hiện thực được) thuộc 3 Dev do Huyền quản lý
  const teamPendingNoPrBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const belongsToTeamDev = dev3People.some((p) => bugBelongsToPerson(b, p));
      if (!belongsToTeamDev) return false;
      const st = (b.status ?? "").toLowerCase();
      if (st === "cancel" || st === "closed" || st === "deployed") return false;
      if (isNoRepro(b)) return false;
      if (isBugPausedFix(b)) return false;
      return !hasPR(b);
    });
  }, [view.bugs, dev3People]);

  // Bug tạm dừng fix (isPausedFix === true) thuộc 3 Dev do Huyền quản lý
  const teamPendingPausedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const belongsToTeamDev = dev3People.some((p) => bugBelongsToPerson(b, p));
      if (!belongsToTeamDev) return false;
      const st = (b.status ?? "").toLowerCase();
      if (st === "cancel" || st === "closed" || st === "deployed") return false;
      if (isNoRepro(b)) return false;
      return isBugPausedFix(b);
    });
  }, [view.bugs, dev3People]);

  // Tất cả bug Status = Resolved thuộc 3 Dev do Huyền quản lý (Tổng Resolved = 37)
  const teamResolvedBugs = useMemo(() => {
    return view.bugs.filter((b) => {
      const belongsToTeamDev = dev3People.some((p) => bugBelongsToPerson(b, p));
      if (!belongsToTeamDev) return false;
      const st = (b.status ?? "").toLowerCase();
      if (st !== "resolved") return false;
      if (isNoRepro(b)) return false;
      return true;
    });
  }, [view.bugs, dev3People]);

  // Phân rã 3 nhóm từ teamResolvedBugs:
  // 1. Tạm dừng fix (Checked)
  const teamResolvedPausedBugs = useMemo(() => {
    return teamResolvedBugs.filter((b) => isBugPausedFix(b));
  }, [teamResolvedBugs]);

  // 2. PR empty (Chưa có link PR)
  const teamResolvedNoPrBugs = useMemo(() => {
    return teamResolvedBugs.filter((b) => !isBugPausedFix(b) && !hasPR(b));
  }, [teamResolvedBugs]);

  // 3. Ưu tiên review (Có PR & Tạm dừng Unchecked)
  const teamResolvedPriorityBugs = useMemo(() => {
    return teamResolvedBugs.filter((b) => !isBugPausedFix(b) && hasPR(b));
  }, [teamResolvedBugs]);



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
      const approvedWithNoteCount = devBugs.filter(isHuyenBugApprovedWithNote).length;
      const changesRequestedCount = devBugs.filter(isHuyenBugChangesRequested).length;
      const totalQcCommentsCount = devBugs.reduce(
        (sum, b) => sum + (b.prCommentsByHuyen ?? 0),
        0,
      );
      const withCommentCount = changesRequestedCount;
      const noCommentCount = devBugs.filter(isHuyenBugPassNgay).length;
      const pendingCount = teamResolvedPriorityBugs.filter((b) =>
        bugBelongsToPerson(b, dev),
      ).length;
      const reviewRate =
        fixedCount > 0 ? (reviewedCount / fixedCount) * 100 : 0;
      return {
        dev,
        fixedCount,
        reviewedCount,
        approvedWithNoteCount,
        changesRequestedCount,
        totalQcCommentsCount,
        withCommentCount,
        noCommentCount,
        pendingCount,
        reviewRate,
      };
    });
  }, [dev3People, periodFixedBugs, huyenReviewedBugs, teamResolvedPriorityBugs]);

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
      if (huyenCommentFilter === "changes_requested") return isHuyenBugChangesRequested(b);
      if (huyenCommentFilter === "approved_with_note") return isHuyenBugApprovedWithNote(b);
      if (huyenCommentFilter === "nocomments") return isHuyenBugPassNgay(b);
      if (huyenCommentFilter === "multiround") return isHuyenBugReReview(b);
      if (huyenCommentFilter === "dev_replied") return isDevRepliedBug(b);
      if (huyenCommentFilter === "pending_reply")
        return isHuyenBugWithComment(b) && !isDevRepliedBug(b);

      if (selectedPrFilter !== "all") {
        const prs = extractAllPrUrls(b.pullRequestUrl);
        const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
        const stLower = (b.status ?? "").toLowerCase();

        if (selectedPrFilter === "tool") {
          if (!prs.some((p) => p.repoLabel === "tool")) return false;
        } else if (selectedPrFilter === "agent") {
          if (!prs.some((p) => p.repoLabel === "agent")) return false;
        } else if (selectedPrFilter === "web") {
          if (!prs.some((p) => p.repoLabel === "web")) return false;
        } else if (selectedPrFilter === "wait") {
          if (!stLower.includes("wait") && !ghLbls.some((l) => l.includes("wait"))) return false;
        } else if (selectedPrFilter === "ready") {
          if (!stLower.includes("ready") && !ghLbls.some((l) => l.includes("ready"))) return false;
        } else if (selectedPrFilter === "closed") {
          if (!stLower.includes("close") && !stLower.includes("deploy") && !ghLbls.some((l) => l.includes("close") || l.includes("merge"))) return false;
        }
      }

      return true;
    });
  }, [
    huyenReviewedBugs,
    selectedDevFilter,
    selectedLocFilter,
    huyenCommentFilter,
    dev3People,
  ]);


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

      if (selectedPrFilter !== "all") {
        const prs = extractAllPrUrls(b.pullRequestUrl);
        const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
        const stLower = (b.status ?? "").toLowerCase();

        if (selectedPrFilter === "tool") {
          if (!prs.some((p) => p.repoLabel === "tool")) return false;
        } else if (selectedPrFilter === "agent") {
          if (!prs.some((p) => p.repoLabel === "agent")) return false;
        } else if (selectedPrFilter === "web") {
          if (!prs.some((p) => p.repoLabel === "web")) return false;
        } else if (selectedPrFilter === "wait") {
          if (!stLower.includes("wait") && !ghLbls.some((l) => l.includes("wait"))) return false;
        } else if (selectedPrFilter === "ready") {
          if (!stLower.includes("ready") && !ghLbls.some((l) => l.includes("ready"))) return false;
        } else if (selectedPrFilter === "closed") {
          if (!stLower.includes("close") && !stLower.includes("deploy") && !ghLbls.some((l) => l.includes("close") || l.includes("merge"))) return false;
        }
      }

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
                  <tr style={{ background: "var(--surface-2)", color: "var(--text-1)", fontWeight: "bold", borderBottom: "1px solid var(--border-2)" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-1)" }}>TÁC GIẢ</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TỔNG FIX</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>HUYỀN REVIEW</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TRƯỜNG DUYỆT</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TỶ LỆ LỖI VÒNG 1</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TỶ LỆ CẦN SỬA VÒNG 2</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>HOÀN THÀNH</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TIẾN ĐỘ CHUNG</th>
                  </tr>
                </thead>
                <tbody>
                  {allDevStats.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-2)", background: idx % 2 === 0 ? "var(--surface-1)" : "var(--surface-2)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", cursor: "pointer", color: "var(--text-1)" }}
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
                  <tr style={{ background: "var(--surface-2)", color: "var(--text-1)", fontWeight: "bold", borderBottom: "1px solid var(--border-2)" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-1)" }}>TÁC GIẢ</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TỔNG BUG FIX</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>APPROVED</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>CHANGES REQ</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>WAIT FOR DEV</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>CHƯA ĐỤNG TỚI</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}>TIẾN ĐỘ DUYỆT</th>
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
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-2)", background: idx % 2 === 0 ? "var(--surface-1)" : "var(--surface-2)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: "700", cursor: "pointer", color: "var(--text-1)" }}
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
                borderTop: "4px solid #2563eb",
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailSubTab("reviewed");
                setHuyenCommentFilter("all");
                scrollToDetails();
              }}
              title={`[Công thức Tính toán]\n• TỔNG ĐÃ REVIEW: Đếm tất cả Task có PR hợp lệ mà Huyền đã test & review trong kỳ.\n• Điều kiện: Có PR + (Gán Reviewer Huyền trên Notion OR Có comment GitHub OR Đã đổi status/label sang wait for dev).\n• Tỷ lệ hoàn thành = (Đã review ${huyenReviewedBugs.length} / Total Dev đã sửa ${periodFixedBugs.filter((b) => getDevNameByBug(b) !== "HuyenTN").length}) = ${periodFixedBugs.filter((b) => getDevNameByBug(b) !== "HuyenTN").length > 0 ? ((huyenReviewedBugs.length / periodFixedBugs.filter((b) => getDevNameByBug(b) !== "HuyenTN").length) * 100).toFixed(0) : 0}%`}
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
                  color: "#2563eb",
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
              title={`[Công thức Tính toán]\n• REVIEW CÓ COMMENT: Task có PR mà Huyền có viết comment ra lỗi trực tiếp trên GitHub PR.\n• Tỷ lệ có comment = (Số bug có comment ${huyenReviewedWithComments.length} / Tổng đã review ${huyenReviewedBugs.length}) × 100% = ${huyenReviewedBugs.length > 0 ? ((huyenReviewedWithComments.length / huyenReviewedBugs.length) * 100).toFixed(0) : 0}%`}
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
              title={`[Công thức Tính toán]\n• RE-REVIEW: Task mà Huyền phải vào comment/re-review từ 2 lần trở lên (khi Dev sửa chưa đạt).\n• Tỷ lệ re-review = (Số bug re-review >1 lần ${huyenMultiRoundBugs.length} / Tổng đã review ${huyenReviewedBugs.length}) × 100% = ${huyenReviewedBugs.length > 0 ? ((huyenMultiRoundBugs.length / huyenReviewedBugs.length) * 100).toFixed(0) : 0}%`}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#f59e0b",
                  fontWeight: "bold",
                }}
              >
                RE-REVIEW
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
                Tỷ lệ re-review:{" "}
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
              title={`[Công thức Tính toán]\n• REVIEW KHÔNG COMMENT: Task Huyền test Pass 100% không comment lỗi, tự chuyển sang wait for dev.\n• Phép tính = Tổng đã review (${huyenReviewedBugs.length}) - Review có comment (${huyenReviewedWithComments.length}) = ${huyenReviewedNoComments.length}\n• Tỷ lệ Pass ngay = (Số bug không comment ${huyenReviewedNoComments.length} / Tổng đã review ${huyenReviewedBugs.length}) × 100% = ${huyenReviewedBugs.length > 0 ? ((huyenReviewedNoComments.length / huyenReviewedBugs.length) * 100).toFixed(0) : 0}%`}
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
              title={`[Bug Chờ Review: ${teamResolvedPriorityBugs.length}]\n• ${teamResolvedPriorityBugs.length} bug CÓ PR: Dev đã sửa & sẵn sàng chờ QA review\n• Đã loại trừ hoàn toàn các bug Tạm dừng fix`}
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
                {teamResolvedPriorityBugs.length}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
                ({teamResolvedPriorityBugs.length} có PR &bull; {teamResolvedNoPrBugs.length} PR empty)
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
                  Pass ngay
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
                  Pass có note
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
                  Request changes (Lỗi)
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#64748b",
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
                const approvedNoteWidth = ((row.approvedWithNoteCount ?? 0) / maxVal) * 100;
                const withCommentWidth = ((row.changesRequestedCount ?? row.withCommentCount) / maxVal) * 100;
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
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("nocomments");
                            scrollToDetails();
                          }}
                          title={`[Bấm để lọc chi tiết]\n• Dev: ${row.dev.code}\n• Loại: Pass 100% (Không comment)\n• Số lượng: ${row.noCommentCount} bug`}
                        >
                          {noCommentWidth > 6 && `${row.noCommentCount} Pass`}
                        </div>
                      )}

                      {/* Segment 2: Pass có Note (Amber) */}
                      {(row.approvedWithNoteCount ?? 0) > 0 && (
                        <div
                          style={{
                            width: `${approvedNoteWidth}%`,
                            height: "100%",
                            background: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            transition: "width 0.4s ease-out",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("approved_with_note");
                            scrollToDetails();
                          }}
                          title={`[Bấm để lọc chi tiết]\n• Dev: ${row.dev.code}\n• Loại: Pass Có Note (Approve with note)\n• Số lượng: ${row.approvedWithNoteCount} bug`}
                        >
                          {approvedNoteWidth > 6 && `${row.approvedWithNoteCount} Note`}
                        </div>
                      )}

                      {/* Segment 3: Request Changes / Lỗi (Red) */}
                      {(row.changesRequestedCount ?? row.withCommentCount) > 0 && (
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
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("reviewed");
                            setHuyenCommentFilter("changes_requested");
                            scrollToDetails();
                          }}
                          title={`[Bấm để lọc chi tiết]\n• Dev: ${row.dev.code}\n• Loại: Request Changes (Lỗi)\n• Số lượng: ${row.changesRequestedCount ?? row.withCommentCount} bug`}
                        >
                          {withCommentWidth > 6 &&
                            `${row.changesRequestedCount ?? row.withCommentCount} Lỗi`}
                        </div>
                      )}

                      {/* Segment 4: Chờ Review (Gray) */}
                      {row.pendingCount > 0 && (
                        <div
                          style={{
                            width: `${pendingWidth}%`,
                            height: "100%",
                            background: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            transition: "width 0.4s ease-out",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedDevFilter(row.dev.code);
                            setDetailSubTab("pending");
                            scrollToDetails();
                          }}
                          title={`[Bấm để lọc chi tiết]\n• Dev: ${row.dev.code}\n• Loại: Đang chờ review\n• Số lượng: ${row.pendingCount} bug`}
                        >
                          {pendingWidth > 6 && `${row.pendingCount} Chờ`}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        width: "320px",
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
                        (🟢 {row.noCommentCount} pass | 🟨 {row.approvedWithNoteCount ?? 0} note | 🔴{" "}
                        {row.changesRequestedCount ?? row.withCommentCount} lỗi | ⏳ {row.pendingCount} chờ)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Dev Review Breakdown Table */}
            <DevBreakdownTable
              devReviewStats={devReviewStats}
              huyenReviewedBugs={huyenReviewedBugs}
              huyenReviewedWithComments={huyenReviewedWithComments}
              bugBelongsToPerson={bugBelongsToPerson}
              onSelectDevFilter={(devCode) => setSelectedDevFilter(devCode)}
              onSelectSubTab={(tab) => setDetailSubTab(tab)}
              onSelectCommentFilter={(filter) => setHuyenCommentFilter(filter)}
              scrollToDetails={scrollToDetails}
            />
          </div>

          {/* Minimalist & Clean Details Tables for Huyen */}{/* Minimalist & Clean Details Tables for Huyen */}
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
                  Danh Sách Chờ Review (
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
                  Danh Sách Đã Review (
                  {
                    displayedReviewed.filter(
                      (b) => getDevNameByBug(b) !== "HuyenTN",
                    ).length
                  }
                  )
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
                  <option value="nocomments">
                    Pass ngay ({huyenReviewedNoComments.length})
                  </option>
                  <option value="approved_with_note">
                    Pass có note ({huyenReviewedApprovedWithNote.length})
                  </option>
                  <option value="changes_requested">
                    Request changes ({huyenReviewedChangesRequested.length})
                  </option>
                  <option value="dev_replied">
                    Dev đã reply ({huyenDevRepliedBugs.length})
                  </option>
                  <option value="pending_reply">
                    Chờ Dev reply ({huyenPendingReplyBugs.length})
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

              {isAnyFilterActive && (
                <button
                  className="ctrl"
                  onClick={resetAllFilters}
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    height: "38px",
                    padding: "0 14px",
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    marginLeft: "auto",
                  }}
                  title="Xóa tất cả các điều kiện lọc và quay về mặc định"
                >
                  <span>🔄</span> Xóa bộ lọc (Reset)
                </button>
              )}
            </div>

            {/* Render Tables according to detailSubTab */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr",
                gap: "0px",
              }}
            >
              {/* Reviewed Table */}
              {detailSubTab === "reviewed" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
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
                    <div style={{ overflowX: "auto", flex: 1 }}>
                      <ReviewBugsTable
                        tableType="reviewed"
                        bugs={displayedReviewed}
                        pagedBugs={pagedReviewedBugs}
                        page={pageReviewed}
                        totalPages={totalPagesReviewed}
                        totalCount={reviewedFilteredNoHuyen.length}
                        pageSize={pageSize}
                        setPage={setPageReviewed}
                        selectedDevFilter={selectedDevFilter}
                        setSelectedDevFilter={setSelectedDevFilter}
                        selectedLocFilter={selectedLocFilter}
                        setSelectedLocFilter={setSelectedLocFilter}
                        huyenCommentFilter={huyenCommentFilter}
                        setHuyenCommentFilter={setHuyenCommentFilter}
                        selectedPrFilter={selectedPrFilter}
                        setSelectedPrFilter={setSelectedPrFilter}
                        activeHeaderMenu={activeHeaderMenu}
                        setActiveHeaderMenu={setActiveHeaderMenu}
                        dev3People={dev3People}
                        availableLocations={availableLocations}
                        huyenReviewedBugs={huyenReviewedBugs}
                        huyenDevRepliedBugs={huyenDevRepliedBugs}
                        huyenPendingReplyBugs={huyenPendingReplyBugs}
                        huyenReviewedNoComments={huyenReviewedNoComments}
                        getDevNameByBug={getDevNameByBug}
                        getLocationTagStyle={getLocationTagStyle}
                        extractAllPrUrls={extractAllPrUrls}
                        renderLabelBadge={renderLabelBadge}
                        renderResultBadge={(b) => {
                          if (isNoRepro(b)) {
                            return (
                              <span
                                className="tag"
                                style={{
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                                title="Lỗi không thể tái hiện / không phải lỗi"
                              >
                                Không tái hiện
                              </span>
                            );
                          }

                          if (isHuyenBugApprovedWithNote(b)) {
                            return (
                              <span
                                className="tag"
                                style={{
                                  background: "#fef3c7",
                                  color: "#d97706",
                                  border: "1px solid #fde68a",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                                title="Approve with note (Có comment góp ý thêm)"
                              >
                                Pass có note
                              </span>
                            );
                          }

                          if (isHuyenBugChangesRequested(b)) {
                            return (
                              <span
                                className="tag"
                                style={{
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  border: "1px solid #fca5a5",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                                title="Request Changes / Bị bắt lỗi nghiêm trọng"
                              >
                                Request Changes
                              </span>
                            );
                          }

                          return (
                            <span
                              className="tag"
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #86efac",
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "4px",
                              }}
                              title="Huyền test đạt 100%, không comment"
                            >
                              Pass ngay
                            </span>
                          );
                        }}
                      />
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

              {/* Pending Table */}
              {detailSubTab === "pending" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
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
                    <div style={{ overflowX: "auto", flex: 1 }}>
                      <ReviewBugsTable
                        tableType="pending"
                        bugs={displayedPending}
                        pagedBugs={pagedPendingBugs}
                        page={pagePending}
                        totalPages={totalPagesPending}
                        totalCount={pendingFilteredNoHuyen.length}
                        pageSize={pageSize}
                        setPage={setPagePending}
                        selectedDevFilter={selectedDevFilter}
                        setSelectedDevFilter={setSelectedDevFilter}
                        selectedLocFilter={selectedLocFilter}
                        setSelectedLocFilter={setSelectedLocFilter}
                        huyenCommentFilter={huyenCommentFilter}
                        setHuyenCommentFilter={setHuyenCommentFilter}
                        selectedPrFilter={selectedPrFilter}
                        setSelectedPrFilter={setSelectedPrFilter}
                        activeHeaderMenu={activeHeaderMenu}
                        setActiveHeaderMenu={setActiveHeaderMenu}
                        dev3People={dev3People}
                        availableLocations={availableLocations}
                        huyenReviewedBugs={huyenReviewedBugs}
                        huyenDevRepliedBugs={huyenDevRepliedBugs}
                        huyenPendingReplyBugs={huyenPendingReplyBugs}
                        huyenReviewedNoComments={huyenReviewedNoComments}
                        getDevNameByBug={getDevNameByBug}
                        getLocationTagStyle={getLocationTagStyle}
                        extractAllPrUrls={extractAllPrUrls}
                        renderLabelBadge={renderLabelBadge}
                      />
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
