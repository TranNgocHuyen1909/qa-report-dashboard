import type { DashboardView, TeamPeriodMetric, BugTrackingBreakdownItem } from "../../shared/types";

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function fmtDate(v: string | undefined): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function MonthlyTable({ rows }: { rows: TeamPeriodMetric[] }) {
  const totalDetected = rows.reduce((s, r) => s + r.totalDetected, 0);
  const totalFixed = rows.reduce((s, r) => s + r.totalFixed, 0);
  const backlogEnd = rows[0]?.backlogEnd ?? 0;
  const fixRatePercent = totalDetected + backlogEnd > 0 ? (totalFixed / (totalDetected + backlogEnd)) * 100 : 0;

  return (
    <section className="card" style={{ marginBottom: "16px" }}>
      <div className="card-header">
        <div>
          <div className="card-title">Thống Kê Tổng Hợp Bug — Theo Tháng</div>
          <div className="card-subtitle">Tổng hợp lỗi phát sinh và tỷ lệ xử lý hàng tháng</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="metric-table report-table">
          <thead>
            <tr>
              <th className="col-period has-tooltip" style={{ textAlign: "left" }} data-tooltip="Tháng dương lịch thống kê">Tháng</th>
              <th className="col-generated has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lượng lỗi phát hiện mới trong tháng (tất cả các trạng thái, ngoại trừ Cancel)">Lỗi phát sinh</th>
              <th className="col-fixed has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số lỗi được sửa xong trong tháng (ở trạng thái Closed, Deployed, Resolved - không tính các lỗi Không tái hiện)">Lỗi đã fix trong tháng</th>
              <th className="col-backlog has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lượng lỗi chưa xử lý xong tính đến cuối tháng (ở trạng thái New, In Progress, Reopened, Pending)">Lỗi tồn cuối tháng</th>
              <th className="col-rate has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tỷ lệ xử lý lỗi trong tháng:&#10;(Lỗi đã fix / (Lỗi tồn đầu tháng + Lỗi phát sinh mới)) * 100%">Tỷ lệ fix trong tháng</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)" }}>Chưa có dữ liệu ngày lỗi</td>
              </tr>
            ) : (
              rows.map((row) => {
                const d = new Date();
                const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const isCurrent = today >= row.period.startDate && today <= row.period.endDate;
                return (
                  <tr key={row.period.key}>
                    <td style={{ textAlign: "left" }}>
                      {row.period.label}
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
                    <td className="td-num metric-danger">{row.totalDetected.toLocaleString()}</td>
                    <td className="td-num metric-fixed">{row.totalFixed.toLocaleString()}</td>
                    <td className="td-num metric-backlog">{row.backlogEnd.toLocaleString()}</td>
                    <td className="td-num metric-rate">{formatPercent(row.fixRatePercent)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", borderTop: "2px solid var(--border-2)" }}>
              <td style={{ textAlign: "left" }}>TỔNG</td>
              <td className="td-num metric-danger">{totalDetected.toLocaleString()}</td>
              <td className="td-num metric-fixed">{totalFixed.toLocaleString()}</td>
              <td className="td-num metric-backlog">{backlogEnd.toLocaleString()}</td>
              <td className="td-num metric-rate">{formatPercent(fixRatePercent)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function WeeklyTable({ rows }: { rows: TeamPeriodMetric[] }) {
  const totalDetected = rows.reduce((s, r) => s + r.totalDetected, 0);
  const totalNewFixed = rows.reduce((s, r) => s + r.totalNewFixed, 0);
  const totalNewOpen = rows.reduce((s, r) => s + r.totalNewOpen, 0);
  const totalFixed = rows.reduce((s, r) => s + r.totalFixed, 0);
  const backlogEnd = rows[0]?.backlogEnd ?? 0;
  const fixRatePercent = totalDetected + backlogEnd > 0 ? (totalFixed / (totalDetected + backlogEnd)) * 100 : 0;

  return (
    <section className="card" style={{ marginBottom: "16px" }}>
      <div className="card-header">
        <div>
          <div className="card-title">8 Tuần Gần Nhất</div>
          <div className="card-subtitle">Tuần bắt đầu từ thứ 2, cập nhật theo thời gian thực</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="metric-table report-table">
          <thead>
            <tr>
              <th className="col-period has-tooltip" style={{ textAlign: "left" }} data-tooltip="Tuần thống kê (bắt đầu từ Thứ Hai)">Tuần</th>
              <th className="col-period has-tooltip" style={{ textAlign: "center" }} data-tooltip="Thứ Hai đầu tuần">Ngày bắt đầu</th>
              <th className="col-period has-tooltip" style={{ textAlign: "center" }} data-tooltip="Chủ Nhật cuối tuần">Ngày kết thúc</th>
              <th className="col-generated has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lượng lỗi phát hiện mới trong tuần (tất cả các trạng thái, ngoại trừ Cancel)">Lỗi phát sinh</th>
              <th className="col-fixed-blue has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lỗi mới phát sinh tuần này hiện ở trạng thái Closed, Deployed, Resolved (không tính lỗi Không tái hiện)">Lỗi mới đã sửa</th>
              <th className="col-period has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lỗi mới phát sinh tuần này hiện đang mở (ở trạng thái New, In Progress, Reopened, Pending)">Lỗi mới còn mở</th>
              <th className="col-fixed has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tổng số lỗi được sửa xong trong tuần (ở trạng thái Closed, Deployed, Resolved - gồm cả lỗi mới và cũ, không tính lỗi Không tái hiện)">Lỗi đã fix trong tuần</th>
              <th className="col-backlog has-tooltip" style={{ textAlign: "right" }} data-tooltip="Số lượng lỗi chưa xử lý xong tính đến cuối tuần (ở trạng thái New, In Progress, Reopened, Pending)">Lỗi tồn cuối tuần</th>
              <th className="col-rate has-tooltip" style={{ textAlign: "right" }} data-tooltip="Tỷ lệ xử lý lỗi trong tuần:&#10;(Lỗi đã fix / (Lỗi tồn đầu tuần + Lỗi phát sinh mới)) * 100%">Tỷ lệ fix trong tuần</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--text-3)" }}>Chưa có dữ liệu ngày lỗi</td>
              </tr>
            ) : (
              rows.map((row) => {
                const d = new Date();
                const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const isCurrent = today >= row.period.startDate && today <= row.period.endDate;

                // Calculate week number starting from 2026-06-29
                const startMs = new Date("2026-06-29T00:00:00Z").getTime();
                const currentMs = new Date(row.period.startDate + "T00:00:00Z").getTime();
                const diffWeeks = Math.round((currentMs - startMs) / (7 * 24 * 60 * 60 * 1000));
                const weekNum = diffWeeks + 1;

                return (
                  <tr key={row.period.key}>
                    <td style={{ textAlign: "left" }}>
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
                    <td style={{ textAlign: "center" }}>{fmtDate(row.period.startDate)}</td>
                    <td style={{ textAlign: "center" }}>{fmtDate(row.period.endDate)}</td>
                    <td className="td-num metric-danger">{row.totalDetected.toLocaleString()}</td>
                    <td className="td-num metric-fixed-blue">{row.totalNewFixed.toLocaleString()}</td>
                    <td className="td-num" style={{ fontWeight: "bold" }}>{row.totalNewOpen.toLocaleString()}</td>
                    <td className="td-num metric-fixed">{row.totalFixed.toLocaleString()}</td>
                    <td className="td-num metric-backlog">{row.backlogEnd.toLocaleString()}</td>
                    <td className="td-num metric-rate">{formatPercent(row.fixRatePercent)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", borderTop: "2px solid var(--border-2)" }}>
              <td colSpan={3} style={{ textAlign: "left" }}>TỔNG</td>
              <td className="td-num metric-danger">{totalDetected.toLocaleString()}</td>
              <td className="td-num metric-fixed-blue">{totalNewFixed.toLocaleString()}</td>
              <td className="td-num" style={{ fontWeight: "bold" }}>{totalNewOpen.toLocaleString()}</td>
              <td className="td-num metric-fixed">{totalFixed.toLocaleString()}</td>
              <td className="td-num metric-backlog">{backlogEnd.toLocaleString()}</td>
              <td className="td-num metric-rate">{formatPercent(fixRatePercent)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function CountTable({
  title,
  subtitle,
  nameColumn,
  rows
}: {
  title: string;
  subtitle: string;
  nameColumn: string;
  rows: BugTrackingBreakdownItem[];
}) {
  const summary = rows.reduce(
    (total, row) => ({
      totalBugs: total.totalBugs + row.totalBugs,
      fixedBugs: total.fixedBugs + row.fixedBugs,
      openBugs: total.openBugs + row.openBugs
    }),
    { totalBugs: 0, fixedBugs: 0, openBugs: 0 }
  );

  return (
    <section className="card" style={{ flex: 1 }}>
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="table-wrap" style={{ maxHeight: "350px", overflowY: "auto" }}>
        <table className="metric-table report-table">
          <thead>
            <tr>
              <th className="col-period" style={{ textAlign: "left" }}>{nameColumn}</th>
              <th className="col-period" style={{ textAlign: "right" }}>Số bug</th>
              <th className="col-fixed" style={{ textAlign: "right" }}>Đã fix</th>
              <th className="col-period" style={{ textAlign: "right" }}>Chưa fix</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--text-3)" }}>Chưa có bug từ Notion</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name}>
                  <td style={{ textAlign: "left" }}>{row.name}</td>
                  <td className="td-num">{row.totalBugs.toLocaleString()}</td>
                  <td className="td-num metric-fixed">{row.fixedBugs.toLocaleString()}</td>
                  <td className="td-num" style={{ fontWeight: "bold" }}>{row.openBugs.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", borderTop: "2px solid var(--border-2)" }}>
              <td style={{ textAlign: "left" }}>TỔNG</td>
              <td className="td-num">{summary.totalBugs.toLocaleString()}</td>
              <td className="td-num metric-fixed">{summary.fixedBugs.toLocaleString()}</td>
              <td className="td-num" style={{ fontWeight: "bold" }}>{summary.openBugs.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function BugsPanel({ view }: { view: DashboardView }) {
  const bugs = view.bugs;
  const totalBugs = view.weeklyMetrics.reduce((sum, r) => sum + r.totalDetected, 0); // approximation or total
  const openBugs = view.bugs.filter(b => !["closed", "deployed", "resolved"].includes((b.status ?? "").toLowerCase())).length;
  const fixedBugs = view.bugs.filter(b => ["closed", "deployed", "resolved"].includes((b.status ?? "").toLowerCase())).length;
  const fixRate = fixedBugs + openBugs > 0 ? (fixedBugs / (fixedBugs + openBugs)) * 100 : 0;

  return (
    <div>
      <h1 className="section-title">🐛 Thống kê chi tiết Bug Notion</h1>

      <section className="kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi kpi-accent">
          <div className="kpi-label">Tổng lỗi gần đây</div>
          <div className="kpi-value">{view.bugs.length}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">Đã fix</div>
          <div className="kpi-value">{fixedBugs}</div>
        </div>
        <div className="kpi kpi-red">
          <div className="kpi-label">Chưa fix</div>
          <div className="kpi-value">{openBugs}</div>
        </div>
        <div className="kpi kpi-cyan">
          <div className="kpi-label">Tỷ lệ fix</div>
          <div className="kpi-value">{fixRate.toFixed(1)}%</div>
        </div>
      </section>

      <MonthlyTable rows={view.monthlyMetrics} />
      <WeeklyTable rows={view.weeklyMetrics} />

      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
        <CountTable 
          title="Count theo PL testcase" 
          subtitle="Trạng thái Active (bỏ Cancel). Mỗi bug chỉ có tối đa 1 PL testcase (Tổng = 126 bug thực tế)." 
          nameColumn="PL testcase" 
          rows={view.byTestcase} 
        />
        <CountTable 
          title="Count theo Vị trí lỗi" 
          subtitle="Trạng thái Active (bỏ Cancel). Một bug có thể chọn nhiều vị trí lỗi nên tổng các hàng sẽ lớn hơn số bug thực tế (139 > 126)." 
          nameColumn="Vị trí lỗi" 
          rows={view.byLocation} 
        />
      </div>
    </div>
  );
}
