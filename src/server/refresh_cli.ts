import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "./config";
import { NotionBugClient } from "./notion/bugClient";
import { NotionTaskClient } from "./notion/taskClient";
import { enrichAllBugs, enrichAllTasks } from "./github/prClient";

const config = loadConfig();
const CACHE_PATH = ".cache/bugs.json";
const TASK_CACHE_PATH = ".cache/tasks.json";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function run() {
  if (!config.notionToken || !config.notionBugDataSourceId) {
    console.error("Error: Notion credentials not configured in .env");
    process.exit(1);
  }
  
  try {
    console.log("Fetching bugs from Notion...");
    const client = new NotionBugClient(config.notionToken, config.notionVersion, config.notionBugDataSourceId);
    let bugs = await client.listBugs();
    console.log(`Fetched ${bugs.length} bugs. Mapped bugId field.`);
    
    // Check if any bugId is populated
    const populated = bugs.filter(b => b.bugId);
    console.log(`Number of bugs with bugId after mapping: ${populated.length}`);
    if (populated.length > 0) {
      console.log(`Sample: ${populated[0].title} -> ${populated[0].bugId}`);
    }

    console.log("Enriching with GitHub...");
    bugs = await enrichAllBugs(bugs, config.githubToken);
    console.log(`Enriched ${bugs.length} bugs with GitHub data.`);
    
    ensureDir(CACHE_PATH);
    fs.writeFileSync(CACHE_PATH, JSON.stringify(bugs, null, 2));
    console.log("Successfully wrote updated cache to .cache/bugs.json!");

    if (config.notionTaskDataSourceId) {
      console.log("Fetching tasks from Notion Task List...");
      const taskClient = new NotionTaskClient(config.notionToken, config.notionVersion, config.notionTaskDataSourceId);
      let tasks = await taskClient.listTasks();
      console.log(`Fetched ${tasks.length} tasks.`);

      console.log("Enriching tasks with GitHub PR date...");
      tasks = await enrichAllTasks(tasks, config.githubToken);
      console.log(`Enriched ${tasks.length} tasks with GitHub data.`);

      ensureDir(TASK_CACHE_PATH);
      fs.writeFileSync(TASK_CACHE_PATH, JSON.stringify(tasks, null, 2));
      console.log("Successfully wrote updated cache to .cache/tasks.json!");
    } else {
      console.warn("NOTION_TASK_DATA_SOURCE_ID not configured, skipping task refresh.");
    }
  } catch (e: any) {
    console.error("Sync failed:", e);
    process.exit(1);
  }
}

run();
