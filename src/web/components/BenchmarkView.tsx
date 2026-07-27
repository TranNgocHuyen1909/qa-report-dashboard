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

  // Realistic Milestone targets for Developers & Lead
  const targets = [
    { label: "Mức 0 (Tuần 1-2 - Người Mới)", pct: 30, weeklyTarget: 4, desc: "Đọc docs, làm quen codebase, setup môi trường và sửa bug đơn giản (3-5 bug/tuần)" },
    { label: "Mốc T1 (Tháng 1 - Đạt Chuẩn Cơ Bản)", pct: 50, weeklyTarget: 7, desc: "Tự chủ fix bug độc lập, áp dụng pre-handover checklist (5-8 bug/tuần)" },
    { label: "Mốc T2 (Tháng 2 - Tăng Tốc Flow Khó)", pct: 75, weeklyTarget: 10, desc: "Xử lý task luồng nghiệp vụ phức tạp, giảm tỷ lệ lỗi reopen (8-12 bug/tuần)" },
    { label: "Mốc T3 (Đạt Chuẩn Năng Suất Tối Đa)", pct: 100, weeklyTarget: 14, desc: "Đạt mốc năng suất thực tế tiêu chuẩn (~12-15 bug/tuần)" },
  ];

  return (
    <div>
      <h1 className="section-title">🎯 Benchmark — Mốc Năng Suất Tiêu Chuẩn Theo Tuần</h1>

      {/* WHITEBOARD GROWTH TRAJECTORY CHART MATCHING BOARD PHOTO */}
      <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--cyan)", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📈 Sơ Đồ Tăng Trưởng & Mục Tiêu Theo Vai Trò (Lead / Developer)</span>
          <span className="tag tag-green" style={{ fontSize: "11px" }}>Mốc Baseline Thực Tế: ~14 bug/tuần</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "16px" }}>
          Lộ trình đo lường phù hợp theo vai trò: <strong>Lead (HuyenTN)</strong> đo lường theo <strong>Năng suất Review PRs & Kiểm soát chất lượng</strong>; <strong>Developer</strong> đo lường theo lộ trình tăng trưởng năng suất thực tế.
        </p>

        {/* Growth Curves per Developer / Lead */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {view.personnel.filter(p => p.role !== "benchmark").map(dev => {
            const isLead = dev.code === "HuyenTN" || dev.role === "lead";

            // If Lead, calculate weekly PR reviews instead of bugs fixed
            const devWeeklyHistory = view.weeklyMetrics.slice(0, 6).reverse().map((w, idx) => {
              const pData = w.byPerson.find(p => p.personCode === dev.code);
              const val = isLead ? (pData ? pData.bugsReviewed : 0) : (pData ? pData.bugsFixed : 0);
              return { weekLabel: `Tuần ${idx + 1}`, val };
            });

            const currentValThisWeek = devWeeklyHistory[devWeeklyHistory.length - 1]?.val || 0;
            
            let milestoneBadge = "Đang làm quen (T1)";
            let badgeColor = "var(--text-3)";
            
            if (isLead) {
              milestoneBadge = "👑 Lead Reviewer — Mục tiêu Review 100% PRs";
              badgeColor = "var(--cyan)";
            } else {
              const maxDevTarget = 14;
              const currentPct = (currentValThisWeek / maxDevTarget) * 100;
              if (currentPct >= 85) { milestoneBadge = "🥇 Mốc T3 (Đạt Chuẩn Tối Đa)"; badgeColor = "var(--green)"; }
              else if (currentPct >= 60) { milestoneBadge = "🥈 Mốc T2 (Khá - Tăng Tốc)"; badgeColor = "var(--blue)"; }
              else if (currentPct >= 40) { milestoneBadge = "🥉 Mốc T1 (Cơ Bản)"; badgeColor = "var(--yellow)"; }
            }

            return (
              <div key={dev.code} style={{ background: "var(--surface-2)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--text-1)" }}>
                      {isLead ? "👑" : "👤"} {dev.displayName}
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--text-3)", marginLeft: "8px" }}>
                      ({dev.code} — {isLead ? "Lead / QC Reviewer" : "Developer"})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: badgeColor }}>{milestoneBadge}</span>
                    <span className={`tag ${isLead ? "tag-purple" : "tag-cyan"}`} style={{ fontSize: "11px" }}>
                      {isLead ? `${currentValThisWeek} PRs đã Review/tuần` : `${currentValThisWeek} bug/tuần`}
                    </span>
                  </div>
                </div>

                {/* Visual Trajectory Bars per Week */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {devWeeklyHistory.map((h, i) => {
                    const leadTargets = [17, 25, 28, 30, 35, 40];
                    const targetForWeek = isLead ? (leadTargets[i] ?? 40) : Math.round(4 + (i * 2));
                    const maxScale = isLead ? Math.max(45, targetForWeek, h.val) : 15;
                    const barHeightPct = Math.min((h.val / maxScale) * 100, 100);

                    return (
                      <div key={h.weekLabel} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-3)" }}>{h.weekLabel}</div>
                        <div style={{ position: "relative", width: "100%", height: "80px", background: "var(--surface-3)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                          {/* Dotted Target Line Marker */}
                          <div 
                            style={{ 
                              position: "absolute", 
                              left: 0, 
                              right: 0, 
                              bottom: `${Math.min((targetForWeek / maxScale) * 100, 95)}%`, 
                              height: "2px", 
                              borderBottom: "2px dashed var(--cyan)", 
                              zIndex: 10 
                            }} 
                            title={`Target Tuần ${i+1}: ${targetForWeek} ${isLead ? "reviews" : "bugs"}`}
                          />

                          {/* Actual Bar Fill */}
                          <div 
                            style={{ 
                              width: "100%", 
                              height: `${Math.max(barHeightPct, 4)}%`, 
                              background: isLead 
                                ? "var(--purple)" 
                                : h.val >= targetForWeek ? "var(--green)" : "var(--blue)", 
                              borderRadius: "4px 4px 0 0",
                              transition: "height 0.4s ease",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "flex-start",
                              paddingTop: "2px"
                            }}
                          >
                            {h.val > 0 && (
                              <span style={{ fontSize: "9px", color: "#fff", fontWeight: "bold" }}>{h.val}</span>
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
          <div className="card-title">🎯 Mốc Mục Tiêu Năng Suất Phù Hợp Theo Vai Trò (Lead vs Developer)</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mốc Tiến Độ / Vai Trò</th>
                <th style={{ textAlign: "right" }}>Target Tuần Thực Tế</th>
                <th style={{ textAlign: "right" }}>% Mốc Tiêu Chuẩn</th>
                <th>Mục tiêu trọng tâm &amp; Định hướng chuyên môn</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "rgba(168, 85, 247, 0.05)" }}>
                <td><strong>👑 Lead / QC Reviewer (HuyenTN)</strong></td>
                <td className="td-num" style={{ color: "var(--purple)", fontWeight: "bold", fontSize: "13px" }}>
                  100% PRs của Dev
                </td>
                <td className="td-num" style={{ color: "var(--cyan)", fontWeight: "bold" }}>
                  100%
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-1)" }}>
                  Tập trung trọng tâm vào <strong>Review Code, Check PRs &amp; Đảm bảo chất lượng nghiệm thu</strong>; Kiểm soát tỷ lệ Reopen toàn team &lt; 15%.
                </td>
              </tr>
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
