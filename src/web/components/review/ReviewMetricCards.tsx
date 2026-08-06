import React from "react";

export interface ReviewMetricCardsProps {
  reviewedCount: number;
  periodFixedCount: number;
  withCommentCount: number; // Changes Requested / Lỗi count
  commentRate: string; // Changes Requested / Lỗi rate
  approvedWithNoteCount?: number;
  approvedWithNoteRate?: string;
  multiRoundCount: number;
  recheckRate: string;
  noCommentCount: number;
  passRate: string;
  pendingCount: number;
  totalResolvedCount?: number;
  priorityCount?: number;
  pausedCount?: number;
  noPrCount?: number;
  onSelectSubTab?: (tab: "reviewed" | "pending") => void;
  onSelectCommentFilter?: (
    filter:
      | "all"
      | "comments"
      | "nocomments"
      | "multiround"
      | "approved_with_note"
      | "changes_requested"
  ) => void;
}

export const ReviewMetricCards: React.FC<ReviewMetricCardsProps> = ({
  reviewedCount,
  periodFixedCount,
  withCommentCount,
  commentRate,
  approvedWithNoteCount = 0,
  approvedWithNoteRate = "0",
  multiRoundCount,
  recheckRate,
  noCommentCount,
  passRate,
  pendingCount,
  totalResolvedCount,
  priorityCount,
  pausedCount,
  noPrCount,
  onSelectSubTab,
  onSelectCommentFilter,
}) => {
  const displayPriority = priorityCount !== undefined ? priorityCount : pendingCount;
  const displayNoPr = noPrCount ?? 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
        title="Bấm để xem tất cả bug QC đã review"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          TỔNG ĐÃ REVIEW
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#2563eb", margin: "4px 0" }}>
          {reviewedCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Trên {periodFixedCount} bug dev đã sửa
        </div>
      </div>

      {/* 2. PASS NGAY */}
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
        title="Bấm để xem danh sách bug Pass ngay (không comment)"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          PASS NGAY
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981", margin: "4px 0" }}>
          {noCommentCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ Pass ngay: <strong>{passRate}%</strong>
        </div>
      </div>

      {/* 3. PASS CÓ NOTE / APPROVE W/ NOTE */}
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
          onSelectCommentFilter?.("approved_with_note");
        }}
        title="Bấm để xem danh sách bug Approve with note (góp ý thêm)"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          PASS CÓ NOTE
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#f59e0b", margin: "4px 0" }}>
          {approvedWithNoteCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ có note: <strong>{approvedWithNoteRate}%</strong>
        </div>
      </div>

      {/* 4. REQUEST CHANGES / LỖI */}
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
          onSelectCommentFilter?.("changes_requested");
        }}
        title="Bấm để xem danh sách bug bị Request Changes (lỗi thực sự)"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          REQUEST CHANGES
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#ef4444", margin: "4px 0" }}>
          {withCommentCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ lỗi: <strong>{commentRate}%</strong>
        </div>
      </div>

      {/* 5. RE-REVIEW */}
      <div
        className="card"
        style={{
          padding: "16px",
          borderRadius: "10px",
          borderLeft: "4px solid #8b5cf6",
          cursor: "pointer",
        }}
        onClick={() => {
          onSelectSubTab?.("reviewed");
          onSelectCommentFilter?.("multiround");
        }}
        title="Bấm để xem danh sách bug re-review nhiều lần"
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          RE-REVIEW
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#8b5cf6", margin: "4px 0" }}>
          {multiRoundCount}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          Tỷ lệ re-review: <strong>{recheckRate}%</strong>
        </div>
      </div>

      {/* 6. BUG CHỜ REVIEW */}
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
        title={`[Bug Chờ Review: ${displayPriority}]\n• ${displayPriority} bug CÓ PR: Dev đã sửa & sẵn sàng chờ QA review`}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
          BUG CHỜ REVIEW
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-1)", margin: "4px 0" }}>
          {displayPriority}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: "1.4" }}>
          ({displayPriority} có PR &bull; {displayNoPr} PR empty)
        </div>
      </div>
    </div>
  );
};
