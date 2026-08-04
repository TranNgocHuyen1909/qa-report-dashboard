import React, { useState } from "react";

export function BugWorkflowView({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string, repo?: string) => void;
}) {
  const [activeStepTab, setActiveStepTab] = useState<number>(0); // 0 = ALL, 1 = Checkpoint 1, 2 = Checkpoint 2, 3 = Checkpoint 3

  const checkpoints = [
    {
      num: 1,
      badge: "Notion Status: New ➔ In Progress ➔ Resolved",
      shortTitle: "Checkpoint 1: Dev Fix & PR",
      title: "Checkpoint 1: Dev Tiếp Nhận, Sửa Code & Tạo PR GitHub",
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.06)",
      desc: "Nhiệm vụ Checkpoint 1: Dev chọn task theo Priority, trace root cause, sửa code sạch và dán link PR lên Notion.",
      tasks: [
        {
          label: "Nhận Task & Test Tái Hiện (10 lần)",
          text: "Chọn task theo Priority (Critical ➔ Low), chuyển Status sang In Progress, điền Ngày Estimate và test tái hiện 10 lần (10/10 PASS ➔ chuyển Cancel, 1/10 FAIL ➔ Xác nhận Bug thực sự).",
        },
        {
          label: "Phân Tích Root Cause & Giải Trình Lead",
          text: "Trace đúng 6 tầng root cause (tool-100, prompt, docs, etc.), BẮT BUỘC nhắn tin báo cáo phương án sửa với Team Lead trước khi gõ code.",
        },
        {
          label: "Sửa Code Sạch & Self-test Repo Checklist",
          text: "Sửa code sạch, rà soát ngang các pattern tương tự và bắt buộc tự chạy Repo Checklist kiểm tra trước khi push.",
        },
        {
          label: "Tạo PR GitHub & Dán Link Card Notion",
          text: "Tạo PR trên GitHub với tiêu đề chuẩn, đính kèm ảnh minh họa evidence, điền Số giờ fix và đổi Status sang Resolved (Chờ Review).",
        },
      ],
      notionFields: [
        "Status ➔ In Progress ➔ Resolved",
        "Fixed by (Tên Dev)",
        "📅 Ngày bắt đầu / Dự định xong",
        "Pull Request (Link PR)",
        "Số giờ fix (Number)",
      ],
    },
    {
      num: 2,
      badge: "Notion Status: Resolved ➔ Reviewed ➔ Deployed",
      shortTitle: "Checkpoint 2: QA & Tech Review",
      title: "Checkpoint 2: QC Lead Test Nghiệm Thu & Tech Lead Duyệt PR",
      color: "#7c3aed",
      bgColor: "rgba(124, 58, 237, 0.06)",
      desc: "Nhiệm vụ Checkpoint 2: Review 2 vòng nghiêm ngặt để bảo đảm chất lượng mã nguồn trước khi deploy server.",
      tasks: [
        {
          label: "Vòng 1 — QC Lead (Huyền)",
          text: "BẮT BUỘC QUA VÒNG 1 TRƯỚC. Huyền test nghiệm thu thực tế & review PR, gán Reviewers = Huyền, điền 📅 Ngày bắt đầu review, 📅 Ngày kết thúc review và Số giờ review. Test Pass ➔ đổi Status sang Reviewed và nhãn wait for development. Có lỗi ➔ comment chỉ rõ và đổi Status sang InReview.",
        },
        {
          label: "Vòng 2 — Tech Lead (Anh Trường)",
          text: "Anh Trường review logic các PR đã qua Vòng 1 (trạng thái Reviewed / wait for development) trong 1h đầu buổi chiều. Review OK ➔ Merge PR & Deploy server (Status ➔ Deployed).",
        },
      ],
      notionFields: [
        "Reviewers (Gán Huyền)",
        "📅 Ngày bắt đầu review",
        "📅 Ngày kết thúc review",
        "Số giờ review (Number)",
        "Status ➔ InReview (có comment) / Reviewed (pass vòng 1)",
        "Status ➔ Deployed (sau khi Merge PR & Deploy)",
        "Label ➔ wait for development ➔ change requested / ready for review",
      ],
    },
    {
      num: 3,
      badge: "Notion Status: Deployed ➔ Closed / Reopened",
      shortTitle: "Checkpoint 3: OP Nghiệm Thu",
      title: "Checkpoint 3: OP Test Nghiệm Thu & Đóng Thẻ Card",
      color: "#059669",
      bgColor: "rgba(5, 150, 105, 0.06)",
      desc: "Nhiệm vụ Checkpoint 3: OP Thương & Linh test thực tế sau khi deploy và chốt trạng thái Closed hoặc Reopened.",
      tasks: [
        {
          label: "Test Pass ➔ Chuyển Status Closed",
          text: "OP Thương & Linh test thực tế trên server Deployed OK ➔ Đổi Status sang Closed và BẮT BUỘC cập nhật 📅 Ngày xác nhận (Confirmed Date).",
        },
        {
          label: "Test Fail ➔ Chuyển Status Reopened",
          text: "Nếu tái phát lỗi ➔ Đổi Status sang Reopened, điền 📅 Ngày mở lại (Reopen Date) và chỉa luồng quay ngược về Checkpoint 1 để Dev trace lại Root Cause.",
        },
      ],
      notionFields: [
        "Status ➔ Closed (nếu Pass) / Reopened (nếu Fail)",
        "📅 Ngày xác nhận (Confirmed Date)",
        "📅 Ngày mở lại (Reopen Date)",
      ],
    },
  ];

  const filteredCheckpoints = activeStepTab === 0 ? checkpoints : checkpoints.filter((s) => s.num === activeStepTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Checkpoint Header Banner */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 className="section-title" style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
              📍 Bản Đồ Quy Trình Checkpoint Sửa Bug &amp; Nghiệm Thu
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
              Luồng 3 mốc Checkpoint chuẩn hóa: <code>Checkpoint 1: Dev Fix &amp; PR</code> ➔ <code>Checkpoint 2: Review</code> ➔ <code>Checkpoint 3: OP Nghiệm Thu</code>.
            </p>
          </div>

          {/* Checkpoint Filter Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`ctrl ${activeStepTab === 0 ? "ctrl-primary" : ""}`}
              onClick={() => setActiveStepTab(0)}
              style={{ fontSize: "12px", padding: "6px 12px", fontWeight: "bold" }}
            >
              Tất cả Checkpoints
            </button>
            {checkpoints.map((s) => (
              <button
                key={s.num}
                type="button"
                className={`ctrl ${activeStepTab === s.num ? "ctrl-primary" : ""}`}
                onClick={() => setActiveStepTab(s.num)}
                style={{ fontSize: "12px", padding: "6px 12px", fontWeight: "bold" }}
              >
                CP {s.num}
              </button>
            ))}
          </div>
        </div>

        {/* Checkpoint Timeline Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-3)" }}>
          {checkpoints.map((cp) => {
            const isActive = activeStepTab === 0 || activeStepTab === cp.num;
            return (
              <div
                key={cp.num}
                onClick={() => setActiveStepTab(cp.num)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: isActive ? cp.bgColor : "transparent",
                  border: `2px solid ${isActive ? cp.color : "var(--border-3)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.15s ease",
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: cp.color,
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                >
                  {cp.num}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-1)" }}>
                    {cp.shortTitle}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                    {cp.badge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkpoint Detail Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {filteredCheckpoints.map((cp) => (
          <div
            key={cp.num}
            id={`step-${cp.num}`}
            className="card"
            style={{
              padding: "22px 24px",
              borderLeft: `5px solid ${cp.color}`,
            }}
          >
            {/* Checkpoint Card Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: cp.color,
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: "900",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                >
                  {cp.num}
                </span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-1)" }}>
                  {cp.title}
                </h3>
              </div>
              <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: cp.bgColor, color: cp.color, border: `1px solid ${cp.color}`, fontWeight: "bold" }}>
                {cp.badge}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              {cp.desc}
            </p>

            {/* Checkpoint Tasks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {cp.tasks.map((task, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-3)",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  <span style={{ color: cp.color, fontWeight: "bold", fontSize: "14px", marginTop: "1px" }}>✓</span>
                  <div>
                    <strong style={{ color: "var(--text-1)", marginRight: "6px", fontSize: "12px" }}>{task.label}:</strong>
                    <span style={{ color: "var(--text-2)" }}>{task.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notion Fields Tag Bar */}
            <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-3)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-1)" }}>Trường Notion Checkpoint:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {cp.notionFields.map((field) => (
                  <span
                    key={field}
                    style={{
                      background: "var(--surface-3)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "var(--text-1)",
                      fontWeight: "600",
                      border: "1px solid var(--border-3)",
                    }}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Repo Checklist Links */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px" }}>
          📦 Quick Checklist Tự Kiểm Tra Theo Repository (Bắt buộc chạy trước khi PR):
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
          {[
            { id: "tool-100", name: "tool-100", detail: "Audit Sheet & FalsePositiveGuard" },
            { id: "lisa-ai-agent", name: "lisa-ai-agent", detail: "code:check-strict & eval:metadata" },
            { id: "lisa-visa-web-backend", name: "lisa-visa-web-backend", detail: "pytest, ruff check & ruff format" },
            { id: "lisa-visa-web", name: "lisa-visa-web", detail: "pnpm test, lint:fix & type-check" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="ctrl"
              onClick={() => onNavigateTab?.("checklist", item.id)}
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "8px 14px",
                borderRadius: "6px",
                background: "var(--surface-2)",
                border: "1px solid var(--border-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "var(--text-1)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <span style={{ color: "#2563eb", fontWeight: "bold" }}>📦 {item.name}</span>
                <span style={{ color: "var(--text-2)", fontSize: "10px", fontWeight: "normal" }}>{item.detail}</span>
              </div>
              <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>➔</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
