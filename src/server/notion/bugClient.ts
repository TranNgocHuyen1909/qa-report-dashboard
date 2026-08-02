import type { BugRecord } from "../../shared/types";

interface NotionPage {
  id: string;
  url?: string;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, any>;
}

function rich(prop: any, key: "title" | "rich_text"): string | undefined {
  const v = prop?.[key]?.map((p: any) => p.plain_text ?? "").join("").trim();
  return v || undefined;
}
function sel(prop: any): string | undefined { return prop?.select?.name || undefined; }
function stat(prop: any): string | undefined { return prop?.status?.name || undefined; }
function multi(prop: any): string[] { return prop?.multi_select?.flatMap((o: any) => o.name ? [o.name] : []) ?? []; }
function dt(prop: any): string | undefined { return prop?.date?.start || undefined; }
function chk(prop: any): boolean { return prop?.checkbox === true; }
function url(prop: any): string | undefined {
  if (!prop) return undefined;
  if (prop.type === "url" || prop.url) return prop.url || undefined;
  if (prop.type === "rich_text" || prop.rich_text) return rich(prop, "rich_text");
  return undefined;
}
function people(prop: any): string[] { return prop?.people?.flatMap((p: any) => p.id ? [p.id] : []) ?? []; }
function uid(prop: any): string | undefined {
  if (prop?.type === "unique_id" && prop.unique_id) {
    const prefix = prop.unique_id.prefix ? `${prop.unique_id.prefix}-` : "";
    return `${prefix}${prop.unique_id.number}`;
  }
  return undefined;
}

function formulaOrChk(prop: any): boolean {
  if (!prop) return false;
  if (prop.type === "checkbox") return prop.checkbox === true;
  if (prop.type === "formula") {
    if (prop.formula?.type === "boolean") return prop.formula.boolean === true;
    if (prop.formula?.type === "string") return prop.formula.string === "true" || prop.formula.string === "1";
    if (prop.formula?.type === "number") return prop.formula.number > 0;
  }
  if (prop.checkbox !== undefined) return prop.checkbox === true;
  return false;
}

function relationIds(prop: any): string[] {
  if (!prop) return [];
  if (prop.type === "relation" && Array.isArray(prop.relation)) {
    return prop.relation.flatMap((r: any) => r.id ? [r.id] : []);
  }
  if (prop.type === "rollup" && Array.isArray(prop.rollup?.array)) {
    return prop.rollup.array.flatMap((item: any) => relationIds(item));
  }
  return [];
}

function dateProp(prop: any): string | undefined {
  if (!prop) return undefined;
  if (prop.type === "date" && prop.date?.start) return prop.date.start;
  if (prop.date?.start) return prop.date.start;
  if (prop.type === "rich_text" || prop.type === "title") return rich(prop, prop.type);
  return undefined;
}

function parseKnowledge(p: Record<string, any>): string | undefined {
  const prop =
    p["Kiến thức"] ??
    p["Kiến thức "] ??
    p["Kiến thức rút ra"] ??
    p["Bài học kinh nghiệm"] ??
    p["Bài học"] ??
    p["Knowledge"];
  if (!prop) return undefined;
  if (prop.type === "rich_text") return rich(prop, "rich_text");
  if (prop.type === "title") return rich(prop, "title");
  if (prop.type === "select") return sel(prop);
  if (prop.type === "multi_select") return multi(prop).join(", ");
  if (prop.type === "checkbox") return prop.checkbox ? "True" : undefined;
  if (prop.type === "url") return url(prop);
  return undefined;
}

