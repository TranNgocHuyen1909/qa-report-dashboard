import * as dotenv from "dotenv";

export interface AppConfig {
  port: number;
  notionToken?: string;
  notionVersion: string;
  notionBugDataSourceId?: string;
  githubToken?: string;
  checklistPath: string;
  refreshIntervalSeconds: number;
}

export function loadConfig(): AppConfig {
  dotenv.config({ quiet: true });
  const env = process.env;
  return {
    port: Number(env.PORT) || 8788,
    notionToken: env.NOTION_TOKEN?.trim() || undefined,
    notionVersion: env.NOTION_VERSION?.trim() || "2026-03-11",
    notionBugDataSourceId: env.NOTION_BUG_DATA_SOURCE_ID?.trim() || undefined,
    githubToken: env.GITHUB_TOKEN?.trim() || undefined,
    checklistPath: env.CHECKLIST_PATH?.trim() || ".cache/checklist.json",
    refreshIntervalSeconds: Number(env.REFRESH_INTERVAL_SECONDS) || 300,
  };
}
