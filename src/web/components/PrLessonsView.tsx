import { useState, useMemo } from "react";
import type { DashboardView, ChecklistItem } from "../../shared/types";
import { addChecklistItem, updateChecklistItem, deleteChecklistItem, grabChecklistComments } from "../api";
import { parsePrUrl } from "./ChecklistView";

function ChecklistModal({ item, onSave, onClose }: {
  item?: ChecklistItem;
  onSave: (data: Partial<ChecklistItem>) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [example, setExample] = useState(item?.example ?? "");
  const [lesson, setLesson] = useState(item?.lesson ?? "");
  const [prs, setPrs] = useState(item?.prs?.join(", ") ?? "");
  const [repo, setRepo] = useState(item?.repo ?? "");

  const handleSubmit = () => {
    let finalRepo = repo.trim();
    if (!finalRepo && prs) {
      const firstPr = prs.split(",")[0].trim();
      const parts = firstPr.split("/");
      if (parts.length > 0) {
        finalRepo = parts[0];
      }
    }

    onSave({
      code,
      title,
      description: desc,
      example: example || undefined,
      lesson: lesson || undefined,
      prs: prs.split(",").map(s => s.trim()).filter(Boolean),
      repo: finalRepo || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: "600px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "14px" }}>
          {item ? "✏️ Sửa bài học kinh nghiệm" : "➕ Thêm bài học mới"}
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Mã lỗi (Code):</label>
            <input 
              type="text" 
              placeholder="VD: L10, T-01..." 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              style={{ width: "100%", padding: "8px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Tiêu đề bài học:</label>
            <input 
              type="text" 
              placeholder="Tên bài học rút ra..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ width: "100%", padding: "8px", fontSize: "13px" }}
            />
          </div>
        </div>

        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Mô tả lỗi thường gặp:</label>
        <textarea 
          placeholder="Mô tả nguyên nhân xảy ra lỗi..." 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
          style={{ width: "100%", minHeight: "60px", marginBottom: "10px", padding: "8px", fontSize: "13px" }}
        />

        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Ví dụ minh họa (Example):</label>
        <textarea 
          placeholder="Case thực tế xảy ra trong PR..." 
          value={example} 
          onChange={e => setExample(e.target.value)} 
          style={{ width: "100%", minHeight: "50px", marginBottom: "10px", padding: "8px", fontSize: "13px" }}
        />

        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Bài học khắc phục cốt lõi:</label>
        <textarea 
          placeholder="Nguyên tắc xử lý chuẩn..." 
          value={lesson} 
          onChange={e => setLesson(e.target.value)} 
          style={{ width: "100%", minHeight: "50px", marginBottom: "10px", padding: "8px", fontSize: "13px" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>PR Links (phân cách bằng dấu phẩy):</label>
            <input 
              type="text" 
              placeholder="VD: lisa-ai-agent/pull/171..." 
              value={prs} 
              onChange={e => setPrs(e.target.value)} 
              style={{ width: "100%", padding: "8px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Repo liên quan:</label>
            <input 
              type="text" 
              placeholder="lisa-ai-agent..." 
              value={repo} 
              onChange={e => setRepo(e.target.value)} 
              style={{ width: "100%", padding: "8px", fontSize: "13px" }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="ctrl" onClick={onClose} style={{ fontSize: "13px" }}>Hủy</button>
          <button className="ctrl ctrl-primary" onClick={handleSubmit} style={{ fontSize: "13px" }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}

export function PrLessonsView({ view, onUpdate }: { view: DashboardView; onUpdate: () => void }) {
  const [subTab, setSubTab] = useState<"core9" | "scraped">("core9");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | undefined>();
  const [grabbing, setGrabbing] = useState(false);

  const handleAdd = async (data: Partial<ChecklistItem>) => {
    await addChecklistItem(data);
    setShowModal(false);
    onUpdate();
  };

  const handleEdit = async (data: Partial<ChecklistItem>) => {
    if (editItem) {
      await updateChecklistItem(editItem.id, data);
      setEditItem(undefined);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Xoá bài học này?")) {
      await deleteChecklistItem(id);
      onUpdate();
    }
  };

  const handleGrabComments = async () => {
    setGrabbing(true);
    try {
      const res = await grabChecklistComments();
      alert(`Đã quét xong PR comments của anh Trường!\n- Đã tự động thêm mới ${res.addedCount || 0} bài học.`);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tự động quét PR comments");
    } finally {
      setGrabbing(false);
    }
  };

  function matchedBugsCount(item: Partial<ChecklistItem>): number {
    if (!view?.bugs || !item?.prs || !Array.isArray(item.prs)) return 0;
    return view.bugs.filter(b => {
      if (!b.pullRequestUrl) return false;
      return item.prs!.some(pr => pr && b.pullRequestUrl!.includes(pr));
    }).length;
  }

  function getItemRepo(item: Partial<ChecklistItem>): string {
    if (item.repo) return item.repo;
    if (item.prs && item.prs.length > 0) {
      const pr = item.prs[0].trim();
      const parts = pr.split("/");
      const pullIndex = parts.indexOf("pull");
      const commitIndex = parts.indexOf("commit");
      const markerIndex = pullIndex >= 0 ? pullIndex : commitIndex;
      if (markerIndex > 0) return parts[markerIndex - 1];
      if (parts[0]) return parts[0].split("#")[0];
    }
    return "";
  }

  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    const list = view?.checklist || [];
    return list.filter(i => {
      const matchSearch =
        !search ||
        (i.title && i.title.toLowerCase().includes(search.toLowerCase())) ||
        (i.code && i.code.toLowerCase().includes(search.toLowerCase())) ||
        (i.description && i.description.toLowerCase().includes(search.toLowerCase()));

      const itemRepo = getItemRepo(i);
      const matchRepo =
        selectedRepoFilter === "all" ||
        itemRepo.toLowerCase().includes(selectedRepoFilter.toLowerCase());

      return matchSearch && matchRepo;
    });
  }, [view?.checklist, search, selectedRepoFilter]);

  const masterList = [
    {
      code: "L1", star: true, highlighted: true,
      title: "Sửa sai tầng — vá triệu chứng",
      desc: 'Sửa prompt AI cho bug "1–15 ngày", nhưng lỗi thật ở tool-100 extract sai. PR#171 vá prompt khi chưa kiểm docs nào được load ra.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/171", "https://github.com/truongtc/lisa-ai-agent/pull/154", "https://github.com/truongtc/lisa-ai-agent/pull/148", "https://github.com/truongtc/lisa-ai-agent/pull/165"],
      lesson: "Trace đúng tầng trước khi sửa: tool-100 → group-rule → COLUMN_PROMPTS (frozen) → COT_HINTS → docs → prompt. Nhớ 'Tool > AI'."
    },
    {
      code: "L2", star: true, highlighted: true,
      title: "Test 'xanh giả' — không fail khi logic sai",
      desc: 'Assert nguyên văn "Du lịch" nằm trong prompt (đổi wording là vỡ); test backend chỉ so chuỗi SQL, không chạy DB; eval equals hạ lowercase nên "du lịch" pass mà production drop.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/150", "https://github.com/truongtc/lisa-ai-agent/pull/146", "https://github.com/truongtc/lisa-ai-agent/pull/160", "https://github.com/truongtc/lisa-ai-agent/pull/126", "https://github.com/truongtc/lisa-visa-web-backend/pull/32"],
      lesson: "Test phải fail khi nghiệp vụ sai, không phải khi câu chữ đổi. Cần đúng casing thì dùng contains/regex."
    },
    {
      code: "L3", star: true, highlighted: true,
      title: "Test thiếu — chỉ vá đúng câu bug",
      desc: 'o2001 thiếu present-mirror "Thất nghiệp"; m0002 nhánh fallback vừa restructure lại mù test; fix "Bỉ 45 ngày" không kèm test.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/146", "https://github.com/truongtc/lisa-ai-agent/pull/160", "https://github.com/truongtc/lisa-ai-agent/pull/166"],
      lesson: "Sửa 1 nhánh → cover cả nhánh: happy + absent (kèm present-mirror) + biến thể, không chỉ câu bug gốc."
    },
    {
      code: "L4", star: false, highlighted: false,
      title: "Guard/regex allowlist rộng → xoá oan",
      desc: 'Guard O9004 "chỉ giữ khi khớp regex" xoá oan câu thật "visa Nhật được cấp năm ngoái"; m0003 bắt nhầm câu hỏi "...2 tháng à?".',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/162", "https://github.com/truongtc/tool-100/pull/17"],
      lesson: "Denylist hẹp — chặn đúng cái sai đã kiểm chứng, mặc định tin model; thiết kế theo intent, đừng liệt kê 'mọi cách khách nói'."
    },
    {
      code: "L5", star: false, isStudy: true, highlighted: true,
      title: "Hiểu sai định nghĩa field / nghiệp vụ",
      desc: 'O9004 scoped theo NƯỚC ĐÍCH, nhưng test gán "đậu visa Mỹ, giờ xin Schengen" = "đã đậu" — sai, vì Schengen chưa có lịch sử.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/162"],
      lesson: "Bám nguồn chuẩn (COLUMN_PROMPTS 'for destination country', tool-100 nhận destinations) trước khi viết expected."
    },
    {
      code: "L6", star: false, highlighted: false,
      title: "Sửa 1 chỗ, sót N chỗ cùng pattern",
      desc: "Fix mapping Schengen nhưng thiếu Iceland / Switzerland / Liechtenstein; token visa copy-paste ở 8 module.",
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/143"],
      lesson: "Fix hệ thống — quét hết vị trí cùng pattern, ghi rõ 'đã rà soát X, Y, Z' vào PR."
    },
    {
      code: "L7", star: false, highlighted: false,
      title: "Prompt mơ hồ / dài dòng",
      desc: 'task_1 viết "ngược lại cái gì?" để model tự đoán; rule THÁI ĐỘ ~1k token; thiếu nhãn "Ví dụ:" khiến model hiểu nhầm.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/126", "https://github.com/truongtc/lisa-ai-agent/pull/122", "https://github.com/truongtc/lisa-ai-agent/pull/166", "https://github.com/truongtc/lisa-ai-agent/pull/137"],
      lesson: "Mỗi câu một intent, có nhãn ('Ví dụ:'), cắt token thừa; sửa ở COT_HINTS/yaml, không đụng COLUMN_PROMPTS finetune."
    },
    {
      code: "L8", star: false, highlighted: false,
      title: "Ẩu quy trình — hygiene & convention",
      desc: 'Comment "giải trình chỉnh sửa AI" thừa; thiếu mã ticket BSVA trong fixture; báo "đã test" chung chung không kèm ảnh.',
      prs: ["https://github.com/truongtc/lisa-ai-agent/pull/142", "https://github.com/truongtc/tool-100/pull/18", "https://github.com/truongtc/tool-100/pull/19", "https://github.com/truongtc/tool-100/pull/22", "https://github.com/truongtc/tool-100/pull/23"],
      lesson: "Gắn ticket; hiểu vì sao code tồn tại rồi mới bỏ (Chesterton's fence); 'đã test' phải kèm ảnh/output."
    },
    {
      code: "L9", star: false, highlighted: false,
      title: "An toàn input & vận hành",
      desc: 'Search ghép f"%{q}%" vào ILIKE → "50%" khớp mọi thứ (wildcard injection); migration CREATE EXTENSION cần superuser, dễ nổ trên prod least-privilege.',
      prs: ["https://github.com/truongtc/lisa-visa-web-backend/pull/32"],
      lesson: "Escape input ILIKE (% _ \\) + khai báo ESCAPE; tách thao tác superuser khỏi migration app, note runbook."
    }
  ];

  const scrapedItems = useMemo(() => {
    return filteredItems.filter(item => !item.code.startsWith("L"));
  }, [filteredItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: "22px" }}>💡 Bài Học Kinh Nghiệm</h1>
          <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "4px 0 0 0" }}>
            Quản trị 9 bài học cốt lõi từ Anh Trường TC &amp; Tự động quét bài học mới từ PR Comments.
          </p>
        </div>

        {/* Sub-tabs for 9 Lessons vs Scraped PR Comments */}
        <div style={{ display: "flex", gap: "6px", background: "var(--surface-3)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <button
            className={`ctrl ${subTab === "core9" ? "ctrl-primary" : ""}`}
            style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => setSubTab("core9")}
          >
            💡 9 Bài Học Cốt Lõi (L1 - L9)
          </button>
          <button
            className={`ctrl ${subTab === "scraped" ? "ctrl-primary" : ""}`}
            style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => setSubTab("scraped")}
          >
            🤖 Quét PR Comments Anh Trường ({scrapedItems.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 9 BÀI HỌC CỐT LÕI (L1 - L9) */}
      {subTab === "core9" && (
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--accent-2)", marginBottom: "12px" }}>
            🏆 Bảng 9 Loại Lỗi Thường Gặp Cốt Lõi (L1 - L9 Master Checklist):
          </div>
          
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-3)", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", width: "260px", fontSize: "13px" }}>Mã &amp; Tiêu đề lỗi</th>
                <th style={{ padding: "10px 12px", fontSize: "13px" }}>Chi tiết nguyên nhân &amp; PR Links</th>
                <th style={{ padding: "10px 12px", width: "340px", fontSize: "13px" }}>Bài học rút ra</th>
              </tr>
            </thead>
            <tbody>
              {masterList.map((item) => {
                const bugCount = matchedBugsCount(item);
                const isStar = item.code === "L1" || item.code === "L2" || item.code === "L3";
                const isStudy = item.code === "L5";
                return (
                  <tr 
                    key={item.code} 
                    style={{ 
                      borderBottom: "1px solid var(--border-3)",
                      background: isStar ? "rgba(99,102,241,0.04)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "4px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          background: isStar ? "rgba(16,185,129,0.15)" : isStudy ? "rgba(6,182,212,0.15)" : "var(--surface-3)",
                          color: isStar ? "var(--green)" : isStudy ? "var(--cyan)" : "var(--text-2)"
                        }}>
                          {item.code} {isStar && "★"} {isStudy && "🔷"}
                        </span>
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "var(--text-1)" }}>
                        {item.title}
                      </div>
                      {bugCount > 0 && (
                        <span className="tag tag-red" style={{ marginTop: "4px", display: "inline-block", fontSize: "11px" }}>{bugCount} bugs</span>
                      )}
                    </td>

                    <td style={{ padding: "12px", verticalAlign: "top", color: "var(--text-2)", lineHeight: "1.5", fontSize: "13px" }}>
                      <div style={{ whiteSpace: "pre-line" }}>{item.desc}</div>
                      {item.prs && item.prs.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                          {item.prs.map(pr => {
                            const parsed = parsePrUrl(pr);
                            return (
                              <a 
                                key={pr} 
                                href={parsed.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                  fontSize: "12px", 
                                  background: "rgba(59,130,246,0.15)", 
                                  border: "1px solid rgba(59,130,246,0.3)",
                                  padding: "3px 8px", 
                                  borderRadius: "6px", 
                                  color: "var(--blue)",
                                  textDecoration: "none",
                                  fontWeight: "bold",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                                title={`Mở Pull Request: ${parsed.url}`}
                              >
                                🔗 {parsed.label}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px", verticalAlign: "top", color: "var(--text-1)", lineHeight: "1.5", fontSize: "13px" }}>
                      {item.lesson}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 2: QUÉT PR COMMENTS TỰ ĐỘNG (SCRAPED COMMENTS) */}
      {subTab === "scraped" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "var(--text-1)" }}>🤖 Quét PR Comments Tự Động Từ GitHub</strong>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>Tự động tìm kiếm các comment nhận xét của Anh Trường TC trên GitHub PRs và chuyển thành bài học.</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className="ctrl ctrl-primary" 
                onClick={handleGrabComments} 
                disabled={grabbing}
                style={{ fontSize: "13px" }}
              >
                {grabbing ? "🔄 Đang quét..." : "🤖 Quét Ngay Bây Giờ"}
              </button>
              <button className="ctrl ctrl-primary" onClick={() => setShowModal(true)} style={{ fontSize: "13px" }}>
                ➕ Thêm thủ công
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm bài học PR..."
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "260px", fontSize: "13px" }}
            />

            <select
              className="ctrl"
              value={selectedRepoFilter}
              onChange={e => setSelectedRepoFilter(e.target.value)}
              style={{ fontSize: "13px", padding: "6px 12px", fontWeight: "bold" }}
            >
              <option value="all">🌐 Tất cả Repositories</option>
              <option value="tool-100">📦 tool-100</option>
              <option value="lisa-ai-agent">🤖 lisa-ai-agent</option>
              <option value="lisa-visa-web-backend">⚙️ lisa-visa-web-backend</option>
              <option value="lisa-visa-web">🌐 lisa-visa-web</option>
            </select>
          </div>

          {scrapedItems.length === 0 ? (
            <div className="card" style={{ padding: "30px", textAlign: "center", color: "var(--text-3)" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>Không tìm thấy bài học nào phù hợp filter. Nhấn nút <strong>"🤖 Quét Ngay Bây Giờ"</strong> ở trên để tự động quét từ GitHub!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {scrapedItems.map(item => {
                const repoName = getItemRepo(item);
                return (
                  <div key={item.id} className="card" style={{ padding: "16px", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ padding: "2px 8px", background: "rgba(59,130,246,0.15)", color: "var(--blue)", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>{item.code}</span>
                        {repoName && (
                          <span style={{ padding: "2px 8px", background: "rgba(37,99,235,0.15)", color: "#2563eb", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                            {repoName}
                          </span>
                        )}
                        <strong style={{ fontSize: "14px", color: "var(--text-1)" }}>{item.title}</strong>
                      </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button className="ctrl ctrl-sm" onClick={() => setEditItem(item)}>✏️ Sửa</button>
                      <button className="ctrl ctrl-sm ctrl-danger" onClick={() => handleDelete(item.id)}>🗑️ Xoá</button>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--text-2)", marginTop: "8px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                    {item.description}
                  </div>

                  {item.lesson && (
                    <div style={{ fontSize: "13px", color: "var(--green)", marginTop: "6px", fontWeight: "bold" }}>
                      💡 Bài học: {item.lesson}
                    </div>
                  )}

                  {item.prs && item.prs.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      {item.prs.map(pr => {
                        const parsed = parsePrUrl(pr);
                        return (
                          <a key={pr} href={parsed.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--blue)", textDecoration: "none" }}>
                            🔗 {parsed.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {(showModal || editItem) && (
        <ChecklistModal
          item={editItem}
          onSave={editItem ? handleEdit : handleAdd}
          onClose={() => { setShowModal(false); setEditItem(undefined); }}
        />
      )}
    </div>
  );
}
