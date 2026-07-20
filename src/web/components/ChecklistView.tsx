import { useState, useMemo } from "react";
import type { DashboardView, ChecklistItem } from "../../shared/types";
import { addChecklistItem, updateChecklistItem, deleteChecklistItem, grabChecklistComments } from "../api";

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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{item ? "✏️ Sửa Checklist" : "➕ Thêm Checklist mới"}</h2>

        <label>Mã lỗi (VD: L1, L2...)</label>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="L1" />

        <label>Tiêu đề</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên loại lỗi..." />

        <label>Repository (Ví dụ: lisa-ai-agent)</label>
        <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="lisa-ai-agent" />

        <label>Mô tả chi tiết</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả lỗi hay gặp..." />

        <label>Ví dụ thực tế</label>
        <textarea value={example} onChange={e => setExample(e.target.value)} placeholder="Ví dụ..." />

        <label>Bài học rút ra</label>
        <textarea value={lesson} onChange={e => setLesson(e.target.value)} placeholder="Bài học rút ra..." />

        <label>PRs liên quan (phân cách bằng dấu phẩy)</label>
        <input value={prs} onChange={e => setPrs(e.target.value)} placeholder="lisa-ai-agent/pull/171" />

        <div className="modal-actions">
          <button className="ctrl" onClick={onClose}>Huỷ</button>
          <button className="ctrl ctrl-primary" onClick={handleSubmit}>{item ? "Lưu" : "Thêm"}</button>
        </div>
      </div>
    </div>
  );
}

