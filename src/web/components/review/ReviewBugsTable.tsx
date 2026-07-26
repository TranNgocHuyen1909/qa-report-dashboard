import React from "react";
import type { BugRecord, Person } from "../../../shared/types";
import { FilterableTableHeader } from "./FilterableTableHeader";

export interface ReviewBugsTableProps {
  tableType: "reviewed" | "pending";
  bugs: BugRecord[];
  pagedBugs: BugRecord[];
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (p: number) => void;
  // Header filter props
  selectedDevFilter: string;
  setSelectedDevFilter: (val: string) => void;
  selectedLocFilter: string;
  setSelectedLocFilter: (val: string) => void;
  huyenCommentFilter: "all" | "comments" | "nocomments" | "multiround" | "dev_replied" | "pending_reply";
  setHuyenCommentFilter: (val: any) => void;
  selectedPrFilter: string;
  setSelectedPrFilter: (val: string) => void;
  activeHeaderMenu: "dev" | "loc" | "result" | "pr" | null;
  setActiveHeaderMenu: (val: "dev" | "loc" | "result" | "pr" | null) => void;
  dev3People: Person[];
  availableLocations: string[];
  huyenReviewedBugs: BugRecord[];
  huyenDevRepliedBugs: BugRecord[];
  huyenPendingReplyBugs: BugRecord[];
  huyenReviewedNoComments: BugRecord[];
  // Cell renderer helpers
  getDevNameByBug: (b: BugRecord) => string;
  getLocationTagStyle: (loc: string) => { bg: string; color: string; border: string };
  extractAllPrUrls: (rawUrl?: string) => { url: string; repoLabel: string; prNum: string | null }[];
  renderLabelBadge: (b: BugRecord) => React.ReactNode;
  renderResultBadge?: (b: BugRecord) => React.ReactNode;
}

