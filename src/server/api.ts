import express from "express";
import { buildDashboardView } from "./aggregator";
import type {
  BugRecord,
  ChecklistItem,
  DashboardFilters,
  PeriodType,
} from "../shared/types";

interface ApiDeps {
  getBugs: () => BugRecord[];
  getChecklist: () => ChecklistItem[];
  saveChecklist: (items: ChecklistItem[]) => void;
  refresh: () => Promise<void>;
  getConclusions: () => Record<string, any>;
  saveConclusions: (data: Record<string, any>) => void;
  getCustomTargets: () => Record<string, number[]>;
  saveCustomTargets: (data: Record<string, number[]>) => void;
  githubToken?: string;
}

export function createApi(deps: ApiDeps) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/dashboard", (req, res) => {
    try {
      const filters: DashboardFilters = {
        periodType: (req.query.periodType as PeriodType) || "week",
        periodKey: req.query.periodKey as string | undefined,
        personCode: req.query.personCode as string | undefined,
      };
      const view = buildDashboardView(
        deps.getBugs(),
        filters,
        deps.getChecklist(),
        deps.getConclusions(),
      );
      res.json({ ...view, conclusions: deps.getConclusions(), customTargets: deps.getCustomTargets() });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/refresh", (_req, res) => {
    // Trigger refresh in background, respond immediately with current data
    deps.refresh().catch((e) => console.error("Background refresh failed:", e));
    const view = buildDashboardView(
      deps.getBugs(),
      { periodType: "week" },
      deps.getChecklist(),
      deps.getConclusions(),
    );
    res.json({ ...view, conclusions: deps.getConclusions(), refreshing: true });
  });

  app.post("/api/conclusions", (req, res) => {
    const { periodKey, good, bad, risks, manDaysOverrides, explanations } = req.body;
    if (!periodKey) {
      res.status(400).json({ error: "periodKey required" });
      return;
    }
    const data = deps.getConclusions();
    data[periodKey] = {
      good: good || "",
      bad: bad || "",
      risks: risks || "",
      manDaysOverrides: manDaysOverrides || {},
      explanations: explanations || {},
    };
    deps.saveConclusions(data);
    res.json({ ok: true, data: data[periodKey] });
  });

  app.get("/api/custom-targets", (_req, res) => {
    res.json(deps.getCustomTargets());
  });

  app.post("/api/custom-targets", (req, res) => {
    const data = req.body || {};
    deps.saveCustomTargets(data);
    res.json({ ok: true, data });
  });

  // Checklist CRUD
  app.get("/api/checklist", (_req, res) => {
    res.json(deps.getChecklist());
  });

  app.post("/api/checklist", (req, res) => {
    const items = deps.getChecklist();
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      code: req.body.code || `L${items.length + 1}`,
      title: req.body.title || "",
      description: req.body.description || "",
      example: req.body.example,
      lesson: req.body.lesson,
      prs: req.body.prs || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    deps.saveChecklist(items);
    res.json(item);
  });

  app.put("/api/checklist/:id", (req, res) => {
    const items = deps.getChecklist();
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    items[idx] = {
      ...items[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    deps.saveChecklist(items);
    res.json(items[idx]);
  });

  app.delete("/api/checklist/:id", (req, res) => {
    let items = deps.getChecklist();
    items = items.filter((i) => i.id !== req.params.id);
    deps.saveChecklist(items);
    res.json({ ok: true });
  });

  app.post("/api/checklist/grab", async (req, res) => {
    try {
      const { grabTruongComments } = await import("./github/commentGrabber");
      const currentList = deps.getChecklist();
      const result = await grabTruongComments(
        deps.getBugs(),
        currentList,
        deps.githubToken,
      );
      if (result.addedCount > 0 || result.updatedCount > 0) {
        const updatedList = [...currentList, ...result.newItems];
        deps.saveChecklist(updatedList);
      }
      res.json({
        success: true,
        addedCount: result.addedCount,
        updatedCount: result.updatedCount,
        newItems: result.newItems,
      });
    } catch (err) {
      console.error("Grab comments failed:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  return app;
}