export function ChecklistView({ view, onUpdate }: { view: DashboardView; onUpdate: () => void }) {
  const [subTab, setSubTab] = useState<"general" | "repo">("general");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem>();
  const [search, setSearch] = useState("");
  const [grabbing, setGrabbing] = useState(false);

  const handleGrab = async () => {
    setGrabbing(true);
    try {
      const res = await grabChecklistComments();
      alert(
        `Đã quét xong PR comments của anh Trường!\n` +
        `- Thêm mới: ${res.addedCount} lỗi\n` +
        `- Gộp/Cập nhật thêm ví dụ: ${res.updatedCount} lỗi.`
      );
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Không quét được comments từ GitHub. Hãy kiểm tra lại Github Token.");
    } finally {
      setGrabbing(false);
    }
  };

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
    if (confirm("Xoá mục này?")) {
      await deleteChecklistItem(id);
      onUpdate();
    }
  };

  // Match bugs to checklist items by PR
  function matchedBugsCount(item: ChecklistItem): number {
    return view.bugs.filter(b => {
      if (!b.pullRequestUrl) return false;
      return item.prs.some(pr => b.pullRequestUrl!.includes(pr));
    }).length;
  }

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    return view.checklist.filter(i =>
      !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [view.checklist, search]);

  // General items (Codes starting with L, e.g. L1-L9, or without repo and not starting with T-)
  const generalItems = useMemo(() => {
    return filteredItems.filter(item => item.code.startsWith("L") || (!item.repo && !item.code.startsWith("T")));
  }, [filteredItems]);

  // Repo normalization helper (lisa-visa-web-backend, lisa-ai-agent, lisa-visa-web, tool-100)
  const normalizeRepoName = (item: ChecklistItem): string => {
    let name = item.repo || "";
    if (!name && item.prs[0]) {
      const path = item.prs[0].replace("https://github.com/", "");
      const parts = path.split("/");
      // e.g., "truongtc/lisa-visa-web/pull/60" -> parts[0]="truongtc", parts[1]="lisa-visa-web"
      if (parts.length > 1) {
        name = parts[1];
      } else {
        name = parts[0];
      }
    }
    name = name.toLowerCase().trim();
    if (name.includes("backend") || name.includes("web-backend")) return "lisa-visa-web-backend";
    if (name.includes("ai-agent")) return "lisa-ai-agent";
    if (name.includes("visa-web") && !name.includes("backend")) return "lisa-visa-web";
    if (name.includes("tool-100") || name.includes("tool100")) return "tool-100";
    return name || "Chung / Khác";
  };

  // Group items by normalized Repository
  const groupedRepoItems = useMemo(() => {
    const repoSpecific = filteredItems.filter(item => item.code.startsWith("T-") || !!item.repo);
    const groups: Record<string, ChecklistItem[]> = {
      "lisa-visa-web-backend": [],
      "lisa-ai-agent": [],
      "lisa-visa-web": [],
      "tool-100": [],
      "Chung / Khác": []
    };

    repoSpecific.forEach(item => {
      const norm = normalizeRepoName(item);
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(item);
    });

    // Remove empty groups except the main 4 if they don't have items? Let's keep them clean
    return Object.fromEntries(
      Object.entries(groups).filter(([key, items]) => items.length > 0 || ["lisa-visa-web-backend", "lisa-ai-agent", "lisa-visa-web", "tool-100"].includes(key))
    );
  }, [filteredItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header with Sub-tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>📋 Checklist Bài Học Kinh Nghiệm</h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Quản trị bài học chất lượng để ngăn chặn lỗi lặp checklist cũ của team dev.
          </p>
        </div>

        {/* Sub-tabs for Checklist */}
        <div style={{ display: "flex", gap: "6px", background: "var(--surface-3)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <button
            className={`ctrl ${subTab === "general" ? "ctrl-primary" : ""}`}
            style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer" }}
            onClick={() => setSubTab("general")}
          >
            📋 Checklist Chung (Core rules)
          </button>
          <button
            className={`ctrl ${subTab === "repo" ? "ctrl-primary" : ""}`}
            style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer" }}
            onClick={() => setSubTab("repo")}
          >
            📂 Lỗi Theo Repo (GitHub grab)
          </button>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", background: "var(--surface-2)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "bold" }}>🔍 TÌM KIẾM:</span>
          <input className="ctrl" style={{ flex: 1, minWidth: "200px", height: "32px", fontSize: "12px" }}
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã lỗi, tiêu đề, mô tả..." />
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          {subTab === "repo" && (
            <button 
              className="ctrl" 
              style={{ 
                background: "rgba(168,85,247,0.15)", 
                color: "var(--accent-2)", 
                border: "1px solid rgba(168,85,247,0.3)",
                height: "32px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: grabbing ? "default" : "pointer"
              }}
              onClick={handleGrab}
              disabled={grabbing}
            >
              {grabbing ? "⏳ Đang quét..." : "⚡ Quét comment anh Trường (18:00)"}
            </button>
          )}
          <button className="ctrl ctrl-primary" style={{ height: "32px", fontSize: "12px" }} onClick={() => setShowModal(true)}>
            ➕ Thêm mới
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: GENERAL CHECKLIST */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {generalItems.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
              Không tìm thấy mục checklist chung nào.
            </div>
          ) : (
            generalItems.map(item => {
              const bugCount = matchedBugsCount(item);
              return (
                <div className="checklist-item" key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="checklist-code">{item.code}</span>
                      <span className="checklist-title-text">{item.title}</span>
                      {bugCount > 0 && (
                        <span className="tag tag-red" style={{ marginLeft: 8 }}>{bugCount} bugs liên quan</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button className="ctrl ctrl-sm" onClick={() => setEditItem(item)}>✏️</button>
                      <button className="ctrl ctrl-sm ctrl-danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </div>
                  </div>

                  <div className="checklist-desc" style={{ whiteSpace: "pre-line", marginTop: 4 }}>
                    {item.description}
                  </div>

                  {item.example && (
                    <div className="checklist-desc" style={{ marginTop: 6, fontStyle: "italic", color: "var(--text-3)", whiteSpace: "pre-line" }}>
                      📌 Ví dụ:<br />{item.example}
                    </div>
                  )}

                  {item.lesson && (
                    <div className="checklist-desc" style={{ marginTop: 6, color: "var(--accent-2)" }}>
                      💡 Bài học: {item.lesson}
                    </div>
                  )}

                  {item.prs && item.prs.length > 0 && (
                    <div className="checklist-prs" style={{ marginTop: 8 }}>
                      {item.prs.map(pr => (
                        <a href={`https://github.com/${pr}`} target="_blank" rel="noopener noreferrer" className="tag tag-blue" key={pr} style={{ textDecoration: "none" }}>
                          {pr.split("/").slice(-3).join("/")} 🔗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: REPO-SPECIFIC CHECKLIST */}
      {/* ──────────────────────────────────────────────────────── */}
      {subTab === "repo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(groupedRepoItems).map(([repoName, repoItems]) => (
            <div key={repoName}>
              {/* Repo Folder Card Header */}
              <div style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--accent-2)",
                background: "rgba(255,255,255,0.02)",
                padding: "10px 14px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  📂 Repo: <strong style={{ color: "var(--text-1)" }}>{repoName}</strong>
                </span>
                <span className="tag tag-gray" style={{ fontSize: "11px", fontWeight: "normal" }}>
                  {repoItems.length} mục lỗi
                </span>
              </div>

              {/* List of items inside repo */}
              {repoItems.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", fontStyle: "italic", fontSize: "12px", border: "1px dashed var(--border)", borderRadius: "6px", textAlign: "center" }}>
                  Chưa ghi nhận lỗi checklist đặc thù nào cho repo này.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {repoItems.map(item => {
                    const bugCount = matchedBugsCount(item);
                    return (
                      <div className="checklist-item" key={item.id} style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span className="checklist-code" style={{ background: "rgba(168,85,247,0.15)", color: "var(--accent-2)" }}>{item.code}</span>
                            <span className="checklist-title-text">{item.title}</span>
                            {bugCount > 0 && (
                              <span className="tag tag-red" style={{ marginLeft: 8 }}>{bugCount} bugs liên quan</span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button className="ctrl ctrl-sm" onClick={() => setEditItem(item)}>✏️</button>
                            <button className="ctrl ctrl-sm ctrl-danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                          </div>
                        </div>

                        <div className="checklist-desc" style={{ whiteSpace: "pre-line", marginTop: 4 }}>
                          {item.description}
                        </div>

                        {item.example && (
                          <div className="checklist-desc" style={{ marginTop: 6, fontStyle: "italic", color: "var(--text-3)", whiteSpace: "pre-line" }}>
                            📌 Ví dụ:<br />{item.example}
                          </div>
                        )}

                        {item.lesson && (
                          <div className="checklist-desc" style={{ marginTop: 6, color: "var(--accent-2)" }}>
                            💡 Bài học: {item.lesson}
                          </div>
                        )}

                        {item.prs && item.prs.length > 0 && (
                          <div className="checklist-prs" style={{ marginTop: 8 }}>
                            {item.prs.map(pr => (
                              <a href={`https://github.com/${pr}`} target="_blank" rel="noopener noreferrer" className="tag tag-blue" key={pr} style={{ textDecoration: "none" }}>
                                {pr.split("/").slice(-3).join("/")} 🔗
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <ChecklistModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editItem && <ChecklistModal item={editItem} onSave={handleEdit} onClose={() => setEditItem(undefined)} />}
    </div>
  );
}
