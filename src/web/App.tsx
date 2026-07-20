import { useEffect, useState, useCallback } from "react";
import type { DashboardView, PeriodType } from "../shared/types";
import { fetchDashboard, refreshData } from "./api";
import { ManagerReport } from "./components/ManagerReport";
import { BugsPanel } from "./components/BugsPanel";
import { PersonalStats } from "./components/PersonalStats";
import { BugLifecycle } from "./components/BugLifecycle";
import { BenchmarkView } from "./components/BenchmarkView";
import { ChecklistView } from "./components/ChecklistView";
import { DevComparison } from "./components/DevComparison";
import { ProcessView } from "./components/ProcessView";
import { ReviewStats } from "./components/ReviewStats";

type Tab = "report" | "bugs" | "comparison" | "personal" | "lifecycle" | "benchmark" | "checklist" | "process" | "reviews";

export function App() {
  const [view, setView] = useState<DashboardView>();
  const [tab, setTab] = useState<Tab>("report");
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [periodKey, setPeriodKey] = useState<string>();
  const [personCode, setPersonCode] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Global custom tooltip event listener to prevent clipping by overflow: auto scroll containers
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

      const rect = target.getBoundingClientRect();
      let x = rect.left + window.scrollX + (rect.width - tooltip.offsetWidth) / 2;
      let y = rect.top + window.scrollY - tooltip.offsetHeight - 8;

      // Constrain within viewport boundaries
      const margin = 12;
      if (x < margin + window.scrollX) {
        x = margin + window.scrollX;
      } else if (x + tooltip.offsetWidth > window.innerWidth + window.scrollX - margin) {
        x = window.innerWidth + window.scrollX - tooltip.offsetWidth - margin;
      }

      // If it overflows the top of the viewport, display it below the element instead
      if (rect.top - tooltip.offsetHeight - 8 < 0) {
        y = rect.bottom + window.scrollY + 8;
      }

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
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
      tooltip.remove();
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDashboard(periodType, periodKey, personCode);
      setView(data);
      if (!periodKey && data.availablePeriods.length > 0) {
        // Default to the latest period that actually has bugs, so the dashboard is not empty on load
        const matchWithBugs = data.availablePeriods.find(p => {
          return data.bugs.some(b => {
            const date = b.prCreatedAt ?? b.lastEditedTime ?? b.detectedDate;
            if (!date) return false;
            const dStr = date.slice(0, 10);
            return dStr >= p.startDate && dStr <= p.endDate;
          });
        });
        if (matchWithBugs) {
          setPeriodKey(matchWithBugs.key);
        } else {
          const d = new Date();
          const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const match = data.availablePeriods.find(p => today >= p.startDate && today <= p.endDate);
          setPeriodKey(match ? match.key : data.availablePeriods[0].key);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [periodType, periodKey, personCode]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await refreshData();
      setView(data);
      setTimeLeft(300); // Reset timer on manual click
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  // Auto-refresh countdown interval (5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          console.log("[Auto-Refresh] Countdown reached zero, syncing data...");
          handleRefresh();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleRefresh]);

  if (loading && !view) {
    return <div className="app"><div className="loading"><div className="loading-spinner" /></div></div>;
  }
  if (!view) {
    return <div className="app"><div className="loading"><p style={{ color: "var(--text-3)" }}>Không có dữ liệu. Cấu hình Notion token rồi thử lại.</p></div></div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "report", label: "📊 Báo cáo" },
    { key: "bugs", label: "🐛 Bugs" },
    { key: "comparison", label: "⚖️ So sánh chất lượng" },
    { key: "reviews", label: "🔍 Hoạt động Review" },
    { key: "personal", label: "👤 Cá nhân" },
    { key: "lifecycle", label: "🔄 Bug Lifecycle" },
    { key: "benchmark", label: "🎯 Benchmark An" },
    { key: "checklist", label: "📋 Checklist" },
    { key: "process", label: "📘 Quy trình PM/QC" },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="logo" />
          <span>QA Report Dashboard</span>
        </div>
        <div className="topbar-controls">
          <select className="ctrl" value={periodType} onChange={e => { setPeriodType(e.target.value as PeriodType); setPeriodKey(undefined); }}>
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
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
            <option value="">Tất cả</option>
            {view.personnel.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </select>
          <button className="ctrl" onClick={toggleTheme} title="Đổi giao diện Sáng / Tối">
            {theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-3)", whiteSpace: "nowrap", fontFamily: "monospace" }} title="Thời gian đếm ngược tự động đồng bộ từ Notion">
              ⏱️ Auto-sync: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
            <button className="ctrl ctrl-primary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Đang sync..." : "🔄 Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="tabs" role="tablist">
          {tabs.map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)} role="tab" aria-selected={tab === t.key}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "report" && <ManagerReport view={view} onUpdate={load} />}
        {tab === "bugs" && <BugsPanel view={view} />}
        {tab === "comparison" && <DevComparison view={view} periodType={periodType} periodKey={periodKey} onUpdate={load} />}
        {tab === "reviews" && <ReviewStats view={view} periodType={periodType} periodKey={periodKey} />}
        {tab === "personal" && <PersonalStats view={view} personCode={personCode} periodType={periodType} />}
        {tab === "lifecycle" && <BugLifecycle view={view} />}
        {tab === "benchmark" && <BenchmarkView view={view} />}
        {tab === "checklist" && <ChecklistView view={view} onUpdate={load} />}
        {tab === "process" && <ProcessView view={view} />}
      </main>
    </div>
  );
}
