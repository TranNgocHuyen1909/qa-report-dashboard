import React from "react";
import type { BugRecord, Person } from "../../../shared/types";

export interface FilterableTableHeaderProps {
  type: "dev" | "loc" | "result" | "pr";
  title: string;
  widthStyle: string;
  align?: "left" | "center";
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
}

export const FilterableTableHeader: React.FC<FilterableTableHeaderProps> = ({
  type,
  title,
  widthStyle,
  align = "left",
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
}) => {
  const isDevActive = type === "dev" && selectedDevFilter !== "all";
  const isLocActive = type === "loc" && selectedLocFilter !== "all";
  const isResActive = type === "result" && huyenCommentFilter !== "all";
  const isPrActive = type === "pr" && selectedPrFilter !== "all";
  const isActive = isDevActive || isLocActive || isResActive || isPrActive;

  const activeLabel = isDevActive
    ? selectedDevFilter
    : isLocActive
    ? selectedLocFilter
    : isResActive
    ? "Lọc"
    : isPrActive
    ? selectedPrFilter
    : "";

  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: align,
        width: widthStyle,
        cursor: "pointer",
        position: "relative",
        userSelect: "none",
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveHeaderMenu(activeHeaderMenu === type ? null : type);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveHeaderMenu(activeHeaderMenu === type ? null : type);
      }}
      title={`Bấm chuột trái/phải để lọc theo ${title}`}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          justifyContent: align === "center" ? "center" : "flex-start",
          width: "100%",
        }}
      >
        <span
          style={{
            color: isActive ? "#2563eb" : "inherit",
            fontWeight: isActive ? "700" : "600",
          }}
        >
          {title}
        </span>
        {isActive ? (
          <span
            style={{
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "700",
              padding: "1px 5px",
              borderRadius: "4px",
              lineHeight: "1.2",
            }}
          >
            {activeLabel}
          </span>
        ) : (
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-3)",
              opacity: 0.8,
            }}
          >
            ▾
          </span>
        )}
      </div>

      {/* Popover Dropdown Menu */}
      {activeHeaderMenu === type && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: align === "center" ? "50%" : "0",
            transform: align === "center" ? "translateX(-50%)" : "none",
            marginTop: "4px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-2)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            borderRadius: "8px",
            padding: "6px",
            zIndex: 9999,
            minWidth: "160px",
            maxWidth: "220px",
            cursor: "default",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-3)",
              padding: "4px 8px",
              borderBottom: "1px solid var(--border-3)",
              marginBottom: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>LỌC THEO {title.toUpperCase()}</span>
            <span
              style={{ cursor: "pointer", fontSize: "14px" }}
              onClick={() => setActiveHeaderMenu(null)}
            >
              ×
            </span>
          </div>

          {/* Dev Options */}
          {type === "dev" && (
            <>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background:
                    selectedDevFilter === "all"
                      ? "var(--surface-3)"
                      : "transparent",
                  fontWeight: selectedDevFilter === "all" ? "700" : "500",
                  color:
                    selectedDevFilter === "all"
                      ? "var(--accent)"
                      : "var(--text-1)",
                }}
                onClick={() => {
                  setSelectedDevFilter("all");
                  setActiveHeaderMenu(null);
                }}
              >
                Tất cả Dev
              </div>
              {dev3People.map((d) => (
                <div
                  key={d.code}
                  style={{
                    padding: "6px 8px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      selectedDevFilter === d.code
                        ? "var(--surface-3)"
                        : "transparent",
                    fontWeight: selectedDevFilter === d.code ? "700" : "500",
                    color:
                      selectedDevFilter === d.code
                        ? "var(--accent)"
                        : "var(--text-1)",
                  }}
                  onClick={() => {
                    setSelectedDevFilter(d.code);
                    setActiveHeaderMenu(null);
                  }}
                >
                  {d.code}
                </div>
              ))}
            </>
          )}

          {/* Location Options */}
          {type === "loc" && (
            <>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background:
                    selectedLocFilter === "all"
                      ? "var(--surface-3)"
                      : "transparent",
                  fontWeight: selectedLocFilter === "all" ? "700" : "500",
                  color:
                    selectedLocFilter === "all"
                      ? "var(--accent)"
                      : "var(--text-1)",
                }}
                onClick={() => {
                  setSelectedLocFilter("all");
                  setActiveHeaderMenu(null);
                }}
              >
                Tất cả Vị trí ({availableLocations.length})
              </div>
              {availableLocations.map((loc) => (
                <div
                  key={loc}
                  style={{
                    padding: "6px 8px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      selectedLocFilter === loc
                        ? "var(--surface-3)"
                        : "transparent",
                    fontWeight: selectedLocFilter === loc ? "700" : "500",
                    color:
                      selectedLocFilter === loc
                        ? "var(--accent)"
                        : "var(--text-1)",
                  }}
                  onClick={() => {
                    setSelectedLocFilter(loc);
                    setActiveHeaderMenu(null);
                  }}
                >
                  {loc}
                </div>
              ))}
            </>
          )}

          {/* Result Options */}
          {type === "result" && (
            <>
              {[
                { key: "all", label: `Tất cả (${huyenReviewedBugs.length})` },
                { key: "dev_replied", label: `Dev đã reply (${huyenDevRepliedBugs.length})` },
                { key: "pending_reply", label: `Chờ Dev reply (${huyenPendingReplyBugs.length})` },
                { key: "nocomments", label: `Pass (${huyenReviewedNoComments.length})` },
              ].map((opt) => (
                <div
                  key={opt.key}
                  style={{
                    padding: "6px 8px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      huyenCommentFilter === opt.key
                        ? "var(--surface-3)"
                        : "transparent",
                    fontWeight: huyenCommentFilter === opt.key ? "700" : "500",
                    color:
                      huyenCommentFilter === opt.key
                        ? "var(--accent)"
                        : "var(--text-1)",
                  }}
                  onClick={() => {
                    setHuyenCommentFilter(opt.key);
                    setActiveHeaderMenu(null);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </>
          )}

          {/* PR Options */}
          {type === "pr" && (
            <>
              {[
                { key: "all", label: "Tất cả PR / Repo" },
                { key: "tool-100", label: "tool-100 (tool)" },
                { key: "lisa-ai-agent", label: "lisa-ai-agent (agent)" },
                { key: "web", label: "qa-report-dashboard (web)" },
                { key: "wait for deployment", label: "wait for deployment" },
                { key: "ready for review", label: "ready for review" },
                { key: "Closed", label: "Closed / Merged" },
              ].map((opt) => (
                <div
                  key={opt.key}
                  style={{
                    padding: "6px 8px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background:
                      selectedPrFilter === opt.key
                        ? "var(--surface-3)"
                        : "transparent",
                    fontWeight: selectedPrFilter === opt.key ? "700" : "500",
                    color:
                      selectedPrFilter === opt.key
                        ? "var(--accent)"
                        : "var(--text-1)",
                  }}
                  onClick={() => {
                    setSelectedPrFilter(opt.key);
                    setActiveHeaderMenu(null);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </th>
  );
};