function mapPage(page: NotionPage): BugRecord {
  const p = page.properties ?? {};
  return {
    id: page.id,
    url: page.url,
    title: rich(p["Bug title"], "title") ?? page.id,
    testcaseName: sel(p["PL testcase"]),
    status: stat(p["Status"]),
    severity: sel(p["Severity"]),
    priority: sel(p["Priority"]),
    environment: sel(p["Environment"]),
    defectType: sel(p["PL Lỗi"]),
    rootCause: sel(p["PL Nguyên nhân"]),
    process: sel(p["Công đoạn gây ra lỗi"]),
    location: multi(p["Vị trí lỗi"]),
    violatedCriteria: multi(p["Tiêu chí vi phạm "]),
    detectedDate: dt(p["Ngày phát hiện"]) || dt(p["Ngày phát hiện lỗi"]),
    confirmedDate: dt(p["Ngày xác nhận"]),
    reopenedDate: dt(p["Ngày mở lại"]),
    solution: rich(p["Giải pháp xử lý"], "rich_text"),
    note: rich(p["Note"], "rich_text"),
    pullRequestUrl: url(p["Pull Request"]),
    horizontalRolloutNeeded: chk(p["Cần triển khai ngang"]),
    testerIds: people(p["Tester"]),
    causedByIds: people(p["Caused by"]),
    fixedByIds: people(p["Fixed by"]),
    reviewerIds: people(p["Reviewers"]),
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    bugId: uid(p["BUG ID"]),
    reviewStartDate:
      dateProp(p["Ngày bắt đầu review"]) ||
      dateProp(p["Ngày bắt đầu review "]) ||
      dateProp(p["Ngày bắt đầu Review"]) ||
      dateProp(p["Ngày bắt đầu Review "]) ||
      dateProp(p["Ngày bắt đầu"]) ||
      p["Ngày review"]?.date?.start ||
      p["Review Date"]?.date?.start,
    reviewEndDate:
      dateProp(p["Ngày kết thúc review"]) ||
      dateProp(p["Ngày kết thúc review "]) ||
      dateProp(p["Ngày kết thúc Review"]) ||
      dateProp(p["Ngày kết thúc Review "]) ||
      dateProp(p["Ngày kết thúc"]) ||
      p["Ngày bắt đầu review"]?.date?.end ||
      p["Ngày review"]?.date?.end ||
      p["Review Date"]?.date?.end,
    knowledge: parseKnowledge(p),
    isPausedFix:
      chk(p["Tạm dừng fix"]) ||
      chk(p["Tạm dừng Fix"]) ||
      chk(p["Tạm dừng"]) ||
      chk(p["Pause fix"]) ||
      sel(p["Tạm dừng fix"]) === "Có" ||
      sel(p["Tạm dừng fix"]) === "Yes" ||
      sel(p["Tạm dừng fix"]) === "True" ||
      sel(p["Tạm dừng Fix"]) === "Có" ||
      sel(p["Tạm dừng"]) === "Có" ||
      stat(p["Tạm dừng fix"]) === "Tạm dừng" ||
      stat(p["Tạm dừng Fix"]) === "Tạm dừng" ||
      stat(p["Status"]) === "Tạm dừng",
    isDuplicate:
      formulaOrChk(p["Duplicate?"]) ||
      formulaOrChk(p["Duplicates?"]) ||
      formulaOrChk(p["Duplicate"]) ||
      formulaOrChk(p["Duplicates"]) ||
      formulaOrChk(p["Lỗi trùng"]) ||
      chk(p["Duplicate?"]) ||
      chk(p["Duplicates?"]) ||
      chk(p["Duplicate"]) ||
      (p["Duplicates"]?.relation?.length ?? 0) > 0 ||
      (p["Duplicate"]?.relation?.length ?? 0) > 0,
    duplicateIds: Array.from(new Set([
      ...relationIds(p["Duplicates"]),
      ...relationIds(p["Duplicate"]),
      ...relationIds(p["Task trùng"]),
      ...relationIds(p["Lỗi trùng"]),
      ...relationIds(p["Lỗi trùng lặp"]),
      ...relationIds(p["Duplicate Tasks"]),
      ...relationIds(p["Duplicate Task"]),
    ])),
  };
}

export class NotionBugClient {
  private dsId: string;
  constructor(private token: string, private version: string, dataSourceId: string) {
    this.dsId = dataSourceId.replace(/^collection:\/\//, "").trim();
  }

  async listBugs(): Promise<BugRecord[]> {
    const bugs: BugRecord[] = [];
    let cursor: string | undefined;
    do {
      const body: any = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch(
        `https://api.notion.com/v1/data_sources/${encodeURIComponent(this.dsId)}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
            "Notion-Version": this.version,
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({})) as any;
      if (!res.ok) throw new Error(`Notion ${res.status}: ${data.message ?? res.statusText}`);
      bugs.push(...(data.results ?? []).map(mapPage));
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
    } while (cursor);
    return bugs;
  }
}
