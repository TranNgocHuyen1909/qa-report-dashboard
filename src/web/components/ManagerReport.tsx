import { useState, useEffect } from "react";
import type { DashboardView } from "../../shared/types";
import { saveConclusion } from "../api";

export function ManagerReport({ view, onUpdate }: { view: DashboardView; onUpdate: () => void }) {
  const getDisplayName = (code: string) => {
    return view.personnel.find(p => p.code === code)?.displayName || code;
  };

  const isInvalidBug = (b: any) => {
    const hasPR = Boolean(b.pullRequestUrl && b.pullRequestUrl.trim().length > 0);
    const note = (b.note ?? "").toLowerCase();
    const title = (b.title ?? "").toLowerCase();
    const status = (b.status ?? "").toLowerCase();
    const hasNoRepro = note.includes("tái hiện") || note.includes("no repro") || note.includes("không phải lỗi");
    const hasDuplicate = note.includes("trùng") || note.includes("duplicate") || title.includes("trùng") || status.includes("duplicate");
    return !hasPR || hasNoRepro || hasDuplicate;
  };

  const bugs = view.bugs;
  const closedBugs = bugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase()) && !isInvalidBug(b)).length;
  const resolvedBugs = bugs.filter(b => (b.status ?? "").toLowerCase() === "resolved" && !isInvalidBug(b)).length;
  const fixedBugs = closedBugs + resolvedBugs;
  const openBugs = bugs.filter(b => ["open", "in progress", "wait", "doing"].includes((b.status ?? "").toLowerCase()) && !isInvalidBug(b)).length;
  const reopened = bugs.filter(b => (b.status ?? "").toLowerCase() === "reopened" && !isInvalidBug(b)).length;
  const validBugsOnNotion = bugs.filter(b => !isInvalidBug(b));
  const actualReceived = validBugsOnNotion.length;
  const closeRate = actualReceived > 0 ? ((closedBugs / actualReceived) * 100).toFixed(1) : "0";

  // Latest period summary
  const latest = view.teamMetrics[0];

  // Conclusion Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [risks, setRisks] = useState("");
  const [manDaysOverrides, setManDaysOverrides] = useState<Record<string, number>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Selected Dev Filter for Chart ("all" for total team, or specific person code)
  const [selectedDevFilter, setSelectedDevFilter] = useState<string>("all");

  // Load existing conclusion when active period changes
  const activePeriodKey = latest?.period.key;
  const activeConclusion = activePeriodKey && view.conclusions ? view.conclusions[activePeriodKey] : null;

  useEffect(() => {
    if (activeConclusion) {
      setGood(activeConclusion.good);
      setBad(activeConclusion.bad);
      setRisks(activeConclusion.risks);
      setManDaysOverrides(activeConclusion.manDaysOverrides || {});
      setExplanations(activeConclusion.explanations || {});
    } else {
      setGood("");
      setBad("");
      setRisks("");
      setManDaysOverrides({});
      setExplanations({});
    }
  }, [activePeriodKey, activeConclusion]);

  // Weekly Targets Trajectory for Developers (Realistic Capacity Milestone Curve)
  const weeklyTargetTrajectory = [
    { weekLabel: "Tuần 1", targetPerDev: 4, milestoneLabel: "Mức 0: Làm quen codebase & quy trình (3-5 bug/tuần)" },
    { weekLabel: "Tuần 2", targetPerDev: 6, milestoneLabel: "Mức Onboarding: Tự chủ fix bug độc lập (5-7 bug/tuần)" },
    { weekLabel: "Tuần 3", targetPerDev: 8, milestoneLabel: "Mốc T1: Đạt chuẩn tiến độ người mới (7-9 bug/tuần)" },
    { weekLabel: "Tuần 4", targetPerDev: 10, milestoneLabel: "Mốc T2: Tự làm các task luồng khó (9-11 bug/tuần)" },
    { weekLabel: "Tuần 5", targetPerDev: 12, milestoneLabel: "Mốc T3: Tiệm cận năng suất tối đa (11-13 bug/tuần)" },
    { weekLabel: "Tuần 6", targetPerDev: 14, milestoneLabel: "Mốc 100%: Năng suất thực tế tiêu chuẩn (~12-15 Bug/Tuần)" },
    { weekLabel: "Tuần 7", targetPerDev: 14, milestoneLabel: "Duy trì năng suất tiêu chuẩn (~14 Bug/Tuần)" },
    { weekLabel: "Tuần 8", targetPerDev: 14, milestoneLabel: "Duy trì năng suất tiêu chuẩn (~14 Bug/Tuần)" },
    { weekLabel: "Tuần 9", targetPerDev: 14, milestoneLabel: "Duy trì năng suất tiêu chuẩn (~14 Bug/Tuần)" },
    { weekLabel: "Tuần 10", targetPerDev: 14, milestoneLabel: "Duy trì năng suất tiêu chuẩn (~14 Bug/Tuần)" },
  ];

  // Weekly Targets Trajectory for Lead Reviewer (100% PR Team Capacity Target Curve)
  // Ensures target progressively increases over time and never drops to 0 or arbitrary static values.
  const leadReviewTargetTrajectory = [
    { weekLabel: "Tuần 1", target: 17, milestoneLabel: "👑 Mốc Onboarding: Review Code & Nghiệm thu 100% PRs (~17 PRs/tuần)" },
    { weekLabel: "Tuần 2", target: 25, milestoneLabel: "👑 Mốc T1: Kiểm soát chất lượng PRs toàn team (~25 PRs/tuần)" },
    { weekLabel: "Tuần 3", target: 28, milestoneLabel: "👑 Mốc T2: Tăng tốc nghiệm thu PRs (~28 PRs/tuần)" },
    { weekLabel: "Tuần 4", target: 30, milestoneLabel: "👑 Mốc T3: Review & nghiệm thu tối đa sản lượng team (~30 PRs/tuần)" },
    { weekLabel: "Tuần 5", target: 35, milestoneLabel: "👑 Mốc Tiệm Cận Cao Điểm: Review PRs chất lượng cao (~35 PRs/tuần)" },
    { weekLabel: "Tuần 6", target: 40, milestoneLabel: "👑 Mốc 100%: Năng suất Review tiêu chuẩn (~40 PRs/Tuần)" },
    { weekLabel: "Tuần 7", target: 42, milestoneLabel: "👑 Duy trì năng suất Review tiêu chuẩn (~42 PRs/Tuần)" },
    { weekLabel: "Tuần 8", target: 42, milestoneLabel: "👑 Duy trì năng suất Review tiêu chuẩn (~42 PRs/Tuần)" },
    { weekLabel: "Tuần 9", target: 45, milestoneLabel: "👑 Mốc Tối Đa: Duy trì năng suất Review đỉnh cao (~45 PRs/Tuần)" },
    { weekLabel: "Tuần 10", target: 45, milestoneLabel: "👑 Mốc Tối Đa: Duy trì năng suất Review đỉnh cao (~45 PRs/Tuần)" },
  ];

  const handleAutoDraft = () => {
    if (!latest) return;
    
    let goodText = "";
    const totalFixed = latest.totalFixed;
    const totalDetected = latest.totalDetected;
    if (totalFixed >= totalDetected) {
      goodText += `Team kiểm soát tốt tiến độ: đã sửa xong ${totalFixed} bug/tuần trong khi phát sinh ${totalDetected} bug mới.\n`;
    }
    
    const devs = latest.byPerson;
    devs.forEach((p: any) => {
      const fixed = p.bugsFixed;
      const name = getDisplayName(p.personCode);
      if (fixed >= 10) {
        goodText += `- ${name} đạt sản lượng tốt: ${fixed} bug/tuần.\n`;
      }
    });
    if (!goodText) goodText = "- Năng suất sửa bug theo tuần duy trì ở mức ổn định.";
    
    let badText = "";
    devs.forEach((p: any) => {
      const name = getDisplayName(p.personCode);
      if (p.bugsReopened > 0) {
        badText += `- ${name} có ${p.bugsReopened} lỗi bị Re-open trong tuần. Cần rà soát kỹ tự test.\n`;
      }
      const fixed = p.bugsFixed;
      if (fixed < 5 && p.manDays > 2) {
        badText += `- ${name} năng suất tuần này hạn chế: ${fixed} bug/tuần (dành 1-2 ngày xử lý task luồng khó).\n`;
      }
    });
    if (!badText) badText = "- Chưa ghi nhận vấn đề nghiêm trọng về năng suất tuần.";

    let risksText = "Đề xuất hành động của Ban Quản lý:\n";
    risksText += "- Bám sát Target số bug sửa theo tuần để nâng cao năng suất.\n";
    risksText += "- Tự kiểm tra đủ 6 mục Pre-handover checklist trước khi mở PR.\n";
    risksText += "- Phân tích root cause 11 lỗi chất lượng phát sinh.";

    const draftExp: Record<string, string> = {};
    devs.forEach((p: any) => {
      if (p.personCode === "HoangGV") {
        draftExp["HoangGV"] = "Tuần này assign task luồng nghiệp vụ (flow) khó, mất 1-2 ngày xử lý + review code.";
      } else if (p.personCode === "HoNX") {
        draftExp["HoNX"] = "Năng suất tuần tốt nhưng bị 3 bug reopen và dính 1 lỗi lặp do chưa tự test kỹ.";
      } else if (p.personCode === "HuyDH") {
        draftExp["HuyDH"] = "Thành viên mới đang trong giai đoạn làm quen dự án và quy trình.";
      } else if (p.personCode === "HuyenTN") {
        draftExp["HuyenTN"] = "Lead dành 20% thời gian review/quản lý + trực tiếp fix task trọng tâm.";
      }
    });
    
    setGood(goodText.trim());
    setBad(badText.trim());
    setRisks(risksText.trim());
    setExplanations(prev => ({ ...draftExp, ...prev }));
  };

  const handleSaveConclusion = async () => {
    if (!activePeriodKey) return;
    setSaving(true);
    try {
      await saveConclusion(activePeriodKey, good, bad, risks, manDaysOverrides, explanations);
      setIsEditing(false);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu kết luận");
    } finally {
      setSaving(false);
    }
  };

  const activeDevsCount = view.personnel.filter(p => p.role !== "benchmark").length || 3;

  const getOnboardingWeek = (startDate: string, periodStartDate: string) => {
    const start = new Date(`${startDate}T00:00:00Z`);
    const periodStart = new Date(`${periodStartDate}T00:00:00Z`);
    const startDay = start.getUTCDay() || 7;
    const periodDay = periodStart.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - startDay + 1);
    periodStart.setUTCDate(periodStart.getUTCDate() - periodDay + 1);
    return Math.max(1, Math.floor((periodStart.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const [y1, m1, d1] = start.split("-");
    const [y2, m2, d2] = end.split("-");
    if (!d1 || !d2) return `${start} → ${end}`;
    if (y1 === y2 && m1 === m2) {
      return `${d1}/${m1} — ${d2}/${m2}/${y1}`;
    }
    return `${d1}/${m1}/${y1} — ${d2}/${m2}/${y2}`;
  };

  // Chart follows each person's onboarding timeline, not one shared team week.
  const selectedDev = selectedDevFilter !== "all"
    ? view.personnel.find(p => p.code === selectedDevFilter)
    : undefined;
  const chartMetrics = [...view.weeklyMetrics]
    .filter(metric => !selectedDev || metric.period.endDate >= selectedDev.startDate)
    .slice(0, 10)
    .reverse();
  const chartSlots = Array.from({ length: 10 }, (_, index) => chartMetrics[index]);
  const todayStr = new Date().toISOString().slice(0, 10);

  const chartData = chartSlots.map((matchedMetric, index) => {
    let displayActual = 0;
    let displayTarget = 0;
    let weekLabel = weeklyTargetTrajectory[index].weekLabel;
    let milestoneLabel = weeklyTargetTrajectory[index].milestoneLabel;

    let startDate = matchedMetric?.period.startDate || "";
    let endDate = matchedMetric?.period.endDate || "";

    if (!startDate && chartMetrics[0]?.period.startDate) {
      const firstStart = new Date(`${chartMetrics[0].period.startDate}T00:00:00Z`);
      const weekStart = new Date(firstStart);
      weekStart.setUTCDate(firstStart.getUTCDate() + index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      startDate = weekStart.toISOString().slice(0, 10);
      endDate = weekEnd.toISOString().slice(0, 10);
    }

    const isCurrentWeek = Boolean(startDate && endDate && todayStr >= startDate && todayStr <= endDate);
    const dateRangeLabel = formatDateRange(startDate, endDate);

    const isLead = selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead";

    if (selectedDevFilter === "all") {
      const teamTotalFixed = matchedMetric ? matchedMetric.totalFixed : 0;
      displayActual = teamTotalFixed;
      displayTarget = matchedMetric ? view.personnel
        .filter(person => person.role !== "benchmark" && person.startDate <= matchedMetric.period.endDate)
        .reduce((sum, person) => {
          const week = getOnboardingWeek(person.startDate, matchedMetric.period.startDate);
          return sum + (weeklyTargetTrajectory[week - 1]?.targetPerDev ?? weeklyTargetTrajectory.at(-1)?.targetPerDev ?? 0);
        }, 0) : weeklyTargetTrajectory[index].targetPerDev * activeDevsCount;
      if (matchedMetric) {
        weekLabel = matchedMetric.period.label;
        milestoneLabel = "Theo tuần lịch";
      }
    } else if (isLead) {
      const personData = matchedMetric?.byPerson.find(p => p.personCode === selectedDevFilter);
      displayActual = personData ? personData.bugsReviewed : 0;
      const onboardingWeek = matchedMetric && selectedDev
        ? getOnboardingWeek(selectedDev.startDate, matchedMetric.period.startDate)
        : index + 1;
      const leadStep = leadReviewTargetTrajectory[onboardingWeek - 1] ?? leadReviewTargetTrajectory.at(-1);
      displayTarget = leadStep?.target ?? 45;
      weekLabel = `Tuần ${onboardingWeek}`;
      milestoneLabel = leadStep?.milestoneLabel ?? "👑 Review Code & Nghiệm thu PRs";
    } else {
      const personData = matchedMetric?.byPerson.find(p => p.personCode === selectedDevFilter);
      displayActual = personData ? personData.bugsFixed : 0;
      const onboardingWeek = matchedMetric && selectedDev
        ? getOnboardingWeek(selectedDev.startDate, matchedMetric.period.startDate)
        : index + 1;
      const targetStep = weeklyTargetTrajectory[onboardingWeek - 1] ?? weeklyTargetTrajectory.at(-1);
      displayTarget = targetStep?.targetPerDev ?? 0;
      weekLabel = `Tuần ${onboardingWeek}`;
      milestoneLabel = targetStep?.milestoneLabel ?? "Năng suất ổn định";
    }

    const maxScale = selectedDevFilter === "all"
      ? Math.max(45 * activeDevsCount, displayTarget, displayActual)
      : Math.max(50, displayTarget, displayActual);
    const targetPct = Math.min((displayTarget / maxScale) * 100, 100);
    const actualPct = Math.min((displayActual / maxScale) * 100, 100);
    const achieveRate = displayTarget > 0 ? Math.round((displayActual / displayTarget) * 100) : 0;
    const isTargetMet = displayActual >= displayTarget;

    return {
      weekLabel,
      milestoneLabel,
      startDate,
      endDate,
      dateRangeLabel,
      isCurrentWeek,
      displayActual,
      displayTarget,
      targetPct,
      actualPct,
      achieveRate,
      isTargetMet,
      maxScale
    };
  });

  const currentWeekItem = chartData.find(d => d.isCurrentWeek);

  // SVG Line Chart Points calculation (Expanded Height & Clean Padding)
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingTop = 40;
  const paddingBottom = 50;
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingTop - paddingBottom;

  const targetPoints = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
    const y = svgHeight - paddingBottom - (d.targetPct / 100) * usableH;
    return `${x},${y}`;
  }).join(" ");

  const actualPoints = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
    const y = svgHeight - paddingBottom - (d.actualPct / 100) * usableH;
    return `${x},${y}`;
  }).join(" ");

  const selectedDevName = selectedDevFilter !== "all" ? getDisplayName(selectedDevFilter) : "Tổng Cả Team";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Streamlined Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="section-title" style={{ margin: "0 0 4px 0" }}>📊 Báo cáo Quản lý &amp; Tiến độ Tuần</h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Tổng hợp số bug đã sửa trên Notion (<strong>bắt buộc phải có PR URL</strong>, đã trừ lỗi Không tái hiện / Trùng): <strong>{latest?.period.label}</strong>
          </p>
        </div>
        {activePeriodKey && (
          <button 
            className="ctrl ctrl-primary" 
            style={{ fontSize: "12px", padding: "8px 16px", fontWeight: "bold" }}
            onClick={() => setIsEditing(true)}
          >
            {activeConclusion ? "✏️ Sửa kết luận &amp; Giải trình" : "✍️ Viết kết luận &amp; Giải trình"}
          </button>
        )}
      </div>

      {/* 4 Core KPIs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <div className="card" style={{ padding: "14px", borderLeft: "4px solid var(--green)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold" }}>ĐÃ CLOSE / DEPLOY</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--green)", marginTop: "4px" }}>{closedBugs}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Tỷ lệ Close: {closeRate}%</div>
        </div>

        <div className="card" style={{ padding: "14px", borderLeft: "4px solid var(--blue)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold" }}>RESOLVED (CHỜ REVIEW)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--blue)", marginTop: "4px" }}>{resolvedBugs}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Đã xong code, chờ duyệt PR</div>
        </div>

        <div className="card" style={{ padding: "14px", borderLeft: "4px solid var(--red)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold" }}>CÒN MỞ (OPEN)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--red)", marginTop: "4px" }}>{openBugs}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Số thực nhận: {actualReceived}</div>
        </div>

        <div className="card" style={{ padding: "14px", borderLeft: "4px solid var(--yellow)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold" }}>RE-OPENED / LỖI LẶP</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--yellow)", marginTop: "4px" }}>{reopened}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Target Reopen: &lt; 15%</div>
        </div>
      </div>

      {/* FULL-WIDTH CHART CARD */}
      <div 
        className="card" 
        style={{ 
          padding: "24px", 
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        {/* Header with Selector */}
        <div style={{ marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🚀</span> Biểu Đồ Lộ Trình Target Tiến Độ Theo Tuần — <span style={{ color: "var(--cyan)" }}>{selectedDevName}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>
                {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead"
                  ? "Mốc lộ trình Năng suất Review Code & Nghiệm thu chất lượng PRs của Lead theo các tuần."
                  : "Mốc lộ trình tăng trưởng năng suất sửa bug thực tế trên Notion vs Target thiết lập qua các tuần."}
              </span>
              {currentWeekItem && (
                <span className="tag tag-cyan" style={{ fontSize: "11px", border: "1px solid var(--cyan)", fontWeight: "bold", boxShadow: "0 0 6px rgba(6,182,212,0.2)" }}>
                  🔥 {currentWeekItem.weekLabel} (Tuần hiện tại: {currentWeekItem.dateRangeLabel})
                </span>
              )}
            </div>
          </div>
          
          {/* Person Selector Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-2)", fontWeight: "bold" }}>Xem biểu đồ theo:</span>
            <select 
              className="ctrl"
              value={selectedDevFilter} 
              onChange={e => setSelectedDevFilter(e.target.value)}
              style={{ fontSize: "12px", fontWeight: "bold", padding: "6px 12px", background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
            >
              <option value="all">👥 Tất cả thành viên (Tổng Cả Team)</option>
              {view.personnel.filter(p => p.role !== "benchmark").map(p => (
                <option key={p.code} value={p.code}>👤 {p.displayName} ({p.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* SVG Curve Visualization Top Layer */}
        <div style={{ marginBottom: "20px", background: "var(--surface-2)", borderRadius: "12px", padding: "16px 20px", border: "1px solid var(--border-3)" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
            <span>📈 Đồ Thị Đường Tăng Trưởng Thực Tế vs Target Curve</span>
            <div style={{ display: "flex", gap: "20px", fontSize: "11px" }}>
              <span style={{ color: "var(--cyan)", fontWeight: "bold" }}>
                ── 🎯 {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead" ? "Target Review Curve (100% PR Team)" : "Target Curve"}
              </span>
              <span style={{ color: selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead" ? "var(--purple)" : "var(--green)", fontWeight: "bold" }}>
                ── {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead" ? "🟣 Thực Tế PRs Reviewed" : "🟢 Thực Tế Progress"}
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "220px", overflow: "visible" }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {chartData.length === 0 && (
              <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="var(--text-2)" fontSize="13">
                Chưa có dữ liệu trong thời gian làm việc của thành viên này
              </text>
            )}

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => (
              <line 
                key={i}
                x1={paddingX} 
                y1={paddingTop + ratio * usableH} 
                x2={svgWidth - paddingX} 
                y2={paddingTop + ratio * usableH} 
                stroke="var(--border-3)" 
                strokeDasharray="4 4"
              />
            ))}

            {/* Target Area Fill & Line */}
            <polygon 
              points={`${paddingX},${svgHeight - paddingBottom} ${targetPoints} ${svgWidth - paddingX},${svgHeight - paddingBottom}`} 
              fill="url(#targetGradient)" 
            />
            <polyline 
              points={targetPoints} 
              fill="none" 
              stroke="var(--cyan)" 
              strokeWidth="2.5" 
              strokeDasharray="5 4"
            />

            {/* Actual Area Fill & Line */}
            <polygon 
              points={`${paddingX},${svgHeight - paddingBottom} ${actualPoints} ${svgWidth - paddingX},${svgHeight - paddingBottom}`} 
              fill="url(#actualGradient)" 
            />
            <polyline 
              points={actualPoints} 
              fill="none" 
              stroke="var(--green)" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points & Smart Non-Colliding Labels */}
            {chartData.map((d, i) => {
              const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
              const yTarget = svgHeight - paddingBottom - (d.targetPct / 100) * usableH;
              const yActual = svgHeight - paddingBottom - (d.actualPct / 100) * usableH;

              // Smart offset logic to guarantee ZERO collision with dots or X-axis labels
              const targetYPos = yTarget - 12;
              
              // Place actual badge cleanly above or below depending on proximity
              const isCloseToTarget = Math.abs(yActual - yTarget) < 28;
              const isActualBelow = yActual > yTarget;
              
              let actualBadgeY = yActual - 24;
              if (isCloseToTarget && !isActualBelow) {
                actualBadgeY = yActual - 26;
              } else if (isCloseToTarget && isActualBelow) {
                actualBadgeY = yActual + 10;
              } else if (yActual < 35) {
                actualBadgeY = yActual + 10;
              }

              const shortDates = d.startDate && d.endDate
                ? `${d.startDate.slice(8,10)}/${d.startDate.slice(5,7)} - ${d.endDate.slice(8,10)}/${d.endDate.slice(5,7)}`
                : "";

              return (
                <g key={i}>
                  {/* Current Week Highlight Column */}
                  {d.isCurrentWeek && (
                    <rect 
                      x={x - 28} 
                      y={paddingTop - 5} 
                      width="56" 
                      height={usableH + 10} 
                      rx="6" 
                      fill="rgba(6,182,212,0.12)" 
                      stroke="rgba(6,182,212,0.4)" 
                      strokeDasharray="3 3" 
                    />
                  )}

                  {/* Target Dot & Label */}
                  <circle cx={x} cy={yTarget} r="4.5" fill="var(--cyan)" />
                  <text 
                    x={x} 
                    y={targetYPos} 
                    textAnchor="middle" 
                    fill="var(--cyan)" 
                    fontSize="11" 
                    fontWeight="800"
                  >
                    🎯 {d.displayTarget}
                  </text>

                  {/* Actual Glowing Dot */}
                  <circle cx={x} cy={yActual} r="6.5" fill="var(--green)" stroke="var(--card-bg)" strokeWidth="2.5" />

                  {/* Actual Value High-Contrast Pill Badge */}
                  <g>
                    <rect 
                      x={x - 22} 
                      y={actualBadgeY} 
                      width="44" 
                      height="18" 
                      rx="5" 
                      fill="var(--surface-3)" 
                      stroke="var(--green)" 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x={x} 
                      y={actualBadgeY + 13} 
                      textAnchor="middle" 
                      fill="var(--green)" 
                      fontSize="12" 
                      fontWeight="800"
                    >
                      {d.displayActual}
                    </text>
                  </g>

                  {/* Week X-Axis Label (Placed safely at bottom) */}
                  <text 
                    x={x} 
                    y={svgHeight - 20} 
                    textAnchor="middle" 
                    fill={d.isCurrentWeek ? "var(--cyan)" : "var(--text-1)"} 
                    fontSize="12" 
                    fontWeight="bold"
                  >
                    {d.weekLabel}{d.isCurrentWeek ? " 🔥" : ""}
                  </text>
                  {shortDates && (
                    <text 
                      x={x} 
                      y={svgHeight - 6} 
                      textAnchor="middle" 
                      fill={d.isCurrentWeek ? "var(--cyan)" : "var(--text-3)"} 
                      fontSize="9" 
                      fontWeight={d.isCurrentWeek ? "bold" : "normal"}
                    >
                      {shortDates}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Compact High-Contrast Meters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {chartData.map((d) => (
            <div 
              key={d.weekLabel} 
              style={{ 
                background: d.isCurrentWeek ? "rgba(6,182,212,0.06)" : "var(--surface-2)", 
                padding: "8px 12px", 
                borderRadius: "8px", 
                border: d.isCurrentWeek ? "1px solid var(--cyan)" : "1px solid var(--border-3)",
                boxShadow: d.isCurrentWeek ? "0 0 10px rgba(6,182,212,0.12)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "5px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: d.isCurrentWeek ? "var(--cyan)" : "var(--text-1)" }}>{d.weekLabel}</span>
                  {d.isCurrentWeek && (
                    <span className="tag tag-cyan" style={{ fontSize: "10px", padding: "1px 7px", fontWeight: "bold", border: "1px solid var(--cyan)", boxShadow: "0 0 6px rgba(6,182,212,0.3)" }}>
                      🔥 Tuần hiện tại
                    </span>
                  )}
                  {d.dateRangeLabel && (
                    <span style={{ fontSize: "11px", color: "var(--text-2)", background: "var(--surface-3)", padding: "1px 7px", borderRadius: "4px", fontWeight: "600", border: "1px solid var(--border-3)" }}>
                      📅 {d.dateRangeLabel}
                    </span>
                  )}
                  <span style={{ color: "var(--text-3)" }}>|</span>
                  <span style={{ fontSize: "11px", color: "var(--cyan)", fontWeight: "600" }}>{d.milestoneLabel}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-2)" }}>
                    Target: <strong style={{ color: "var(--cyan)" }}>{d.displayTarget} {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead" ? "PRs review" : "bug/tuần"}</strong>
                  </span>
                  <span style={{ color: "var(--text-3)" }}>|</span>
                  <span style={{ color: "var(--text-1)" }}>
                    Thực tế: <strong style={{ color: d.isTargetMet ? "var(--green)" : "var(--accent-2)" }}>{d.displayActual} {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead" ? "PRs đã review" : "bug/tuần"}</strong>
                  </span>
                  <span 
                    style={{ 
                      padding: "2px 8px", 
                      borderRadius: "10px", 
                      fontSize: "10px", 
                      fontWeight: "bold",
                      background: d.isCurrentWeek
                        ? "rgba(6,182,212,0.18)"
                        : d.isTargetMet ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                      color: d.isCurrentWeek
                        ? "var(--cyan)"
                        : d.isTargetMet ? "var(--green)" : "var(--blue)",
                      border: `1px solid ${d.isCurrentWeek ? "rgba(6,182,212,0.4)" : d.isTargetMet ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.3)"}`
                    }}
                  >
                    {d.isCurrentWeek 
                      ? `⏳ Đang thực hiện (${d.displayActual}/${d.displayTarget})` 
                      : d.isTargetMet ? `✅ Vượt target (+${d.achieveRate - 100}%)` : `🔹 Đạt ${d.achieveRate}% target`}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div 
                style={{ 
                  position: "relative", 
                  height: "18px", 
                  background: "var(--surface-3)", 
                  borderRadius: "5px", 
                  overflow: "hidden",
                  border: "1px solid var(--border-3)"
                }}
              >
                {/* Target Marker Pin Line */}
                <div 
                  style={{ 
                    position: "absolute", 
                    left: `${d.targetPct}%`, 
                    top: 0, bottom: 0, 
                    width: "3px", 
                    background: "var(--cyan)", 
                    zIndex: 10,
                    boxShadow: "0 0 6px var(--cyan)"
                  }} 
                  title={`Target: ${d.displayTarget} bug/tuần`}
                />

                {/* Actual Fill Bar */}
                <div 
                  style={{ 
                    width: `${d.actualPct}%`, 
                    height: "100%", 
                    background: d.isTargetMet 
                      ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                      : "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)", 
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "8px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "10px"
                  }}
                >
                  {d.displayActual > 0 && `${d.displayActual} bug/tuần`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Edit Conclusion Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: "680px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "16px" }}>✍️ Viết kết luận &amp; Giải trình năng suất tuần: {latest?.period.label}</h2>
              <button 
                type="button"
                className="ctrl ctrl-primary" 
                style={{ fontSize: "11px", padding: "6px 12px" }}
                onClick={handleAutoDraft}
              >
                🪄 Điền nháp tự động
              </button>
            </div>
            
            {/* Man-Days Overrides & Explanations per Dev */}
            <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(99,102,241,0.04)", borderRadius: "6px", border: "1px solid var(--border-2)" }}>
              <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "10px", color: "var(--accent-2)" }}>
                ⚙️ Điều chỉnh ngày công Man-Days &amp; Giải trình năng suất tuần từng người:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {latest?.byPerson.map((p: any) => {
                  const devName = getDisplayName(p.personCode);
                  const currentVal = manDaysOverrides[p.personCode] !== undefined 
                    ? manDaysOverrides[p.personCode] 
                    : p.workingDays;
                  const currentExp = explanations[p.personCode] || "";

                  return (
                    <div key={p.personCode} style={{ background: "var(--surface-2)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "bold" }}>👤 {devName} ({p.personCode}):</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Man-Days tuần:</span>
                          <input 
                            type="number" 
                            step="0.5" 
                            min="0" 
                            max="31"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setManDaysOverrides(prev => ({
                                ...prev,
                                [p.personCode]: isNaN(val) ? 0 : val
                              }));
                            }}
                            style={{ 
                              width: "60px", 
                              padding: "2px 6px", 
                              fontSize: "12px", 
                              border: "1px solid var(--border-3)", 
                              borderRadius: "4px", 
                              background: "var(--bg-1)", 
                              color: "var(--text-1)",
                              textAlign: "right"
                            }}
                          />
                        </div>
                      </div>
                      <input 
                        type="text"
                        placeholder={`Lý do/giải trình năng suất tuần của ${devName} (nếu dính task flow khó 1-2 ngày)...`}
                        value={currentExp}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExplanations(prev => ({
                            ...prev,
                            [p.personCode]: val
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "11px",
                          border: "1px solid var(--border-3)",
                          borderRadius: "4px",
                          background: "var(--bg-1)",
                          color: "var(--text-1)"
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>🟢 Điểm tốt / Đạt yêu cầu tuần:</label>
            <textarea 
              value={good} 
              onChange={e => setGood(e.target.value)} 
              placeholder="Ví dụ: Team kiểm soát tốt tiến độ tuần..."
              style={{ minHeight: "70px", marginBottom: "12px", width: "100%", fontSize: "12px" }}
            />

            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>🔴 Điểm xấu / Tồn tại &amp; Lỗi chất lượng tuần:</label>
            <textarea 
              value={bad} 
              onChange={e => setBad(e.target.value)} 
              placeholder="Ví dụ: Phân tích 11 lỗi chất lượng cơ bản..."
              style={{ minHeight: "70px", marginBottom: "12px", width: "100%", fontSize: "12px" }}
            />

            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>⚠️ Action / Hành động chỉ đạo:</label>
            <textarea 
              value={risks} 
              onChange={e => setRisks(e.target.value)} 
              placeholder="Ví dụ: Áp dụng checklist trong PR template..."
              style={{ minHeight: "70px", marginBottom: "12px", width: "100%", fontSize: "12px" }}
            />

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button 
                className="ctrl" 
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button 
                className="ctrl ctrl-primary" 
                onClick={handleSaveConclusion}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu kết luận &amp; Giải trình"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
