/* ── Personnel ─────────────────────────────────────────── */

export interface Person {
  code: string; // HuyenTN, HoNX, HoangGV, HuyDH, AnPD
  displayName: string;
  notionIds: string[];
  aliases: string[];
  githubUsername: string;
  startDate: string; // YYYY-MM-DD
  role: "lead" | "developer" | "benchmark";
}

/* ── Bug Record (from Notion) ─────────────────────────── */

export interface BugRecord {
  id: string;
  url?: string;
  title: string;
  testcaseName?: string;
  status?: string;
  severity?: string;
  priority?: string;
  environment?: string;
  defectType?: string;
  rootCause?: string;
  process?: string;
  location?: string[];
  violatedCriteria?: string[];
  detectedDate?: string;
  confirmedDate?: string;
  reopenedDate?: string;
  solution?: string;
  note?: string;
  pullRequestUrl?: string;
  horizontalRolloutNeeded?: boolean;
  testerIds?: string[];
  causedByIds?: string[];
  fixedByIds?: string[];
  reviewerIds?: string[];
  createdTime?: string;
  lastEditedTime?: string;
  bugId?: string;
  isPausedFix?: boolean;
  // GitHub enrichment
  ghReviewStatus?:
    | "Approved"
    | "Changes Requested"
    | "Commented"
    | "No review"
    | "Error"
    | "No PR";
  ghCommitsCount?: number;
  ghReviewCount?: number;
  ghReviews?: Array<{ author: string; state: string; submittedAt: string }>;
  prAuthor?: string;
  prCreatedAt?: string;
  prLastCommitAt?: string;
  prCommentsByAuthor?: number;
  prCommentsByTruong?: number;
  prCommentsByHuyen?: number;
  huyenFirstCommentAt?: string;
  huyenLastCommentAt?: string;
  huyenReviewRounds?: number;
  ghLabels?: string[];
}

/* ── Period types ──────────────────────────────────────── */

export type PeriodType = "day" | "week" | "month";

export interface PeriodInfo {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

/* ── Per-person metrics ───────────────────────────────── */

export interface PersonPeriodMetric {
  personCode: string;
  period: PeriodInfo;
  bugsDetected: number;
  bugsFixed: number;
  bugsNewFixed: number;
  bugsNewOpen: number;
  bugsReviewed: number;
  bugsReopened: number;
  backlogEnd: number;
  fixRatePercent: number;
  workingDays: number;
  manDays: number;
  bugsPerDay: number;
  bugsList: BugRecord[];
}

/* ── Team-wide period metric ──────────────────────────── */

export interface TeamPeriodMetric {
  period: PeriodInfo;
  totalDetected: number;
  totalFixed: number;
  totalNewFixed: number;
  totalNewOpen: number;
  backlogEnd: number;
  fixRatePercent: number;
  byPerson: PersonPeriodMetric[];
}

/* ── Bug lifecycle ────────────────────────────────────── */

export type BugLifecycleStage =
  | "New"
  | "In Progress"
  | "Resolved"
  | "Deployed"
  | "Reopened"
  | "Pending"
  | "Closed"
  | "Cancel";

export interface LifecycleMetric {
  stage: BugLifecycleStage;
  count: number;
  avgDays?: number;
}

/* ── Anomaly / Insight ────────────────────────────────── */

export type InsightSeverity = "good" | "warning" | "danger" | "info";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  detail: string;
  personCode?: string;
  metric?: string;
  value?: number;
  suggestion?: string;
}

/* ── Benchmark ────────────────────────────────────────── */

export interface BenchmarkData {
  personCode: string;
  month: string;
  totalDetected: number;
  totalFixed: number;
  totalNewFixed: number;
  totalNewOpen: number;
  backlogEnd: number;
  fixRatePercent: number;
  avgBugsPerDay: number;
  weeklyBreakdown: TeamPeriodMetric["period"] extends infer P
    ? Array<{
        period: PeriodInfo;
        detected: number;
        newFixed: number;
        newOpen: number;
        fixedInPeriod: number;
        backlogEnd: number;
        fixRatePercent: number;
      }>
    : never;
}

/* ── Checklist ────────────────────────────────────────── */

export interface ChecklistItem {
  id: string;
  code: string;
  title: string;
  description: string;
  example?: string;
  lesson?: string;
  prs: string[];
  createdAt: string;
  updatedAt: string;
  repo?: string;
}

/* ── Dashboard View (API response) ────────────────────── */

export interface DashboardFilters {
  periodType: PeriodType;
  periodKey?: string;
  personCode?: string;
}

export interface ManagerConclusion {
  good: string;
  bad: string;
  risks: string;
  manDaysOverrides?: Record<string, number>;
  explanations?: Record<string, string>;
}

export interface BugTrackingBreakdownItem {
  name: string;
  totalBugs: number;
  fixedBugs: number;
  openBugs: number;
}

export interface DashboardView {
  syncedAt: string;
  personnel: Person[];
  bugs: BugRecord[];
  lifecycle: LifecycleMetric[];
  insights: Insight[];
  teamMetrics: TeamPeriodMetric[];
  weeklyMetrics: TeamPeriodMetric[];
  monthlyMetrics: TeamPeriodMetric[];
  byTestcase: BugTrackingBreakdownItem[];
  byLocation: BugTrackingBreakdownItem[];
  benchmark: BenchmarkSnapshot;
  availablePeriods: PeriodInfo[];
  checklist: ChecklistItem[];
  totalDatabaseBugs?: number;
  conclusions?: Record<string, ManagerConclusion>;
}

export interface BenchmarkSnapshot {
  person: Person;
  months: BenchmarkMonthSummary[];
}

export interface BenchmarkMonthSummary {
  month: string;
  label: string;
  totalDetected: number;
  totalFixed: number;
  backlogEnd: number;
  fixRatePercent: number;
  avgBugsPerDay: number;
  weeks: BenchmarkWeek[];
}

export interface BenchmarkWeek {
  label: string;
  startDate: string;
  endDate: string;
  detected: number;
  newFixed: number;
  newOpen: number;
  fixedInWeek: number;
  backlogEnd: number;
  fixRatePercent: number;
}