export const ReviewBugsTable: React.FC<ReviewBugsTableProps> = ({
  tableType,
  bugs,
  pagedBugs,
  page,
  totalPages,
  totalCount,
  pageSize,
  setPage,
  selectedDevFilter,
  setSelectedDevFilter,
  selectedLocFilter,
  setSelectedLocFilter,
  huyenCommentFilter,
  setHuyenCommentFilter,
  selectedPrFilter,
  setSelectedPrFilter,
  activeHeaderMenu,
  setActiveHeaderMenu,
  dev3People,
  availableLocations,
  huyenReviewedBugs,
  huyenDevRepliedBugs,
  huyenPendingReplyBugs,
  huyenReviewedNoComments,
  getDevNameByBug,
  getLocationTagStyle,
  extractAllPrUrls,
  renderLabelBadge,
  renderResultBadge,
}) => {
  const filteredBugsNoHuyen = bugs.filter((b) => getDevNameByBug(b) !== "HuyenTN");

  if (filteredBugsNoHuyen.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          color: "var(--text-3)",
          textAlign: "center",
          fontSize: "12px",
        }}
      >
        {tableType === "reviewed"
          ? "Không có bug nào phù hợp với bộ lọc."
          : "Không có bug nào đang chờ review."}
      </div>
    );
  }

  return (
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
            background: "var(--surface-3)",
            color: "var(--text-2)",
            textTransform: "uppercase",
            fontSize: "11px",
            borderBottom: "1px solid var(--border-3)",
          }}
        >
          <th style={{ padding: "10px 12px", textAlign: "center", width: "45px" }}>
            STT
          </th>
          <th style={{ padding: "10px 12px", textAlign: "left", width: "110px" }}>
            BUG ID
          </th>
          <th style={{ padding: "10px 12px", textAlign: "center", width: "130px" }}>
            LINK PR
          </th>
          <FilterableTableHeader
            type="dev"
            title="Dev"
            widthStyle="90px"
            align="left"
            selectedDevFilter={selectedDevFilter}
            setSelectedDevFilter={setSelectedDevFilter}
            selectedLocFilter={selectedLocFilter}
            setSelectedLocFilter={setSelectedLocFilter}
            huyenCommentFilter={huyenCommentFilter}
            setHuyenCommentFilter={setHuyenCommentFilter}
            selectedPrFilter={selectedPrFilter}
            setSelectedPrFilter={setSelectedPrFilter}
            activeHeaderMenu={activeHeaderMenu}
            setActiveHeaderMenu={setActiveHeaderMenu}
            dev3People={dev3People}
            availableLocations={availableLocations}
            huyenReviewedBugs={huyenReviewedBugs}
            huyenDevRepliedBugs={huyenDevRepliedBugs}
            huyenPendingReplyBugs={huyenPendingReplyBugs}
            huyenReviewedNoComments={huyenReviewedNoComments}
          />
          <th style={{ padding: "10px 12px", textAlign: "left" }}>
            Tiêu đề lỗi
          </th>
          <FilterableTableHeader
            type="loc"
            title="Vị trí"
            widthStyle="140px"
            align="left"
            selectedDevFilter={selectedDevFilter}
            setSelectedDevFilter={setSelectedDevFilter}
            selectedLocFilter={selectedLocFilter}
            setSelectedLocFilter={setSelectedLocFilter}
            huyenCommentFilter={huyenCommentFilter}
            setHuyenCommentFilter={setHuyenCommentFilter}
            selectedPrFilter={selectedPrFilter}
            setSelectedPrFilter={setSelectedPrFilter}
            activeHeaderMenu={activeHeaderMenu}
            setActiveHeaderMenu={setActiveHeaderMenu}
            dev3People={dev3People}
            availableLocations={availableLocations}
            huyenReviewedBugs={huyenReviewedBugs}
            huyenDevRepliedBugs={huyenDevRepliedBugs}
            huyenPendingReplyBugs={huyenPendingReplyBugs}
            huyenReviewedNoComments={huyenReviewedNoComments}
          />
          <FilterableTableHeader
            type="result"
            title="Kết quả"
            widthStyle="115px"
            align="center"
            selectedDevFilter={selectedDevFilter}
            setSelectedDevFilter={setSelectedDevFilter}
            selectedLocFilter={selectedLocFilter}
            setSelectedLocFilter={setSelectedLocFilter}
            huyenCommentFilter={huyenCommentFilter}
            setHuyenCommentFilter={setHuyenCommentFilter}
            selectedPrFilter={selectedPrFilter}
            setSelectedPrFilter={setSelectedPrFilter}
            activeHeaderMenu={activeHeaderMenu}
            setActiveHeaderMenu={setActiveHeaderMenu}
            dev3People={dev3People}
            availableLocations={availableLocations}
            huyenReviewedBugs={huyenReviewedBugs}
            huyenDevRepliedBugs={huyenDevRepliedBugs}
            huyenPendingReplyBugs={huyenPendingReplyBugs}
            huyenReviewedNoComments={huyenReviewedNoComments}
          />
          <FilterableTableHeader
            type="pr"
            title="Trạng thái PR"
            widthStyle="150px"
            align="center"
            selectedDevFilter={selectedDevFilter}
            setSelectedDevFilter={setSelectedDevFilter}
            selectedLocFilter={selectedLocFilter}
            setSelectedLocFilter={setSelectedLocFilter}
            huyenCommentFilter={huyenCommentFilter}
            setHuyenCommentFilter={setHuyenCommentFilter}
            selectedPrFilter={selectedPrFilter}
            setSelectedPrFilter={setSelectedPrFilter}
            activeHeaderMenu={activeHeaderMenu}
            setActiveHeaderMenu={setActiveHeaderMenu}
            dev3People={dev3People}
            availableLocations={availableLocations}
            huyenReviewedBugs={huyenReviewedBugs}
            huyenDevRepliedBugs={huyenDevRepliedBugs}
            huyenPendingReplyBugs={huyenPendingReplyBugs}
            huyenReviewedNoComments={huyenReviewedNoComments}
          />
        </tr>
      </thead>
      <tbody>
        {pagedBugs.map((b, idx) => (
          <tr
            key={idx}
            style={{
              borderBottom: "1px solid var(--border-3)",
              background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
            }}
          >
            {/* STT */}
            <td
              style={{
                padding: "10px 12px",
                textAlign: "center",
                fontWeight: "600",
                color: "var(--text-3)",
                fontSize: "11px",
              }}
            >
              {(page - 1) * pageSize + idx + 1}
            </td>

            {/* BUG ID */}
            <td style={{ padding: "10px 12px", fontWeight: "600", whiteSpace: "nowrap" }}>
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)", textDecoration: "underline" }}
              >
                {b.bugId || b.id}
              </a>
            </td>

            {/* LINK PR */}
            <td style={{ padding: "10px 12px", textAlign: "center" }}>
              {(() => {
                const prList = extractAllPrUrls(b.pullRequestUrl);
                if (prList.length === 0) return <span style={{ color: "var(--text-3)" }}>—</span>;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                    {prList.map((p, i) => (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-ghost"
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-2)",
                          background: "var(--surface-3)",
                          color: "var(--accent)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                        title={p.url}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v5.256a2.25 2.25 0 101.5 0V5.372zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zm8-7a.75.75 0 100-1.5.75.75 0 000 1.5zm-1.5 5.372v-1.622a2.25 2.25 0 00-2.25-2.25h-1.5v1.5h1.5a.75.75 0 01.75.75v1.622a2.25 2.25 0 101.5 0zm.75 2.128a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                        </svg>
                        {p.prNum ? `${p.repoLabel} #${p.prNum} ↗` : `${p.repoLabel} ↗`}
                        {b.ghCommitsCount && b.ghCommitsCount > 1 ? (
                          <span
                            style={{
                              fontSize: "9px",
                              color: "#d97706",
                              fontWeight: 700,
                              background: "#fef3c7",
                              padding: "0 4px",
                              borderRadius: "3px",
                              marginLeft: "2px",
                            }}
                            title={`Dev đã push ${b.ghCommitsCount} commits bổ sung trên PR này`}
                          >
                            {b.ghCommitsCount}c
                          </span>
                        ) : null}
                      </a>
                    ))}
                  </div>
                );
              })()}
            </td>

            {/* DEV */}
            <td style={{ padding: "10px 12px", fontWeight: "600", color: "var(--text-2)" }}>
              {getDevNameByBug(b)}
            </td>

            {/* TIÊU ĐỀ LỖI */}
            <td style={{ padding: "10px 12px", color: "var(--text-1)", lineHeight: "1.5" }}>
              {b.title}
            </td>

            {/* VỊ TRÍ */}
            <td style={{ padding: "10px 12px" }}>
              {Array.isArray(b.location) && b.location.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {b.location.map((loc, i) => {
                    const st = getLocationTagStyle(loc);
                    return (
                      <span
                        key={i}
                        className="tag"
                        style={{
                          background: st.bg,
                          color: st.color,
                          border: st.border,
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {loc}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: "11px", color: "var(--text-3)" }}>—</span>
              )}
            </td>

            {/* KẾT QUẢ */}
            <td style={{ padding: "10px 12px", textAlign: "center" }}>
              {tableType === "reviewed" ? (
                renderResultBadge ? renderResultBadge(b) : <span style={{ color: "var(--text-3)" }}>—</span>
              ) : (
                <span
                  className="tag"
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "5px",
                  }}
                  title="Bug đang chờ Huyền test & review"
                >
                  Chờ review
                </span>
              )}
            </td>

            {/* TRẠNG THÁI PR */}
            <td style={{ padding: "10px 12px", textAlign: "center" }}>
              {renderLabelBadge(b)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
