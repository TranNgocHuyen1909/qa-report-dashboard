import React from "react";
import type { DashboardView, PeriodType } from "../../shared/types";
import { ReviewStats } from "./ReviewStats";

interface ReviewProtocolViewProps {
  view?: DashboardView;
  periodType?: PeriodType;
  periodKey?: string;
  onNavigateTab?: (tab: string, repoFilter?: string) => void;
}

export const ReviewProtocolView: React.FC<ReviewProtocolViewProps> = ({
  view,
  periodType = "week",
  periodKey,
  onNavigateTab,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* Header Banner */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1 className="section-title" style={{ margin: "0 0 6px 0" }}>
            🔍 Quy Trình Review 2 Vòng &amp; Luồng Phân Nhánh Label (Huyền &amp; Anh Trường)
          </h1>
          <div style={{ display: "flex", gap: "10px", fontSize: "12px", fontWeight: "bold" }}>
            <span style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(236,72,153,0.3)" }}>
              👑 Huyền: GitHub <code>@TranNgocHuyen1909</code>
            </span>
            <span style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(168,85,247,0.3)" }}>
              🛡️ Anh Trường: GitHub <code>@dract</code>
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-2)",
            margin: "4px 0 0 0",
            fontWeight: 500,
          }}
        >
          Hướng dẫn chi tiết luồng Review Vòng 1 (QC Lead Huyền - @TranNgocHuyen1909) và Vòng 2 (Tech Lead Anh Trường - @dract), phân phễu xử lý comment, thông báo notification và đổi Label Notion.
        </p>
      </div>

      {/* 2 Main Review Stages Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* CARD 1: VÒNG 1 - HUYỀN */}
        <div
          className="card"
          style={{
            padding: "20px",
            background: "var(--card-bg)",
            border: "1px solid rgba(236,72,153,0.3)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(236,72,153,0.15)",
                  color: "#ec4899",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                👑
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-1)" }}>
                  Vòng 1 — Review Vòng 1 (Huyền)
                </h3>
                <span style={{ fontSize: "11px", color: "#ec4899", fontWeight: 600 }}>
                  Phụ trách duy nhất: QC Lead Huyền
                </span>
              </div>
            </div>
            <span className="tag" style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", fontWeight: "bold" }}>
              Status: Resolved ➔ Wait for dev
            </span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-1)", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "var(--surface-3)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #ec4899" }}>
              👑 <strong>Quản Lý Ô Trách Nhiệm:</strong> Huyền chuyển trường <code>Reviewers</code> trên Notion ➔ <span className="tag" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", fontWeight: "bold" }}>Huyền</span> và tiến hành test thực tế môi trường. <i>(2 trường <code>Reviewers</code> và <code>Số giờ review</code> do duy nhất Huyền kiểm soát)</i>.
            </div>

            <div style={{ background: "rgba(16,185,129,0.06)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #10b981" }}>
              🟢 <strong>Trường Hợp 1 — KHÔNG COMMENT (OK Hết):</strong> Test thực tế Pass ➔ Huyền <strong>tự đổi Label Notion ➔</strong> <span className="tag tag-green">wait for development</span> và <strong>tự điền</strong> <span className="tag tag-blue">Số giờ review</span>.
            </div>

            <div style={{ background: "rgba(239,68,68,0.06)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #ef4444" }}>
              🔔 <strong>Trường Hợp 2 — CÓ COMMENT (Dev Reply &amp; Resolve):</strong>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <li>Dev <strong>BẮT BUỘC reply trực tiếp dưới comment</strong> ("Đã sửa" hoặc lý do không sửa) để Huyền nhận Gmail notification.</li>
                <li>Dev <strong>bấm nút Resolve conversation</strong>.</li>
                <li>Huyền nhận noti ➔ Re-check test Pass ➔ <strong>Tự đổi Label Notion ➔</strong> <span className="tag tag-green">wait for development</span> và <strong>điền Số giờ review</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CARD 2: VÒNG 2 - ANH TRƯỜNG */}
        <div
          className="card"
          style={{
            padding: "20px",
            background: "var(--card-bg)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(168,85,247,0.15)",
                  color: "#a855f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                👨‍💻
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-1)" }}>
                  Vòng 2 — Tech Lead Review (Anh Trường)
                </h3>
                <span style={{ fontSize: "11px", color: "#a855f7", fontWeight: 600 }}>
                  Review logic PR &amp; Merge Code
                </span>
              </div>
            </div>
            <span className="tag" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", fontWeight: "bold" }}>
              Status: Wait for dev ➔ Deployed
            </span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-1)", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "rgba(234,179,8,0.08)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #d97706" }}>
              ⏰ <strong>Lịch Collect &amp; Review Cố Định:</strong> Anh Trường dành <span className="tag tag-yellow" style={{ fontSize: "12px", fontWeight: "bold" }}>⏱️ 1 tiếng đầu buổi chiều mỗi ngày</span> để gom (collect) và review toàn bộ các PR có Label <span className="tag tag-green">wait for development</span> (do Huyền đã duyệt ở Vòng 1).
            </div>ag tag-yellow" style={{ fontSize: "12px", fontWeight: "bold" }}>⏱️ 1 tiếng đầu buổi chiều mỗi ngày</span> để gom (collect) và review toàn bộ các PR có Label <span className="tag tag-green">wait for development</span> (do Chị Huyền đã duyệt ở Vòng 1).
            </div>

            <div style={{ background: "var(--surface-3)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #a855f7" }}>
              💬 <strong>Anh Trường CHỈ CÓ COMMENT (Khi Cần Sửa Logic):</strong> Anh Trường sẽ <strong>viết comment chỉ rõ chỗ cần sửa</strong> trên PR và <strong>đổi Label Notion ➔</strong> <span className="tag tag-red">change requested</span>.
            </div>

            <div style={{ background: "rgba(59,130,246,0.06)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #3b82f6" }}>
              🔄 <strong>Dev Sửa Code &amp; Đổi Label Báo Review Lại:</strong> Sau khi Dev sửa xong, reply giải thích dưới comment, <strong>bấm Resolve conversation</strong> và <strong>tự đổi Label Notion ➔</strong> <span className="tag tag-blue">ready for review</span> để báo Anh Trường review lại!
            </div>

            <div style={{ background: "rgba(16,185,129,0.06)", padding: "10px 12px", borderRadius: "8px", borderLeft: "3px solid #10b981" }}>
              🚀 <strong>Khi Anh Trường Review OK &amp; Merge PR:</strong> Merge PR &amp; deploy server ➔ Chuyển <code>Status</code> Notion ➔ <span className="tag" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7", fontWeight: "bold" }}>Deployed</span> và <strong>bàn giao cho bên OP (Thương &amp; Linh) test nghiệm thu lại!</strong>
            </div>
          </div>
        </div>
      </div>

      {/* HANDOFF TO OP (THƯƠNG & LINH) CARD */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          background: "rgba(16,185,129,0.04)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "28px" }}>🟢</div>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-1)" }}>
              Bàn Giao Bên OP (Thương &amp; Linh) Nghiệm Thu Môi Trường Production
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-2)" }}>
              Sau khi status chuyển <code>Deployed</code>, bên OP (Thương &amp; Linh) sẽ test nghiệm thu thực tế: Pass ➔ Đổi Status Notion ➔ <strong>Closed</strong>. Fail ➔ Đổi Status ➔ <strong>Reopened</strong> (quay về Bước 1).
            </p>
          </div>
        </div>
        {onNavigateTab && (
          <button
            className="ctrl ctrl-primary"
            onClick={() => onNavigateTab("workflow")}
            style={{ fontSize: "12px", padding: "8px 16px", whiteSpace: "nowrap" }}
          >
            ⚡ Xem Quy Trình Bug Chi Tiết
          </button>
        )}
      </div>

      {/* INTEGRATED REVIEW STATS */}
      {view && (
        <div>
          <h2 style={{ fontSize: "16px", color: "var(--text-1)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📊</span> Thống Kê Số Liệu Review PR Thực Tế
          </h2>
          <ReviewStats view={view} periodType={periodType} periodKey={periodKey} />
        </div>
      )}
    </div>
  );
};
