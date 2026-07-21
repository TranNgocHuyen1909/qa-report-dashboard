import { useState, useEffect } from "react";

export function parsePrUrl(pr: string): { url: string; label: string } {
  const trimmed = pr.trim();
  if (!trimmed) return { url: "#", label: pr };

  if (trimmed.includes("/commit/")) {
    const parts = trimmed.split("/");
    const sha = parts[parts.length - 1].slice(0, 7);
    const repo = parts[parts.length - 3] || "";
    let shortRepo = repo.includes("ai-agent")
      ? "AI"
      : repo.includes("tool-100")
        ? "tool100"
        : repo.includes("backend")
          ? "BE"
          : repo;
    return { url: trimmed, label: `${shortRepo} Commit @${sha}` };
  }

  if (trimmed.includes("/pull/")) {
    const parts = trimmed.split("/");
    const num = parts[parts.length - 1];
    const repo = parts[parts.length - 3] || parts[0];
    let shortRepo = repo.includes("ai-agent")
      ? "AI"
      : repo.includes("tool-100")
        ? "tool100"
        : repo.includes("backend")
          ? "BE"
          : repo;
    return {
      url: trimmed.startsWith("http")
        ? trimmed
        : `https://github.com/truongtc/${trimmed}`,
      label: `${shortRepo} PR #${num}`,
    };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const parts = trimmed.split("/");
    const last = parts[parts.length - 1];
    return { url: trimmed, label: `Link ${last}` };
  }

  let repoPath = "truongtc/lisa-ai-agent";
  let prefix = "AI";
  if (
    trimmed.toLowerCase().includes("be") ||
    trimmed.toLowerCase().includes("backend")
  ) {
    repoPath = "truongtc/lisa-visa-web-backend";
    prefix = "BE";
  } else if (
    trimmed.toLowerCase().includes("tool100") ||
    trimmed.toLowerCase().includes("tool-100")
  ) {
    repoPath = "truongtc/tool-100";
    prefix = "tool100";
  } else if (
    trimmed.toLowerCase().includes("web") &&
    !trimmed.toLowerCase().includes("backend")
  ) {
    repoPath = "truongtc/lisa-visa-web";
    prefix = "WEB";
  }

  const numMatch = trimmed.match(/#?(\d+)/);
  const prNum = numMatch ? numMatch[1] : "";

  if (prNum) {
    return {
      url: `https://github.com/${repoPath}/pull/${prNum}`,
      label: `${prefix} PR #${prNum}`,
    };
  }

  return {
    url: `https://github.com/truongtc/lisa-ai-agent/pulls`,
    label: trimmed,
  };
}

interface ChecklistRule {
  id: string;
  tag: string;
  check: string;
  detail: string;
  prs?: string[];
}

interface RepoConfig {
  title: string;
  badgeColor: string;
  rules: ChecklistRule[];
}

const repoChecklistsConfig: Record<string, RepoConfig> = {
  "tool-100": {
    title: "📦 tool-100 (Regex & Extractors Metadata)",
    badgeColor: "var(--blue)",
    rules: [
      {
        id: "tool-100-test-lint",
        tag: "task audit",
        check: "task audit & task ci — Chạy Audit Sheet & Pipeline Kiểm Thử",
        detail:
          "Bắt buộc chạy 'task audit' (kiểm tra Audit Sheet) và 'task ci' (chạy ruff check, type-check, pytest unit test, schema & version verify) xanh 100% trước khi tạo PR.",
      },
      {
        id: "tool-100-prefix-homonym",
        tag: "FalsePositiveGuard",
        check:
          "Chặn bắt nhầm từ đồng âm / cùng prefix (vd: 'chi', 'so', 'hàn', 'nhật')",
        detail:
          "Regex mới không bắt nhầm từ cùng prefix (vd: 'chi' -> 'chi tiết', 'so' -> 'so sánh', 'hàn' -> 'hàn lâm', 'nhật' -> 'sinh nhật'). Thêm negative-lookahead hoặc FalsePositiveGuard.",
        prs: ["https://github.com/truongtc/tool-100/commit/a5c54b1c"],
      },
      {
        id: "tool-100-accent-variants",
        tag: "Match Accent",
        check:
          "Khai báo restrict_to_match & regex cover đủ biến thể có/không dấu",
        detail:
          "FalsePositiveGuard & regex pattern phải list đủ cả bản có dấu và không dấu: ('hàn', 'han', 'hàn quốc', 'han quoc'). Thiếu biến thể không dấu ➔ guard không hoạt động khi text đã lowercase.",
        prs: ["https://github.com/truongtc/tool-100/commit/97330b9"],
      },
      {
        id: "tool-100-rescue-anchor",
        tag: "Rescue Anchor",
        check:
          "Rescue rule phải có đủ 2 điều kiện anchor (rescue = COND_A AND COND_B)",
        detail:
          "Rescue rule cần đủ 2 điều kiện anchor đồng thời. Chỉ có 1 anchor ➔ over-rescue bắt nhầm cả câu tán gẫu (vd: friend-trip: COND_A = chủ ngữ bạn bè, COND_B = có nghi vấn).",
        prs: ["https://github.com/truongtc/tool-100/commit/29f5bb07"],
      },
      {
        id: "tool-100-subject-negation",
        tag: "Guard Subject & Negation",
        check: "Phân biệt chủ thể user vs bên thứ ba & bỏ qua câu phủ định",
        detail:
          "Filter temporal/past-trip phải kiểm tra chủ thể ('bạn mình vừa đi Hàn' ≠ lịch sử user). Guard chặn ambiguous/bare không được xoá nhầm câu phủ định ('không có sổ đỏ' = không sở hữu tài sản).",
        prs: [
          "https://github.com/truongtc/tool-100/commit/1613781a",
          "https://github.com/truongtc/tool-100/commit/07f55105",
        ],
      },
      {
        id: "tool-100-option-guard",
        tag: "Option Guard",
        check: "Cập nhật _OPTION_DISCUSSION_RE khi thêm alias dạng số",
        detail:
          "Khi thêm alias dạng số ('1 lần', '2 lần') ➔ phải cập nhật cả _OPTION_DISCUSSION_RE bao gồm cả dạng chữ lẫn dạng số để guard câu so sánh giá.",
        prs: ["https://github.com/truongtc/tool-100/commit/a60fd08"],
      },
      {
        id: "tool-100-verb-sync",
        tag: "Verb Set Sync",
        check: "Đồng bộ Verb Set giữa Extractor và Guard",
        detail:
          "Nếu thêm/bỏ verb khỏi pattern tài sản ➔ các regex _REAL_ESTATE_CONTRACT_RE và guard liên quan phải đồng bộ để tránh 1 case ra double-count.",
        prs: ["https://github.com/truongtc/tool-100/commit/26f2d584"],
      },
      {
        id: "tool-100-code-struct",
        tag: "Module Constant & Build",
        check: "Tách regex inline thành constant & Đăng ký build_xxx_rules()",
        detail:
          "Regex phức tạp tách thành constant ở module level (_SELF_CONTACT_TITLE_RE). Class FilterRule mới BẮT BỘC phải được rules.append() vào hàm build_xxx_rules().",
        prs: [
          "https://github.com/truongtc/tool-100/commit/0bb84c2f",
          "https://github.com/truongtc/tool-100/commit/97330b9",
        ],
      },
      {
        id: "tool-100-fixture-union",
        tag: "YAML Fixture & Union",
        check: "Tên Test Case YAML '- name: BSVA-xxx' & Merge Fixture Union",
        detail:
          "Fixture case name đúng format '- name: BSVA-xxx mô tả'. Khi resolve merge conflict trong fixture YAML ➔ luôn giữ CẢ 2 bên (union), không được xoá regression test của main.",
        prs: ["https://github.com/truongtc/tool-100/commit/fa81a144"],
      },
      {
        id: "tool-100-audit",
        tag: "Regression Audit",
        check:
          "Chạy Regression Audit Check từ file Ground-Truth Google Drive Sheet",
        detail:
          "Nạp file Input từ Google Drive Sheet chính thức (https://docs.google.com/spreadsheets/d/1UiVqKCknkImyCj_2a2sfiRsaAjAk4xMoN8uz_Cnevwc/edit?gid=2078879997). Chạy audit run --rule-trace -> audit diff --rules đảm bảo Verdict 🟢 IMPROVED.",
        prs: ["https://github.com/truongtc/tool-100/pull/9"],
      },

    ],
  },
  "lisa-ai-agent": {
    title: "🤖 lisa-ai-agent (Prompts, Decision Matrix & Graph)",
    badgeColor: "#a855f7",
    rules: [
      {
        id: "agent-test-ci",
        tag: "task code:check",
        check:
          "Chạy bộ 3 lệnh Task CI (code:fix, code:check, code:check-strict)",
        detail:
          "Bắt buộc: (1) 'task code:fix' để auto-format, (2) 'task code:check' cho mỗi commit, và (3) 'task code:check-strict' + 'task test' xanh 100% trước khi push/mở PR.",
      },
      {
        id: "agent-philosophy",
        tag: "Tool > AI",
        check: "Triết lý thiết kế: Cái gì Code xử lý được thì để Code xử lý",
        detail:
          "Ưu tiên đưa logic nghiệp vụ vào tool-100 hoặc DeterministicLayer. LLM 7B chỉ dùng khi thật sự cần suy luận ngữ cảnh hoặc sinh câu tự nhiên.",
      },
      {
        id: "agent-cot-hints",
        tag: "FBF Mode & COT_HINTS",
        check: "Chạy nhánh field_by_field (FBF) & CHỈ sửa COT_HINTS",
        detail:
          "• Kiểm tra .env: Nếu METADATA__EXTRACT_MODE đang để 'auto', BẮT BỘC sửa lại env thành 'field_by_field' (FBF).\n• CHỈ maintain duy nhất nhánh field_by_field; nhánh Group (constants.py) đang PENDING kệ nó không cần sửa.\n• Trong field_by_field: COLUMN_PROMPTS đã finetune frozen trên model 7B (giữ nguyên). Mọi logic guard/reasoning BẮT BỘC chỉ thêm vào COT_HINTS.",
        prs: ["https://github.com/truongtc/lisa-ai-agent/pull/137"],
      },

      {
        id: "agent-decision-matrix",
        tag: "Decision Matrix",
        check: "CẤM tự ý chốt nhánh tài liệu khi thiếu Metadata",
        detail:
          "Khi tài liệu có nhiều nhánh phụ thuộc vào thông tin chưa biết (vd: C-3-1 vs C-3-9 tùy loại thân nhân), CẤM tự ý kết luận 1 nhánh. Phải viết dạng điều kiện 'Nếu... thì...' và đặt câu hỏi hỏi bổ sung metadata còn thiếu (MISSING_METADATA).",
        prs: [
          "https://github.com/truongtc/lisa-ai-agent/pull/126",
          "https://github.com/truongtc/lisa-ai-agent/pull/128",
        ],
      },
      {
        id: "agent-eval-metadata",
        tag: "task test:eval:metadata",
        check: "Chạy 'task test:eval:metadata' sinh báo cáo Eval khi sửa COT_HINTS / Metadata LLM",
        detail:
          "Khi sửa COT_HINTS hoặc logic metadata LLM, BẮT BỘC chạy 'task test:eval:metadata' để xem báo cáo trực quan. Bổ sung các test case (happy, unhappy, edge, bug-fix regression) và đảm bảo toàn bộ eval test suite xanh 100% trước khi mở PR.",
      },
      {
        id: "agent-prompt-style",
        tag: "response_style.yaml",
        check: "Sửa response_style.yaml — Gom quy tắc Xưng hô & Mapping",
        detail:
          "Gom tất cả quy tắc xưng hô và ví dụ đúng/sai vào chung block 'Mapping' trong response_style.yaml. Không dùng dấu '/' mập mờ ('anh/chị ➔ em'); viết câu điều kiện tường minh và khớp quy tắc 'mình - bạn'.",
        prs: ["https://github.com/truongtc/lisa-ai-agent/commit/d6d9c581"],
      },
      {
        id: "agent-prompt-task1-guides",
        tag: "task_1.yaml & response_guides.yaml",
        check: "Sửa task_1.yaml & response_guides.yaml — Đồng bộ luật CẤM tự chốt nhánh",
        detail:
          "Khi tài liệu có nhiều nhánh phụ thuộc thông tin chưa biết (vd: C-3-1 vs C-3-9 tùy thân nhân), CẤM tự ý kết luận 1 nhánh. Phải đồng bộ luật viết theo hướng điều kiện 'Nếu... thì...' trong CẢ HẠI FILE task_1.yaml và response_guides.yaml.",
        prs: [
          "https://github.com/truongtc/lisa-ai-agent/pull/126",
          "https://github.com/truongtc/lisa-ai-agent/pull/128",
        ],
      },
      {
        id: "agent-prompt-task2",
        tag: "task_2.yaml",
        check: "Sửa task_2.yaml — Hỏi bổ sung Missing Metadata",
        detail:
          "Chuyên trách dựng prompt hỏi thu thập các trường metadata còn thiếu (MISSING_METADATA). Tối ưu ngắn gọn, tránh từ mơ hồ để LLM 7B không tốn token thừa.",
        prs: ["https://github.com/truongtc/lisa-ai-agent/pull/126"],
      },
      {
        id: "agent-eval-test",
        tag: "Eval Test",
        check: "Không viết Change-Detector Test (assert string prompt)",
        detail:
          "CẤM tuyệt đối unit test assert nguyên văn wording prompt. Test prompt chỉ kiểm tra cấu trúc section header và wiring logic.",
        prs: ["https://github.com/truongtc/lisa-ai-agent/commit/0b5504b7"],
      },
      {
        id: "agent-prompt-guidelines",
        tag: "Prompt Optimization",
        check: "3 Nguyên tắc Tối ưu Prompt chuẩn (Leader truongtc format)",
        detail:
          "• Viết ngắn gọn nhất có thể, nhưng vẫn đủ rõ để model hiểu đúng intent.\n• Tránh các từ mơ hồ, chung chung khiến model phải tự suy diễn.\n• Chỉ giữ lại các instruction thật sự cần thiết cho output mong muốn.\n💡 Lý do: Prompt càng dài LLM càng tốn token, giảm hiệu suất phản hồi.",
      },
    ],
  },
  "lisa-visa-web-backend": {
    title: "⚙️ lisa-visa-web-backend (SQL, Alembic & DB Queries)",
    badgeColor: "var(--cyan)",
    rules: [
      {
        id: "be-ci-check",
        tag: "Testing & Code Style",
        check: "Chạy bộ 3 lệnh CI Backend (pytest, ruff check, ruff format)",
        detail:
          "Bắt buộc chạy sạch sẽ 100% trước khi push/mở PR:\n1. pytest ➔ Run unit/integration tests xanh 100%\n2. ruff check . ➔ Linting code sạch sẽ\n3. ruff format . ➔ Format code theo chuẩn",
      },
    ],
  },
  "lisa-visa-web": {
    title: "🌐 lisa-visa-web (QA Dashboard & UI Components)",
    badgeColor: "var(--green)",
    rules: [
      {
        id: "fe-ci-check",
        tag: "Testing & Code Quality",
        check: "Chạy bộ lệnh CI Frontend (pnpm test, lint:fix, format, type-check)",
        detail:
          "Bắt buộc chạy sạch 100% trước khi commit/push:\n1. pnpm test ➔ Vitest xanh 100%\n2. pnpm lint:fix && pnpm format && pnpm type-check ➔ Clean 100% linter, format & TypeScript types",
      },
      {
        id: "fe-ui-ai-eval",
        tag: "UI Proof & AI Eval",
        check: "Đính kèm ảnh Pre/Post UI trên PR & Đưa AI Đánh giá Giao diện OK",
        detail:
          "• Khi sửa UI: BẮT BỘC dán ảnh/video so sánh Pre (Trước khi sửa) & Post (Sau khi sửa) lên PR Description.\n• Đưa AI Agent (Vision Eval) đánh giá lại giao diện UI; chỉ mở/merge PR khi AI báo giao diện đẹp, đạt chuẩn và OK.",
      },
    ],
  },
};

export function ChecklistView({ initialRepoFilter = "all" }: { initialRepoFilter?: string }) {
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>(initialRepoFilter);
  
  useEffect(() => {
    if (initialRepoFilter) {
      setSelectedRepoFilter(initialRepoFilter);
    }
  }, [initialRepoFilter]);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = localStorage.getItem("qa_interactive_checklist_ticks");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "qa_interactive_checklist_ticks",
      JSON.stringify(checkedState),
    );
  }, [checkedState]);

  const toggleCheck = (id: string) => {
    setCheckedState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetAll = () => {
    if (confirm("Reset tất cả các mục đã tích về chưa tích [ ]?")) {
      setCheckedState({});
    }
  };

  const handleSelectAll = () => {
    const all: Record<string, boolean> = {};
    Object.values(repoChecklistsConfig).forEach((repo) => {
      repo.rules.forEach((rule) => {
        all[rule.id] = true;
      });
    });
    setCheckedState(all);
  };

  // Calculate overall progress
  const allRules = Object.values(repoChecklistsConfig).flatMap((r) => r.rules);
  const totalCount = allRules.length;
  const checkedCount = allRules.filter((r) => !!checkedState[r.id]).length;
  const overallPercentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: "22px" }}>
            📋 Interactive Checklist Tự Kiểm Tra
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-2)",
              margin: "4px 0 0 0",
            }}
          >
            Tích chọn (tick [x]) trực tiếp các tiêu chuẩn Code Review theo Repo
            trước khi gửi PR.
          </p>
        </div>


      </div>



      {/* Quick Repo Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
          background: "var(--surface-2)",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "var(--text-1)",
          }}
        >
          🔍 Lọc theo Repo:
        </span>
        {[
          { id: "all", label: "🌐 Tất cả Repositories (4)" },
          { id: "tool-100", label: "📦 tool-100" },
          { id: "lisa-ai-agent", label: "🤖 lisa-ai-agent" },
          { id: "lisa-visa-web-backend", label: "⚙️ lisa-visa-web-backend" },
          { id: "lisa-visa-web", label: "🖥️ lisa-visa-web" },
        ].map((f) => (
          <button
            key={f.id}
            className={`ctrl ${selectedRepoFilter === f.id ? "ctrl-primary" : ""}`}
            style={{
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => setSelectedRepoFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {Object.keys(checkedState).length > 0 && (
          <button
            className="ctrl ctrl-sm"
            onClick={handleResetAll}
            style={{
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#ef4444",
              borderColor: "rgba(239,68,68,0.3)",
            }}
            title="Bỏ tích tất cả các tiêu chuẩn đã chọn"
          >
            🧹 Bỏ tích tất cả
          </button>
        )}
      </div>

      {/* Accordion Repo Cards with Real Checkboxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {Object.entries(repoChecklistsConfig)
          .filter(
            ([key]) =>
              selectedRepoFilter === "all" || selectedRepoFilter === key,
          )
          .map(([key, config]) => {
            const repoCheckedCount = config.rules.filter(
              (r) => !!checkedState[r.id],
            ).length;
            const repoTotal = config.rules.length;
            const repoPercent = Math.round(
              (repoCheckedCount / repoTotal) * 100,
            );

            return (
              <div
                key={key}
                className="card"
                style={{ padding: "18px", borderRadius: "12px" }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: config.badgeColor,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {config.title}
                    <span
                      className="tag"
                      style={{
                        fontSize: "12px",
                        background:
                          repoCheckedCount === repoTotal
                            ? "rgba(16,185,129,0.2)"
                            : "rgba(59,130,246,0.15)",
                        color:
                          repoCheckedCount === repoTotal
                            ? "var(--green)"
                            : "var(--blue)",
                      }}
                    >
                      {repoCheckedCount}/{repoTotal} đã tích ({repoPercent}%)
                    </span>
                  </div>
                </div>

                {/* Rules with Real Interactive Checkboxes */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {config.rules.map((rule) => {
                    const isChecked = !!checkedState[rule.id];
                    return (
                      <label
                        key={rule.id}
                        style={{
                          display: "flex",
                          gap: "14px",
                          alignItems: "flex-start",
                          background: isChecked
                            ? "rgba(16,185,129,0.06)"
                            : "var(--surface-2)",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: isChecked
                            ? "1px solid rgba(16,185,129,0.3)"
                            : "1px solid var(--border-3)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          userSelect: "none",
                        }}
                      >
                        {/* REAL INTERACTIVE CHECKBOX */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(rule.id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            marginTop: "2px",
                            accentColor: "var(--green)",
                            cursor: "pointer",
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                padding: "2px 7px",
                                background: "var(--surface-3)",
                                color: config.badgeColor,
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              {rule.tag}
                            </span>
                            <strong
                              style={{
                                fontSize: "14px",
                                color: "var(--text-1)",
                              }}
                            >
                              {rule.check}
                            </strong>
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-2)",
                              lineHeight: "1.5",
                            }}
                          >
                            {rule.detail}
                          </div>
                          {rule.prs && rule.prs.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginTop: "6px",
                              }}
                            >
                              {rule.prs.map((pr) => {
                                const parsed = parsePrUrl(pr);
                                return (
                                  <a
                                    key={pr}
                                    href={parsed.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "11px",
                                      background: "rgba(59,130,246,0.15)",
                                      border: "1px solid rgba(59,130,246,0.3)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      color: "var(--blue)",
                                      textDecoration: "none",
                                      fontWeight: "bold",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Mở Pull Request trên GitHub: ${parsed.url}`}
                                  >
                                    🔗 {parsed.label}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
