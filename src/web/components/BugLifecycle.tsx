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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ marginBottom: "4px" }}>🔄 Vòng Đời Bug &amp; Quy Trình Xử Lý End-to-End</h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          Sơ đồ luồng công việc chuẩn 6 bước từ khi nhận defect trên Notion ➔ đổi Status ➔ phân tích Root Cause ➔ tạo PR ➔ Review ➔ Close Bug.
        </p>
      </div>

      {/* FULL END-TO-END WORKFLOW PIPELINE CARD */}
      <div 
        className="card" 
        style={{ 
          padding: "20px", 
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--accent-2)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🚀</span> Quy Trình Xử Lý Bug Chuẩn 6 Bước (Notion Defect ➔ PR ➔ Close Bug)
        </div>

        {/* Horizontal Step Pipeline Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "16px" }}>
          
          {/* STEP 1 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--blue)", color: "#fff", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <span style={{ fontSize: "9px", color: "var(--cyan)", fontWeight: "bold", background: "rgba(6,182,212,0.15)", padding: "1px 4px", borderRadius: "3px" }}>Notion</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>1. Nhận Task &amp; Status</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Nhận assign defect. Đổi status Notion sang <strong style={{ color: "var(--yellow)" }}>Doing</strong>. Hủy ngay nếu trùng/không tái hiện.
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#a855f7", color: "#fff", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
              <span style={{ fontSize: "9px", color: "#c084fc", fontWeight: "bold", background: "rgba(168,85,247,0.15)", padding: "1px 4px", borderRadius: "3px" }}>Analysis</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>2. Root Cause &amp; TL</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Trace đúng tầng (Tool &gt; AI). Báo cáo phương án sửa với Lead trước khi gõ code.
            </div>
          </div>

          {/* STEP 3 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--yellow)", color: "#000", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              <span style={{ fontSize: "9px", color: "var(--yellow)", fontWeight: "bold", background: "rgba(234,179,8,0.15)", padding: "1px 4px", borderRadius: "3px" }}>Code &amp; Test</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>3. Code &amp; Self-Test</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Sửa code &amp; tự tích đủ 6 mục Pre-handover checklist (test cả 2 nhánh Present-Mirror).
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--cyan)", color: "#000", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
              <span style={{ fontSize: "9px", color: "var(--cyan)", fontWeight: "bold", background: "rgba(6,182,212,0.15)", padding: "1px 4px", borderRadius: "3px" }}>GitHub</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>4. PR &amp; Notion Link</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Tạo PR GitHub, copy PR URL dán vào Notion. Đổi status Notion ➔ <strong style={{ color: "var(--blue)" }}>Resolved (Chờ Review)</strong>.
            </div>
          </div>

          {/* STEP 5 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ec4899", color: "#fff", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>5</span>
              <span style={{ fontSize: "9px", color: "#f472b6", fontWeight: "bold", background: "rgba(236,72,153,0.15)", padding: "1px 4px", borderRadius: "3px" }}>Review</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>5. Review 2 Vòng</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Vòng 1: Lead Huyền QC test. Vòng 2: Tech Lead Anh Trường review logic PR.
            </div>
          </div>

          {/* STEP 6 */}
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--green)", color: "#fff", fontWeight: "bold", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>6</span>
              <span style={{ fontSize: "9px", color: "var(--green)", fontWeight: "bold", background: "rgba(16,185,129,0.15)", padding: "1px 4px", borderRadius: "3px" }}>Done</span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "3px" }}>6. Deploy &amp; Close</div>
            <div style={{ fontSize: "10px", color: "var(--text-2)", lineHeight: "1.4" }}>
              PR merged, test prod pass. Anh Trường / Lead đóng status Notion ➔ <strong style={{ color: "var(--green)" }}>Closed</strong>.
            </div>
          </div>

        </div>

        {/* Status Flow Helper Notes */}
        <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-2)", background: "var(--surface-3)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
          <span>📌 <strong>Notion Status Flow:</strong> <code>Wait</code> ➔ <code>Assign</code> ➔ <code style={{ color: "var(--yellow)" }}>Doing</code> ➔ <code style={{ color: "var(--blue)" }}>Chờ review (Resolved)</code> ➔ <code style={{ color: "#c084fc" }}>Deployed</code> ➔ <code style={{ color: "var(--green)" }}>Closed</code></span>
          <span>⚖️ <strong>Thẩm quyền Close:</strong> Anh Trường / Lead Huyền</span>
        </div>
      </div>

      {/* Notion Statuses breakdown */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Trạng thái Notion thực tế trên hệ thống</div>
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
      <div className="card">
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
          <div className="card" key={status}>
            <div className="card-header">
              <div className="card-title" style={{ color: STAGE_COLORS[status] }}>
                Danh sách Bug trạng thái: {status} ({bugs.length})
              </div>
            </div>
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-3)" }}>
                    <th>STT</th>
                    <th>Tên Bug / Defect</th>
                    <th>Assignee</th>
                    <th>PR URL</th>
                    <th>Lý do Reopen / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {bugs.map((b, idx) => (
                    <tr key={b.id ?? idx}>
                      <td>{idx + 1}</td>
                      <td><strong>{b.title}</strong></td>
                      <td>{b.assignee || "Chưa gán"}</td>
                      <td>
                        {b.pullRequestUrl ? (
                          <a href={b.pullRequestUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontWeight: "bold" }}>
                            🔗 Xem PR
                          </a>
                        ) : (
                          <span style={{ color: "var(--red)", fontSize: "10px" }}>⚠️ Thiếu PR URL</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-3)" }}>{b.notes || "—"}</td>
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
