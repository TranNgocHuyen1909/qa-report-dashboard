export function RoleView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ margin: "0 0 4px 0" }}>👥 Phân Rã Vai Trò &amp; Quy Định Tuân Thủ (Roles &amp; Compliance)</h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          Quy định nghĩa vụ tuân thủ cho từng vai trò theo chỉ đạo tại <strong>Biên bản họp PM/QC</strong> (Tập trung Quality Control &amp; Trách nhiệm Lead).
        </p>
      </div>

      {/* 2-Column Concise Role Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        {/* TEAM LEAD ROLE CARD */}
        <div 
          className="card" 
          style={{ 
            padding: "20px", 
            borderTop: "4px solid #a855f7", 
            background: "var(--card-bg)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#c084fc", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👑</span> Team Lead (TL)
            </div>
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "10px", background: "rgba(168,85,247,0.15)", color: "#c084fc", fontWeight: "bold" }}>
              Quản lý &amp; Quality Control
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-1)", fontStyle: "italic", marginBottom: "14px", padding: "8px 12px", background: "rgba(168,85,247,0.06)", borderLeft: "3px solid #a855f7", borderRadius: "0 6px 6px 0", lineHeight: "1.4" }}>
            &quot;Đảm bảo team hoạt động hiệu quả, các bug được xử lý đúng hướng và đạt mục tiêu chung của team.&quot;
          </div>

          {/* Effort Badge */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", fontSize: "11px" }}>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "#c084fc", fontWeight: "bold" }}>⏱ 5% Quản lý</span>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "var(--cyan)", fontWeight: "bold" }}>⏱ 20% Review &amp; QC</span>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "var(--green)", fontWeight: "bold" }}>⏱ 75% Fix bug khó</span>
          </div>

          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "8px" }}>
            ⚠️ Các mục bắt buộc TL phải tuân thủ:
          </div>

          <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
            <li>
              <strong>Plan &amp; Priorities:</strong> Xác định mục tiêu tuần, kế hoạch bug &amp; độ ưu tiên theo deadline.
            </li>
            <li>
              <strong>Organize Owner:</strong> Điều phối công việc, đảm bảo mỗi bug đều có owner rõ ràng.
            </li>
            <li>
              <strong>Quality Control (Bắt buộc):</strong> Yêu cầu dev báo cáo hướng fix trước khi sửa; kiểm soát chất lượng, không đâm đầu chạy tiến độ.
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
            background: "var(--card-bg)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💻</span> Developer (Lập trình viên)
            </div>
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "10px", background: "rgba(6,182,212,0.15)", color: "var(--cyan)", fontWeight: "bold" }}>
              Thực thi &amp; Self-test QC
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-1)", fontStyle: "italic", marginBottom: "14px", padding: "8px 12px", background: "rgba(6,182,212,0.06)", borderLeft: "3px solid var(--cyan)", borderRadius: "0 6px 6px 0", lineHeight: "1.4" }}>
            &quot;Phân tích, xử lý bug được giao và đóng góp vào việc nâng cao khả năng xử lý chung của team.&quot;
          </div>

          {/* Effort Badge */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", fontSize: "11px" }}>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "var(--yellow)", fontWeight: "bold" }}>⏱ 20% Root Cause</span>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "var(--green)", fontWeight: "bold" }}>⏱ 60% Code &amp; Test</span>
            <span style={{ background: "var(--surface-3)", padding: "3px 8px", borderRadius: "4px", color: "var(--blue)", fontWeight: "bold" }}>⏱ 20% Document</span>
          </div>

          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "8px" }}>
            ⚠️ Các mục bắt buộc Dev phải tuân thủ:
          </div>

          <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
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

      {/* 4 Pillars Concise Card */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent-2)", marginBottom: "10px" }}>
          🏛 4 Trụ Cột Tư Duy Quản Lý (Plan - Control - Organize - Lead)
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#c084fc", marginBottom: "2px" }}>1. PLAN</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Xác định target tuần, ưu tiên theo deadline &amp; gán owner cho mọi bug.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--cyan)", marginBottom: "2px" }}>2. CONTROL (QC)</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Review hướng fix trước khi sửa; kiểm soát chất lượng, không chỉ chạy tiến độ.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--yellow)", marginBottom: "2px" }}>3. ORGANIZE</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Chuẩn hóa Input (Notion defect) ➔ Output (PR + Env) ➔ Checklist 6 bước.</div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--green)", marginBottom: "2px" }}>4. LEAD</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)" }}>Dẫn dắt dev tự giải quyết vấn đề &amp; họp Agile sáng để unblock kịp thời.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
