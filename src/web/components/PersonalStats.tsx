import { useState, useMemo, useEffect } from "react";
import type { DashboardView, PeriodType, BugRecord } from "../../shared/types";

function fmtDate(v: string | undefined): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function isNoRepro(b: BugRecord): boolean {
  const note = (b.note ?? "").toLowerCase();
  const st = (b.status ?? "").toLowerCase();
  const hasNoReproNote =
    note.includes("tái hiện") ||
    note.includes("no repro") ||
    note.includes("không phải lỗi") ||
    note.includes("ko phải lỗi") ||
    st.includes("tái hiện");
  return hasNoReproNote || !b.pullRequestUrl;
}

export function PersonalStats({ view, personCode, periodType }: { view: DashboardView; personCode?: string; periodType: PeriodType }) {
  const [activeCode, setActiveCode] = useState<string>("all");

  // Sync with personCode from topbar filter if it changes
  useEffect(() => {
    if (personCode) {
      setActiveCode(personCode);
    } else {
      setActiveCode("all");
    }
  }, [personCode]);

  const developers = useMemo(() => {
    return view.personnel.filter(p => p.role !== "benchmark");
  }, [view.personnel]);

  // Helper to match a bug to a developer
  const bugBelongsTo = (bug: BugRecord, person: typeof developers[0]) => {
    const prAuthor = bug.prAuthor?.toLowerCase();
    if (bug.pullRequestUrl && prAuthor) {
      if (person.githubUsername && person.githubUsername.toLowerCase() === prAuthor) return true;
      if (developers.some(p => p.code !== person.code && p.githubUsername && p.githubUsername.toLowerCase() === prAuthor)) return false;
    }
    const notionIds = person.notionIds || [];
    return (bug.fixedByIds ?? []).some(id => notionIds.includes(id));
  };

  // Helper to get location breakdown for a set of bugs
  const getLocationBreakdown = (bugs: BugRecord[]) => {
    const map = new Map<string, { total: number; closed: number; resolved: number; open: number }>();
    bugs.forEach(b => {
      const locations = b.location && b.location.length > 0 ? b.location : ["(Không xác định)"];
      locations.forEach(loc => {
        const current = map.get(loc) || { total: 0, closed: 0, resolved: 0, open: 0 };
        current.total++;
        const statusLower = (b.status ?? "").toLowerCase();
        const noRepro = isNoRepro(b);
        if (["closed", "deployed"].includes(statusLower) && !noRepro) {
          current.closed++;
        } else if (statusLower === "resolved" && !noRepro) {
          current.resolved++;
        } else if (statusLower !== "cancel") {
          current.open++;
        }
        map.set(loc, current);
      });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.total - a.total);
  };

  // An's average bugs per day for benchmark referencing (specifically May 2026)
  const anAvgBugsPerDay = useMemo(() => {
    const may = view.benchmark?.months?.find(m => m.month === "2026-05");
    return may ? Number(may.avgBugsPerDay) : 2.1;
  }, [view.benchmark]);

  // Summarize stats for all developers
  const devSummaries = useMemo(() => {
    return developers.map(person => {
      const devBugs = view.bugs.filter(b => bugBelongsTo(b, person) && (b.status ?? "").toLowerCase() !== "cancel");
      
      const closedCount = devBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase()) && !isNoRepro(b)).length;
      const resolvedCount = devBugs.filter(b => (b.status ?? "").toLowerCase() === "resolved" && !isNoRepro(b)).length;

      const allMetrics = view.teamMetrics.flatMap(m => m.byPerson.filter(p => p.personCode === person.code));
      const totalDetected = allMetrics.reduce((s, m) => s + m.bugsDetected, 0);
      const totalReviewed = allMetrics.reduce((s, m) => s + m.bugsReviewed, 0);
      const totalReopened = allMetrics.reduce((s, m) => s + m.bugsReopened, 0);
      const totalDays = allMetrics.reduce((s, m) => s + m.workingDays, 0);
      const avgPerDay = totalDays > 0 ? ((closedCount + resolvedCount) / totalDays).toFixed(1) : "0";

      // Top location breakdown
      const locBreakdown = getLocationBreakdown(devBugs);
      const topLocations = locBreakdown.slice(0, 3).map(loc => `${loc.name} (${loc.total})`);

      const achievementRate = anAvgBugsPerDay > 0 ? (Number(avgPerDay) / anAvgBugsPerDay) * 100 : 0;

      const totalAssigned = devBugs.length;
      const noReproCount = devBugs.filter(isNoRepro).length;
      const actualReceived = totalAssigned - noReproCount;

      return {
        person,
        closedCount,
        resolvedCount,
        totalDetected,
        totalReviewed,
        totalReopened,
        avgPerDay,
        totalDays,
        topLocations,
        achievementRate,
        totalAssigned,
        noReproCount,
        actualReceived,
      };
    });
  }, [developers, view.bugs, view.teamMetrics, anAvgBugsPerDay]);

  const weeklyBreakdown = useMemo(() => {
    if (!view.weeklyMetrics || view.weeklyMetrics.length === 0) return [];
    
    const targetDev = activeCode === "all" ? null : developers.find(d => d.code === activeCode);
    const anPerson = view.personnel.find(p => p.role === "benchmark");
    const anIds = anPerson?.notionIds || [];

    const relevantBugs = view.bugs.filter(b => {
      if ((b.status ?? "").toLowerCase() === "cancel") return false;
      
      const isAn = (b.fixedByIds ?? []).some(id => anIds.includes(id));
      if (isAn && activeCode !== "AnPD") return false;

      if (targetDev) {
        return bugBelongsTo(b, targetDev);
      }
      return true;
    });

    const isFixed = (b: BugRecord) => ["closed", "deployed", "resolved"].includes((b.status ?? "").toLowerCase()) && !isNoRepro(b);
    
    const getFixedDate = (b: BugRecord) => {
      if (b.pullRequestUrl && b.prCreatedAt) return b.prCreatedAt.slice(0, 10);
      return (b.lastEditedTime || b.confirmedDate || b.createdTime || "").slice(0, 10);
    };

    return view.weeklyMetrics.map(w => {
      const start = w.period.startDate;
      const end = w.period.endDate;

      const detected = relevantBugs.filter(b => {
        const d = b.detectedDate;
        return d && d >= start && d <= end && !isNoRepro(b);
      });

      const newFixed = detected.filter(isFixed);
      const newOpenCount = detected.length - newFixed.length;

      const fixedInWeek = relevantBugs.filter(b => {
        if (!isFixed(b)) return false;
        const fd = getFixedDate(b);
        return fd && fd >= start && fd <= end;
      });

      const prevBacklog = relevantBugs.filter(b => {
        const det = b.detectedDate;
        if (!det || det >= start) return false;
        if (isFixed(b)) {
          const fd = getFixedDate(b);
          if (fd && fd < start) return false;
        }
        return true;
      }).length;

      const backlogEnd = relevantBugs.filter(b => {
        const det = b.detectedDate;
        if (!det || det > end) return false;
        if (isFixed(b)) {
          const fd = getFixedDate(b);
          if (fd && fd <= end) return false;
        }
        return true;
      }).length;

      const fixRate = (prevBacklog + detected.length) > 0
        ? (fixedInWeek.length / (prevBacklog + detected.length)) * 100
        : 0;

      return {
        label: w.period.label,
        startDate: start,
        endDate: end,
        detectedCount: detected.length,
        newFixedCount: newFixed.length,
        newOpenCount,
        fixedInWeekCount: fixedInWeek.length,
        backlogEnd,
        fixRatePercent: fixRate,
      };
    });
  }, [view.weeklyMetrics, view.bugs, activeCode, developers, view.personnel]);

  return (
    <div>
      <h1 className="section-title">👤 Thống kê Cá nhân</h1>

      {/* Internal Navigation tabs - if not locked by parent prop */}
      {!personCode && (
        <div className="personal-tabs" style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button className={`ctrl ${activeCode === "all" ? "ctrl-primary" : ""}`} onClick={() => setActiveCode("all")}>
            📊 Tất cả (Tổng quan)
          </button>
          {developers.map(p => (
            <button key={p.code} className={`ctrl ${activeCode === p.code ? "ctrl-primary" : ""}`} onClick={() => setActiveCode(p.code)}>
              👤 {p.displayName}
            </button>
          ))}
        </div>
      )}

      {/* CASE 1: Overview Grid of all developers */}
      {activeCode === "all" && (
        <div className="grid-2" style={{ gap: "16px" }}>
          {devSummaries.map(summary => (
            <div className="card animate-fade-in" key={summary.person.code} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <strong style={{ fontSize: "16px" }}>{summary.person.displayName}</strong>
                    <span style={{ fontSize: "12px", color: "var(--text-3)", marginLeft: "6px" }}>
                      ({summary.person.code})
                    </span>
                  </div>
                  <span className="tag tag-gray">{summary.person.role === "lead" ? "👑 Lead" : "💻 Dev"}</span>
                </div>
                <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}>
                  <div className="kpi kpi-green" style={{ padding: "8px" }}>
                    <div className="kpi-value" style={{ fontSize: "18px" }}>{summary.closedCount}</div>
                    <div className="kpi-label" style={{ fontSize: "9px" }}>Đã Close (Deploy)</div>
                  </div>
                  <div className="kpi kpi-blue" style={{ padding: "8px" }}>
                    <div className="kpi-value" style={{ fontSize: "18px" }}>{summary.resolvedCount}</div>
                    <div className="kpi-label" style={{ fontSize: "9px" }}>Resolved (Chưa review)</div>
                  </div>
                  <div className="kpi kpi-cyan" style={{ padding: "8px" }}>
                    <div className="kpi-value" style={{ fontSize: "18px" }}>{summary.avgPerDay}</div>
                    <div className="kpi-label" style={{ fontSize: "9px" }}>Bug/Ngày TB</div>
                  </div>
                  <div className="kpi kpi-red" style={{ padding: "8px" }}>
                    <div className="kpi-value" style={{ fontSize: "18px" }}>{summary.totalReopened}</div>
                    <div className="kpi-label" style={{ fontSize: "9px" }}>Re-opened</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "10px", lineHeight: "1.4" }}>
                  🎯 <strong>So với Benchmark An:</strong>{' '}
                  <strong style={{ color: summary.achievementRate >= 90 ? "var(--green)" : summary.achievementRate >= 70 ? "var(--cyan)" : summary.achievementRate >= 50 ? "var(--yellow)" : "var(--text-3)" }}>
                    {summary.achievementRate.toFixed(0)}%
                  </strong>{' '}
                  ({summary.achievementRate >= 90 ? "Đạt mốc T3" : summary.achievementRate >= 70 ? "Đạt mốc T2" : summary.achievementRate >= 50 ? "Đạt mốc T1" : "Đang làm quen"})
                  <br />
                  📋 <strong>Thực nhận:</strong> {summary.actualReceived} bug (Tổng gán: {summary.totalAssigned} | Trừ {summary.noReproCount} không tái hiện)
                  <br />
                  📍 <strong>Vị trí lỗi chính:</strong> {summary.topLocations.join(", ") || "(chưa có)"}
                </div>
              </div>
              <button className="ctrl ctrl-primary" style={{ width: "100%", marginTop: "16px", fontSize: "12px", height: "32px" }} onClick={() => setActiveCode(summary.person.code)}>
                Xem chi tiết 👤 {summary.person.code}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CASE 2: Detailed stats for a single developer */}
      {activeCode !== "all" && (() => {
        const person = view.personnel.find(p => p.code === activeCode);
        if (!person) return <div className="card">Nhân sự không tồn tại</div>;

        const devBugs = view.bugs.filter(b => bugBelongsTo(b, person) && (b.status ?? "").toLowerCase() !== "cancel");
        
        // Aggregate stats across all periods for this person
        const allMetrics = view.teamMetrics.flatMap(m => m.byPerson.filter(p => p.personCode === person.code));
        const totalDetected = allMetrics.reduce((s, m) => s + m.bugsDetected, 0);
        const totalReviewed = allMetrics.reduce((s, m) => s + m.bugsReviewed, 0);
        const totalReopened = allMetrics.reduce((s, m) => s + m.bugsReopened, 0);
        const totalDays = allMetrics.reduce((s, m) => s + m.workingDays, 0);

        const totalClosed = devBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase()) && !isNoRepro(b)).length;
        const totalResolved = devBugs.filter(b => (b.status ?? "").toLowerCase() === "resolved" && !isNoRepro(b)).length;
        const avgPerDay = totalDays > 0 ? ((totalClosed + totalResolved) / totalDays).toFixed(1) : "—";

        // Benchmark progress rate
        const achievementRate = anAvgBugsPerDay > 0 ? (Number(avgPerDay) / anAvgBugsPerDay) * 100 : 0;

        const totalAssigned = devBugs.length;
        const noReproCount = devBugs.filter(isNoRepro).length;
        const actualReceived = totalAssigned - noReproCount;
        const solveRate = actualReceived > 0 ? ((totalClosed + totalResolved) / actualReceived * 100).toFixed(1) : "0.0";

        // Bug list from latest period
        const latestMetric = view.teamMetrics[0]?.byPerson.find(p => p.personCode === person.code);
        const bugList = latestMetric?.bugsList ?? [];

        // Bug locations breakdown
        const locationBreakdown = getLocationBreakdown(devBugs);

        return (
          <div className="animate-fade-in">
            {/* Back button if in "Tất cả" mode */}
            {!personCode && (
              <button className="ctrl" style={{ marginBottom: "16px", fontSize: "12px", padding: "4px 10px", height: "30px" }} onClick={() => setActiveCode("all")}>
                ⬅️ Quay lại danh sách
              </button>
            )}

            {/* Header card */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: "#fff"
                  }}>
                    {person.code.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{person.code} ({person.displayName})</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {person.role === "lead" ? "👑 Lead" : "💻 Developer"} · Từ {fmtDate(person.startDate)} · GitHub: {person.githubUsername}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "13px" }}>
                  <div>🎯 <strong>Mốc Target Tiêu Chuẩn:</strong> <strong style={{ color: achievementRate >= 90 ? "var(--green)" : achievementRate >= 70 ? "var(--cyan)" : achievementRate >= 50 ? "var(--yellow)" : "var(--text-3)" }}>{achievementRate.toFixed(0)}%</strong></div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {achievementRate >= 90 ? "🎯 Đạt mục tiêu Tháng 3 (Target 90%)" : achievementRate >= 70 ? "💻 Đạt mục tiêu Tháng 2 (Target 70%)" : achievementRate >= 50 ? "🚀 Đạt mục tiêu Tháng 1 (Target 50%)" : "🌱 Đang thích nghi quy trình"}
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: "16px", gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div className="kpi kpi-accent has-tooltip" data-tooltip="Số bug thực tế dev phải xử lý (bằng Tổng gán trừ đi số bug Không tái hiện/Không có PR)"><div className="kpi-value">{actualReceived} <span style={{ fontSize: 10, color: "var(--text-3)" }}>(Tổng: {totalAssigned})</span></div><div className="kpi-label">Thực nhận</div></div>
              <div className="kpi kpi-green has-tooltip" data-tooltip="Tổng số bug đã hoàn thành, review xong và deploy thành công (Closed, Deployed)"><div className="kpi-value">{totalClosed}</div><div className="kpi-label">Đã Close</div></div>
              <div className="kpi kpi-blue has-tooltip" data-tooltip="Tổng số bug đã sửa xong nhưng chưa được review hoặc merge (Resolved)"><div className="kpi-value">{totalResolved}</div><div className="kpi-label">Resolved</div></div>
              <div className="kpi kpi-cyan has-tooltip" data-tooltip="Hiệu suất sửa bug trung bình mỗi ngày công:&#10;(Đã Close + Resolved) / Tổng Man-Days"><div className="kpi-value">{avgPerDay}</div><div className="kpi-label">Bug/Ngày TB</div></div>
              <div className="kpi kpi-blue has-tooltip" data-tooltip="Tổng số PR/task đã review"><div className="kpi-value">{totalReviewed}</div><div className="kpi-label">Reviewed</div></div>
              <div className="kpi kpi-red has-tooltip" data-tooltip="Tổng số bug bị reopen"><div className="kpi-value">{totalReopened}</div><div className="kpi-label">Re-opened</div></div>
              <div className="kpi kpi-yellow has-tooltip" data-tooltip="Tổng số ngày công làm việc thực tế ghi nhận"><div className="kpi-value">{totalDays}</div><div className="kpi-label">Man-Days</div></div>
<div className="kpi kpi-cyan has-tooltip" data-tooltip="Tỷ lệ bug đã sửa xong (Closed + Resolved) trên số Thực nhận:&#10;(Sửa xong / Thực nhận) * 100%"><div className="kpi-value">{solveRate}%</div><div className="kpi-label">Tỷ lệ Sửa xong</div></div>
            </div>

            {/* Weekly Breakdown Table (Notion Style) */}
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
                <div className="card-title" style={{ fontSize: "14px" }}>📅 Tiến độ sửa bug theo tuần (Cấu trúc Báo cáo Notion)</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tuần</th>
                      <th>Ngày bắt đầu</th>
                      <th>Ngày kết thúc</th>
                      <th className="col-generated has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug được tạo mới gán cho dev trong tuần">Lỗi phát sinh</th>
                      <th className="col-fixed-blue has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số bug mới phát sinh trong tuần này đã được sửa (Closed, Deployed, Resolved)">Lỗi mới đã sửa</th>
                      <th className="col-period has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số bug mới phát sinh trong tuần này chưa được sửa (còn Mở/Trong tiến trình)">Lỗi mới còn mở</th>
                      <th className="col-fixed has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug dev đã sửa xong trong tuần (gồm cả bug tồn tuần trước)">Lỗi đã fix trong tuần</th>
                      <th className="col-backlog has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug chưa sửa còn tồn lại cuối tuần">Lỗi tồn cuối tuần</th>
                      <th className="col-rate has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tỷ lệ hoàn thành trong tuần: Lỗi đã fix / (Lỗi tồn đầu tuần + Lỗi phát sinh) * 100%">Tỷ lệ fix trong tuần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", color: "var(--text-3)", padding: "20px" }}>Chưa có dữ liệu phân rã tuần</td>
                      </tr>
                    ) : (
                      weeklyBreakdown.map(w => {
                        const d = new Date();
                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const isCurrent = today >= w.startDate && today <= w.endDate;
                        
                        // Calculate week number starting from 2026-06-29
                        const startMs = new Date("2026-06-29T00:00:00Z").getTime();
                        const currentMs = new Date(w.startDate + "T00:00:00Z").getTime();
                        const diffWeeks = Math.round((currentMs - startMs) / (7 * 24 * 60 * 60 * 1000));
                        const weekNum = diffWeeks + 1;

                        return (
                          <tr key={w.label}>
                            <td>
                              <strong>Tuần {weekNum}</strong>
                              {isCurrent && (
                                <span style={{ 
                                  fontSize: "10px", 
                                  background: "rgba(6,182,212,0.1)", 
                                  color: "var(--cyan)", 
                                  padding: "2px 6px", 
                                  borderRadius: "4px", 
                                  fontWeight: "bold",
                                  marginLeft: "6px",
                                  display: "inline-block",
                                  verticalAlign: "middle"
                                }}>
                                  đang diễn ra
                                </span>
                              )}
                            </td>
                            <td>{fmtDate(w.startDate)}</td>
                            <td>{fmtDate(w.endDate)}</td>
                            <td className="td-num metric-danger">{w.detectedCount}</td>
                            <td className="td-num metric-fixed-blue">{w.newFixedCount}</td>
                            <td className="td-num" style={{ fontWeight: "bold" }}>{w.newOpenCount}</td>
                            <td className="td-num metric-fixed">{w.fixedInWeekCount}</td>
                            <td className="td-num metric-backlog">{w.backlogEnd}</td>
                            <td className="td-num metric-rate">{w.fixRatePercent.toFixed(1)}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail split columns: Trend (Left) & Locations (Right) */}
            <div className="grid-2" style={{ gap: "16px", marginBottom: "16px" }}>
              {/* Trend table card */}
              <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
                  <div className="card-title" style={{ fontSize: "14px" }}>📈 Tiến độ & Sự tăng trưởng qua từng kỳ</div>
                </div>
                <div className="table-wrap" style={{ flex: 1 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Kỳ</th>
                        <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã close/deploy trong kỳ (wow change)">Closed</th>
                        <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug ở trạng thái Resolved trong kỳ">Resolved</th>
                        <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug tự phát hiện/tạo mới trong kỳ">Detected</th>
                        <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số PR/task đã review trong kỳ">Reviewed</th>
                        <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Hiệu suất sửa bug trung bình ngày công:&#10;Fixed / MD (wow change)">Bug/Ngày</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.teamMetrics.map((m, idx) => {
                        const pm = m.byPerson.find(p => p.personCode === person.code);
                        if (!pm) return null;

                        // Find the previous period metric (sorted newest first, so previous is next index)
                        const prevMetric = view.teamMetrics[idx + 1];
                        const prevPm = prevMetric?.byPerson.find(p => p.personCode === person.code);

                        const pmBugs = pm.bugsList ?? [];
                        const pmClosed = pmBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase())).length;
                        const pmResolved = pmBugs.filter(b => (b.status ?? "").toLowerCase() === "resolved").length;

                        // Calculate growth in Bug/Ngày
                        let bugsPerDayDiff = 0;
                        if (prevPm && prevPm.bugsPerDay > 0) {
                          bugsPerDayDiff = ((pm.bugsPerDay - prevPm.bugsPerDay) / prevPm.bugsPerDay) * 100;
                        }

                        // Calculate growth in Closed bugs
                        let closedDiff = 0;
                        if (prevPm) {
                          const prevPmBugs = prevPm.bugsList ?? [];
                          const prevPmClosed = prevPmBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase())).length;
                          if (prevPmClosed > 0) {
                            closedDiff = ((pmClosed - prevPmClosed) / prevPmClosed) * 100;
                          }
                        }

                        return (
                          <tr key={m.period.key}>
                            <td>{m.period.label}</td>
                            <td className="td-num">
                              <span style={{ color: "var(--green)" }}>{pmClosed}</span>
                              {prevPm && closedDiff !== 0 && (
                                <span style={{ marginLeft: 4, fontSize: 9, color: closedDiff > 0 ? "var(--green)" : "var(--red)" }}>
                                  {closedDiff > 0 ? `▲+${closedDiff.toFixed(0)}%` : `▼${closedDiff.toFixed(0)}%`}
                                </span>
                              )}
                            </td>
                            <td className="td-num" style={{ color: "var(--blue)" }}>{pmResolved}</td>
                            <td className="td-num">{pm.bugsDetected}</td>
                            <td className="td-num">{pm.bugsReviewed}</td>
                            <td className="td-num">
                              <span style={{ color: "var(--accent-2)" }}>{pm.bugsPerDay}</span>
                              {prevPm && bugsPerDayDiff !== 0 && (
                                <span style={{ marginLeft: 4, fontSize: 9, color: bugsPerDayDiff > 0 ? "var(--green)" : "var(--red)" }}>
                                  {bugsPerDayDiff > 0 ? `▲+${bugsPerDayDiff.toFixed(0)}%` : `▼${bugsPerDayDiff.toFixed(0)}%`}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bug locations breakdown card */}
              <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
                  <div className="card-title" style={{ fontSize: "14px" }}>📍 Phân bố lỗi theo Vị trí</div>
                </div>
                <div className="table-wrap" style={{ flex: 1 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Vị trí lỗi</th>
                        <th style={{ textAlign: "right" }}>Tổng</th>
                        <th style={{ textAlign: "right" }}>Close</th>
                        <th style={{ textAlign: "right" }}>Resolved</th>
                        <th style={{ textAlign: "right" }}>Mở</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: "20px" }}>Chưa ghi nhận lỗi có vị trí</td>
                        </tr>
                      ) : (
                        locationBreakdown.map(loc => (
                          <tr key={loc.name}>
                            <td><strong>{loc.name}</strong></td>
                            <td className="td-num" style={{ fontWeight: "bold" }}>{loc.total}</td>
                            <td className="td-num" style={{ color: "var(--green)" }}>{loc.closed}</td>
                            <td className="td-num" style={{ color: "var(--blue)" }}>{loc.resolved}</td>
                            <td className="td-num" style={{ color: loc.open > 0 ? "var(--red)" : "var(--text-3)" }}>{loc.open}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bug list from latest period */}
            {bugList.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Bug đã xử lý kỳ gần nhất ({bugList.length})</div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Bug</th>
                        <th>Trạng thái</th>
                        <th>Độ nghiêm trọng</th>
                        <th>PR Review</th>
                        <th>Ngày phát hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bugList.slice(0, 20).map(b => (
                        <tr key={b.id}>
                          <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {b.bugId && (
                              <span className="tag tag-gray" style={{ marginRight: 6, fontSize: 10, fontFamily: "monospace" }}>
                                {b.bugId}
                              </span>
                            )}
                            {b.url ? <a href={b.url} target="_blank" rel="noopener">{b.title}</a> : b.title}
                          </td>
                          <td>
                            <span className={`tag ${(b.status ?? "").toLowerCase() === "closed" ? "tag-green" : (b.status ?? "").toLowerCase() === "resolved" ? "tag-blue" : "tag-yellow"}`}>
                              {(b.status ?? "").toLowerCase() === "resolved" ? "Resolved" : b.status}
                            </span>
                          </td>
                          <td><span className="tag tag-gray">{b.severity ?? "—"}</span></td>
                          <td>
                            <span className={`tag ${b.ghReviewStatus === "Approved" ? "tag-green" : b.ghReviewStatus === "Changes Requested" ? "tag-red" : "tag-gray"}`}>
                              {b.ghReviewStatus ?? "—"}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-3)" }}>{fmtDate(b.detectedDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
