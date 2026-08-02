import React from "react";
import type { BugRecord, Person } from "../../../shared/types";

export interface DevReviewStatRow {
  dev: Person;
  fixedCount: number;
  reviewedCount: number;
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
  onSelectCommentFilter: (filter: "all" | "comments" | "nocomments" | "multiround") => void;
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
            <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-1)" }} title="Tên lập trình viên phụ trách">
              TÁC GIẢ
            </th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }} title="Tổng số bug có PR của Dev này mà QC Lead đã hoàn thành review">
              TỔNG ĐÃ REVIEW
            </th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }} title="Số bug của Dev này test Pass 100% không cần comment lỗi">
              PASS NGAY
            </th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }} title="Số bug của Dev này bị QC Lead comment ra lỗi trên GitHub PR">
              REVIEW CÓ COMMENT
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Công thức Tỷ Lệ Lỗi Cá Nhân]\n• Phép tính = (Số bug có comment / Tổng số bug đã review của chính Dev này) × 100%\n• Đánh giá: >30% (Đỏ - Cao) | >15%-30% (Vàng) | ≤15% (Xanh)`}
            >
              TỶ LỆ LỖI (CÁ NHÂN)
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Công thức Đóng Góp Lỗi Cả Team]\n• Phép tính = (Số bug có comment của Dev này / TỔNG BUG CÓ COMMENT CỦA CẢ TEAM) × 100%\n• Đánh giá mức độ đóng góp lỗi vào tổng lỗi team`}
            >
              ĐÓNG GÓP LỖI (CẢ TEAM)
            </th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }} title="Số PR của Dev này phải re-review / comment từ 2 lần trở lên">
              RE-REVIEW
            </th>
            <th
              style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }}
              title={`[Sửa Bổ Sung / Re-commit]\n• Số PR mà Dev phải push thêm commit (2, 3... commits) sau khi đã tạo PR / đợt sửa đầu tiên`}
            >
              SỬA BỔ SUNG
            </th>
            <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-1)" }} title="Số bug của Dev này đã sửa/có PR nhưng chưa được QC Lead review (Tất cả thời gian)">
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
              bugBelongsToPerson(b, row.dev),
            );
            const multiRoundCount = devBugs.filter(
              (b) =>
                (b.prCommentsByHuyen ?? 0) > 1 ||
                (b.huyenReviewRounds ?? 0) > 1,
            ).length;
            const errRatePersonal =
              row.reviewedCount > 0
                ? (
                    (row.withCommentCount / row.reviewedCount) *
                    100
                  ).toFixed(0)
                : "0";
            const totalTeamWithComments = huyenReviewedWithComments.length;
            const errRateTeamShare =
              totalTeamWithComments > 0
                ? (
                    (row.withCommentCount / totalTeamWithComments) *
                    100
                  ).toFixed(0)
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
                  title={`Click để xem bug Pass của ${row.dev.code}`}
                >
                  {row.noCommentCount} bug
                </td>
                {/* Review có comment */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: row.withCommentCount > 0 ? "#ef4444" : "var(--text-2)",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    onSelectDevFilter(row.dev.code);
                    onSelectSubTab("reviewed");
                    onSelectCommentFilter("comments");
                    scrollToDetails();
                  }}
                  title={`Click để xem bug có comment của ${row.dev.code}`}
                >
                  {row.withCommentCount} bug
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
                {/* Sửa Bổ Sung */}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: (() => {
                      const reCommitBugs = devBugs.filter((b) => {
                        const st = (b.status ?? "").toLowerCase();
                        const isResolvedOrClosed = ["resolved", "closed", "deployed"].includes(st);
                        const hasMultipleCommitsOrRounds =
                          (b.ghCommitsCount ?? 1) > 1 ||
                          (b.prCommentsByHuyen ?? 0) > 0 ||
                          (b.huyenReviewRounds ?? 0) > 1;
                        return isResolvedOrClosed && hasMultipleCommitsOrRounds;
                      }).length;
                      return reCommitBugs > 0 ? "#f59e0b" : "var(--text-2)";
                    })(),
                    fontWeight: "600",
                  }}
                  title={`Số PR của ${row.dev.code} đã Resolved nhưng có > 1 commit bổ sung sau lượt đầu`}
                >
                  {(() => {
                    const reCommitBugs = devBugs.filter((b) => {
                      const st = (b.status ?? "").toLowerCase();
                      const isResolvedOrClosed = ["resolved", "closed", "deployed"].includes(st);
                      const hasMultipleCommitsOrRounds =
                        (b.ghCommitsCount ?? 1) > 1 ||
                        (b.prCommentsByHuyen ?? 0) > 0 ||
                        (b.huyenReviewRounds ?? 0) > 1;
                      return isResolvedOrClosed && hasMultipleCommitsOrRounds;
                    }).length;
                    return `${reCommitBugs} PR`;
                  })()}
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
