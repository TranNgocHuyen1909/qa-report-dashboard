export function ProcessView({ view }: { view?: any }) {
  return (
    <div className="process-view animate-fade-in" style={{ paddingBottom: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ marginBottom: "4px" }}>📘 Quy Trình Xử Lý Bug &amp; Hướng Dẫn PM/QC (End-to-End Workflow)</h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          Quy chuẩn các bước thực thi từ khi nhận defect trên Notion ➔ đổi Status ➔ phân tích Root Cause ➔ tạo PR ➔ Review &amp; Close Bug.
        </p>
      </div>

      {/* FULL END-TO-END WORKFLOW PIPELINE CARD */}
      <div 
        className="card" 
        style={{ 
          padding: "24px", 
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--accent-2)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔄</span> Sơ Đồ Quy Trình Xử Lý Bug Chuẩn 6 Bước (Notion ➔ PR ➔ Close Bug)
        </div>

        {/* Horizontal Step Pipeline Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", marginBottom: "20px" }}>
          
          {/* STEP 1 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--blue)", color: "#fff", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <span style={{ fontSize: "10px", color: "var(--cyan)", fontWeight: "bold", background: "rgba(6,182,212,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Notion</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Nhận Task &amp; Đổi Status</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Nhận assign defect. Đổi status Notion sang <strong style={{ color: "var(--yellow)" }}>Doing</strong>. Hủy ngay nếu trùng/không rảnh.
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#a855f7", color: "#fff", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
              <span style={{ fontSize: "10px", color: "#c084fc", fontWeight: "bold", background: "rgba(168,85,247,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Analysis</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Root Cause &amp; Báo TL</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Trace đúng tầng (Tool &gt; AI). Báo cáo phương án sửa với Lead trước khi gõ code.
            </div>
          </div>

          {/* STEP 3 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--yellow)", color: "#000", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              <span style={{ fontSize: "10px", color: "var(--yellow)", fontWeight: "bold", background: "rgba(234,179,8,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Code &amp; Test</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Fix Code &amp; Self-Test</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Sửa code &amp; tự tích đủ 6 mục Pre-handover checklist. Test cả 2 nhánh Present-Mirror.
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--cyan)", color: "#000", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
              <span style={{ fontSize: "10px", color: "var(--cyan)", fontWeight: "bold", background: "rgba(6,182,212,0.15)", padding: "1px 6px", borderRadius: "4px" }}>GitHub</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Tạo PR &amp; Dán PR URL</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Tạo PR GitHub, copy PR URL dán vào Notion. Đổi status ➔ <strong style={{ color: "var(--blue)" }}>Resolved (Chờ Review)</strong>.
            </div>
          </div>

          {/* STEP 5 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#ec4899", color: "#fff", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>5</span>
              <span style={{ fontSize: "10px", color: "#f472b6", fontWeight: "bold", background: "rgba(236,72,153,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Review</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Review 2 Vòng</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Vòng 1: Lead Huyền QC test. Vòng 2: Anh Trường review logic PR.
            </div>
          </div>

          {/* STEP 6 */}
          <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--green)", color: "#fff", fontWeight: "bold", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>6</span>
              <span style={{ fontSize: "10px", color: "var(--green)", fontWeight: "bold", background: "rgba(16,185,129,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Done</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "4px" }}>Deploy &amp; Close Bug</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: "1.4" }}>
              PR merged, test prod pass. Anh Trường / Lead đóng status ➔ <strong style={{ color: "var(--green)" }}>Closed</strong>.
            </div>
          </div>

        </div>

        {/* Detailed Guidelines Breakdown Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          
          {/* Column 1: Notion Status Rules */}
          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--cyan)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📌</span> Quy Tắc Chuyển Trạng Thái (Notion Status Flow)
            </div>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "6px", lineHeight: "1.5" }}>
              <li>
                <strong style={{ color: "var(--text-1)" }}>Wait / Assign:</strong> Bug mới phát sinh trên Notion, chưa có ai bắt đầu gõ code.
              </li>
              <li>
                <strong style={{ color: "var(--yellow)" }}>Doing:</strong> Dev nhận assign và bắt đầu phân tích / sửa code (Chỉ chuyển sang Doing khi thực sự làm).
              </li>
              <li>
                <strong style={{ color: "var(--blue)" }}>Resolved (Chờ Review):</strong> Đã sửa xong code, đã tự test 6 bước và <strong>BẮT BUỘC PHẢI DÁN PR URL</strong> vào card Notion.
              </li>
              <li>
                <strong style={{ color: "#c084fc" }}>Ready for Test / Deployed:</strong> Code đã merge, đã deploy lên server chạy thử nghiệm.
              </li>
              <li>
                <strong style={{ color: "var(--green)" }}>Closed / Done:</strong> Thẩm quyền đóng bug thuộc về Anh Trường / Lead sau khi nghiệm thu hoàn tất.
              </li>
            </ul>
          </div>

          {/* Column 2: PR & Review Hygiene */}
          <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#c084fc", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏷️</span> Quy Chuẩn Tạo PR &amp; Hygiene Báo Cáo
            </div>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "6px", lineHeight: "1.5" }}>
              <li>
                <strong style={{ color: "var(--text-1)" }}>Bắt buộc PR URL:</strong> Mọi bug ở trạng thái Resolved/Closed đều phải có PR URL hợp lệ trên Notion để tính chỉ số năng suất chính xác.
              </li>
              <li>
                <strong style={{ color: "var(--text-1)" }}>Gắn Ticket BSVA:</strong> Đặt tiêu đề PR và commit message có đính kèm mã ticket (vd: `fix(ai-agent): resolve BSVA-102`).
              </li>
              <li>
                <strong style={{ color: "var(--text-1)" }}>Bằng chứng đã test:</strong> Trong mô tả PR phải dán ảnh chụp màn hình hoặc log output thực tế đã test pass.
              </li>
              <li>
                <strong style={{ color: "var(--red)" }}>Hủy bug trùng sớm:</strong> Bug trùng lặp hoặc không tái hiện phải HỦY (Cancel) ngay từ đầu, không kéo dài để tránh sai lệch nỗ lực.
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Row 2: Estimate Levels */}
      <div className="manager-dashboard-layout">
        {/* Estimate Levels */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-3)", paddingBottom: "6px" }}>
            <div className="card-title" style={{ color: "var(--accent-2)" }}>⏱️ 2. Năng lực Ước Lượng (Estimate)</div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
            Năng lực cốt lõi giúp trả lời câu hỏi: <em>&quot;Bao giờ thì xong?&quot;</em>. Gồm 3 cấp độ chính:
          </p>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>1. Khái quát (Rough Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Dùng tính khả thi/ngân sách sơ bộ</div>
              </div>
              <span className="tag tag-gray">🎯 ~20% Acc</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>2. Khái lược (Budget Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Ước lượng sau khi chia nhỏ module</div>
              </div>
              <span className="tag tag-blue">🎯 ~70% Acc</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>3. Thực thi (Definitive Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Xác định khi làm chi tiết từng task</div>
              </div>
              <span className="tag tag-green">🎯 &gt;=80% Acc</span>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "10px", fontStyle: "italic" }}>
            * Sử dụng đơn vị Man-Month / Man-Day để quy đổi nỗ lực ra chi phí tối ưu nhân sự cho dự án.
          </div>
        </div>

      </div>
    </div>
  );
}
