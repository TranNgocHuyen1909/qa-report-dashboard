import type { DashboardView } from "../../shared/types";

export function BenchmarkView({ view }: { view: DashboardView }) {
  const bm = view.benchmark;
  if (!bm || bm.months.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
        Chưa có dữ liệu mốc tiêu chuẩn. Refresh để cập nhật từ Notion.
      </div>
    );
  }

  // Find Month 5 data specifically as the baseline
  const mayMonth = bm.months.find(m => m.month.includes("-05") || m.label.includes("Tháng 5")) || bm.months[0];
  
  // Baseline average weekly fixed bugs in Month 5
  const mayWeeklyFixedBaseline = mayMonth.weeks.length > 0
    ? mayMonth.weeks.reduce((sum, w) => sum + w.fixedInWeek, 0) / mayMonth.weeks.length
    : Math.round(mayMonth.totalFixed / 4);

  // Latest team metrics
  const latestTeam = view.teamMetrics[0];

  // Realistic Milestone targets for New Joiners based on Month 5 baseline
  const targets = [
    { label: "Mức 0 (Tuần 1-2 - Người Mới Gia Nhập)", pct: 30, weeklyTarget: 10, desc: "Giai đoạn đọc docs, làm quen codebase, setup môi trường và sửa bug đơn giản" },
    { label: "Mốc T1 (Tháng 1 - Đạt Chuẩn Người Mới)", pct: 50, weeklyTarget: Math.round(mayWeeklyFixedBaseline * 0.5), desc: "Tự chủ fix bug độc lập, áp dụng pre-handover checklist" },
    { label: "Mốc T2 (Tháng 2 - Tăng Tốc Flow Khó)", pct: 70, weeklyTarget: Math.round(mayWeeklyFixedBaseline * 0.7), desc: "Xử lý task luồng nghiệp vụ khó, giảm tỷ lệ lỗi reopen" },
    { label: "Mốc T3 (Tháng 3 - Tiệm Cận Mốc Tối Đa)", pct: 90, weeklyTarget: Math.round(mayWeeklyFixedBaseline * 0.9), desc: "Tiệm cận năng suất tối đa, hỗ trợ review code cho đồng đội" },
    { label: "Mốc 100% Năng Suất Tối Đa", pct: 100, weeklyTarget: mayWeeklyFixedBaseline, desc: "Đạt ngang năng suất mốc tiêu chuẩn (~40 bug/tuần)" },
  ];

  return (
    <div>
      <h1 className="section-title">🎯 Benchmark — Mốc Năng Suất Tiêu Chuẩn Theo Tuần</h1>

      {/* WHITEBOARD GROWTH TRAJECTORY CHART MATCHING BOARD PHOTO */}
      <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--cyan)", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📈 Sơ Đồ Tăng Trưởng Theo Tuần (Lộ Trình Năng Suất Tiêu Chuẩn)</span>
          <span className="tag tag-green" style={{ fontSize: "11px" }}>Mốc Baseline Tháng 5: ~{mayWeeklyFixedBaseline} bug/tuần</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "16px" }}>
          Mô hình tăng trưởng năng suất sửa bug theo tuần (Bugs/Tuần) giúp các thành viên mới nâng dần từ mốc Mức 0 ➔ T1 (50%) ➔ T2 (70%) ➔ T3 (90%) ➔ 100% năng suất tối đa.
        </p>

        {/* Growth Curves per Developer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {view.personnel.filter(p => p.role !== "benchmark").map(dev => {
            // Calculate developer's actual weekly bugs fixed over recent weeks
            const devWeeklyHistory = view.weeklyMetrics.slice(0, 6).reverse().map((w, idx) => {
              const pData = w.byPerson.find(p => p.personCode === dev.code);
              const fixedInW = pData ? pData.bugsFixed : 0;
              return { weekLabel: `Tuần ${idx + 1}`, fixed: fixedInW };
            });

            const currentFixedThisWeek = devWeeklyHistory[devWeeklyHistory.length - 1]?.fixed || 0;
            const currentPctOfBaseline = mayWeeklyFixedBaseline > 0 ? (currentFixedThisWeek / mayWeeklyFixedBaseline) * 100 : 0;

            let milestoneBadge = "Đang làm quen (T1)";
            let badgeColor = "var(--text-3)";
            if (currentPctOfBaseline >= 90) { milestoneBadge = "🥇 Mốc T3 (90% Tiêu chuẩn)"; badgeColor = "var(--green)"; }
            else if (currentPctOfBaseline >= 70) { milestoneBadge = "🥈 Mốc T2 (70% Tiêu chuẩn)"; badgeColor = "var(--blue)"; }
            else if (currentPctOfBaseline >= 50) { milestoneBadge = "🥉 Mốc T1 (50% Tiêu chuẩn)"; badgeColor = "var(--yellow)"; }

            return (
              <div key={dev.code} style={{ background: "var(--surface-2)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--text-1)" }}>👤 {dev.displayName}</strong>
                    <span style={{ fontSize: "11px", color: "var(--text-3)", marginLeft: "8px" }}>({dev.code})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: badgeColor }}>{milestoneBadge}</span>
                    <span className="tag tag-cyan" style={{ fontSize: "11px" }}>{currentFixedThisWeek} bug/tuần ({currentPctOfBaseline.toFixed(0)}% mốc tiêu chuẩn)</span>
                  </div>
                </div>

                {/* Visual Trajectory Bars per Week */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {devWeeklyHistory.map((h, i) => {
                    const maxScale = Math.max(mayWeeklyFixedBaseline, 25);
                    const barHeightPct = Math.min((h.fixed / maxScale) * 100, 100);
                    const targetForWeek = Math.round(mayWeeklyFixedBaseline * (0.5 + (i * 0.1)));

                    return (
                      <div key={h.weekLabel} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-3)" }}>{h.weekLabel}</div>
                        <div style={{ position: "relative", width: "100%", height: "80px", background: "var(--surface-3)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                          {/* Dotted Target Line Marker for that week */}
                          <div 
                            style={{ 
                              position: "absolute", 
                              left: 0, 
                              right: 0, 
                              bottom: `${(targetForWeek / maxScale) * 100}%`, 
                              height: "2px", 
                              borderBottom: "2px dashed var(--cyan)", 
                              zIndex: 10 
                            }} 
                            title={`Target Tuần ${i+1}: ${targetForWeek} bug/tuần`}
                          />

                          {/* Dotted Baseline Marker */}
                          <div 
                            style={{ 
                              position: "absolute", 
                              left: 0, 
                              right: 0, 
                              bottom: `${(mayWeeklyFixedBaseline / maxScale) * 100}%`, 
                              height: "1px", 
                              borderBottom: "1px dashed var(--yellow)", 
                              zIndex: 11,
                              opacity: 0.6
                            }} 
                            title={`Mốc Tiêu Chuẩn: ${mayWeeklyFixedBaseline} bug/tuần`}
                          />

                          {/* Actual Bar Fill */}
                          <div 
                            style={{ 
                              width: "100%", 
                              height: `${Math.max(barHeightPct, 4)}%`, 
                              background: h.fixed >= targetForWeek ? "var(--green)" : "var(--blue)", 
                              borderRadius: "4px 4px 0 0",
                              transition: "height 0.4s ease",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "flex-start",
                              paddingTop: "2px"
                            }}
                          >
                            {h.fixed > 0 && (
                              <span style={{ fontSize: "9px", color: "#fff", fontWeight: "bold" }}>{h.fixed}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-2)", fontWeight: "bold" }}>
                          Target: {targetForWeek}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones Reference Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🎯 Mốc Mục Tiêu Năng Suất Tuần theo Tiêu Chuẩn Baseline (~{mayWeeklyFixedBaseline} bug/tuần)</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mốc Tiến Độ</th>
                <th style={{ textAlign: "right" }}>Target Bugs/Tuần</th>
                <th style={{ textAlign: "right" }}>% Mốc Tiêu Chuẩn</th>
                <th>Yêu cầu &amp; Định hướng chuyên môn</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.label}>
                  <td><strong>{t.label}</strong></td>
                  <td className="td-num" style={{ color: "var(--cyan)", fontWeight: "bold", fontSize: "13px" }}>
                    {t.weeklyTarget} bug/tuần
                  </td>
                  <td className="td-num" style={{ color: "var(--accent-2)", fontWeight: "bold" }}>
                    {t.pct}%
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--text-2)" }}>{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
