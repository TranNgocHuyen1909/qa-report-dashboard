import { useMemo, useState } from "react";
import type { DashboardView } from "../../shared/types";

interface RepeatedBugsAnalysisViewProps {
  view: DashboardView;
  activePeriodKey?: string;
  onLockTab?: () => void;
}

export const MASTER_LESSONS = [
  {
    code: "L1",
    title: "Sửa sai tầng — vá triệu chứng",
    category: "Tầng Kiến Trúc & Logic Base",
    desc: 'Sửa prompt AI cho bug nhưng lỗi thật ở tool extract sai. PR vá prompt khi chưa kiểm tra docs/tool nào được load ra.',
    lesson: "Trace đúng tầng trước khi sửa: tool → group-rule → COLUMN_PROMPTS → COT_HINTS → docs → prompt. Nhớ nguyên tắc 'Tool > AI'.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/171", "https://github.com/truongtc/lisa-ai-agent/pull/154", "https://github.com/truongtc/lisa-ai-agent/pull/148", "https://github.com/truongtc/lisa-ai-agent/pull/165"],
    color: "#ef4444"
  },
  {
    code: "L2",
    title: "Test 'xanh giả' — không fail khi logic sai",
    category: "Chất Lượng Test Case",
    desc: 'Assert nguyên văn string nằm trong prompt (đổi wording là vỡ); test backend chỉ so chuỗi SQL; eval equals hạ lowercase làm lọt lỗi.',
    lesson: "Test phải fail khi nghiệp vụ sai, không phải khi câu chữ đổi. Cần đúng casing thì dùng contains/regex phù hợp.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/150", "https://github.com/truongtc/lisa-ai-agent/pull/146", "https://github.com/truongtc/lisa-ai-agent/pull/160", "https://github.com/truongtc/lisa-ai-agent/pull/126", "https://github.com/truongtc/lisa-visa-web-backend/pull/32"],
    color: "#f59e0b"
  },
  {
    code: "L3",
    title: "Test thiếu — chỉ vá đúng câu bug",
    category: "Độ Phủ Test Case",
    desc: 'Fix đúng case bug gốc mà không cover các nhánh liên quan (happy path + absent case + các biến thể cùng nhóm).',
    lesson: "Sửa 1 nhánh → cover cả nhánh: happy + absent (kèm present-mirror) + biến thể, không chỉ mỗi câu bug gốc.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/146", "https://github.com/truongtc/lisa-ai-agent/pull/160", "https://github.com/truongtc/lisa-ai-agent/pull/166"],
    color: "#3b82f6"
  },
  {
    code: "L4",
    title: "Guard/regex allowlist rộng → xoá oan",
    category: "Xử Lý Regex & Boundary",
    desc: 'Guard chặn regex quá rộng làm xoá oan dữ liệu thật của người dùng hoặc bắt nhầm các câu hỏi khác intent.',
    lesson: "Denylist hẹp — chặn đúng cái sai đã kiểm chứng, mặc định tin model; thiết kế theo intent, đừng hứa hẹn bao phủ 'mọi câu'.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/162", "https://github.com/truongtc/tool-100/pull/17"],
    color: "#10b981"
  },
  {
    code: "L5",
    title: "Hiểu sai định nghĩa field / nghiệp vụ",
    category: "Nghiệp Vụ Nguồn Chuẩn",
    desc: 'Hiểu sai phạm vi scope nghiệp vụ (ví dụ: gán sai scope nước đích Schengen với nước khác), dẫn tới viết expected test bị sai.',
    lesson: "Bám nguồn chuẩn (COLUMN_PROMPTS 'for destination country', tool-100 nhận destinations) trước khi viết expected.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/162"],
    color: "#8b5cf6"
  },
  {
    code: "L6",
    title: "Sửa 1 chỗ, sót N chỗ cùng pattern",
    category: "Đồng Bộ Pattern Codebase",
    desc: 'Fix mapping ở 1 quốc gia / module nhưng quên đồng bộ ở các nước hoặc module khác có cùng cấu trúc pattern.',
    lesson: "Fix hệ thống — Grep toàn project quét hết vị trí cùng pattern, ghi rõ 'đã rà soát X, Y, Z' vào PR.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/143"],
    color: "#ec4899"
  },
  {
    code: "L7",
    title: "Prompt mơ hồ / dài dòng",
    category: "Tối Ưu Prompt AI",
    desc: 'Prompt thiếu nhãn ví dụ rõ ràng hoặc quá dài dòng làm model hiểu nhầm hoặc bị trôi thông tin quan trọng.',
    lesson: "Mỗi câu một intent, có nhãn ('Ví dụ:'), cắt token thừa; sửa ở COT_HINTS/yaml, không đụng COLUMN_PROMPTS finetune.",
    prs: ["https://github.com/truongtc/lisa-ai-agent/pull/126", "https://github.com/truongtc/lisa-ai-agent/pull/122", "https://github.com/truongtc/lisa-ai-agent/pull/166", "https://github.com/truongtc/lisa-ai-agent/pull/137"],
    color: "#06b6d4"
  },
  {
    code: "L9",
    title: "An toàn input & vận hành",
    category: "Bảo Mật & Vận Hành Prod",
    desc: 'Thiếu sanitize input khi query SQL (ILIKE wildcard injection) hoặc migration yêu cầu quyền cao gây nổ trên prod.',
    lesson: "Escape input ILIKE (% _ \\) + khai báo ESCAPE; tách thao tác superuser khỏi migration app, note runbook.",
    prs: ["https://github.com/truongtc/lisa-visa-web-backend/pull/32"],
    color: "#6366f1"
  }
];

