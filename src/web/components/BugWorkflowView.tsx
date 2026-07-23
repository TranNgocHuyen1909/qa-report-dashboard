import React from "react";

export function BugWorkflowView({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string, repo?: string) => void;
}) {
  const steps = [
    {
      num: 1,
      badge: "Notion Status: New ➔ In Progress",
      shortTitle: "1. Nhận Task",
      title:
        "1. Tự Chọn Task (Ưu Tiên Priority), Đổi Status & Test Tái Hiện 10 Lần",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Kiểm tra Priority khi nhận task trên Notion, gán chính chủ, điền ngày Estimate và test tái hiện biến thể.",
      actionNodes: [
        <>
          <strong>Ưu tiên Priority:</strong> Nhận task theo thứ tự:{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Critical</span>{" "}
          ➔ <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>High</span> ➔{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Medium</span> ➔{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Low</span>. Đọc
          kỹ ô <strong>Note</strong> trước khi nhận.
        </>,
        <>
          <strong>Đổi Status Notion:</strong> Chuyển <code>Status</code> từ{" "}
          <strong>New</strong> ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>In Progress</strong>.
        </>,
        <>
          <strong>Gán Assignee:</strong> Đổi trường <code>Fixed by</code> sang{" "}
          <strong>tên bản thân</strong>.
        </>,
        <>
          <strong>BẮT BUỘC điền 2 trường ngày:</strong> 📅{" "}
          <strong>Ngày bắt đầu xử lý</strong> &amp; 📅{" "}
          <strong>Ngày dự định hoàn thành</strong> (Estimate).
        </>,
        <>
          <strong>Gắn link Notion bài học tương tự (Ref Notion Link):</strong>{" "}
          Nếu nhận task thấy có pattern tương tự task cũ bản thân hoặc ai đó đã
          làm ➔{" "}
          <strong>
            Copy link Notion card cũ dán vào ô <code>Note</code>
          </strong>{" "}
          để ref phương án fix (tránh làm lại từ đầu).
        </>,
        <>
          <strong>Test tái hiện 10 lần (ChatGPT / AI):</strong> Tạo biến thể
          script (wording, casing, ngữ pháp). Run test 10 lần:
          <div
            style={{
              marginTop: "4px",
              paddingLeft: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div>
              🟢 <strong>10/10 PASS:</strong> Ghi rõ vào ô <code>Note</code> là{" "}
              <strong>"Không tái hiện được (Đã test 10 lần biến thể)"</strong> ➔
              Chuyển <code>Status</code> sang{" "}
              <strong style={{ color: "var(--text-1)" }}>Cancel</strong> (tránh sai
              Effort).
            </div>
            <div>
              🔴 <strong>1/10 FAIL:</strong>{" "}
              <strong style={{ color: "var(--text-1)" }}>
                BẮT BUỘC XÁC NHẬN LÀ BUG THỰC SỰ
              </strong>{" "}
              (Theo chỉ đạo anh Đạt: Không coi thường lỗi thi thoảng, bắt buộc
              trace Root Cause sửa dứt điểm).
            </div>
          </div>
        </>,
      ],
      notionFields: [
        "Priority (Critical ➔ High ➔ Medium ➔ Low)",
        "Note (Ghi chú mô tả lỗi)",
        "Status ➔ In Progress",
        "Fixed by ➔ Tên Dev",
        "📅 Ngày bắt đầu xử lý",
        "📅 Ngày dự định hoàn thành",
      ],
      icon: "📥",
    },
    {
      num: 2,
      badge: "Root Cause Analysis",
      shortTitle: "2. Phân Tích",
      title: "2. Phân Tích Nguyên Nhân Gốc Rễ & Báo Cáo Team Lead",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Phân tích kỹ lưỡng tầng phát sinh lỗi trước khi gõ code, áp dụng nguyên tắc Tool > AI.",
      actionNodes: [
        <>
          <strong>Trace đúng 6 tầng lỗi:</strong> <code>tool-100</code> ➔{" "}
          <code>group-rule</code> ➔ <code>COLUMN_PROMPTS (frozen)</code> ➔{" "}
          <code>COT_HINTS</code> ➔ <code>docs</code> ➔ <code>prompt</code>. Khẩu
          quyết: <strong style={{ color: "var(--text-1)" }}>"Tool &gt; AI"</strong>.
        </>,
        <>
          <div
            style={{
              marginTop: "4px",
              background: "var(--surface-3)",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid var(--border-3)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "13px",
                color: "var(--text-1)",
                marginBottom: "12px",
              }}
            >
              🔀 SƠ ĐỒ PHÂN NHÁNH QUYẾT ĐỊNH CHẨN ĐOÁN &amp; XỬ LÝ THEO 4 TẦNG
              LỖI THỰC TỰU
            </div>

            {/* 4 Branching Columns Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
              }}
            >
              {/* Branch 1: Metadata */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--text-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    borderBottom: "1px solid var(--border-2)",
                    paddingBottom: "4px",
                  }}
                >
                  🔍 1. NẾU LÀ METADATA
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-1)",
                    fontStyle: "italic",
                  }}
                >
                  JSON/Sidebar thiếu hoặc sai Field
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "2px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "6px",
                      borderRadius: "6px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                      lineHeight: "1.3",
                    }}
                  >
                    🔹{" "}
                    <strong>
                      Status = <code>exactly</code>:
                    </strong>
                    <br />➔{" "}
                    <strong style={{ color: "var(--text-1)" }}>
                      SỬA Ở REPO <code>tool-100</code>
                    </strong>{" "}
                    (Cấm đụng prompt AI)
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "6px",
                      borderRadius: "6px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                      lineHeight: "1.3",
                    }}
                  >
                    🔹{" "}
                    <strong>
                      Status = <code>high</code> (rescue):
                    </strong>
                    <br />➔ Sửa ở <code>COT_HINTS</code> / prompt AI
                  </div>
                </div>
              </div>

              {/* Branch 2: Docs */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--text-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    borderBottom: "1px solid var(--border-2)",
                    paddingBottom: "4px",
                  }}
                >
                  📖 2. NẾU LÀ DOCS (RAG / MARKET DATA)
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-1)",
                    fontStyle: "italic",
                  }}
                >
                  Quy trình chuẩn khi phát hiện lỗi do Docs
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "2px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    1️⃣ <strong>Đổi phân loại:</strong> Chuyển category bug sang <strong>Docs</strong> ở Notion.
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    2️⃣ <strong>Dev test local:</strong> Tự sửa doc local test OK ➔ Hú Tester/OP sửa trên Google Drive (báo anh An).
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    3️⃣ <strong>Fixed by:</strong> Tag tên <strong>Dev điều tra + Tester/OP sửa doc</strong>.
                  </div>
                  <div
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    4️⃣ <strong>Sync Drive &amp; Commit:</strong> Get doc từ Drive về (map 100%) ➔ Re-test OK ➔ Commit &amp; đổi Status bug.
                  </div>
                </div>
              </div>

              {/* Branch 3: Prompt AI */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--text-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    borderBottom: "1px solid var(--border-2)",
                    paddingBottom: "4px",
                  }}
                >
                  🤖 3. NẾU LÀ PROMPT AI
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-1)",
                    fontStyle: "italic",
                  }}
                >
                  Metadata &amp; Docs ĐÚNG, AI sai format
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "2px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      fontSize: "11px",
                    }}
                  >
                    1️⃣ Sửa ở <code>COT_HINTS</code> / yaml prompt
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      fontSize: "11px",
                    }}
                  >
                    2️⃣ Thêm nhãn <em>"Ví dụ:"</em> &amp; cắt token thừa
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    🛑{" "}
                    <strong style={{ color: "var(--text-1)" }}>
                      CẤM ĐỤNG COLUMN_PROMPTS
                    </strong>{" "}
                    (Frozen)
                  </div>
                </div>
              </div>

              {/* Branch 4: Graph Flow */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--text-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    borderBottom: "1px solid var(--border-2)",
                    paddingBottom: "4px",
                  }}
                >
                  🔄 4. NẾU LÀ GRAPH FLOW
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-1)",
                    fontStyle: "italic",
                  }}
                >
                  Cả 3 tầng trên đúng, sai luồng Node
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "2px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      fontSize: "11px",
                    }}
                  >
                    1️⃣ Soi 8 Graph Nodes (<code>greeting</code>,{" "}
                    <code>metadata</code>, <code>intent</code>,{" "}
                    <code>reject</code>, <code>mandatory</code>,{" "}
                    <code>compare</code>, <code>currency</code>,{" "}
                    <code>suggestion</code>)
                  </div>
                  <div
                    style={{
                      background: "var(--surface-3)",
                      padding: "5px 6px",
                      borderRadius: "5px",
                      borderLeft: "3px solid var(--text-1)",
                      fontSize: "11px",
                    }}
                  >
                    2️⃣ Check <code>routing logic</code> &amp; payload trên{" "}
                    <code>ChatState</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>,
        <>
          🚨 <strong>Quy trình Leo Thang khi vướng (Escalation Rule):</strong>{" "}
          Lỗi ảnh hưởng quá rộng hoặc <strong>không chắc cách sửa</strong> ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>BẮT BUỘC hỏi Huyền trước</strong>
          . Nếu Huyền không giải quyết được ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>
            Gửi sang nhóm Issue hỏi trực tiếp Anh Trường
          </strong>
          .
        </>,
        <>
          <strong>Cập nhật Vị trí lỗi Notion:</strong> Nếu trace xong phát hiện{" "}
          <code>Vị trí lỗi</code> ban đầu bị đánh sai ➔ Dev{" "}
          <strong>NÊN SỬA LẠI ĐÚNG TẦNG LỖI THỰC TỰU</strong> để báo cáo thống
          kê (stats) chuẩn xác hơn.
        </>,
      ],
      notionFields: ["Vị trí lỗi"],
      icon: "🔎",
    },
    {
      num: 3,
      badge: "Code & Self-Test",
      shortTitle: "3. Fix Code",
      title: "3. Fix Code & Tự Kiểm Tra QC (Repo Checklist)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Sửa mã nguồn chính xác và tự kiểm tra chất lượng theo chuẩn Repo Checklist.",
      actionNodes: [
        <>
          <strong>Fix Code sạch:</strong> Thực hiện sửa code logic, tuyệt đối
          không làm vỡ các chức năng liên quan.
        </>,
        <>
          <strong>Rà soát ngang (Rule L6):</strong> Sửa 1 chỗ ➔{" "}
          <strong>BẮT BUỘC rà soát N chỗ cùng pattern</strong> trong codebase.
          <div
            style={{
              marginTop: "6px",
              padding: "8px 12px",
              background: "var(--surface-3)",
              borderRadius: "6px",
              borderLeft: "3px solid var(--text-1)",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
          >
            ⚠️ <strong style={{ color: "var(--text-1)" }}>PHẢI BÁO ANH TRƯỜNG PHÊ DUYỆT:</strong> Khi rà soát phát hiện ra các vị trí cần triển khai ngang, PHẢI nhắn báo lên cho Anh Trường (anh T) để phê duyệt trước khi tiến hành sửa code!
          </div>
        </>,
        <>
          👉 <strong>BẮT BUỘC tuân thủ Repo Checklists trước khi PR:</strong>
          <div
            style={{
              marginTop: "8px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {[
              {
                id: "tool-100",
                badge: "📦 tool-100",
                color: "var(--text-1)",
                detail: "Chạy task audit xanh 100%, check FalsePositiveGuard cùng prefix/accent, rescue anchor & Audit Sheet.",
              },
              {
                id: "lisa-ai-agent",
                badge: "🤖 lisa-ai-agent",
                color: "var(--text-1)",
                detail: "Chạy task code:check-strict, task test:eval:metadata, mode field_by_field & chỉ sửa COT_HINTS.",
              },
              {
                id: "lisa-visa-web-backend",
                badge: "⚙️ lisa-visa-web-backend",
                color: "var(--text-1)",
                detail: "Chạy bộ 3 lệnh CI Backend (pytest, ruff check ., ruff format .).",
              },
              {
                id: "lisa-visa-web",
                badge: "🌐 lisa-visa-web",
                color: "var(--text-1)",
                detail: "Chạy pnpm test, lint:fix, format, type-check. Ảnh Pre/Post UI & AI Vision Eval OK.",
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab?.("checklist", item.id)}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-2)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
                title={`Click để chuyển sang tab Checklist repo ${item.id}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: item.color }}>
                    {item.badge}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-1)", fontWeight: "bold" }}>
                    Tới Checklist ↗
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-1)", lineHeight: "1.35" }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </>,
      ],
      notionFields: ["Cần triển khai ngang (Checkbox)", "Tiêu chí vi phạm"],
      icon: "🛠",
    },
    {
      num: 4,
      badge: "Notion Status: In Progress ➔ Resolved",
      shortTitle: "4. Tạo PR",
      title: "4. Tạo PR trên GitHub & Đính Kèm Link vào Card Notion",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Đẩy code lên GitHub repository, đính kèm mã ticket BSVA và dán PR URL vào Notion.",
      actionNodes: [
        <>
          <strong>Tuân thủ PR Template:</strong> Viết tiêu đề Conventional Commits (vd:{" "}
          <code>fix(ai-agent): resolve BSVA-102</code>) và trình bày theo đúng <strong>PR Template</strong> tiêu chuẩn dự án.
        </>,
        <>
          <strong>BẮT BUỘC ĐÍNH KÈM ANH MINH HỌA (SCREENSHOT):</strong>
          <div
            style={{
              marginTop: "4px",
              paddingLeft: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div>📦 <strong>tool-100:</strong> Ảnh chụp màn hình kết quả sau khi chạy test Audit Sheet (<code>task audit</code> xanh 100%).</div>
            <div>🌐 <strong>Web / Frontend / Backend:</strong> Ảnh chụp màn hình giao diện Web (Pre/Post UI) hoặc kết quả chạy test terminal.</div>
          </div>
        </>,
        <>
          <strong>Điền Số giờ fix:</strong> BẮT BUỘC nhập tổng số giờ thực tế đã thực hiện (tính từ lúc chuyển <code>In Progress</code> đến khi fix xong) vào ô <code>Số giờ fix</code> trên Notion card.
        </>,
        <>
          <strong>BẮT BUỘC DÁN LINK PR:</strong> Copy URL PR GitHub dán vào ô{" "}
          <code>Pull Request</code> trên Notion card và viết ngắn gọn nguyên nhân/cách sửa vào ô <code>Giải pháp xử lý</code>.
        </>,
        <>
          <strong>Đổi Status Notion:</strong> Chuyển <code>Status</code> từ{" "}
          <strong>In Progress</strong> ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>Resolved (Chờ Review)</strong>.
        </>,
      ],
      notionFields: [
        "Pull Request (URL bắt buộc)",
        "Số giờ fix (Number bắt buộc)",
        "Status ➔ Resolved",
        "Giải pháp xử lý (Text)",
      ],
      icon: "🔗",
    },
    {
      num: 5,
      badge: "Notion Status: Resolved ➔ Wait for dev",
      shortTitle: "5. Vòng 1: Huyền",
      title: "5. Review Vòng 1 — Do Huyền Kiểm Soát (BẮT BUỘC QUA VÒNG HUYỀN TRƯỚC)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Mọi PR/bug BẮT BUỘC phải qua Vòng 1 (Huyền test thực tế & kiểm soát ô Reviewers + Số giờ review) trước khi chuyển sang Anh Trường Vòng 2.",
      actionNodes: [
        <>
          🔒 <strong style={{ color: "var(--text-1)" }}>QUY TẮC TUẦN TỰ NGUYÊN TẮC:</strong> Bug/PR <strong>BẮT BUỘC PHẢI QUA VÒNG HUYỀN TEST &amp; DUYỆT TRƯỚC (VÒNG 1)</strong> thì mới được cấp nhãn <span className="tag tag-green">wait for development</span> để chuyển sang Vòng 2!
        </>,
        <>
          👑 <strong>Trường Hợp 1 — Huyền KHÔNG COMMENT (OK Hết):</strong> Test thực tế Pass ➔ Huyền <strong>tự đổi Label Notion ➔</strong> <span className="tag tag-green">wait for development</span> và <strong>tự điền</strong> <span className="tag tag-blue">Số giờ review</span> (2 trường này do duy nhất Huyền quản lý).
        </>,
        <>
          🔔 <strong>Trường Hợp 2 — Huyền CÓ COMMENT (Dev Bắt Buộc Reply &amp; Resolve):</strong>
          <div style={{ marginTop: "4px", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-1)" }}>
            <div>• Dev <strong>BẮT BUỘC reply trực tiếp bên dưới comment</strong> (ghi rõ "Đã sửa" hoặc lý do không sửa) để Huyền nhận notification.</div>
            <div>• Dev <strong>bấm nút Resolve conversation</strong>.</div>
            <div>• Huyền nhận noti sẽ re-check ➔ Test Pass thì <strong>tự đổi Label Notion ➔</strong> <span className="tag tag-green">wait for development</span> và <strong>điền Số giờ review</strong>.</div>
          </div>
        </>,
      ],
      notionFields: [
        "Reviewers ➔ Huyền (Duy nhất Huyền quản lý)",
        "Số giờ review (Duy nhất Huyền điền)",
        "Status / Label ➔ wait for development",
      ],
      icon: "👑",
    },
    {
      num: 6,
      badge: "Notion Status: Wait for dev ➔ Deployed",
      shortTitle: "6. Vòng 2: Anh Trường",
      title: "6. Review Vòng 2 — Tech Lead Review (Anh Trường 1h Đầu Buổi Chiều)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Anh Trường CHỈ collect và review logic những PR ĐÃ QUA VÒNG HUYỀN (có nhãn wait for development) trong 1 tiếng đầu buổi chiều.",
      actionNodes: [
        <>
          ⛔ <strong style={{ color: "var(--text-1)" }}>ĐIỀU KIỆN CẦN (ĐÃ QUA VÒNG HUYỀN):</strong> Anh Trường <strong>CHỈ REVIEW NHỮNG PR ĐÃ QUA VÒNG 1 (HUYỀN DUYỆT PASS)</strong> mang nhãn <span className="tag tag-green">wait for development</span>. Tuyệt đối không review nhảy cóc!
        </>,
        <>
          ⏱️ <strong>Lịch Collect &amp; Review Cố Định Của Anh Trường:</strong> Anh Trường dành <span className="tag tag-yellow" style={{ fontSize: "12px", fontWeight: "bold" }}>⏱️ 1 tiếng đầu buổi chiều mỗi ngày</span> để gom (collect) và review toàn bộ các PR có Label <span className="tag tag-green">wait for development</span> (do Huyền đã duyệt ở Vòng 1).
        </>,
        <>
          💬 <strong>Anh Trường CHỈ CÓ COMMENT (Nếu Cần Sửa Logic):</strong> Anh Trường sẽ <strong>viết comment chỉ rõ chỗ cần sửa</strong> trên PR và <strong>đổi Label Notion ➔</strong> <span className="tag tag-red">change requested</span>.
        </>,
        <>
          🔄 <strong>Quy Trình Dev Sửa Code &amp; Đổi Label Báo Review Lại:</strong> Sau khi Dev sửa xong, reply giải thích dưới comment, <strong>bấm Resolve conversation</strong> và <strong>tự đổi Label Notion ➔</strong> <span className="tag tag-blue">ready for review</span> để báo Anh Trường review lại!
        </>,
        <>
          🚀 <strong>Khi Anh Trường Review OK &amp; Merge PR:</strong> Merge PR &amp; deploy server ➔ Chuyển <code>Status</code> Notion ➔ <span className="tag" style={{ background: "var(--surface-3)", color: "var(--text-1)", fontWeight: "bold" }}>Deployed</span> và <strong>bàn giao cho bên OP (Thương &amp; Linh) test nghiệm thu lại!</strong>
        </>,
      ],
      notionFields: [
        "Status / Label ➔ wait for development ➔ Deployed",
      ],
      icon: "👨‍💻",
    },
    {
      num: 7,
      badge: "Decision: Closed OR Reopen",
      shortTitle: "7. Close Bug",
      title: "7. OP (Thương & Linh) Test Nghiệm Thu: Closed (Pass) HOẶC Reopen (Fail)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Bên OP (Thương & Linh) nghiệm thu thực tế sau khi status chuyển Deployed.",
      actionNodes: [
        <>
          🟢 <strong>NẾU TEST PASS (OP Thương &amp; Linh Nghiệm thu OK):</strong> Tính năng / fix bug chạy chuẩn ➔ Bên OP (Thương &amp; Linh) đổi <code>Status</code> Notion ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>Closed</strong>. <em>(Lưu ý: OP CHỈ đóng Status trên Notion card; PR trên GitHub do Dev/Lead tự quản lý &amp; merge/close).</em>
        </>,
        <>
          🔴 <strong>NẾU TEST FAIL (Tái phát lỗi):</strong> Chuyển <code>Status</code> ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>Reopened</strong>.
        </>,
        <>
          🔄 <strong style={{ color: "var(--text-1)" }}>LUỒNG MŨI TÊN QUAY VỀ BƯỚC 2 (PHÂN TÍCH LỖI):</strong> Bug Reopen tự động <strong>chỉa mũi tên quay ngược về ↩️ Bước 2 (Phân Tích &amp; Phân Loại Bug: Logic Code vs RAG Docs)</strong>. Dev bắt buộc re-trace Root Cause &amp; họp với Lead trước khi fix lại!
        </>,
      ],
      notionFields: [
        "Status ➔ Closed (nếu Pass)",
        "Status ➔ Reopened (nếu Fail)",
        "Ngày mở lại",
      ],
      icon: "⚖️",
    },
  ];

  const scrollToStep = (stepNum: number) => {
    const el = document.getElementById(`step-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
      <div>
        <h1 className="section-title" style={{ margin: "0 0 4px 0" }}>
          ⚡ Quy Trình Xử Lý Bug End-to-End (Notion Status &amp; Branching)
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-1)",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Sơ đồ quy trình chuẩn chỉnh: <code>New</code> ➔{" "}
          <code>In Progress</code> ➔ <code>Resolved</code> ➔{" "}
          <code>Deployed</code> ➔ <code>Closed</code> (hoặc{" "}
          <code>Reopened</code> nếu deploy xong test fail). Bấm vào ô bất kỳ bên
          dưới để nhảy trực tiếp tới bước chi tiết.
        </p>
      </div>

      {/* Integrated Black Box Model Input/Output Banner */}
      <div className="card" style={{ padding: "16px 20px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "14px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-1)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📦</span> Mô Hình &quot;Black Box&quot; Sửa Bug (Đầu Vào - Quy Trình - Đầu Ra Chuẩn Hóa)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ background: "var(--surface-3)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>📥 1. Đầu vào (Input):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-1)", lineHeight: "1.4" }}>
              Log defect chi tiết trên Notion (Priority, Deadline, Repro steps, Specs/Design).
            </div>
          </div>

          <div style={{ background: "var(--surface-3)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>⚡ 2. Quy trình tiếp cận:</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-1)", lineHeight: "1.4" }}>
              Dev <strong>bắt buộc đề xuất &amp; giải trình phương án sửa</strong> với Team Lead trước khi gõ code nhằm tránh rework.
            </div>
          </div>

          <div style={{ background: "var(--surface-3)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>📤 3. Đầu ra (Output):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-1)", lineHeight: "1.4" }}>
              Mã nguồn hoàn chỉnh (PR), môi trường Staging test PASS &amp; Pre-handover Checklist chất lượng.
            </div>
          </div>
        </div>
      </div>

      {/* TOP OVERVIEW CARD: COMPACT STEP-BY-STEP PIPELINE WITH CLICK-TO-SCROLL */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: "800",
            color: "var(--text-1)",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📌</span> Tổng Quan 7 Bước Xử Lý Bug (Bấm vào nút để nhảy tới
          bước chi tiết)
        </div>

        {/* Visual Pipeline Container with CSS Curved Reopen Arch & Forward Arrows */}
        <div style={{ position: "relative", paddingTop: "26px", marginBottom: "14px" }}>
          {/* Top Curved Loop-Back Line (Connecting Step 7 back to Step 2) */}
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: "21.4%",
              right: "7.1%",
              height: "22px",
              borderTop: "2px dashed var(--text-1)",
              borderLeft: "2px dashed var(--text-1)",
              borderRight: "2px dashed var(--text-1)",
              borderRadius: "14px 14px 0 0",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            {/* Downward Arrowhead pointing into Step 2 */}
            <div
              style={{
                position: "absolute",
                bottom: "-6px",
                left: "-5px",
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "7px solid var(--text-1)",
              }}
            />
          </div>

          {/* Reopen Label Pill floating on top of the SVG arch */}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "56%",
              transform: "translateX(-50%)",
              background: "var(--text-1)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "800",
              padding: "2px 10px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px var(--surface-3)",
              zIndex: 6,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
            onClick={() => scrollToStep(2)}
            title="Bấm để nhảy tới Bước 2: Phân Tích Lỗi khi Bug Reopen"
          >
            <span>↩️ REOPEN (Tái phát lỗi ➔ Quay lại Bước 2 Phân Tích)</span>
          </div>

          {/* Compact Clickable Steps Row with Forward Arrows */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {steps.map((st, index) => (
              <React.Fragment key={st.num}>
                <div
                  onClick={() => scrollToStep(st.num)}
                  style={{
                    flex: 1,
                    background: "var(--surface-2)",
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: `1.5px solid ${st.borderColor}`,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    minHeight: "72px",
                    boxSizing: "border-box",
                  }}
                  className="ctrl"
                  title={`Bấm để chuyển nhanh tới Bước ${st.num}`}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: st.color,
                      color: st.color === "var(--text-1)" ? "#000" : "#fff",
                      fontWeight: "bold",
                      fontSize: "11px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1",
                      flexShrink: 0,
                      marginBottom: "4px",
                    }}
                  >
                    {st.num}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "var(--text-1)",
                      lineHeight: "1.2",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.shortTitle}
                  </div>
                </div>

                {/* Forward Arrow Connector between step boxes */}
                {index < steps.length - 1 && (
                  <span
                    style={{
                      color: "var(--text-3)",
                      fontWeight: "bold",
                      fontSize: "13px",
                      userSelect: "none",
                      padding: "0 1px",
                    }}
                  >
                    ➔
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Status Flow Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            flexWrap: "wrap",
            background: "var(--surface-3)",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-3)",
          }}
        >
          <span style={{ color: "var(--text-1)" }}>📌 Notion Flow:</span>
          <span
            style={{
              padding: "3px 8px",
              background: "var(--card-bg)",
              borderRadius: "4px",
              color: "var(--text-1)",
            }}
          >
            New
          </span>
          <span>➔</span>
          <span
            style={{
              padding: "3px 8px",
              background: "var(--surface-3)",
              borderRadius: "4px",
              color: "var(--text-1)",
            }}
          >
            In Progress
          </span>
          <span>➔</span>
          <span
            style={{
              padding: "3px 8px",
              background: "var(--surface-3)",
              borderRadius: "4px",
              color: "var(--text-1)",
            }}
          >
            Resolved
          </span>
          <span>➔</span>
          <span
            style={{
              padding: "3px 8px",
              background: "var(--surface-3)",
              borderRadius: "4px",
              color: "var(--text-1)",
            }}
          >
            Deployed
          </span>
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>
            🟢 Closed (Pass)
          </span>
          <span style={{ color: "var(--text-3)" }}>/</span>
          <span
            style={{
              padding: "3px 8px",
              background: "var(--surface-3)",
              borderRadius: "4px",
              color: "var(--text-1)",
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Reopened sẽ chỉa mũi tên quay ngược về Bước 2: Phân Tích Lỗi"
          >
            🔴 Reopened (Fail) ↩️ chỉa về Bước 2: Phân Tích
          </span>
        </div>
      </div>

      {/* BOTTOM SECTION: DETAILED STEP-BY-STEP FLOW */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: "bold",
            color: "var(--text-1)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>📖</span> Hướng Dẫn Chi Tiết Thao Tác Từng Bước &amp; Fields
          Notion:
        </div>

        {steps.map((st, idx) => (
          <div
            key={st.num}
            id={`step-${st.num}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              scrollMarginTop: "20px",
            }}
          >
            {/* Step Main Card */}
            <div
              className="card"
              style={{
                width: "100%",
                padding: "20px 24px",
                background: st.bg,
                border: `1.5px solid ${st.borderColor}`,
                borderRadius: "14px",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* Step Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {/* Perfectly Centered Number Circle */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: st.color,
                      color: st.color === "var(--text-1)" ? "#000" : "#ffffff",
                      fontWeight: "bold",
                      fontSize: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: "1",
                      flexShrink: 0,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    }}
                  >
                    {st.num}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "var(--text-1)",
                    }}
                  >
                    {st.icon} {st.title}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    background: "var(--surface-3)",
                    color: st.color,
                    fontWeight: "bold",
                    border: `1px solid ${st.borderColor}`,
                  }}
                >
                  {st.badge}
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-1)",
                  margin: "0 0 12px 0",
                  fontStyle: "italic",
                  opacity: 0.9,
                }}
              >
                {st.desc}
              </p>

              {/* Action Bullet Items */}
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "var(--text-1)",
                  marginBottom: "8px",
                }}
              >
                🎯 Các hành động cụ thể dev cần thực hiện:
              </div>
              <ul
                style={{
                  margin: "0 0 14px 0",
                  paddingLeft: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-1)",
                  lineHeight: "1.6",
                }}
              >
                {st.actionNodes.map((actNode, aIdx) => (
                  <li key={aIdx}>{actNode}</li>
                ))}
              </ul>

              {/* Required Notion Fields Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--surface-3)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-3)",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-1)",
                    fontWeight: "bold",
                  }}
                >
                  📝 Fields Notion liên quan:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {st.notionFields.map((f, fIdx) => (
                    <span
                      key={fIdx}
                      style={{
                        fontSize: "11px",
                        background: "var(--card-bg)",
                        color: "var(--text-1)",
                        border: "1px solid var(--border-2)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical Connector Arrow */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  padding: "8px 0",
                  color: "var(--text-3)",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                ⬇️
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
