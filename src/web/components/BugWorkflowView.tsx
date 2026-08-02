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
      title: "1. Tự Chọn Task (Ưu Tiên Priority), Đổi Status & Test Tái Hiện 10 Lần",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Kiểm tra Priority khi nhận task trên Notion, gán chính chủ, điền ngày Estimate và test tái hiện biến thể.",
      actionNodes: [
        <>
          <strong>Ưu tiên Priority:</strong> Nhận task theo thứ tự:{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Critical</span> ➔{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>High</span> ➔{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Medium</span> ➔{" "}
          <span style={{ color: "var(--text-1)", fontWeight: "bold" }}>Low</span>. Đọc kỹ ô <strong>Note</strong> trước khi nhận.
        </>,
        <>
          <strong>Đổi Status Notion:</strong> Chuyển <code>Status</code> từ <strong>New</strong> ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>In Progress</strong>.
        </>,
        <>
          <strong>Gán Assignee:</strong> Đổi trường <code>Fixed by</code> sang <strong>tên bản thân</strong>.
        </>,
        <>
          <strong>BẮT BUỘC điền 2 trường ngày:</strong> 📅 <strong>Ngày bắt đầu xử lý</strong> &amp; 📅{" "}
          <strong>Ngày dự định hoàn thành</strong> (Estimate).
        </>,
        <>
          <strong>Gắn link Notion bài học tương tự (Ref Notion Link):</strong> Nếu nhận task thấy có pattern tương tự task cũ bản thân hoặc ai đó đã làm ➔{" "}
          <strong>Copy link Notion card cũ dán vào ô <code>Note</code></strong> để ref phương án fix (tránh làm lại từ đầu).
        </>,
        <>
          <strong>Test tái hiện 10 lần (ChatGPT / AI):</strong> Tạo biến thể script (wording, casing, ngữ pháp). Run test 10 lần:
          <div style={{ marginTop: "4px", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "3px", fontSize: "12px" }}>
            <div>
              🟢 <strong>10/10 PASS:</strong> Ghi rõ vào ô <code>Note</code> là <strong>"Không tái hiện được (Đã test 10 lần biến thể)"</strong> ➔ Chuyển <code>Status</code> sang <strong style={{ color: "var(--text-1)" }}>Cancel</strong> (tránh sai Effort).
            </div>
            <div>
              🔴 <strong>1/10 FAIL:</strong> <strong style={{ color: "var(--text-1)" }}>BẮT BUỘC XÁC NHẬN LÀ BUG THỰC SỰ</strong> (Trace Root Cause sửa dứt điểm).
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
    },
    {
      num: 2,
      badge: "Root Cause Analysis",
      shortTitle: "2. Phân Tích Lỗi",
      title: "2. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause) & Báo Cáo Team Lead",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Phân tích kỹ lưỡng tầng phát sinh lỗi trước khi gõ code, áp dụng nguyên tắc Tool > AI.",
      actionNodes: [
        <>
          <strong>Trace đúng 6 tầng lỗi:</strong> <code>tool-100</code> ➔ <code>group-rule</code> ➔ <code>COLUMN_PROMPTS</code> ➔ <code>COT_HINTS</code> ➔ <code>docs</code> ➔ <code>prompt</code>.
        </>,
        <>
          <strong>BẮT BUỘC BÁO CÁO HƯỚNG FIX VỚI TEAM LEAD TRƯỚC KHỊ SỬA CODE:</strong> Sau khi phân tích xong Root Cause ➔ Dev <strong>bắt buộc nhắn tin báo cáo giải trình phương án sửa cho Team Lead</strong> (để TL kiểm soát chất lượng &amp; phê duyệt). Sau khi TL bấm OK mới được bắt đầu gõ code!
        </>,
        <>
          <strong>Quy trình Leo Thang khi vướng (Escalation Rule):</strong> Trường hợp lỗi ảnh hưởng quá rộng hoặc không chắc cách sửa ➔ BẮT BUỘC hỏi Huyền trước. Nếu không giải quyết được ➔ Gửi sang nhóm Issue hỏi Anh Trường.
        </>,
        <>
          <strong>Cập nhật Vị trí lỗi trên Notion:</strong> Nếu trace xong phát hiện <code>Vị trí lỗi</code> ban đầu bị đánh sai ➔ Dev tự cập nhật lại đúng tầng lỗi thực sự.
        </>,
      ],
      notionFields: ["Vị trí lỗi (Code logic vs Tool-100 vs Prompt vs Docs)"],
    },
    {
      num: 3,
      badge: "Code & Self-Test",
      shortTitle: "3. Fix & Self-Test",
      title: "3. Fix Code & Tự Kiểm Tra Chất Lượng (Repo Checklist)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Sửa mã nguồn chính xác và tự kiểm tra chất lượng theo chuẩn Repo Checklist.",
      actionNodes: [
        <>
          <strong>Fix Code sạch:</strong> Thực hiện sửa code logic, không làm vỡ các chức năng liên quan.
        </>,
        <>
          <strong>Rà soát ngang (Rule L6):</strong> Sửa 1 chỗ ➔ BẮT BUỘC rà soát N chỗ cùng pattern trong codebase. PHẢI nhắn báo Anh Trường phê duyệt trước khi sửa!
        </>,
        <>
          <strong>BẮT BUỘC tuân thủ Repo Checklists trước khi PR (Bấm vào thẻ bên dưới để xem chi tiết):</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
            {[
              { id: "tool-100", name: "tool-100", detail: "Chạy task audit xanh 100%, check FalsePositiveGuard." },
              { id: "lisa-ai-agent", name: "lisa-ai-agent", detail: "Chạy task code:check-strict & task test:eval:metadata." },
              { id: "lisa-visa-web-backend", name: "lisa-visa-web-backend", detail: "Chạy bộ 3 lệnh CI Backend (pytest, ruff check, ruff format)." },
              { id: "lisa-visa-web", name: "lisa-visa-web", detail: "Chạy pnpm test, lint:fix, format, type-check." },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab?.("checklist", item.id)}
                style={{
                  background: "var(--surface-3)",
                  padding: "8px 10px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-2)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)" }}>
                  📦 {item.name} ➔
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </>,
      ],
      notionFields: [
        "Cần triển khai ngang (Yes/No)",
        "Tiêu chí vi phạm (L1-L9)",
      ],
    },
    {
      num: 4,
      badge: "Notion Status: In Progress ➔ Resolved",
      shortTitle: "4. Tạo PR",
      title: "4. Tạo PR trên GitHub &amp; Đính Kèm Link vào Card Notion",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Đẩy code lên GitHub repository, đính kèm mã ticket BSVA và dán PR URL vào Notion.",
      actionNodes: [
        <>
          <strong>Tuân thủ PR Template:</strong> Viết tiêu đề Conventional Commits (vd: <code>fix(ai-agent): resolve BSVA-102</code>).
        </>,
        <>
          <strong>ĐÍNH KÈM ANH MINH HỌA (SCREENSHOT / EVIDENCE):</strong>
          <div style={{ marginTop: "4px", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px" }}>
            <div>📦 <strong>tool-100:</strong> Ảnh chụp màn hình kết quả chạy test Audit Sheet.</div>
            <div>🌐 <strong>Web / Backend:</strong> Ảnh chụp màn hình giao diện Web hoặc kết quả chạy test terminal.</div>
          </div>
        </>,
        <>
          <strong>Điền Số giờ fix:</strong> BẮT BUỘC nhập tổng số giờ thực tế đã thực hiện vào ô <code>Số giờ fix</code> trên Notion card.
        </>,
        <>
          <strong>BẮT BUỘC DÁN LINK PR &amp; ĐỔI STATUS:</strong> Copy URL PR dán vào ô <code>Pull Request</code> ➔ Chuyển <code>Status</code> từ <strong>In Progress</strong> ➔ <strong style={{ color: "var(--text-1)" }}>Resolved (Chờ Review)</strong>.
        </>,
      ],
      notionFields: [
        "Pull Request (URL bắt buộc)",
        "Số giờ fix (Number bắt buộc)",
        "Status ➔ Resolved",
        "Giải pháp xử lý (Text)",
      ],
    },
    {
      num: 5,
      badge: "Notion Status: InReview (nếu có comment) / Reviewed (nếu Pass)",
      shortTitle: "5. Vòng 1: Huyền",
      title: "5. Review Vòng 1 — Do Huyền Kiểm Soát (BẮT BUỘC QUA VÒNG HUYỀN TRƯỚC)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Mọi PR/bug BẮT BUỘC phải qua Vòng 1. Huyền test thực tế và trực tiếp chuyển Status Notion sang InReview (nếu có comment) hoặc Reviewed (nếu Pass ngay).",
      actionNodes: [
        <>
          🔒 <strong style={{ color: "var(--text-1)" }}>QUY TẮC TUẦN TỰ NGUYÊN TẮC:</strong> Bug/PR <strong>BẮT BUỘC PHẢI QUA VÒNG HUYỀN TEST &amp; DUYỆT TRƯỚC (VÒNG 1)</strong> thì mới được chuyển sang Vòng 2!
        </>,
        <>
          🟢 <strong>Trường Hợp 1 — PASS NGAY (Không Có Comment Lỗi):</strong> Test thực tế Pass 100% ➔ Huyền <strong>chuyển Status Notion ➔</strong> <span className="tag tag-green">Reviewed</span>, gán nhãn <span className="tag tag-green">wait for development</span> và <strong>tự điền</strong> <span className="tag tag-blue">Số giờ review</span>.
        </>,
        <>
          🔴 <strong>Trường Hợp 2 — CÓ COMMENT LỖI (Huyền Đổi Status InReview):</strong>
          <div style={{ marginTop: "4px", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-1)" }}>
            <div>• Huyền viết comment chỉ rõ chỗ sai trên PR và <strong>chuyển Status Notion ➔</strong> <span className="tag tag-red">InReview</span>.</div>
            <div>• Dev <strong>BẮT BUỘC reply giải thích bên dưới comment</strong> và <strong>bấm nút Resolve conversation</strong>.</div>
            <div>• Huyền nhận notification sẽ re-check ➔ Test Pass thì <strong>chuyển Status Notion ➔</strong> <span className="tag tag-green">Reviewed</span> (<span className="tag tag-green">wait for development</span>) và <strong>điền Số giờ review</strong>.</div>
          </div>
        </>,
      ],
      notionFields: [
        "Status ➔ InReview (nếu có comment) / Reviewed (nếu Pass)",
        "Reviewers ➔ Huyền (Duy nhất Huyền quản lý)",
        "Số giờ review (Duy nhất Huyền điền)",
        "Label ➔ wait for development",
      ],
    },
    {
      num: 6,
      badge: "Notion Status: Wait for dev ➔ Deployed",
      shortTitle: "6. Vòng 2: Anh Trường",
      title: "6. Review Vòng 2 — Tech Lead Review (Anh Trường 1h Đầu Buổi Chiều)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Anh Trường CHỈ collect và review logic những PR ĐÃ QUA VÒNG HUYỀN (có status Reviewed / wait for development) trong 1 tiếng đầu buổi chiều.",
      actionNodes: [
        <>
          ⛔ <strong style={{ color: "var(--text-1)" }}>ĐIỀU KIỆN CẦN (ĐÃ QUA VÒNG HUYỀN):</strong> Anh Trường <strong>CHỈ REVIEW NHỮNG PR ĐÃ QUA VÒNG 1 (HUYỀN DUYỆT PASS)</strong> mang status <span className="tag tag-green">Reviewed</span> / nhãn <span className="tag tag-green">wait for development</span>. Tuyệt đối không review nhảy cóc!
        </>,
        <>
          ⏱️ <strong>Lịch Collect &amp; Review Cố Định Của Anh Trường:</strong> Anh Trường dành <span className="tag tag-yellow" style={{ fontSize: "12px", fontWeight: "bold" }}>⏱️ 1 tiếng đầu buổi chiều mỗi ngày</span> để gom (collect) và review toàn bộ các PR do Huyền đã duyệt ở Vòng 1.
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
      notionFields: ["Status / Label ➔ wait for development ➔ Deployed"],
    },
    {
      num: 7,
      badge: "Notion Status: Closed OR Reopened",
      shortTitle: "7. OP Nghiệm Thu",
      title: "7. OP (Thương & Linh) Test Nghiệm Thu: Closed (Pass) HOẶC Reopen (Fail)",
      color: "#52708c",
      borderColor: "var(--border-2)",
      bg: "var(--surface-2)",
      desc: "Bên OP (Thương & Linh) nghiệm thu thực tế sau khi status chuyển Deployed và cập nhật ngày chính xác.",
      actionNodes: [
        <>
          🟢 <strong>NẾU TEST PASS (OP Thương &amp; Linh Nghiệm thu OK):</strong> Tính năng / fix bug chạy chuẩn ➔ Bên OP (Thương &amp; Linh) đổi <code>Status</code> Notion ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>Closed</strong> và <strong style={{ color: "var(--green)" }}>BẮT BUỘC CẬP NHẬT TRƯỜNG 📅 "Ngày xác nhận" (Confirmed Date)</strong>.
        </>,
        <>
          🔴 <strong>NẾU TEST FAIL (Tái phát lỗi):</strong> Bên OP đổi <code>Status</code> Notion ➔{" "}
          <strong style={{ color: "var(--text-1)" }}>Reopened</strong> và <strong style={{ color: "var(--red)" }}>BẮT BUỘC CẬP NHẬT TRƯỜNG 📅 "Ngày mở lại" (Reopen Date)</strong>.
        </>,
        <>
          🔄 <strong style={{ color: "var(--text-1)" }}>LUỒNG MŨI TÊN QUAY VỀ BƯỚC 2 (PHÂN TÍCH LỖI):</strong> Bug Reopen tự động <strong>chỉa mũi tên quay ngược về ↩️ Bước 2 (Phân Tích Root Cause)</strong>. Dev bắt buộc re-trace Root Cause &amp; họp với Lead trước khi fix lại!
        </>,
      ],
      notionFields: [
        "Status ➔ Closed (nếu Pass)",
        "📅 Ngày xác nhận (Bắt buộc cập nhật khi Close)",
        "Status ➔ Reopened (nếu Fail)",
        "📅 Ngày mở lại (Bắt buộc cập nhật khi Reopen)",
      ],
    },
  ];

  const scrollToStep = (stepNum: number) => {
    const el = document.getElementById(`step-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Header */}
      <div>
        <h1 className="section-title" style={{ margin: "0 0 4px 0" }}>
          Quy Trình Xử Lý Bug End-to-End (Notion Status &amp; Branching)
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
          Sơ đồ quy trình chuẩn chỉnh: <code>New</code> ➔ <code>In Progress</code> ➔ <code>Resolved</code> ➔ <code>InReview / Reviewed</code> ➔ <code>Deployed</code> ➔ <code>Closed</code> (hoặc <code>Reopened</code>).
        </p>
      </div>

      {/* Black Box Banner */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "10px" }}>
          Mô Hình &quot;Black Box&quot; Sửa Bug (Đầu Vào - Quy Trình - Đầu Ra Chuẩn Hóa)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>1. Đầu vào (Input):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Log defect chi tiết trên Notion (Priority, Deadline, Repro steps, Specs).
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>2. Quy trình tiếp cận:</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Dev <strong>bắt buộc đề xuất &amp; giải trình phương án sửa</strong> với Team Lead trước khi gõ code.
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--text-1)", padding: "10px 12px", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ fontSize: "12px", color: "var(--text-1)" }}>3. Đầu ra (Output):</strong>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-2)", lineHeight: "1.4" }}>
              Mã nguồn hoàn chỉnh (PR), Staging test PASS &amp; Pre-handover Checklist chất lượng.
            </div>
          </div>
        </div>
      </div>

      {/* Overview Pipeline Steps Bar */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px" }}>
          Tổng Quan 7 Bước Xử Lý Bug (Bấm vào nút để nhảy tới bước chi tiết)
        </div>

        {/* Visual Steps Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto" }}>
          {steps.map((st, index) => (
            <React.Fragment key={st.num}>
              <div
                onClick={() => scrollToStep(st.num)}
                style={{
                  flex: 1,
                  minWidth: "90px",
                  background: "var(--surface-2)",
                  padding: "10px 6px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-2)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                className="ctrl"
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "var(--text-1)",
                    color: "var(--bg)",
                    fontWeight: "bold",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "4px",
                  }}
                >
                  {st.num}
                </div>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-1)", whiteSpace: "nowrap" }}>
                  {st.shortTitle}
                </div>
              </div>

              {index < steps.length - 1 && (
                <span style={{ color: "var(--text-3)", fontWeight: "bold", fontSize: "13px" }}>➔</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Detailed Step Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {steps.map((st) => (
          <div key={st.num} id={`step-${st.num}`} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-3)" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-1)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--text-1)", color: "var(--bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                  {st.num}
                </span>
                {st.title}
              </div>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "var(--surface-3)", color: "var(--text-1)", fontWeight: "600" }}>
                {st.badge}
              </span>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "12px" }}>
              {st.desc}
            </div>

            <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "6px" }}>
              Hành động bắt buộc:
            </div>

            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--text-2)", lineHeight: "1.5" }}>
              {st.actionNodes.map((node, idx) => (
                <li key={idx}>{node}</li>
              ))}
            </ul>

            <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-3)", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-3)" }}>
              <strong style={{ color: "var(--text-1)" }}>Trường Notion liên quan:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {st.notionFields.map((field) => (
                  <span key={field} style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: "3px", color: "var(--text-2)", border: "1px solid var(--border-2)" }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
