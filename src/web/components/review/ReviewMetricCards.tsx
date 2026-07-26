import React from "react";

export interface ReviewMetricCardsProps {
  reviewedCount: number;
  periodFixedCount: number;
  withCommentCount: number;
  commentRate: string;
  multiRoundCount: number;
  recheckRate: string;
  noCommentCount: number;
  passRate: string;
  pendingCount: number;
  onSelectSubTab?: (tab: "reviewed" | "pending") => void;
  onSelectCommentFilter?: (filter: "all" | "comments" | "nocomments" | "multiround") => void;
}

export const ReviewMetricCards: React.FC<ReviewMetricCardsProps> = ({
  reviewedCount,
  periodFixedCount,
  withCommentCount,
  commentRate,
  multiRoundCount,
  recheckRate,
  noCommentCount,
  passRate,
  pendingCount,
  onSelectSubTab,
  onSelectCommentFilter,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
        marginBottom: "20px",
      }}
    >
      {/* 1. TỔNG ĐÃ REVIEW */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #2563eb",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("reviewed");
          onSelectCommentFilter?.("all");
        }}
        title="Bấm để xem tất cả bug Huyền đã review"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          TỔNG ĐÃ REVIEW
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb", margin: "4px 0" }}>
          {reviewedCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Trên {periodFixedCount} bug dev đã sửa
        </div>
      </div>

      {/* 2. REVIEW CÓ COMMENT */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #ef4444",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("reviewed");
          onSelectCommentFilter?.("comments");
        }}
        title="Bấm để xem danh sách bug có comment lỗi"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          REVIEW CÓ COMMENT
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444", margin: "4px 0" }}>
          {withCommentCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ có comment: <strong>{commentRate}%</strong>
        </div>
      </div>

      {/* 3. RE-CHECK LẶP LẠI */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #f59e0b",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("reviewed");
          onSelectCommentFilter?.("multiround");
        }}
        title="Bấm để xem danh sách bug re-check nhiều lần"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          RE-CHECK LẶP LẠI
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b", margin: "4px 0" }}>
          {multiRoundCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ re-check: <strong>{recheckRate}%</strong>
        </div>
      </div>

      {/* 4. REVIEW KHÔNG COMMENT / PASS NGAY */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #10b981",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("reviewed");
          onSelectCommentFilter?.("nocomments");
        }}
        title="Bấm để xem danh sách bug Pass ngay"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          REVIEW KHÔNG COMMENT
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", margin: "4px 0" }}>
          {noCommentCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ Pass ngay: <strong>{passRate}%</strong>
        </div>
      </div>

      {/* 5. BUG CHỜ REVIEW */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #64748b",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("pending");
        }}
        title="Bấm để xem danh sách đang chờ review"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          BUG CHỜ REVIEW
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-1)", margin: "4px 0" }}>
          {pendingCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tồn đọng (Tất cả thời gian)
        </div>
      </div>
    </div>
  );
};
