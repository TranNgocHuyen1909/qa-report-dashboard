import React, { useState } from "react";

export function BugWorkflowView({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string, repo?: string) => void;
}) {
  const [activeStepTab, setActiveStepTab] = useState<number>(0); // 0 = ALL, 1 = Step 1, 2 = Step 2, 3 = Step 3

  const steps = [
    {
      num: 1,
      badge: "Notion: New ➔ In Progress ➔ Resolved",
      shortTitle: "Dev Fix & PR",
      title: "Dev Tiếp Nhận, Sửa Code & Tạo PR GitHub",
      color: "#2563eb",
      desc: "Tiếp nhận task theo priority, trace root cause, sửa code sạch và dán link PR lên Notion.",
      actions: [
        {
          label: "Nhận task & Test tái hiện",
          text: "Chọn task theo Priority (Critical ➔ Low), đổi Status sang In Progress, điền ngày Estimate và test tái hiện 10 lần (10/10 PASS ➔ Cancel, 1/10 FAIL ➔ Confirm Bug).",
        },
        {
          label: "Phân tích Root Cause & Báo cáo Lead",
          text: "Trace 6 tầng root cause (tool-100, prompt, docs, etc.), bắt buộc báo cáo giải trình phương án sửa với Team Lead trước khi gõ code.",
        },
        {
          label: "Sửa Code & Self-test",
          text: "Sửa code sạch, rà soát ngang các pattern tương tự trong codebase và chạy Repo Checklist tự kiểm tra trước khi push.",
        },
        {
          label: "Tạo PR GitHub & Dán Link Notion",
          text: "Tạo PR trên GitHub với tiêu đề chuẩn, đính kèm ảnh minh họa/screenshot evidence, điền số giờ fix và đổi Status sang Resolved (Chờ Review).",
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
      badge: "Notion: Resolved ➔ Reviewed ➔ Deployed",
      shortTitle: "QA & Tech Review",
      title: "Kiểm Soát Chất Lượng & Duyệt Code (QC Lead & Tech Lead)",
      color: "#7c3aed",
      desc: "Quy trình review 2 vòng chặt chẽ giúp bảo đảm chất lượng mã nguồn trước khi deploy.",
      actions: [
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
      badge: "Notion: Deployed ➔ Closed / Reopened",
      shortTitle: "OP Nghiệm Thu",
      title: "Nghiệm Thu Thực Tế & Đóng Thẻ (OP Thương & Linh)",
      color: "#059669",
      desc: "Kiểm tra thực tế sau khi deploy server và chốt trạng thái đóng hoặc mở lại task.",
      actions: [
        {
          label: "Test Pass ➔ Closed",
          text: "OP Thương & Linh test thực tế trên server Deployed OK ➔ Đổi Status sang Closed và BẮT BUỘC cập nhật 📅 Ngày xác nhận (Confirmed Date).",
        },
        {
          label: "Test Fail ➔ Reopened",
          text: "Nếu tái phát lỗi ➔ Đổi Status sang Reopened, điền 📅 Ngày mở lại (Reopen Date) và chỉa luồng quay lại Bước 1 để Dev trace lại Root Cause.",
        },
      ],
      notionFields: [
        "Status ➔ Closed (nếu Pass) / Reopened (nếu Fail)",
        "📅 Ngày xác nhận (Confirmed Date)",
        "📅 Ngày mở lại (Reopen Date)",
      ],
    },
  ];

  const filteredSteps = activeStepTab === 0 ? steps : steps.filter((s) => s.num === activeStepTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header Banner & Stepper */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 className="section-title" style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
              📘 Quy Trình Xử Lý Bug End-to-End
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
              Mô hình Black Box &amp; Luồng 3 giai đoạn tinh gọn: <code>Dev Fix &amp; PR</code> ➔ <code>QA &amp; Tech Review</code> ➔ <code>OP Nghiệm Thu</code>.
            </p>
          </div>

          {/* Step Filter Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`ctrl ${activeStepTab === 0 ? "ctrl-primary" : ""}`}
              onClick={() => setActiveStepTab(0)}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Tất cả 3 bước
            </button>
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                className={`ctrl ${activeStepTab === s.num ? "ctrl-primary" : ""}`}
                onClick={() => setActiveStepTab(s.num)}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Bước {s.num}
              </button>
            ))}
          </div>
        </div>

        {/* Streamlined Stepper Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-3)" }}>
          {steps.map((st) => {
            const isActive = activeStepTab === 0 || activeStepTab === st.num;
            return (
              <div
                key={st.num}
                onClick={() => setActiveStepTab(st.num)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: isActive ? "var(--surface-2)" : "transparent",
                  border: `1px solid ${isActive ? st.color : "var(--border-3)"}`,
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
                    background: st.color,
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                >
                  {st.num}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-1)" }}>
                    {st.shortTitle}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                    {st.badge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical Timeline Step Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {filteredSteps.map((st) => (
          <div
            key={st.num}
            id={`step-${st.num}`}
            className="card"
            style={{
              padding: "22px 24px",
              borderLeft: `4px solid ${st.color}`,
            }}
          >
            {/* Step Card Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: st.color,
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "900",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                    flexShrink: 0,
                  }}
                >
                  {st.num}
                </span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-1)" }}>
                  {st.title}
                </h3>
              </div>
              <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: "var(--surface-3)", color: "var(--text-1)", fontWeight: "600" }}>
                {st.badge}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              {st.desc}
            </p>

            {/* List of Action Items (Clean Vertical List, NO Grid Boxes) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {st.actions.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--surface-2)",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  <span style={{ color: st.color, fontWeight: "bold", marginTop: "2px" }}>✓</span>
                  <div>
                    <strong style={{ color: "var(--text-1)", marginRight: "6px" }}>{act.label}:</strong>
                    <span style={{ color: "var(--text-2)" }}>{act.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notion Fields Tag Bar */}
            <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-3)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-3)" }}>Trường Notion:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {st.notionFields.map((field) => (
                  <span
                    key={field}
                    style={{
                      background: "var(--surface-3)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "var(--text-2)",
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

      {/* Repo Checklist Footer Access */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "10px" }}>
          📦 Quick Checklist Tự Kiểm Tra Theo Repository (Bắt buộc chạy trước khi PR):
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                fontSize: "11px",
                fontWeight: "600",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "var(--surface-2)",
                border: "1px solid var(--border-3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ color: "var(--accent)" }}>📦 {item.name}</span>
              <span style={{ color: "var(--text-3)", fontSize: "10px" }}>({item.detail})</span>
              <span>➔</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
