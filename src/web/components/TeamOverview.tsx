import type { DashboardView, PeriodType } from "../../shared/types";

export function TeamOverview({ view, periodType }: { view: DashboardView; periodType: PeriodType }) {
  const metrics = view.teamMetrics;
  const periodLabel = periodType === "day" ? "Ngày" : periodType === "week" ? "Tuần" : "Tháng";

  return (
    <div>
      <h1 className="section-title">📈 Tổng quan theo {periodLabel}</h1>

      {/* Overview bar chart — all persons stacked */}
      {metrics.length > 0 && metrics[0].byPerson.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">So sánh năng suất Fix Bug — {metrics[0]?.period.label}</div>
          </div>
          <div className="bar-chart">
            {(() => {
              const latest = metrics[0];
              const maxFixed = Math.max(...latest.byPerson.map(p => p.bugsFixed), 1);
              return latest.byPerson
                .sort((a, b) => b.bugsFixed - a.bugsFixed)
                .map(p => (
                  <div className="bar-row" key={p.personCode}>
                    <div className="bar-label" style={{ fontWeight: 700 }}>{p.personCode}</div>
                    <div className="bar-track">
                      <div className="bar-fill bar-fill-accent" style={{ width: `${(p.bugsFixed / maxFixed) * 100}%` }}>
                        {p.bugsFixed} ({p.bugsPerDay}/ngày)
                      </div>
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {/* Full metrics table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Bảng tổng hợp theo {periodLabel}</div>
            <div className="card-subtitle">
              Thống kê tổng hợp số liệu bug phát sinh và xử lý trong từng kỳ
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="metric-table report-table">
            <thead>
              <tr>
                <th className="col-period" style={{ textAlign: "left" }}>Kỳ</th>
                <th className="col-generated has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug mới phát sinh trong kỳ">Phát sinh</th>
                <th className="col-fixed-blue has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số bug mới phát sinh trong kỳ này đã được sửa">Mới đã sửa</th>
                <th className="col-period has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số bug mới phát sinh trong kỳ này chưa được sửa:&#10;Phát sinh - Mới đã sửa">Mới còn mở</th>
                <th className="col-fixed has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug đã được sửa trong kỳ (bao gồm cả lỗi cũ và mới)">Fix trong kỳ</th>
                <th className="col-backlog has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số bug còn tồn đọng chưa được sửa tính đến cuối kỳ">Tồn cuối kỳ</th>
                <th className="col-rate has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tỷ lệ sửa bug mới phát sinh trong kỳ:&#10;(Mới đã sửa / Phát sinh) * 100%">Tỷ lệ fix</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => {
                const prev = metrics[i + 1];
                const fixDelta = prev ? m.totalFixed - prev.totalFixed : 0;
                return (
                  <tr key={m.period.key}>
                    <td style={{ textAlign: "left" }}><strong>{m.period.label}</strong></td>
                    <td className="td-num metric-danger">{m.totalDetected}</td>
                    <td className="td-num metric-fixed-blue">{m.totalNewFixed}</td>
                    <td className="td-num" style={{ fontWeight: "bold" }}>{m.totalNewOpen}</td>
                    <td className="td-num metric-fixed">
                      {m.totalFixed}
                      {prev && fixDelta !== 0 && (
                        <span style={{ marginLeft: 4, fontSize: 10, color: fixDelta > 0 ? "var(--green)" : "var(--red)" }}>
                          {fixDelta > 0 ? `▲${fixDelta}` : `▼${Math.abs(fixDelta)}`}
                        </span>
                      )}
                    </td>
                    <td className="td-num metric-backlog">{m.backlogEnd}</td>
                    <td className="td-num metric-rate">
                      {m.fixRatePercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-person breakdown for each period */}
      {metrics.slice(0, 3).map(m => (
        <div className="card" key={m.period.key} style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Chi tiết nhân sự — {m.period.label}</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nhân sự</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã sửa (Closed, Deployed, Resolved) trong kỳ">Fixed</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug tự phát hiện/tạo mới trong kỳ">Detected</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số PR/task đã review trong kỳ">Reviewed</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug bị reopen trong kỳ">Re-open</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số ngày công làm việc thực tế ghi nhận">Man-Day</th>
                  <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Hiệu suất sửa bug trung bình ngày công:&#10;Fixed / Man-Day">Bug/Ngày</th>
                </tr>
              </thead>
              <tbody>
                {m.byPerson.map(p => (
                  <tr key={p.personCode}>
                    <td><strong>{p.personCode}</strong></td>
                    <td className="td-num" style={{ color: "var(--green)" }}>{p.bugsFixed}</td>
                    <td className="td-num">{p.bugsDetected}</td>
                    <td className="td-num">{p.bugsReviewed}</td>
                    <td className="td-num" style={{ color: p.bugsReopened > 0 ? "var(--red)" : "var(--text-3)" }}>{p.bugsReopened}</td>
                    <td className="td-num">{p.manDays}</td>
                    <td className="td-num" style={{ color: "var(--accent-2)" }}>{p.bugsPerDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
