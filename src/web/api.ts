import type { DashboardView, ChecklistItem, PeriodType } from "../shared/types";

const BASE = "/api";

export async function fetchDashboard(periodType: PeriodType = "week", periodKey?: string, personCode?: string): Promise<DashboardView> {
  const params = new URLSearchParams({ periodType });
  if (periodKey) params.set("periodKey", periodKey);
  if (personCode) params.set("personCode", personCode);
  const res = await fetch(`${BASE}/dashboard?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function refreshData(): Promise<DashboardView> {
  const res = await fetch(`${BASE}/refresh`, { method: "POST" });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  return res.json();
}

export async function addChecklistItem(data: Partial<ChecklistItem>): Promise<ChecklistItem> {
  const res = await fetch(`${BASE}/checklist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

export async function updateChecklistItem(id: string, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
  const res = await fetch(`${BASE}/checklist/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await fetch(`${BASE}/checklist/${id}`, { method: "DELETE" });
}

export async function saveConclusion(periodKey: string, good: string, bad: string, risks: string, manDaysOverrides?: Record<string, number>): Promise<any> {
  const res = await fetch(`${BASE}/conclusions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periodKey, good, bad, risks, manDaysOverrides }),
  });
  if (!res.ok) throw new Error("Failed to save conclusion");
  return res.json();
}

export async function grabChecklistComments(): Promise<{ success: boolean; addedCount: number; newItems: ChecklistItem[] }> {
  const res = await fetch(`${BASE}/checklist/grab`, { method: "POST" });
  if (!res.ok) throw new Error(`Grab comments failed: ${res.status}`);
  return res.json();
}