export function RepeatedBugsAnalysisView({ view, activePeriodKey, onLockTab }: RepeatedBugsAnalysisViewProps) {
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string>("all");
  const [selectedDevFilter, setSelectedDevFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const developers = useMemo(() => {
    return view.personnel.filter(p => p.role !== "benchmark");
  }, [view.personnel]);

  // Active period details
  const activePeriod = useMemo(() => {
    if (!activePeriodKey || activePeriodKey === "all") return null;
    return view.availablePeriods.find(p => p.key === activePeriodKey) || null;
  }, [activePeriodKey, view.availablePeriods]);

  // Automated Classification Engine for all PR Bugs against the 9 Master Lessons
  const categorizedBugs = useMemo(() => {
    const periodBugs = view.bugs.filter(b => {
      const st = (b.status ?? "").toLowerCase();
      if (st === "cancel" || st === "không lỗi" || st === "wontfix") return false;

      // Period filter
      if (activePeriod) {
        const d = b.confirmedDate || b.prCreatedAt || b.lastEditedTime || b.detectedDate;
        const dateStr = d ? String(d).slice(0, 10) : "";
        if (!dateStr || dateStr < activePeriod.startDate || dateStr > activePeriod.endDate) {
          return false;
        }
      }
      return true;
    });

    const items: Array<{
      bugId: string;
      title: string;
      url?: string;
      prUrl?: string;
      devCode: string;
      devName: string;
      location: string;
      status: string;
      matchedLessons: typeof MASTER_LESSONS;
      primaryLesson: (typeof MASTER_LESSONS)[0];
    }> = [];

    periodBugs.forEach(b => {
      const prUrl = b.pullRequestUrl || (b.note && b.note.includes("github.com") ? b.note : undefined);
      
      // Determine Dev Code
      const prAuthor = (b.prAuthor || "").toLowerCase();
      let matchedDev = developers.find(d => {
        const aliases = [d.code.toLowerCase(), d.displayName.toLowerCase(), d.githubUsername?.toLowerCase()].filter(Boolean);
        return aliases.some(a => prAuthor.includes(a as string));
      });

      if (!matchedDev && b.fixedByIds && b.fixedByIds.length > 0) {
        matchedDev = developers.find(d => d.notionIds?.some(id => b.fixedByIds?.includes(id)));
      }

      const devCode = matchedDev ? matchedDev.code : "Unassigned";
      const devName = matchedDev ? matchedDev.displayName : (b.prAuthor || "Dev");

      // Match against 9 Master Lessons & Checklist
      const matchedLessonsSet = new Set<(typeof MASTER_LESSONS)[0]>();

      // 1. Direct PR link matching against Master Lesson PRs & view.checklist
      if (prUrl) {
        MASTER_LESSONS.forEach(les => {
          if (les.prs.some(p => prUrl.toLowerCase().includes(p.toLowerCase()))) {
            matchedLessonsSet.add(les);
          }
        });

        view.checklist.forEach(chk => {
          if (chk.prs.some(p => prUrl.toLowerCase().includes(p.toLowerCase()))) {
            const foundLes = MASTER_LESSONS.find(m => m.code === chk.code || chk.code.includes(m.code));
            if (foundLes) matchedLessonsSet.add(foundLes);
          }
        });
      }

      // 2. Explicit lesson code matching in title/note (e.g. [L1], [L2], [LH-01])
      const titleNote = `${b.title} ${b.note ?? ''}`.toUpperCase();
      MASTER_LESSONS.forEach(les => {
        if (titleNote.includes(`[${les.code}]`) || titleNote.includes(`LH-0${les.code.slice(1)}`)) {
          matchedLessonsSet.add(les);
        }
      });

      const matchedLessons = Array.from(matchedLessonsSet);
      if (matchedLessons.length > 0) {
        items.push({
          bugId: b.bugId || b.id,
          title: b.title,
          url: b.url,
          prUrl,
          devCode,
          devName,
          location: b.location && b.location.length > 0 ? b.location[0] : "Chưa phân loại",
          status: (b.status || "RESOLVED").toUpperCase(),
          matchedLessons,
          primaryLesson: matchedLessons[0]
        });
      }
    });

    return items;
  }, [view.bugs, view.checklist, activePeriod, developers]);

  // Lesson x Dev Matrix calculation
  const matrixData = useMemo(() => {
    const devMap = new Map<string, Record<string, number>>();
    developers.forEach(d => {
      devMap.set(d.code, { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, L7: 0, L8: 0, L9: 0, total: 0 });
    });

    categorizedBugs.forEach(item => {
      const rec = devMap.get(item.devCode);
      if (rec) {
        item.matchedLessons.forEach(les => {
          if (rec[les.code] !== undefined) {
            rec[les.code] += 1;
          }
        });
        rec.total += 1;
      }
    });

    return devMap;
  }, [categorizedBugs, developers]);

  // Filtered List for Table View
  const filteredBugs = useMemo(() => {
    return categorizedBugs.filter(b => {
      const matchDev = selectedDevFilter === "all" || b.devCode === selectedDevFilter;
      const matchLesson = selectedLessonFilter === "all" || b.matchedLessons.some(l => l.code === selectedLessonFilter);
      const matchQuery = !searchQuery.trim() || 
        b.bugId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.devName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchDev && matchLesson && matchQuery;
    });
  }, [categorizedBugs, selectedDevFilter, selectedLessonFilter, searchQuery]);

  // Calculate top metrics
  const totalViolations = categorizedBugs.length;
  
  const lessonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MASTER_LESSONS.forEach(l => { counts[l.code] = 0; });
    categorizedBugs.forEach(b => {
      b.matchedLessons.forEach(l => {
        counts[l.code] = (counts[l.code] || 0) + 1;
      });
    });
    return counts;
  }, [categorizedBugs]);

  const topLesson = useMemo(() => {
    let maxCode = "L1";
    let maxCount = -1;
    Object.entries(lessonCounts).forEach(([code, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxCode = code;
      }
    });
    return MASTER_LESSONS.find(l => l.code === maxCode) || MASTER_LESSONS[0];
  }, [lessonCounts]);

  const topDev = useMemo(() => {
    let maxDev = developers[0]?.displayName || "—";
    let maxCount = -1;
    matrixData.forEach((val, devCode) => {
      if (val.total > maxCount) {
        maxCount = val.total;
        const dObj = developers.find(d => d.code === devCode);
        maxDev = dObj ? dObj.displayName : devCode;
      }
    });
    return { name: maxDev, count: maxCount > 0 ? maxCount : 0 };
  }, [matrixData, developers]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title & Filter Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span> Thống Kê & Phân Loại Lỗi Lặp theo 9 Bài Học Kinh Nghiệm
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Tự động phân loại tất cả các bug lặp lại các bài học xương máu (L1–L9) trong kỳ <strong>{activePeriod?.label ?? "Tất cả các kỳ"}</strong> để giúp Đội ngũ chủ động rà soát & tuân thủ.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: "12px", color: "var(--text-2)" }}>Lọc theo Bài học:</div>
          <select
            className="ctrl"
            value={selectedLessonFilter}
            onChange={e => setSelectedLessonFilter(e.target.value)}
            style={{ fontSize: "12px", padding: "6px 12px", fontWeight: "600" }}
          >
            <option value="all">Tất cả 9 Bài Học Kinh Nghiệm</option>
            {MASTER_LESSONS.map(l => (
              <option key={l.code} value={l.code}>
                [{l.code}] {l.title} ({lessonCounts[l.code] || 0} bug)
              </option>
            ))}
          </select>

          <div style={{ fontSize: "12px", color: "var(--text-2)" }}>Nhân sự:</div>
          <select
            className="ctrl"
            value={selectedDevFilter}
            onChange={e => setSelectedDevFilter(e.target.value)}
            style={{ fontSize: "12px", padding: "6px 12px", fontWeight: "600" }}
          >
            <option value="all">Tất cả Dev</option>
            {developers.map(d => (
              <option key={d.code} value={d.code}>
                {d.displayName} ({matrixData.get(d.code)?.total || 0} bug lặp)
              </option>
            ))}
          </select>

          {onLockTab && (
            <button
              type="button"
              className="ctrl"
              onClick={onLockTab}
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                fontWeight: "700",
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--red)",
                border: "1px solid var(--red)",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Bấm để khóa lại tab này"
            >
              🔒 Khóa Tab Lỗi Lặp
            </button>
          )}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "16px", borderLeft: "4px solid var(--yellow)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "600" }}>TỔNG SỐ LỖI LẶP PHÁT HIỆN</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--yellow)", marginTop: "4px" }}>
            {totalViolations} <span style={{ fontSize: "13px", fontWeight: "normal", color: "var(--text-2)" }}>bug vi phạm</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "6px" }}>
            Phát hiện thông qua rà soát PR và phân tích từ vựng
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "16px", borderLeft: `4px solid ${topLesson.color}` }}>
          <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "600" }}>BÀI HỌC BỊ VI PHẠM NHIỀU NHẤT</div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-1)", marginTop: "4px" }}>
            [{topLesson.code}] {topLesson.title}
          </div>
          <div style={{ fontSize: "11px", color: topLesson.color, fontWeight: "600", marginTop: "6px" }}>
            {lessonCounts[topLesson.code] || 0} bug trùng bài học này
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "16px", borderLeft: "4px solid var(--purple)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "600" }}>DEV CÓ NHIỀU BUG LẶP NHẤT</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--purple)", marginTop: "4px" }}>
            {topDev.name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "6px" }}>
            Ghi nhận {topDev.count} lỗi lặp bài học kinh nghiệm
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "16px", borderLeft: "4px solid var(--cyan)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "600" }}>DANH MỤC 9 BÀI HỌC VÀNG</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--cyan)", marginTop: "4px" }}>
            9 / 9 Bài Học
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-2)", marginTop: "6px" }}>
            Đã tích hợp đầy đủ quy tắc L1–L9 chuẩn QA
          </div>
        </div>
      </div>

      {/* Dev x 9 Lessons Matrix Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "18px" }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📊</span> Ma Trận Phân Bố Lỗi Lặp (Phân Tích Dev x 9 Bài Học Kinh Nghiệm)
        </h3>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "center" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border-2)", fontSize: "11px" }}>
                <th style={{ padding: "10px", textAlign: "left", width: "18%" }}>Nhân sự (Dev)</th>
                {MASTER_LESSONS.map(l => (
                  <th key={l.code} style={{ padding: "10px 4px" }} title={`[${l.code}] ${l.title}`}>
                    <span style={{ color: l.color, fontWeight: "700" }}>{l.code}</span>
                  </th>
                ))}
                <th style={{ padding: "10px", width: "12%", color: "var(--text-1)", fontWeight: "700" }}>TỔNG BUG LẶP</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((dev, idx) => {
                const row = matrixData.get(dev.code) || { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, L7: 0, L8: 0, L9: 0, total: 0 };
                const bg = idx % 2 === 1 ? "rgba(99, 102, 241, 0.015)" : "transparent";

                return (
                  <tr key={dev.code} style={{ background: bg, borderBottom: "1px solid var(--border-3)" }}>
                    <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: "700" }}>
                      {dev.displayName} <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "normal" }}>({dev.code})</span>
                    </td>
                    {MASTER_LESSONS.map(l => {
                      const count = (row as any)[l.code] || 0;
                      return (
                        <td
                          key={l.code}
                          style={{
                            padding: "8px 4px",
                            cursor: count > 0 ? "pointer" : "default"
                          }}
                          onClick={() => {
                            if (count > 0) {
                              setSelectedDevFilter(dev.code);
                              setSelectedLessonFilter(l.code);
                            }
                          }}
                        >
                          {count > 0 ? (
                            <span style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: count >= 3 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                              color: count >= 3 ? "var(--red)" : "var(--yellow)",
                              border: count >= 3 ? "1px solid var(--red)" : "1px solid var(--yellow)"
                            }}>
                              {count}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-3)" }}>0</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: "10px", fontWeight: "800", color: row.total > 0 ? "var(--yellow)" : "var(--text-3)" }}>
                      {row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9 Master Lessons Detailed Cards Grid */}
      <div>
        <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📚</span> Chi Tiết Quy Tắc Phân Loại Theo 9 Bài Học Vàng
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {MASTER_LESSONS.map(l => {
            const count = lessonCounts[l.code] || 0;
            return (
              <div
                key={l.code}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "8px",
                  padding: "16px",
                  borderTop: `4px solid ${l.color}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", background: `${l.color}20`, color: l.color, border: `1px solid ${l.color}` }}>
                      {l.code} — {l.category}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: count > 0 ? "var(--yellow)" : "var(--text-3)" }}>
                      {count} bug lặp
                    </span>
                  </div>
                  <h4 style={{ margin: "4px 0 6px 0", fontSize: "14px", fontWeight: "700", color: "var(--text-1)" }}>
                    {l.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "var(--text-2)", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                    {l.desc}
                  </p>
                </div>

                <div style={{ background: "var(--surface-2)", borderRadius: "6px", padding: "8px 10px", borderLeft: `3px solid ${l.color}`, fontSize: "11.5px", color: "var(--text-1)" }}>
                  <strong>💡 Bài học phòng ngừa:</strong> {l.lesson}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Violated Bugs Search & Data Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "8px", padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🔍</span> Danh Sách Bug Lặp Vi Phạm Bài Học ({filteredBugs.length} bug)
          </h3>
          <input
            type="text"
            className="ctrl"
            placeholder="Tìm theo Bug ID, Tiêu đề, Tên Dev..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "260px", fontSize: "12px", padding: "6px 12px" }}
          />
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          {filteredBugs.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              Không có bug lặp nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border-2)", fontSize: "11px", color: "var(--text-1)", fontWeight: "700" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "14%" }}>BUG ID</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "14%" }}>NHÂN SỰ</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "14%" }}>VỊ TRÍ LỖI</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "18%" }}>MÃ BÀI HỌC VI PHẠM</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "28%" }}>TIÊU ĐỀ LỖI</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", width: "12%" }}>PR GITHUB</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: "700" }}>
                      {b.url ? (
                        <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", textDecoration: "underline" }}>
                          {b.bugId}
                        </a>
                      ) : b.bugId}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: "600", color: "var(--text-1)" }}>
                      {b.devName}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border-3)" }}>
                        {b.location}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {b.matchedLessons.map(les => (
                          <span key={les.code} style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "bold", background: `${les.color}18`, color: les.color, border: `1px solid ${les.color}` }}>
                            [{les.code}] {les.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-1)" }}>
                      {b.title}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {b.prUrl ? (
                        <a href={b.prUrl} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", fontWeight: "bold", textDecoration: "underline" }}>
                          PR Link 🔗
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
