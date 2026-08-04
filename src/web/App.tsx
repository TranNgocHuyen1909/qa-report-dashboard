import { useEffect, useState, useCallback } from "react";
import type { DashboardView, PeriodType } from "../shared/types";
import { fetchDashboard, refreshData } from "./api";
import { ManagerReport } from "./components/ManagerReport";
import { PersonalStats } from "./components/PersonalStats";
import { BugLifecycle } from "./components/BugLifecycle";
import { ChecklistView } from "./components/ChecklistView";
import { PrLessonsView } from "./components/PrLessonsView";
import { DevComparison } from "./components/DevComparison";
import { ProcessView } from "./components/ProcessView";
import { ReviewStats } from "./components/ReviewStats";
import { RoleView } from "./components/RoleView";
import { BugWorkflowView } from "./components/BugWorkflowView";
import { ReviewProtocolView } from "./components/ReviewProtocolView";
import { RepeatedBugsAnalysisView } from "./components/RepeatedBugsAnalysisView";

type MainTab = "report" | "roles" | "workflow" | "checklist" | "review" | "comparison" | "lessons" | "repeated";
type ComparisonSubTab = "matrix" | "reviews" | "personal";
type ChecklistSubTab = "master" | "process";

export function App() {
  const [view, setView] = useState<DashboardView>();
  const [tab, setTab] = useState<MainTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("tab") as MainTab) || "report";
  });
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("repo") || "all";
  });

  const handleNavigateTab = useCallback((targetTab: string, repoFilter?: string) => {
    setTab(targetTab as MainTab);
    if (repoFilter) {
      setSelectedRepoFilter(repoFilter);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("tab", targetTab);
    if (repoFilter) {
      url.searchParams.set("repo", repoFilter);
    } else {
      url.searchParams.delete("repo");
    }
    window.history.pushState(null, "", url.toString());
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const currentTab = (params.get("tab") as MainTab) || "report";
      const currentRepo = params.get("repo") || "all";
      setTab(currentTab);
      setSelectedRepoFilter(currentRepo);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [comparisonSubTab, setComparisonSubTab] = useState<ComparisonSubTab>("matrix");
  const [checklistSubTab, setChecklistSubTab] = useState<ChecklistSubTab>("master");

  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [periodKey, setPeriodKey] = useState<string>();
  const [personCode, setPersonCode] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 1800 seconds = 30 minutes

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Global custom tooltip event listener
  useEffect(() => {
    const tooltip = document.createElement("div");
    tooltip.className = "global-custom-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    document.body.appendChild(tooltip);

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tooltip]");
      if (!target) return;

      const text = target.getAttribute("data-tooltip");
      if (!text) return;

      tooltip.innerText = text;
      tooltip.style.display = "block";
      tooltip.style.zIndex = "999999";
      
      const rect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let top = rect.top + window.scrollY - tooltipRect.height - 8;
      let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

      if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 8;
      }
      if (left < 0) left = 8;
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tooltip]");
      if (target) {
        tooltip.style.display = "none";
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDashboard(periodType, periodKey);
      setView(data);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [periodType, periodKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Countdown timer for Notion auto-sync
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          refreshData()
            .then(() => fetchDashboard(periodType, periodKey, personCode))
            .then(data => setView(data))
            .catch(err => console.error("Auto-sync failed:", err));
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [periodType, periodKey, personCode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      const data = await fetchDashboard(periodType, periodKey, personCode);
      setView(data);
      setTimeLeft(1800);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi đồng bộ dữ liệu Notion");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  if (loading && !view) {
    return <div className="app"><div className="loading"><div className="loading-spinner" /></div></div>;
  }
  if (!view) {
    return <div className="app"><div className="loading"><p style={{ color: "var(--text-3)" }}>Không có dữ liệu. Cấu hình Notion token rồi thử lại.</p></div></div>;
  }

  const tabs: { key: MainTab; label: string }[] = [
    { key: "report", label: "Target" },
    { key: "roles", label: "Vai Trò" },
    { key: "workflow", label: "Quy Trình" },
    { key: "checklist", label: "Checklist" },
    { key: "review", label: "Review" },
    { key: "comparison", label: "Tiến Độ" },
    { key: "lessons", label: "Bài Học" },
    { key: "repeated", label: "⚠️ Thống Kê Lỗi Lặp" },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <span>QA Report Dashboard</span>
        </div>
        <div className="topbar-controls">
          <select className="ctrl" value={periodType} onChange={e => { setPeriodType(e.target.value as PeriodType); setPeriodKey(undefined); }}>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
            <option value="day">Theo ngày</option>
          </select>
          <select className="ctrl" value={periodKey ?? ""} onChange={e => setPeriodKey(e.target.value || undefined)}>
            <option value="">Tất cả kỳ</option>
            {view.availablePeriods.map(p => {
              const d = new Date();
              const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const isCurrent = today >= p.startDate && today <= p.endDate;
              return (
                <option key={p.key} value={p.key}>
                  {p.label}{isCurrent ? " (đang diễn ra)" : ""}
                </option>
              );
            })}
          </select>
          <select className="ctrl" value={personCode ?? ""} onChange={e => setPersonCode(e.target.value || undefined)}>
            {view.personnel.map(p => <option key={p.code} value={p.code}>{p.displayName}</option>)}
          </select>
          <button className="ctrl" onClick={toggleTheme} title="Đổi giao diện Sáng / Tối">
            {theme === "dark" ? "Sáng" : "Tối"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-3)", whiteSpace: "nowrap", fontFamily: "monospace" }} title="Thời gian đếm ngược tự động đồng bộ từ Notion">
              Auto-sync: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
            <button className="ctrl ctrl-primary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Đang sync..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Main 4 Navigation Hub Tabs */}
        <div className="tabs" role="tablist">
          {tabs.map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`}
              onClick={() => handleNavigateTab(t.key)} role="tab" aria-selected={tab === t.key}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BÁO CÁO & TIẾN ĐỘ */}
        {tab === "report" && (
          <ManagerReport
            view={view}
            periodType={periodType}
            periodKey={periodKey}
            personCode={personCode}
            onUpdate={load}
          />
        )}

        {/* TAB: HOẠT ĐỘNG CODE REVIEW (STANDALONE TAB) */}
        {tab === "review" && (
          <ReviewStats view={view} periodType={periodType} periodKey={periodKey} />
        )}

        {/* TAB 2: CHẤT LƯỢNG & ĐỘI NGŨ */}
        {tab === "comparison" && (
          <DevComparison view={view} periodType={periodType} periodKey={periodKey} onUpdate={load} />
        )}

        {/* TAB 3: CHECKLIST TỰ KIỂM TRA (CHECKBOXES) */}
        {tab === "checklist" && <ChecklistView initialRepoFilter={selectedRepoFilter} />}

        {/* TAB 4: BÀI HỌC KINH NGHIỆM TỪ PR COMMENTS */}
        {tab === "lessons" && <PrLessonsView view={view} onUpdate={load} />}

        {/* TAB: QUY TRÌNH XỬ LÝ BUG END-TO-END */}
        {tab === "workflow" && <BugWorkflowView onNavigateTab={handleNavigateTab} />}

        {/* TAB 6: PHÂN RÃ VAI TRÒ & TRÁCH NHIỆM */}
        {tab === "roles" && <RoleView />}

        {/* TAB 8: THỐNG KÊ & PHÂN LOẠI LỖI LẶP THEO 9 BÀI HỌC KINH NGHIỆM */}
        {tab === "repeated" && <RepeatedBugsAnalysisView view={view} activePeriodKey={periodKey} />}
      </main>
    </div>
  );
}
