import { useMemo } from "react";
import type { DashboardView } from "../../shared/types";

export function ProcessView({ view }: { view: DashboardView }) {
  return (
    <div className="process-view animate-fade-in" style={{ paddingBottom: "32px" }}>
      <h1 className="section-title" style={{ marginBottom: "6px" }}>📘 Quy trình & Hướng dẫn PM/QC</h1>
      <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "20px" }}>
        Tổng hợp quy chuẩn và định hướng chuyên môn quản lý dự án & kiểm soát chất lượng từ anh Đạt.
      </p>

      <div className="manager-dashboard-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        {/* Row 1, Col 1: Black Box Model */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-3)", paddingBottom: "6px" }}>
            <div className="card-title" style={{ color: "var(--accent-2)" }}>📦 1. Mô hình "Black Box" Sửa Bug</div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
            Trưởng nhóm thiết lập quy trình sửa lỗi nghiêm ngặt với các đầu vào/đầu ra chuẩn hóa:
          </p>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "rgba(99,102,241,0.06)", borderLeft: "3px solid var(--accent)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
              <strong style={{ fontSize: "12px", color: "var(--accent)" }}>📥 Đầu vào (Input):</strong>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                Log defect chi tiết trên Notion, chỉ thị họp (phương án sửa, priority, deadline), và specs/design.
              </div>
            </div>
            <div style={{ background: "rgba(234,179,8,0.06)", borderLeft: "3px solid var(--yellow)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
              <strong style={{ fontSize: "12px", color: "var(--yellow)" }}>⚡ Quy trình tiếp cận:</strong>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                Dev <strong>bắt buộc</strong> đề xuất và giải trình phương án sửa lỗi trước khi bắt đầu code nhằm tránh rework.
              </div>
            </div>
            <div style={{ background: "rgba(34,197,94,0.06)", borderLeft: "3px solid var(--green)", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
              <strong style={{ fontSize: "12px", color: "var(--green)" }}>📤 Đầu ra (Output):</strong>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                Mã nguồn hoàn chỉnh (PR), môi trường test tương ứng, và danh sách kiểm tra (checklist) chất lượng.
              </div>
            </div>
          </div>
        </div>

        {/* Row 1, Col 2: Estimate Levels */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-3)", paddingBottom: "6px" }}>
            <div className="card-title" style={{ color: "var(--accent-2)" }}>⏱️ 2. Năng lực Ước Lượng (Estimate)</div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
            Năng lực cốt lõi giúp trả lời câu hỏi: <em>"Bao giờ thì xong?"</em>. Gồm 3 cấp độ chính:
          </p>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>1. Khái quát (Rough Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Dùng tính khả thi/ngân sách sơ bộ</div>
              </div>
              <span className="tag tag-gray">🎯 ~20% Acc</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>2. Khái lược (Budget Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Ước lượng sau khi chia nhỏ module</div>
              </div>
              <span className="tag tag-blue">🎯 ~70% Acc</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-2)", padding: "8px 12px", borderRadius: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "bold" }}>3. Thực thi (Definitive Estimate)</div>
                <div style={{ fontSize: "10px", color: "var(--text-3)" }}>Xác định khi làm chi tiết từng task</div>
              </div>
              <span className="tag tag-green">🎯 &gt;=80% Acc</span>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "10px", fontStyle: "italic" }}>
            * Sử dụng đơn vị Man-Month để quy đổi nỗ lực ra chi phí tối ưu nhân sự cho dự án.
          </div>
        </div>

        {/* Row 2, Col 1: Manager Effort Allocation */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-3)", paddingBottom: "6px" }}>
            <div className="card-title" style={{ color: "var(--accent-2)" }}>📊 3. Phân bổ Thời gian của Lead Nhóm Nhỏ</div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5", marginBottom: "12px" }}>
            Với team khoảng 3 thành viên, Lead (Huyền) cần chia thời gian 8h/ngày theo tỷ lệ vàng:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                <span>👔 Quản lý &amp; Báo cáo (Manage)</span>
                <strong>5% (~0.4h - 1.2h/ngày)</strong>
              </div>
              <div style={{ height: "6px", background: "var(--border-2)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "5%", height: "100%", background: "var(--accent)" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                <span>🔍 Review code &amp; lỗi (Review)</span>
                <strong>20% (~1.6h/ngày)</strong>
              </div>
              <div style={{ height: "6px", background: "var(--border-2)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "20%", height: "100%", background: "var(--blue)" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                <span>💻 Trực tiếp sửa lỗi (Fix Bug)</span>
                <strong>75% (~5.2h/ngày)</strong>
              </div>
              <div style={{ height: "6px", background: "var(--border-2)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", background: "var(--green)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2, Col 2: Bug Lifecycle & Approval */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header" style={{ marginBottom: "16px", borderBottom: "1px solid var(--border-3)", paddingBottom: "8px" }}>
            <div className="card-title" style={{ color: "var(--accent-2)" }}>🔄 4. Quy trình Review Code &amp; Trạng thái Lỗi</div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Cột trái: Timeline các bước */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
              <div style={{ fontWeight: "bold", color: "var(--accent-2)", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
                📍 Quy trình Phối hợp Review
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span className="tag tag-blue" style={{ flexShrink: 0, width: "24px", justifyContent: "center" }}>1</span>
                <div>
                  <strong>Member sửa xong:</strong> Đổi trạng thái lỗi sang <span className="tag tag-blue" style={{ fontSize: "10px", padding: "1px 6px" }}>ready for review</span>.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span className="tag tag-purple" style={{ flexShrink: 0, width: "24px", justifyContent: "center" }}>2</span>
                <div>
                  <strong>Huyền review trước:</strong> QC Lead Huyền bắt buộc phải review kiểm soát chất lượng trước khi gửi cho anh Trường.
                  <div style={{ marginTop: "4px", background: "rgba(168,85,247,0.06)", borderLeft: "2px solid #a855f7", padding: "4px 8px", borderRadius: "0 4px 4px 0", fontSize: "11px" }}>
                    ✔️ Nếu Huyền test <strong>KHÔNG ra lỗi</strong> ➔ Đổi label/status sang <span className="tag tag-yellow" style={{ fontSize: "10px", padding: "1px 6px" }}>wait for development</span>.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span className="tag tag-green" style={{ flexShrink: 0, width: "24px", justifyContent: "center" }}>3</span>
                <div>
                  <strong>Anh Trường review sau:</strong> Trực tiếp check PR và code logic cuối cùng.
                  <div style={{ marginTop: "4px", background: "rgba(239,68,68,0.06)", borderLeft: "2px solid #ef4444", padding: "4px 8px", borderRadius: "0 4px 4px 0", fontSize: "11px" }}>
                    ❌ Nếu phát hiện lỗi ➔ Đổi label/status sang <span className="tag tag-red" style={{ fontSize: "10px", padding: "1px 6px" }}>change requested</span>. Member sẽ sửa lại và đổi về <span className="tag tag-blue" style={{ fontSize: "10px", padding: "1px 6px" }}>ready for review</span> để chạy lại quy trình.
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Luật Vòng đời & Phê duyệt */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
              <div style={{ fontWeight: "bold", color: "var(--accent-2)", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
                ⚖️ Quy tắc Quản trị Lỗi
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--green)" }}>👑</span>
                <div>
                  <strong>Quyền đóng lỗi:</strong> Chỉ có <strong>Anh Trường</strong> mới có thẩm quyền cuối cùng để close bug. Lead quản lý hay dev không tự ý đóng bug trên hệ thống.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--red)" }}>🔬</span>
                <div>
                  <strong>Phân tích Re-open:</strong> Đối với bug bị mở lại (Re-open), bắt buộc phải phân tích nguyên nhân gốc rễ (Root Cause) để khắc phục triệt để.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--yellow)" }}>🚫</span>
                <div>
                  <strong>Hủy lỗi trùng lặp:</strong> Loại bỏ (cancel) ngay các lỗi trùng lặp khi test xác nhận. Không tính lỗi trùng lặp vào hiệu suất làm việc để tránh sai lệch.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--purple)" }}>⏰</span>
                <div>
                  <strong>Checklist lỗi tự động:</strong> Hệ thống tự động chạy quét PR comments của anh Trường lúc <strong>18:00 mỗi ngày</strong> để tự động trích xuất checklist lỗi thường gặp. Bạn cũng có thể bấm nút quét thủ công tại tab Checklist.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
