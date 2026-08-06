import React from "react";
import type { BugRecord, Person } from "../../../shared/types";

export interface DevReviewStatRow {
  dev: Person;
  fixedCount: number;
  reviewedCount: number;
  approvedWithNoteCount?: number;
  changesRequestedCount?: number;
  totalQcCommentsCount?: number;
  withCommentCount: number;
  noCommentCount: number;
  pendingCount: number;
  reviewRate: number;
}

export interface DevBreakdownTableProps {
  devReviewStats: DevReviewStatRow[];
  huyenReviewedBugs: BugRecord[];
  huyenReviewedWithComments: BugRecord[];
  bugBelongsToPerson: (b: BugRecord, p: Person) => boolean;
  onSelectDevFilter: (devCode: string) => void;
  onSelectSubTab: (tab: "reviewed" | "pending") => void;
  onSelectCommentFilter: (
    filter:
      | "all"
      | "comments"
      | "nocomments"
      | "multiround"
      | "approved_with_note"
      | "changes_requested"
  ) => void;
  scrollToDetails: () => void;
}

export const DevBreakdownTable: React.FC<DevBreakdownTableProps> = ({
  devReviewStats,
  huyenReviewedBugs,
  huyenReviewedWithComments,
  bugBelongsToPerson,
  onSelectDevFilter,
  onSelectSubTab,
  onSelectCommentFilter,
  scrollToDetails,
}) => {
  return (
    <div style={{ marginTop: "20px", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border-2)",
              color: "var(--text-1)",
              fontWeight: "bold",
            }}
          >
            <th
              style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-1)" }}
              title="Tên lập trình viên phụ trách"
            >
              TÁC GIẢ
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Tổng số bug có PR của Dev này mà QC Lead đã hoàn thành review"
            >
              TỔNG ĐÃ REVIEW
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Số bug của Dev này test Pass 100% không cần comment/lưu ý nào"
            >
              PASS NGAY
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Số bug của Dev này được QC Approve cho merge nhưng có comment note góp ý thêm"
            >
              PASS CÓ NOTE
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Số bug của Dev này bị QC Lead bắt lỗi nghiêm trọng/Request Changes trên GitHub PR"
            >
              REQUEST CHANGES
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Tổng số câu comment QC đã để lại trên tất cả PR của Dev này"
            >
              TỔNG COMMENT QC
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Công thức Tỷ Lệ Lỗi Cá Nhân]\n• Phép tính = (Số bug bị Request Changes / Tổng số bug đã review của chính Dev này) × 100%\n• Đánh giá: >30% (Đỏ - Cao) | >15%-30% (Vàng) | ≤15% (Xanh)`}
            >
              TỶ LỆ LỖI (CÁ NHÂN)
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Công thức Đóng Góp Lỗi Cả Team]\n• Phép tính = (Số bug Request Changes của Dev này / TỔNG BUG REQUEST CHANGES CỦA CẢ TEAM) × 100%\n• Đánh giá mức độ đóng góp lỗi vào tổng lỗi team`}
            >
              ĐÓNG GÓP LỖI (CẢ TEAM)
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Số PR của Dev này phải re-review / comment từ 2 lần trở lên"
            >
              RE-REVIEW
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title="Số bug của Dev này đã sửa/có PR nhưng chưa được QC Lead review"
            >
              ĐANG CHỜ REVIEW
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Công thức Tiến Độ Review]\n• Phép tính = (Số bug đã review của Dev này / Tổng số bug Dev này đã sửa trong kỳ) × 100%`}
            >
              TIẾN ĐỘ REVIEW
            </th>
          </tr>
        </thead>
        <tbody>
          {devReviewStats.map((row, idx) => {
            const devBugs = huyenReviewedBugs.filter((b) =>
              bugBelongsToPerson(b, row.dev)
            );
            const multiRoundCount = devBugs.filter(
              (b) =>
                (b.prCommentsByHuyen ?? 0) > 1 ||
                (b.huyenReviewRounds ?? 0) > 1
            ).length;

            const reqChangesCount = row.changesRequestedCount ?? row.withCommentCount;
            const appNoteCount = row.approvedWithNoteCount ?? 0;
            const qcCommentsTotal = row.totalQcCommentsCount ?? devBugs.reduce((sum, b) => sum + (b.prCommentsByHuyen ?? 0), 0);

            const errRatePersonal =
              row.reviewedCount > 0
                ? ((reqChangesCount / row.reviewedCount) * 100).toFixed(0)
                : "0";
            const totalTeamChangesReq = huyenReviewedWithComments.length;
            const errRateTeamShare =
              totalTeamChangesReq > 0
                ? ((reqChangesCount / totalTeamChangesReq) * 100).toFixed(0)
                : "0";

            return (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid var(--border-2)",
                  background:
                    idx % 2 === 0
                      ? "var(--surface-1)"
                      : "var(--surface-2)",
                }}
              >
                {/* Dev Code */}
                <td style={{ padding: "10px 12px", fontWeight: "700" }}>
                  <span
                    style={{
                      cursor: "pointer",
                      color: "var(--text-1)",
                      textDecoration: "none",
                      fontWeight: "700",
                    }}
                    onClick={() => {
                      onSelectDevFilter(row.dev.code);
                      scrollToDetails();
                    }}
                    title={`Click để lọc dữ liệu của ${row.dev.code}`}
                  >
                    {row.dev.code}
                  </span>
                </td>
                {/* Tổng đã review */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("all");
                    scrollToDetails();
                  }}
                  title={`Click để xem tất cả bug đã review của ${row.dev.code}`}
                >
                  {row.reviewedCount} bug
                </td>
                {/* Pass ngay */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "#10b981",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("nocomments");
                    scrollToDetails();
                  }}
                  title={`Click để xem bug Pass ngay của ${row.dev.code}`}
                >
                  {row.noCommentCount} bug
                </td>
                {/* Pass có note */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: appNoteCount > 0 ? "#f59e0b" : "var(--text-2)",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("approved_with_note");
                    scrollToDetails();
                  }}
                  title={`Click để xem bug Approve with note của ${row.dev.code}`}
                >
                  {appNoteCount} bug
                </td>
                {/* Request changes */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: reqChangesCount > 0 ? "#ef4444" : "var(--text-2)",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("changes_requested");
                    scrollToDetails();
                  }}
                  title={`Click để xem bug Request Changes của ${row.dev.code}`}
                >
                  {reqChangesCount} bug
                </td>
                {/* Tổng comment QC */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "var(--accent-2)",
                    fontWeight: "700",
                  }}
                  title={`Tổng số comment QC đã để lại trên các PR của ${row.dev.code}`}
                >
                  {qcCommentsTotal} comments
                </td>
                {/* Tỷ Lệ Lỗi (Cá Nhân) */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    fontWeight: "700",
                    color:
                      Number(errRatePersonal) > 30
                        ? "#ef4444"
                        : Number(errRatePersonal) > 15
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                  title={
                    Number(errRatePersonal) > 30
                      ? "⚠️ Tỷ lệ lỗi cá nhân cao (>30%)"
                      : "Tỷ lệ lỗi cá nhân"
                  }
                >
                  {errRatePersonal}%
                </td>
                {/* Đóng Góp Lỗi (Cả Team) */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    fontWeight: "700",
                    color:
                      Number(errRateTeamShare) > 40
                        ? "#dc2626"
                        : "var(--text-1)",
                  }}
                  title={
                    Number(errRateTeamShare) > 40
                      ? "🚨 Chiếm trên 40% tổng lỗi của cả team!"
                      : "Tỷ lệ đóng góp lỗi cả team"
                  }
                >
                  {errRateTeamShare}%
                </td>
                {/* Re-check */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "var(--text-2)",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("multiround");
                    scrollToDetails();
                  }}
                  title={`Click để xem bug re-check của ${row.dev.code}`}
                >
                  {multiRoundCount} PR
                </td>

                {/* Đang chờ review */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: row.pendingCount > 0 ? "#f59e0b" : "var(--text-2)",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("pending");
                    scrollToDetails();
                  }}
                  title={`Click để xem danh sách đang chờ review của ${row.dev.code}`}
                >
                  {row.pendingCount} bug
                </td>
                {/* Tiến độ review */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: "var(--text-2)",
                    fontWeight: "600",
                  }}
                >
                  {row.reviewRate.toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
