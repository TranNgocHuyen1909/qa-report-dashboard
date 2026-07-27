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
function url(prop: any): string | undefined { return prop?.url || undefined; }
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
    detectedDate: dt(p[""]) || dt(p["Ngày phát hiện lỗi"]),
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
    duplicateIds:
      relationIds(p["Duplicates"]).length > 0
        ? relationIds(p["Duplicates"])
        : relationIds(p["Duplicate"]).length > 0
        ? relationIds(p["Duplicate"])
        : relationIds(p["Task trùng"]),
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
