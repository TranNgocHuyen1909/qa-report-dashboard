import React from "react";

export function BugWorkflowView({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string, repo?: string) => void;
}) {
  const steps = [
    {
      num: 1,
      badge: "Notion: New ➔ In Progress ➔ Resolved",
      shortTitle: "1. Dev Fix & PR",
      title: "1. Dev Tiếp Nhận, Sửa Code & Tạo PR GitHub",
      color: "var(--accent)",
      desc: "Tiếp nhận task theo priority, trace root cause, sửa code sạch và dán link PR lên Notion.",
      actions: [
        {
          label: "Nhận task & Tái hiện",
          text: "Chọn task theo Priority (Critical ➔ Low), đổi Status sang In Progress, điền ngày Estimate và test tái hiện 10 lần.",
        },
        {
          label: "Phân tích & Báo cáo",
          text: "Trace 6 tầng root cause (tool-100, prompt, docs, etc.), báo cáo giải trình phương án sửa với Team Lead trước khi gõ code.",
        },
        {
          label: "Fix code & Self-test",
          text: "Sửa code sạch, rà soát ngang các pattern tương tự và chạy checklist tự kiểm tra repo trước khi push.",
        },
        {
          label: "Tạo PR & Dán Link",
          text: "Tạo PR trên GitHub với tiêu đề chuẩn, đính kèm ảnh minh họa, điền số giờ fix và đổi Status sang Resolved (Chờ Review).",
        },
      ],
      notionFields: [
        "Status ➔ In Progress ➔ Resolved",
        "Fixed by (Tên Dev)",
        "📅 Ngày bắt đầu / Dự định xong",
        "Pull Request (Link PR)",
        "Số giờ fix",
      ],
    },
    {
      num: 2,
      badge: "Notion: Resolved ➔ Reviewed ➔ Deployed",
      shortTitle: "2. QA & Tech Review",
      title: "2. Kiểm Soát Chất Lượng & Duyệt Code (QC Lead & Tech Lead)",
      color: "var(--blue)",
      desc: "Quy trình review 2 vòng chặt chẽ giúp bảo đảm chất lượng mã nguồn trước khi deploy.",
      actions: [
        {
          label: "Vòng 1 — QC Lead (Huyền)",
          text: "BẮT BUỘC QUA VÒNG 1 TRƯỚC. Huyền test nghiệm thu thực tế & review PR. Test Pass ➔ đổi Status sang Reviewed và nhãn wait for development. Có lỗi ➔ comment chỉ rõ và đổi Status sang InReview.",
        },
        {
          label: "Vòng 2 — Tech Lead (Anh Trường)",
          text: "Anh Trường review logic các PR đã qua Vòng 1 (trạng thái Reviewed / wait for development) trong 1h đầu buổi chiều. Review OK ➔ Merge PR & Deploy server (Status ➔ Deployed).",
        },
      ],
      notionFields: [
        "Status ➔ InReview (có comment) / Reviewed (pass vòng 1)",
        "Status ➔ Deployed (sau khi Merge PR & Deploy)",
        "Label ➔ wait for development ➔ change requested / ready for review",
      ],
    },
    {
      num: 3,
      badge: "Notion: Deployed ➔ Closed / Reopened",
      shortTitle: "3. OP Nghiệm Thu",
      title: "3. Nghiệm Thu Thực Tế & Đóng Thẻ (OP Thương & Linh)",
      color: "var(--green)",
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

  const scrollToStep = (stepNum: number) => {
    const el = document.getElementById(`step-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ margin: "0 0 4px 0" }}>
          📘 Quy Trình Xử Lý Bug End-to-End (3 Bước Tinh Gọn)
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          Luồng xử lý chuẩn hóa 3 giai đoạn: <code>Dev Fix &amp; PR</code> ➔ <code>QA &amp; Tech Review</code> ➔ <code>OP Nghiệm Thu</code>.
        </p>
      </div>

      {/* Black Box Banner */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "10px" }}>
          ⚡ Mô Hình &quot;Black Box&quot; Sửa Bug Gọn Nhẹ
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--accent)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>1. Đầu vào (Input):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Log defect chi tiết trên Notion (Priority, Deadline, Repro steps).
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--blue)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>2. Quy trình xử lý:</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Dev đề xuất phương án với Lead ➔ Self-test ➔ Review 2 vòng (QC &amp; Tech Lead).
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--green)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>3. Đầu ra (Output):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              PR Merge, Deploy server &amp; OP nghiệm thu Closed thành công.
            </div>
          </div>
        </div>
      </div>

      {/* Overview Pipeline Steps Bar */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px" }}>
          Tổng Quan 3 Bước Tinh Gọn (Bấm để xem chi tiết)
        </div>

        {/* Visual Steps Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {steps.map((st) => (
            <div
              key={st.num}
              onClick={() => scrollToStep(st.num)}
              style={{
                background: "var(--surface-2)",
                padding: "12px 14px",
                borderRadius: "6px",
                border: "1px solid var(--border-2)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
              className="ctrl"
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: st.color,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {st.num}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-1)" }}>
                  {st.shortTitle}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                  {st.badge}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repo Checklist Quick Access */}
      <div className="card" style={{ padding: "14px 18px", background: "var(--surface-2)" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "8px" }}>
          📦 Quick Checklist Tự Kiểm Tra Theo Repository (Dev Bắt Buộc Chạy Trước Khi PR):
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
          {[
            { id: "tool-100", name: "tool-100", detail: "Audit Sheet & FalsePositiveGuard" },
            { id: "lisa-ai-agent", name: "lisa-ai-agent", detail: "code:check-strict & eval:metadata" },
            { id: "lisa-visa-web-backend", name: "lisa-visa-web-backend", detail: "pytest, ruff check & ruff format" },
            { id: "lisa-visa-web", name: "lisa-visa-web", detail: "pnpm test, lint:fix & type-check" },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigateTab?.("checklist", item.id)}
              style={{
                background: "var(--surface-3)",
                padding: "8px 10px",
                borderRadius: "4px",
                border: "1px solid var(--border-2)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--accent)" }}>
                📦 {item.name} ➔
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-3)", marginTop: "2px" }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Step Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {steps.map((st) => (
          <div key={st.num} id={`step-${st.num}`} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-3)" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-1)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: st.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                  {st.num}
                </span>
                {st.title}
              </div>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "var(--surface-3)", color: "var(--text-1)", fontWeight: "600" }}>
                {st.badge}
              </span>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "14px" }}>
              {st.desc}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {st.actions.map((act, idx) => (
                <div key={idx} style={{ background: "var(--surface-2)", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-1)", marginBottom: "4px" }}>
                    • {act.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
                    {act.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-3)", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-3)" }}>
              <strong style={{ color: "var(--text-1)" }}>Trường Notion liên quan:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {st.notionFields.map((field) => (
                  <span key={field} style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: "3px", color: "var(--text-2)", border: "1px solid var(--border-2)" }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
