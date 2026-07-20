import type { DashboardView } from "../../shared/types";

export function BenchmarkView({ view }: { view: DashboardView }) {
  const bm = view.benchmark;
  if (!bm || bm.months.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
        Chưa có dữ liệu benchmark An. Refresh để cập nhật từ Notion.
      </div>
    );
  }

  // Current team latest metrics for comparison
  const latestTeam = view.teamMetrics[0];

  return (
    <div>
      <h1 className="section-title">🎯 Benchmark — So sánh với {bm.person.code} ({bm.person.displayName})</h1>

      {/* Comparison cards */}
      {latestTeam && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card benchmark-card">
            <div className="card-header">
              <div className="card-title">🏆 {bm.person.code} — Tổng quan</div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {bm.months.slice(0, 3).map(m => (
                <div className="kpi kpi-cyan has-tooltip" key={m.month} data-tooltip={`Tổng số bug An đã sửa trong ${m.label}`}>
                  <div className="kpi-value">{m.totalFixed}</div>
                  <div className="kpi-label">{m.label} Fixed</div>
                </div>
              ))}
            </div>
            {bm.months[0] && (
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "var(--text-2)" }}>
                Trung bình: <strong style={{ color: "var(--cyan)" }}>{bm.months[0].avgBugsPerDay} bugs/ngày</strong>
              </div>
            )}
          </div>
 
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Team hiện tại — {latestTeam.period.label}</div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div className="kpi kpi-green has-tooltip" data-tooltip="Tổng số bug cả team đã sửa trong kỳ này">
                <div className="kpi-value">{latestTeam.totalFixed}</div>
                <div className="kpi-label">Fixed kỳ này</div>
              </div>
              <div className="kpi kpi-accent has-tooltip" data-tooltip="Tỷ lệ sửa bug của cả team trong kỳ:&#10;(Tổng Fixed / Tổng Phát sinh) * 100%">
                <div className="kpi-value">{latestTeam.fixRatePercent}%</div>
                <div className="kpi-label">Tỷ lệ fix</div>
              </div>
            </div>
            {bm.months[0] && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-2)" }}>So sánh năng suất Dev vs An ({bm.months[0].avgBugsPerDay} bugs/ngày):</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {latestTeam.byPerson.map(p => {
                    const rate = bm.months[0].avgBugsPerDay > 0 ? (p.bugsPerDay / bm.months[0].avgBugsPerDay) * 100 : 0;
                    return (
                      <div key={p.personCode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                        <span><strong>{p.personCode}</strong>: {p.bugsPerDay} bug/ngày</span>
                        <span style={{ fontWeight: 600, color: rate >= 90 ? "var(--green)" : rate >= 70 ? "var(--cyan)" : rate >= 50 ? "var(--yellow)" : "var(--text-3)" }}>
                          {rate.toFixed(0)}% của An ({rate >= 90 ? "Mốc T3" : rate >= 70 ? "Mốc T2" : rate >= 50 ? "Mốc T1" : "Đang làm quen"})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* An's monthly breakdown */}
      {bm.months.map(month => (
        <div className="card" key={month.month} style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">{month.label} — {bm.person.code}</div>
              <div className="card-subtitle">
                Tổng fixed: {month.totalFixed} | Phát sinh: {month.totalDetected} | Fix rate: {month.fixRatePercent}% | Avg: {month.avgBugsPerDay} bugs/ngày
              </div>
            </div>
          </div>

          {month.weeks.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tuần</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Tổng số bug được tạo mới phát sinh trong tuần">Lỗi phát sinh</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug mới phát sinh trong tuần này đã được sửa">Lỗi mới đã sửa</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug mới phát sinh trong tuần này chưa được sửa:&#10;Lỗi phát sinh - Lỗi mới đã sửa">Lỗi mới còn mở</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Tổng số bug được sửa trong tuần (bao gồm cả lỗi phát sinh cũ và mới)">Fix trong tuần</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Tổng số bug còn mở tồn đọng tính đến cuối tuần">Tồn cuối tuần</th>
                    <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Tỷ lệ sửa bug mới phát sinh trong tuần:&#10;(Lỗi mới đã sửa / Lỗi phát sinh) * 100%">Tỷ lệ fix</th>
                  </tr>
                </thead>
                <tbody>
                  {month.weeks.map(w => (
                    <tr key={w.startDate}>
                      <td><strong>{w.label}</strong></td>
                      <td style={{ fontSize: 12 }}>{w.startDate}</td>
                      <td style={{ fontSize: 12 }}>{w.endDate}</td>
                      <td className="td-num">{w.detected}</td>
                      <td className="td-num" style={{ color: "var(--green)" }}>{w.newFixed}</td>
                      <td className="td-num" style={{ color: w.newOpen > 0 ? "var(--red)" : "var(--text-3)" }}>{w.newOpen}</td>
                      <td className="td-num" style={{ color: "var(--blue)" }}>{w.fixedInWeek}</td>
                      <td className="td-num" style={{ color: "var(--yellow)" }}>{w.backlogEnd}</td>
                      <td className="td-num"><span className={`tag ${w.fixRatePercent >= 30 ? "tag-green" : "tag-yellow"}`}>{w.fixRatePercent}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Progress milestones for new members */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🎯 Mục tiêu tiến bộ cho người mới</div>
          <div className="card-subtitle">Dựa trên benchmark An ({bm.months[0]?.avgBugsPerDay ?? 0} bugs/ngày)</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mốc</th>
                <th style={{ textAlign: "right" }}>Target bugs/ngày</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Tháng 1 (đang)", pct: 50, desc: "Làm quen quy trình, hiểu codebase, fix bugs đơn giản" },
                { label: "Tháng 2", pct: 70, desc: "Tự chủ fix bugs, giảm lỗi re-open" },
                { label: "Tháng 3", pct: 90, desc: "Tiệm cận năng suất An, tự review được" },
              ].map(({ label, pct, desc }) => (
                <tr key={label}>
                  <td><strong>{label}</strong></td>
                  <td className="td-num" style={{ color: "var(--accent-2)" }}>
                    {((bm.months[0]?.avgBugsPerDay ?? 0) * pct / 100).toFixed(1)} ({pct}%)
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
