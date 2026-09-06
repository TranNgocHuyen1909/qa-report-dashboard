import type { TaskRecord } from "../../shared/types";

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
function stat(prop: any): string | undefined { return prop?.status?.name || undefined; }
function multi(prop: any): string[] { return prop?.multi_select?.flatMap((o: any) => o.name ? [o.name] : []) ?? []; }
function dt(prop: any): string | undefined { return prop?.date?.start || undefined; }
function url(prop: any): string | undefined { return prop?.url || undefined; }
function people(prop: any): string[] { return prop?.people?.flatMap((p: any) => p.id ? [p.id] : []) ?? []; }
function uid(prop: any): string | undefined {
  if (prop?.type === "unique_id" && prop.unique_id) {
    const prefix = prop.unique_id.prefix ? `${prop.unique_id.prefix}-` : "";
    return `${prefix}${prop.unique_id.number}`;
  }
  return undefined;
}

function mapPage(page: NotionPage): TaskRecord {
  const p = page.properties ?? {};
  return {
    id: page.id,
    url: page.url,
    taskId: uid(p["ID"]),
    title: rich(p["Task name"], "title") ?? page.id,
    taskType: multi(p["Task type"]),
    status: stat(p["Status"]),
    assigneeIds: people(p["Assignee"]),
    reviewerIds: people(p["Reviewer"]),
    psDate: dt(p["PSDate"]),
    peDate: dt(p["PEDate"]),
    asDate: dt(p["ASDate"]),
    aeDate: dt(p["AEDate"]),
    pullRequestUrl: url(p["Pull Request"]),
    note: rich(p["Note"], "rich_text"),
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

export class NotionTaskClient {
  private dsId: string;
  constructor(private token: string, private version: string, dataSourceId: string) {
    this.dsId = dataSourceId.replace(/^collection:\/\//, "").trim();
  }

  async listTasks(): Promise<TaskRecord[]> {
    const tasks: TaskRecord[] = [];
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
      tasks.push(...(data.results ?? []).map(mapPage));
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
    } while (cursor);
    return tasks;
  }
}
