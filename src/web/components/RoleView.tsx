import React from "react";

export function RoleView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.025em", color: "var(--text-1)" }}>
          Phân Rã Vai Trò & Quy Định Tuân Thủ (Roles & Compliance)
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-2)", fontWeight: "500", margin: 0 }}>
          Quy định nghĩa vụ tuân thủ cho từng vai trò theo chỉ đạo tại <strong style={{ color: "var(--text-1)", fontWeight: "700" }}>Biên bản họp PM/QC</strong> (Tập trung Quality Control & Trách nhiệm Lead).
        </p>
      </div>

      {/* 2-Column Role Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        {/* TEAM LEAD ROLE CARD */}
        <div 
          className="card" 
          style={{ 
            padding: "20px", 
            borderTop: "4px solid #2563eb", 
            background: "var(--surface)",
            borderRadius: "6px",
            boxShadow: "var(--shadow)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#2563eb" }}>
              Team Lead (TL)
            </div>
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(37,99,235,0.12)", color: "#2563eb", fontWeight: "bold" }}>
              Quản lý &amp; Quality Control
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-1)", fontStyle: "italic", marginBottom: "14px", padding: "10px 12px", background: "var(--surface-2)", borderLeft: "3px solid #2563eb", borderRadius: "0 4px 4px 0", lineHeight: "1.4" }}>
            &quot;Đảm bảo team hoạt động hiệu quả, các bug được xử lý đúng hướng và đạt mục tiêu chung của team.&quot;
          </div>

          {/* Effort Badge */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", fontSize: "11px" }}>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--text-1)", fontWeight: "600" }}>⏱ 5% Quản lý</span>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--cyan)", fontWeight: "600" }}>⏱ 20% Review &amp; QC</span>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--green)", fontWeight: "600" }}>⏱ 75% Fix bug khó</span>
          </div>

          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "8px" }}>
            Các mục bắt buộc TL phải tuân thủ:
          </div>

          <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
            <li>
              <strong>Plan &amp; Priorities:</strong> Xác định mục tiêu tuần, kế hoạch bug &amp; độ ưu tiên theo deadline.
            </li>
            <li>
              <strong>Organize Owner:</strong> Điều phối công việc, đảm bảo mỗi bug đều có owner rõ ràng.
            </li>
            <li>
              <strong>Quality Control (Bắt buộc):</strong> Yêu cầu dev báo cáo hướng fix trước khi sửa; kiểm soát chất lượng, không đâm đầu chạy tiến độ ẩu.
            </li>
            <li>
              <strong>Lead &amp; Unblock:</strong> Review hướng phân tích, tháo gỡ vướng mắc &amp; duy trì họp Agile sáng/cuối tuần.
            </li>
            <li>
              <strong>Report Abnormal:</strong> Theo dõi tiến độ qua số liệu thực tế, phát hiện điểm bất thường để điều phối tài nguyên.
            </li>
            <li>
              <strong>Knowledge Sharing:</strong> Đảm bảo sau khi fix bug có cập nhật checklist bài học (L1-L9) để phòng lỗi lặp.
            </li>
          </ul>
        </div>

        {/* DEVELOPER ROLE CARD */}
        <div 
          className="card" 
          style={{ 
            padding: "20px", 
            borderTop: "4px solid var(--cyan)", 
            background: "var(--surface)",
            borderRadius: "6px",
            boxShadow: "var(--shadow)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--cyan)" }}>
              Developer (Lập trình viên)
            </div>
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(6,182,212,0.12)", color: "var(--cyan)", fontWeight: "bold" }}>
              Thực thi &amp; Self-test QC
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-1)", fontStyle: "italic", marginBottom: "14px", padding: "10px 12px", background: "var(--surface-2)", borderLeft: "3px solid var(--cyan)", borderRadius: "0 4px 4px 0", lineHeight: "1.4" }}>
            &quot;Phân tích, xử lý bug được giao và đóng góp vào việc nâng cao khả năng xử lý chung của team.&quot;
          </div>

          {/* Effort Badge */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", fontSize: "11px" }}>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--yellow)", fontWeight: "600" }}>⏱ 20% Root Cause</span>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--green)", fontWeight: "600" }}>⏱ 60% Code &amp; Test</span>
            <span style={{ background: "var(--surface-3)", padding: "4px 8px", borderRadius: "4px", color: "var(--blue)", fontWeight: "600" }}>⏱ 20% Document</span>
          </div>

          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "8px" }}>
            Các mục bắt buộc Dev phải tuân thủ:
          </div>

          <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
            <li>
              <strong>Analyze Root Cause:</strong> Tiếp nhận bug &amp; trace đúng tầng (Tool-100 ➔ Prompt) trước khi đưa ra hướng fix.
            </li>
            <li>
              <strong>Fix Clean:</strong> Thực hiện fix bug chính xác, không làm vỡ các chức năng liên quan.
            </li>
            <li>
              <strong>Quality Control (Self-test):</strong> Bắt buộc tự kiểm tra đủ 6 mục Pre-handover checklist trước khi mở PR.
            </li>
            <li>
              <strong>Document &amp; Evidence:</strong> Viết mô tả ngắn nguyên nhân/cách xử lý kèm ảnh minh họa/output log thực tế.
            </li>
            <li>
              <strong>Report Blocker:</strong> Chủ động cập nhật tiến độ &amp; báo cáo ngay cho TL khi dính task vướng 1-2 ngày.
            </li>
            <li>
              <strong>Peer Review:</strong> Phối hợp review chéo code &amp; hỗ trợ các thành viên khác khi gặp vấn đề.
            </li>
          </ul>
        </div>
      </div>

      {/* 4 Pillars Card */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px" }}>
          4 Trụ Cột Tư Duy Quản Lý (Plan - Control - Organize - Lead)
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--blue)", marginBottom: "4px" }}>1. PLAN</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>Xác định target tuần, ưu tiên theo deadline &amp; gán owner cho mọi bug.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--cyan)", marginBottom: "4px" }}>2. CONTROL (QC)</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>Review hướng fix trước khi sửa; kiểm soát chất lượng, không chỉ chạy tiến độ.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--yellow)", marginBottom: "4px" }}>3. ORGANIZE</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>Chuẩn hóa Input (Notion defect) ➔ Output (PR + Env) ➔ Checklist 6 bước.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--green)", marginBottom: "4px" }}>4. LEAD</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>Dẫn dắt dev tự giải quyết vấn đề &amp; họp Agile sáng để unblock kịp thời.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
