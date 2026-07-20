import { useState, useEffect } from "react";
import type { DashboardView } from "../../shared/types";
import { saveConclusion } from "../api";

export function ManagerReport({ view, onUpdate }: { view: DashboardView; onUpdate: () => void }) {
  const isNoRepro = (b: any) => {
    const note = (b.note ?? "").toLowerCase();
    const hasNoReproNote = note.includes("không tái hiện") || note.includes("ko tái hiện");
    return hasNoReproNote || !b.pullRequestUrl;
  };

  const bugs = view.bugs;
  const totalBugs = bugs.length;
  const closedBugs = bugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase())).length;
  const resolvedBugs = bugs.filter(b => (b.status ?? "").toLowerCase() === "resolved").length;
  const fixedBugs = closedBugs + resolvedBugs;
  const openBugs = totalBugs - fixedBugs;
  const reopened = bugs.filter(b => (b.status ?? "").toLowerCase() === "reopened").length;
  const noReproCount = bugs.filter(isNoRepro).length;
  const actualReceived = totalBugs - noReproCount;
  const closeRate = actualReceived > 0 ? ((closedBugs / actualReceived) * 100).toFixed(1) : "0";
  const resolveRate = actualReceived > 0 ? ((resolvedBugs / actualReceived) * 100).toFixed(1) : "0";

  // Latest period summary
  const latest = view.teamMetrics[0];

  // Conclusion Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [risks, setRisks] = useState("");
  const [manDaysOverrides, setManDaysOverrides] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Load existing conclusion when active period changes
  const activePeriodKey = latest?.period.key;
  const activeConclusion = activePeriodKey && view.conclusions ? view.conclusions[activePeriodKey] : null;

  // Find previous period for trend tracking (if active period is weekly)
  const weeklyIdx = view.weeklyMetrics.findIndex(m => m.period.key === activePeriodKey);
  const prevMetric = (weeklyIdx !== -1 && weeklyIdx + 1 < view.weeklyMetrics.length)
    ? view.weeklyMetrics[weeklyIdx + 1]
    : null;

  useEffect(() => {
    if (activeConclusion) {
      setGood(activeConclusion.good);
      setBad(activeConclusion.bad);
      setRisks(activeConclusion.risks);
      setManDaysOverrides(activeConclusion.manDaysOverrides || {});
    } else {
      setGood("");
      setBad("");
      setRisks("");
      setManDaysOverrides({});
    }
  }, [activePeriodKey, activeConclusion]);

  const getAutoSummary = () => {
    if (!latest) return null;
    
    const totalFixed = latest.totalFixed;
    const totalDetected = latest.totalDetected;
    const backlog = latest.backlogEnd;
    
    const topDevs = latest.byPerson.filter((p: any) => Number(p.bugsPerDay) >= 2.0);
    const slowDevs = latest.byPerson.filter((p: any) => Number(p.bugsPerDay) < 1.0 && p.manDays > 2);
    const reopenDevs = latest.byPerson.filter((p: any) => p.bugsReopened > 1);

    // Team growth calculation
    let teamGrowthText = "";
    if (prevMetric) {
      const prevFixed = prevMetric.totalFixed;
      const pctChange = prevFixed > 0 ? ((totalFixed - prevFixed) / prevFixed) * 100 : 0;
      teamGrowthText = ` (Tuần trước sửa ${prevFixed} bug, ${pctChange >= 0 ? 'tăng +' : 'giảm '}${pctChange.toFixed(0)}% ${pctChange >= 0 ? '📈' : '📉'})`;
    }
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", lineHeight: "1.6" }}>
        <div>
          {totalFixed >= totalDetected ? (
            <span>
              🟢 <strong>Năng suất toàn team</strong>: Đạt yêu cầu. Đã sửa xong <strong>{totalFixed} bug</strong>{teamGrowthText} trong khi chỉ phát sinh <strong>{totalDetected} bug</strong> mới (backlog giảm còn <strong>{backlog}</strong>).
            </span>
          ) : (
            <span>
              🔴 <strong>Năng suất toàn team</strong>: Chưa đạt yêu cầu. Lượng phát sinh mới (<strong>{totalDetected} bug</strong>) cao hơn lượng sửa xong (<strong>{totalFixed} bug</strong>){teamGrowthText}, backlog tăng lên <strong>{backlog} bug</strong>.
            </span>
          )}
        </div>
        
        {topDevs.length > 0 && (
          <div>
            🏆 <strong>Nhân sự xuất sắc</strong>: {topDevs.map((d: any, idx: number) => {
              const prevP = prevMetric?.byPerson.find((p: any) => p.personCode === d.personCode);
              const prevVal = prevP ? Number(prevP.bugsPerDay) : 0;
              const growth = prevVal > 0 ? ((Number(d.bugsPerDay) - prevVal) / prevVal) * 100 : 0;
              const growthText = prevVal > 0 
                ? ` (${growth >= 0 ? '+' : ''}${growth.toFixed(0)}% so với tuần trước: ${prevVal.toFixed(1)} ${growth >= 0 ? '📈' : '📉'})` 
                : "";
              return (
                <span key={d.personCode}>
                  {idx > 0 && ", "}<strong>{d.personCode}</strong> ({Number(d.bugsPerDay).toFixed(1)} bug/ngày){growthText}
                </span>
              );
            })}.
          </div>
        )}
        
        {slowDevs.length > 0 && (
          <div>
            ⚠️ <strong>Cần hỗ trợ</strong>: Các dev {slowDevs.map((d: any, idx: number) => {
              const prevP = prevMetric?.byPerson.find((p: any) => p.personCode === d.personCode);
              const prevVal = prevP ? Number(prevP.bugsPerDay) : 0;
              const growth = prevVal > 0 ? ((Number(d.bugsPerDay) - prevVal) / prevVal) * 100 : 0;
              const growthText = prevVal > 0 
                ? ` (Tuần trước: ${prevVal.toFixed(1)} ${growth >= 0 ? '📈' : '📉'})` 
                : "";
              return (
                <span key={d.personCode}>
                  {idx > 0 && ", "}<strong>{d.personCode}</strong> ({Number(d.bugsPerDay).toFixed(1)} bug/ngày){growthText}
                </span>
              );
            })} có năng suất sửa dưới 1.0 bug/ngày.
          </div>
        )}
        
        {reopenDevs.length > 0 && (
          <div>
            ❌ <strong>Rủi ro chất lượng</strong>: Lập trình viên {reopenDevs.map((d: any, idx: number) => (
              <span key={d.personCode}>
                {idx > 0 && ", "}<strong>{d.personCode}</strong>
              </span>
            ))} có bug bị Reopen nhiều lần.
          </div>
        )}
      </div>
    );
  };

  const handleAutoDraft = () => {
    if (!latest) return;
    
    let goodText = "";
    const totalFixed = latest.totalFixed;
    const totalDetected = latest.totalDetected;
    if (totalFixed >= totalDetected) {
      goodText += `Team kiểm soát tốt tiến độ: đã sửa ${totalFixed} bug trong khi chỉ phát sinh ${totalDetected} bug mới.\n`;
    }
    if (prevMetric) {
      const prevFixed = prevMetric.totalFixed;
      const pctChange = prevFixed > 0 ? ((totalFixed - prevFixed) / prevFixed) * 100 : 0;
      goodText += `Năng suất toàn team ${pctChange >= 0 ? 'tăng +' : 'giảm '}${pctChange.toFixed(0)}% so với tuần trước (sửa ${totalFixed} vs ${prevFixed} bug).\n`;
    }
    
    const devs = latest.byPerson;
    devs.forEach((p: any) => {
      const rate = Number(p.bugsPerDay);
      const prevP = prevMetric?.byPerson.find((x: any) => x.personCode === p.personCode);
      const prevVal = prevP ? Number(prevP.bugsPerDay) : 0;
      const growth = prevVal > 0 ? ((rate - prevVal) / prevVal) * 100 : 0;
      const growthText = prevVal > 0 
        ? `, ${growth >= 0 ? 'tăng +' : 'giảm '}${growth.toFixed(0)}% so với tuần trước (${prevVal.toFixed(1)} bug/ngày)` 
        : "";
      if (rate >= 2.0) {
        goodText += `- Dev ${p.personCode} có năng suất tốt: đạt ${rate.toFixed(1)} bug/ngày (${p.bugsFixed} bug)${growthText}.\n`;
      }
    });
    if (!goodText) goodText = "- Năng suất sửa bug của team ở mức trung bình ổn định.";
    
    let badText = "";
    devs.forEach((p: any) => {
      if (p.bugsReopened > 1) {
        badText += `- Dev ${p.personCode} có tỷ lệ lỗi bị mở lại (Reopen) cao: bị mở lại ${p.bugsReopened} lần.\n`;
      }
      const rate = Number(p.bugsPerDay);
      const prevP = prevMetric?.byPerson.find((x: any) => x.personCode === p.personCode);
      const prevVal = prevP ? Number(prevP.bugsPerDay) : 0;
      const growth = prevVal > 0 ? ((rate - prevVal) / prevVal) * 100 : 0;
      const growthText = prevVal > 0 
        ? `, tuần trước: ${prevVal.toFixed(1)} bug/ngày` 
        : "";
      if (rate < 1.0 && p.manDays > 2) {
        badText += `- Dev ${p.personCode} năng suất tuần này còn hạn chế: chỉ đạt ${rate.toFixed(1)} bug/ngày${growthText}.\n`;
      }
    });
    if (!badText) badText = "- Chưa ghi nhận vấn đề nghiêm trọng về năng lực cá nhân.";

    let risksText = "";
    const backlog = latest.backlogEnd;
    if (backlog > 30) {
      risksText += `- Lượng backlog tồn đọng toàn team lớn (${backlog} bug). Nguy cơ ảnh hưởng tiến độ phát hành sản phẩm.\n`;
    }
    
    const totalReopened = devs.reduce((sum: number, p: any) => sum + p.bugsReopened, 0);
    if (totalReopened > 2) {
      risksText += `- Số lượng bug bị Reopen của cả team khá nhiều (${totalReopened} lần). Cần chú ý chất lượng kiểm thử nội bộ.\n`;
    }
    
    risksText += "\nĐề xuất hành động:\n";
    risksText += "- Tăng cường rà soát chéo PR giữa các thành viên.\n";
    risksText += "- Yêu cầu team chạy lại testcase cục bộ trước khi chuyển trạng thái Resolved.";
    
    setGood(goodText.trim());
    setBad(badText.trim());
    setRisks(risksText.trim());
  };

  const handleSaveConclusion = async () => {
    if (!activePeriodKey) return;
    setSaving(true);
    try {
      await saveConclusion(activePeriodKey, good, bad, risks, manDaysOverrides);
      setIsEditing(false);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu kết luận");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: 12 }}>📊 Báo cáo Quản lý</h1>

      <div className="manager-dashboard-layout">
        {/* Left Column: KPIs, Conclusions & Insights */}
        <div className="dashboard-col">
          {/* KPI Grid */}
          <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <div className="kpi kpi-accent has-tooltip" style={{ padding: "12px" }} data-tooltip="Số bug thực tế dev phải xử lý (bằng Tổng gán trừ đi số bug Không tái hiện/Không có PR)">
              <div className="kpi-value" style={{ fontSize: "20px" }}>
                {actualReceived}
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500, marginLeft: 6 }}>
                  (Tổng: {totalBugs})
                </span>
              </div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Số thực nhận (trừ Không tái hiện)</div>
            </div>
            <div className="kpi kpi-green has-tooltip" style={{ padding: "12px" }} data-tooltip="Số bug đã hoàn thành, review xong và deploy thành công (Closed, Deployed) trong kỳ">
              <div className="kpi-value" style={{ fontSize: "22px" }}>{closedBugs}</div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Đã Close / Deploy</div>
            </div>
            <div className="kpi kpi-blue has-tooltip" style={{ padding: "12px" }} data-tooltip="Số bug đã sửa xong nhưng chưa được review hoặc merge (Resolved) trong kỳ">
              <div className="kpi-value" style={{ fontSize: "22px" }}>{resolvedBugs}</div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Resolved (Chưa review)</div>
            </div>
            <div className="kpi kpi-red has-tooltip" style={{ padding: "12px" }} data-tooltip="Số bug chưa hoàn thành sửa (Open, In Progress, v.v.)">
              <div className="kpi-value" style={{ fontSize: "22px" }}>{openBugs}</div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Còn Mở</div>
            </div>
            <div className="kpi kpi-yellow has-tooltip" style={{ padding: "12px" }} data-tooltip="Số bug bị mở lại (Reopened) sau khi đã báo sửa xong">
              <div className="kpi-value" style={{ fontSize: "22px" }}>{reopened}</div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Re-opened</div>
            </div>
            <div className="kpi kpi-cyan has-tooltip" style={{ padding: "12px" }} data-tooltip="Tỷ lệ bug đã được review xong và deploy thành công trên số Thực nhận:&#10;(Đã Close / Số thực nhận) * 100%">
              <div className="kpi-value" style={{ fontSize: "22px" }}>{closeRate}%</div>
              <div className="kpi-label" style={{ fontSize: "10px" }}>Tỷ lệ Close (Thực nhận)</div>
            </div>
          </div>

          {/* Manager Conclusion Card */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px" }}>
              <div className="card-title">📝 Kết luận của Quản lý</div>
              {activePeriodKey && (
                <button 
                  className="ctrl ctrl-primary" 
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                  onClick={() => setIsEditing(true)}
                >
                  {activeConclusion ? "✏️ Sửa kết luận" : "✍️ Viết kết luận"}
                </button>
              )}
            </div>
            {!activeConclusion ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ textAlign: "center", color: "var(--text-3)", padding: "4px", fontSize: "12px", fontStyle: "italic" }}>
                  Chưa ghi nhận kết luận chính thức. Dưới đây là phân tích tự động từ hệ thống:
                </div>
                <div style={{ background: "rgba(99,102,241,0.05)", borderLeft: "3px solid var(--accent)", padding: "10px 14px", borderRadius: "0 6px 6px 0" }}>
                  {getAutoSummary()}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeConclusion.good && (
                  <div style={{ background: "rgba(34,197,94,0.06)", borderLeft: "3px solid var(--green)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
                    <div style={{ color: "var(--green)", fontWeight: 700, fontSize: "12px", marginBottom: "2px" }}>🟢 Điểm tốt / Đạt yêu cầu:</div>
                    <div style={{ fontSize: "12px", whiteSpace: "pre-line" }}>{activeConclusion.good}</div>
                  </div>
                )}
                {activeConclusion.bad && (
                  <div style={{ background: "rgba(239,68,68,0.06)", borderLeft: "3px solid var(--red)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
                    <div style={{ color: "var(--red)", fontWeight: 700, fontSize: "12px", marginBottom: "2px" }}>🔴 Điểm xấu / Tồn tại:</div>
                    <div style={{ fontSize: "12px", whiteSpace: "pre-line" }}>{activeConclusion.bad}</div>
                  </div>
                )}
                {activeConclusion.risks && (
                  <div style={{ background: "rgba(234,179,8,0.06)", borderLeft: "3px solid var(--yellow)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
                    <div style={{ color: "var(--yellow)", fontWeight: 700, fontSize: "12px", marginBottom: "2px" }}>⚠️ Rủi ro & Hành động:</div>
                    <div style={{ fontSize: "12px", whiteSpace: "pre-line" }}>{activeConclusion.risks}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insights / Auto-detected Conclusions */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
              <div className="card-title">🔍 Phát hiện bất thường tự động</div>
            </div>
            {view.insights.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", padding: "20px", fontSize: "13px" }}>
                Chưa đủ dữ liệu phát hiện bất thường.
              </div>
            ) : (
              <div className="insights-scrollable">
                {view.insights.map(ins => (
                  <div key={ins.id} className={`insight insight-${ins.severity}`} style={{ padding: "10px 12px" }}>
                    <div className="insight-title" style={{ fontSize: "12px" }}>
                      {ins.severity === "good" ? "✅" : ins.severity === "warning" ? "⚠️" : ins.severity === "danger" ? "🔴" : "ℹ️"}{" "}
                      {ins.title}
                    </div>
                    <div className="insight-detail" style={{ fontSize: "11px", marginTop: "2px" }}>{ins.detail}</div>
                    {ins.suggestion && <div className="insight-suggestion" style={{ fontSize: "10px", marginTop: "4px" }}>💡 {ins.suggestion}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Table & Lifecycle */}
        <div className="dashboard-col">
          {/* Team productivity table for latest period */}
          {latest && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
                <div>
                  <div className="card-title" style={{ fontSize: "14px" }}>📈 Năng suất kỳ mới nhất: {latest.period.label}</div>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nhân sự</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã review xong và deploy thành công (Closed, Deployed) trong kỳ">Closed</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã sửa xong nhưng chưa được review hoặc merge (Resolved) trong kỳ">Resolved</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đóng trực tiếp không qua PR (Ví dụ: Không tái hiện, Trùng lặp, Không phải lỗi, v.v.) trong kỳ">Không tái hiện</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số PR/task nhân sự đã thực hiện review trong kỳ">Reviewed</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug bị mở lại (Reopened) sau khi dev đã báo sửa xong">Reopen</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Man-Days: Số ngày công làm việc thực tế ghi nhận trong kỳ">MD</th>
                      <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Năng suất sửa bug trung bình mỗi ngày công:&#10;Fixed / MD">Bug/Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.byPerson.map(p => {
                      const person = view.personnel.find(pp => pp.code === p.personCode);
                      const avgFixed = latest.byPerson.reduce((s, d) => s + d.bugsFixed, 0) / Math.max(latest.byPerson.length, 1);
                      const diff = avgFixed > 0 ? ((p.bugsFixed - avgFixed) / avgFixed) * 100 : 0;
                      
                      const pmBugs = p.bugsList ?? [];
                      const closedCount = pmBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase())).length;
                      const resolvedCount = pmBugs.filter(b => (b.status ?? "").toLowerCase() === "resolved").length;

                      return (
                        <tr key={p.personCode}>
                          <td>
                            <strong>{p.personCode}</strong>
                            <span style={{ color: "var(--text-3)", marginLeft: 4, fontSize: 10 }}>
                              {person?.role === "lead" ? "👑" : "💻"}
                            </span>
                          </td>
                          <td className="td-num">
                            <span style={{ color: closedCount > 0 ? "var(--green)" : "var(--text-3)" }}>{closedCount}</span>
                            {Math.abs(diff) > 30 && (
                              <span style={{ marginLeft: 3, fontSize: 9, color: diff > 0 ? "var(--green)" : "var(--red)" }}>
                                {diff > 0 ? `▲` : `▼`}
                              </span>
                            )}
                          </td>
                          <td className="td-num" style={{ color: resolvedCount > 0 ? "var(--blue)" : "var(--text-3)" }}>
                            {resolvedCount}
                          </td>
                          <td className="td-num" style={{ color: "var(--text-3)" }}>
                            {pmBugs.filter(isNoRepro).length}
                          </td>
                          <td className="td-num">{p.bugsReviewed}</td>
                          <td className="td-num" style={{ color: p.bugsReopened > 0 ? "var(--red)" : "var(--text-3)" }}>
                            {p.bugsReopened}
                          </td>
                          <td className="td-num">{p.manDays}</td>
                          <td className="td-num" style={{ color: "var(--accent-2)" }}>{p.bugsPerDay}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bug by status breakdown (visual bars) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "10px", paddingBottom: "8px" }}>
              <div className="card-title" style={{ fontSize: "14px" }}>📊 Phân bổ trạng thái Bug</div>
            </div>
            <div className="bar-chart">
              {view.lifecycle.map(lc => {
                const pct = totalBugs > 0 ? (lc.count / totalBugs) * 100 : 0;
                const color = lc.stage === "Closed" ? "green" : lc.stage === "Reopened" ? "red" : lc.stage === "Resolved" || lc.stage === "Deployed" ? "blue" : "accent";
                return (
                  <div className="bar-row" key={lc.stage}>
                    <div className="bar-label" style={{ fontSize: "11px", width: "70px" }}>{lc.stage}</div>
                    <div className="bar-track" style={{ height: "20px" }}>
                      <div className={`bar-fill bar-fill-${color}`} style={{ width: `${Math.max(pct, 2)}%`, fontSize: "10px", paddingRight: "4px" }}>
                        {lc.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Conclusion Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0 }}>✍️ Viết kết luận cho kỳ: {latest?.period.label}</h2>
              <button 
                type="button"
                className="ctrl ctrl-primary" 
                style={{ fontSize: "11px", padding: "6px 12px" }}
                onClick={handleAutoDraft}
              >
                🪄 Điền nháp tự động
              </button>
            </div>
            
            {/* Man-Days Overrides Fields */}
            <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(99,102,241,0.04)", borderRadius: "6px", border: "1px solid var(--border-2)" }}>
              <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "8px", color: "var(--accent-2)" }}>
                ⚙️ Điều chỉnh ngày công làm việc (Man-Days) trong kỳ:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {latest?.byPerson.map((p: any) => {
                  const currentVal = manDaysOverrides[p.personCode] !== undefined 
                    ? manDaysOverrides[p.personCode] 
                    : p.workingDays;
                  return (
                    <div key={p.personCode} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600" }}>{p.personCode}:</span>
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
                          padding: "4px", 
                          fontSize: "12px", 
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

            <label>🟢 Điểm tốt / Đạt yêu cầu (Cái gì tốt?):</label>
            <textarea 
              value={good} 
              onChange={e => setGood(e.target.value)} 
              placeholder="Ví dụ: Dev Hoàng hoàn thành xuất sắc task A, tỷ lệ sửa lỗi đạt yêu cầu cao..."
              style={{ minHeight: "80px", marginBottom: "12px" }}
            />

            <label>🔴 Điểm xấu / Tồn tại (Cái gì xấu?):</label>
            <textarea 
              value={bad} 
              onChange={e => setBad(e.target.value)} 
              placeholder="Ví dụ: Dev Hồ có tỷ lệ reopen cao (25%), cần kiểm tra kỹ trước khi mở PR..."
              style={{ minHeight: "80px", marginBottom: "12px" }}
            />

            <label>⚠️ Rủi ro & Đề xuất hành động (Rủi ro/Bất thường là gì?):</label>
            <textarea 
              value={risks} 
              onChange={e => setRisks(e.target.value)} 
              placeholder="Ví dụ: Sát ngày release lượng bug mới tăng đột biến, cần dồn nguồn lực hỗ trợ..."
              style={{ minHeight: "80px", marginBottom: "12px" }}
            />

            <div className="modal-actions">
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
                {saving ? "Đang lưu..." : "Lưu kết luận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
