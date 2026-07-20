import type { DashboardView } from "../../shared/types";

const STAGE_COLORS: Record<string, string> = {
  "New": "var(--blue)",
  "In Progress": "var(--cyan)",
  "Resolved": "var(--accent-2)",
  "Deployed": "var(--purple)",
  "Reopened": "var(--red)",
  "Pending": "var(--yellow)",
  "Closed": "var(--green)",
  "Cancel": "var(--text-3)",
};

export function BugLifecycle({ view }: { view: DashboardView }) {
  const lifecycle = view.lifecycle;
  const total = lifecycle.reduce((s, l) => s + l.count, 0);

  return (
    <div>
      <h1 className="section-title">🔄 Vòng đời Bug (Bug Lifecycle)</h1>

      {/* Flow diagram */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Trạng thái hiện tại</div>
          <div className="card-subtitle">Tổng {total} bugs đang được theo dõi</div>
        </div>
        <div className="lifecycle-flow">
          {lifecycle.map((lc, i) => (
            <div key={lc.stage} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div className="lifecycle-node" style={{ borderColor: STAGE_COLORS[lc.stage] ?? "var(--border)" }}>
                <div className="lifecycle-count" style={{ color: STAGE_COLORS[lc.stage] }}>{lc.count}</div>
                <div className="lifecycle-label">{lc.stage}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                  {total > 0 ? `${((lc.count / total) * 100).toFixed(0)}%` : "0%"}
                </div>
              </div>
              {i < lifecycle.length - 1 && <span className="lifecycle-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Status distribution bar chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Phân bổ trạng thái</div>
        </div>
        <div className="bar-chart">
          {lifecycle.map(lc => {
            const pct = total > 0 ? (lc.count / total) * 100 : 0;
            return (
              <div className="bar-row" key={lc.stage}>
                <div className="bar-label">{lc.stage}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width: `${Math.max(pct, 3)}%`,
                    background: STAGE_COLORS[lc.stage] ?? "var(--accent)",
                  }}>
                    {lc.count} ({pct.toFixed(0)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bug detail tables by status */}
      {["Reopened", "In Progress", "Pending", "New"].map(status => {
        const bugs = view.bugs.filter(b => (b.status ?? "").toLowerCase() === status.toLowerCase());
        if (bugs.length === 0) return null;
        return (
          <div className="card" key={status} style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div className="card-title" style={{ color: STAGE_COLORS[status] }}>
                {status} ({bugs.length})
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bug</th>
                    <th>Severity</th>
                    <th>Vị trí</th>
                    <th>Root Cause</th>
                    <th>Ngày phát hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {bugs.map(b => (
                    <tr key={b.id}>
                      <td style={{ maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.url ? <a href={b.url} target="_blank" rel="noopener">{b.title}</a> : b.title}
                      </td>
                      <td><span className={`tag ${b.severity === "Critical" || b.severity === "High" ? "tag-red" : "tag-gray"}`}>{b.severity ?? "—"}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-2)" }}>{(b.location ?? []).join(", ") || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-2)" }}>{b.rootCause ?? "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-3)" }}>{b.detectedDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
