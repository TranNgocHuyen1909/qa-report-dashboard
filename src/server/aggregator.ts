import type {
  BugRecord, Person, PeriodInfo, PeriodType, PersonPeriodMetric,
  TeamPeriodMetric, LifecycleMetric, BugLifecycleStage, Insight,
  BenchmarkSnapshot, BenchmarkMonthSummary, BenchmarkWeek, DashboardView,
  DashboardFilters, ChecklistItem,
} from "../shared/types";
import { PERSONNEL, BENCHMARK_PERSON } from "./personnel";

/* ── Helpers ──────────────────────────────────────────── */

function normName(v: string): string {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim().replace(/\s+/g, " ");
}

function dateKey(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const k = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined;
}

function isCanceled(b: BugRecord): boolean { return (b.status ?? "").toLowerCase() === "cancel"; }
function isTrackable(b: BugRecord): boolean {
  const hasOnlyDocs = b.location && b.location.length > 0 && b.location.every(loc => loc.toLowerCase().includes("docs"));
  return !isCanceled(b) && !hasOnlyDocs;
}
function isNoRepro(b: BugRecord): boolean {
  const note = (b.note ?? "").toLowerCase();
  const title = (b.title ?? "").toLowerCase();
  const status = (b.status ?? "").toLowerCase();
  const hasNoReproNote = note.includes("không tái hiện") || note.includes("ko tái hiện");
  if (hasNoReproNote) return true;
  
  // Rule: Exclude duplicate bugs from actual received effort count
  const hasDuplicateNote = note.includes("trùng") || note.includes("duplicate") || 
                        title.includes("trùng lặp") || title.includes("duplicate") ||
                        status.includes("duplicate") || status.includes("trùng");
  if (hasDuplicateNote) return true;
  
  // Rule: For active team members, bugs MUST have a valid Pull Request URL.
  const fixedByIds = b.fixedByIds ?? [];
  const isAn = fixedByIds.some(id => {
    if (BENCHMARK_PERSON.notionIds.includes(id)) return true;
    const n = normName(id);
    return BENCHMARK_PERSON.aliases.some(a => a === n || n.includes(a));
  });
  if (isAn) return false;

  // Must have a valid non-empty Pull Request URL
  return !b.pullRequestUrl || b.pullRequestUrl.trim().length === 0;
}
function isClosed(b: BugRecord): boolean { return (b.status ?? "").toLowerCase() === "closed" && !isNoRepro(b); }
function isDeployed(b: BugRecord): boolean { return (b.status ?? "").toLowerCase() === "deployed" && !isNoRepro(b); }
function isResolved(b: BugRecord): boolean { return (b.status ?? "").toLowerCase() === "resolved" && !isNoRepro(b); }
function isFixed(b: BugRecord): boolean { return isClosed(b) || isDeployed(b) || isResolved(b); }
function isCompletedOrNoRepro(b: BugRecord): boolean {
  const s = (b.status ?? "").toLowerCase();
  return ["closed", "deployed", "resolved"].includes(s);
}
function isReopened(b: BugRecord): boolean { return (b.status ?? "").toLowerCase() === "reopened"; }
function bugFixedDate(b: BugRecord): string | undefined {
  if (b.pullRequestUrl && b.prCreatedAt) {
    return dateKey(b.prCreatedAt);
  }
  return dateKey(b.lastEditedTime) ?? dateKey(b.confirmedDate);
}

function matchesPerson(person: Person, id: string | undefined): boolean {
  if (!id) return false;
  if (person.notionIds.includes(id)) return true;
  const n = normName(id);
  return person.aliases.some(a => a === n || n.includes(a));
}

function matchesGithub(person: Person, ghLogin: string | undefined): boolean {
  if (!ghLogin || !person.githubUsername) return false;
  return person.githubUsername.toLowerCase() === ghLogin.toLowerCase();
}

function bugBelongsTo(bug: BugRecord, person: Person): boolean {
  // PR author takes priority
  if (bug.pullRequestUrl && bug.prAuthor) {
    if (matchesGithub(person, bug.prAuthor)) return true;
    // If PR is by another known team member, skip
    const allPersons = [...PERSONNEL, BENCHMARK_PERSON];
    if (allPersons.some(p => p.code !== person.code && matchesGithub(p, bug.prAuthor))) return false;
  }
  // Fallback to fixedByIds
  return (bug.fixedByIds ?? []).some(id => matchesPerson(person, id));
}

function bugDetectedBy(bug: BugRecord, person: Person): boolean {
  return (bug.testerIds ?? []).some(id => matchesPerson(person, id));
}

function bugReviewedBy(bug: BugRecord, person: Person): boolean {
  return (bug.reviewerIds ?? []).some(id => matchesPerson(person, id));
}

function rd(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function dec(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 10) / 10;
}

/* ── Period builders ──────────────────────────────────── */

function getMonday(d: Date): Date {
  const day = d.getUTCDay() || 7;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() - day + 1);
  return mon;
}

function dateInRange(d: string | undefined, start: string, end: string): boolean {
  return !!d && d >= start && d <= end;
}

function buildDayPeriods(bugs: BugRecord[]): PeriodInfo[] {
  const days = new Set<string>();
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  days.add(todayStr);
  for (const b of bugs) {
    const dd = dateKey(b.detectedDate); if (dd) days.add(dd);
    const cd = bugFixedDate(b); if (cd) days.add(cd);
  }
  return [...days].sort().reverse().slice(0, 14).map(d => ({ key: d, label: d, startDate: d, endDate: d }));
}

function buildWeekPeriods(bugs: BugRecord[], count = 8): PeriodInfo[] {
  const allDates = new Set<string>();
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  allDates.add(todayStr);
  for (const b of bugs) {
    const dd = dateKey(b.detectedDate); if (dd) allDates.add(dd);
    const cd = bugFixedDate(b); if (cd) allDates.add(cd);
  }
  const sorted = [...allDates].sort();
  if (sorted.length === 0) return [];
  const latest = new Date(`${sorted.at(-1)!}T00:00:00Z`);
  const latestMon = getMonday(latest);

  const periods: PeriodInfo[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(latestMon);
    start.setUTCDate(latestMon.getUTCDate() - i * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const sd = start.toISOString().slice(0, 10);
    const ed = end.toISOString().slice(0, 10);
    periods.push({ key: sd, label: `${sd} — ${ed}`, startDate: sd, endDate: ed });
  }
  return periods;
}

function buildMonthPeriods(bugs: BugRecord[]): PeriodInfo[] {
  const months = new Set<string>();
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  months.add(todayStr.slice(0, 7));
  for (const b of bugs) {
    const dd = dateKey(b.detectedDate); if (dd) months.add(dd.slice(0, 7));
    const cd = bugFixedDate(b); if (cd) months.add(cd.slice(0, 7));
  }
  return [...months].sort().reverse().map(m => {
    const [y, mo] = m.split("-");
    const lastDay = new Date(Number(y), Number(mo), 0).getDate();
    return { key: m, label: `Tháng ${Number(mo)}/${y}`, startDate: `${m}-01`, endDate: `${m}-${String(lastDay).padStart(2, "0")}` };
  });
}

export function buildPeriods(bugs: BugRecord[], type: PeriodType): PeriodInfo[] {
  switch (type) {
    case "day": return buildDayPeriods(bugs);
    case "week": return buildWeekPeriods(bugs);
    case "month": return buildMonthPeriods(bugs);
  }
}

/* ── Working days calc ────────────────────────────────── */

function workingDaysBetween(start: string, end: string): number {
  if (start > end) return 0;
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

/* ── Person period metrics ────────────────────────────── */

function buildPersonPeriodMetric(person: Person, bugs: BugRecord[], period: PeriodInfo, conclusions?: Record<string, any>): PersonPeriodMetric {
  const trackable = bugs.filter(isTrackable);
  const myBugs = trackable.filter(b => bugBelongsTo(b, person));

  // Filter by person's start date
  const activeBugs = myBugs.filter(b => {
    if (!person.startDate) return true;
    const d = dateKey(b.prCreatedAt) ?? dateKey(b.detectedDate);
    if (!d) return true;
    // Only exclude if bug was completed before person joined
    if (d < person.startDate && isFixed(b)) {
      const cd = bugFixedDate(b);
      if (cd && cd < person.startDate) return false;
    }
    return true;
  });

  const detected = activeBugs.filter(b => !isNoRepro(b) && dateInRange(dateKey(b.detectedDate), period.startDate, period.endDate) && bugDetectedBy(b, person));
  const fixedInPeriod = activeBugs.filter(b => isFixed(b) && dateInRange(bugFixedDate(b), period.startDate, period.endDate));
  const newInPeriod = activeBugs.filter(b => !isNoRepro(b) && dateInRange(dateKey(b.detectedDate), period.startDate, period.endDate));
  const newFixed = newInPeriod.filter(isFixed);
  const newOpen = newInPeriod.filter(b => !isCompletedOrNoRepro(b));
  const reviewed = trackable.filter(b => {
    if (!bugReviewedBy(b, person)) return false;
    const rDate = dateKey(b.reviewEndDate) || dateKey(b.reviewStartDate) || dateKey(b.huyenLastCommentAt) || dateKey(b.lastEditedTime) || b.confirmedDate || dateKey(b.prCreatedAt);
    return dateInRange(rDate, period.startDate, period.endDate);
  });
  const reopened = activeBugs.filter(b => isReopened(b) && dateInRange(dateKey(b.reopenedDate) ?? dateKey(b.lastEditedTime), period.startDate, period.endDate));

  let wd = workingDaysBetween(
    person.startDate > period.startDate ? person.startDate : period.startDate,
    period.endDate
  );

  // Apply override if present
  if (conclusions && conclusions[period.key]?.manDaysOverrides) {
    const override = conclusions[period.key].manDaysOverrides[person.code];
    if (override !== undefined && override !== null) {
      wd = Number(override);
    }
  }

  return {
    personCode: person.code,
    period,
    bugsDetected: detected.length,
    bugsFixed: fixedInPeriod.length,
    bugsNewFixed: newFixed.length,
    bugsNewOpen: newOpen.length,
    bugsReviewed: reviewed.length,
    bugsReopened: reopened.length,
    backlogEnd: 0, // computed at team level
    fixRatePercent: 0,
    workingDays: wd,
    manDays: wd,
    bugsPerDay: dec(fixedInPeriod.length, wd),
    bugsList: fixedInPeriod,
  };
}

/* ── Team metrics ─────────────────────────────────────── */

function buildTeamPeriodMetric(bugs: BugRecord[], period: PeriodInfo, persons: Person[], conclusions?: Record<string, any>): TeamPeriodMetric {
  const trackable = bugs.filter(isTrackable);
  const detected = trackable.filter(b => !isNoRepro(b) && dateInRange(dateKey(b.detectedDate), period.startDate, period.endDate));
  const fixedInPeriod = trackable.filter(b => isFixed(b) && dateInRange(bugFixedDate(b), period.startDate, period.endDate));
  const newFixed = detected.filter(isFixed);
  const newOpen = detected.filter(b => !isCompletedOrNoRepro(b));

  const byPerson = persons.filter(p => p.role !== "benchmark" && (!p.startDate || p.startDate <= period.endDate)).map(p => buildPersonPeriodMetric(p, bugs, period, conclusions));

  return {
    period,
    totalDetected: detected.length,
    totalFixed: fixedInPeriod.length,
    totalNewFixed: newFixed.length,
    totalNewOpen: newOpen.length,
    backlogEnd: 0,
    fixRatePercent: 0,
    byPerson,
  };
}

function computeBacklogs(metrics: TeamPeriodMetric[], bugs: BugRecord[]): TeamPeriodMetric[] {
  const trackable = bugs.filter(isTrackable);
  // Sort ascending by period start
  const sorted = [...metrics].sort((a, b) => a.period.startDate.localeCompare(b.period.startDate));
  let backlog = 0;

  // Initial backlog = all bugs detected before first period that aren't fixed or no-repro
  if (sorted.length > 0) {
    const firstStart = sorted[0].period.startDate;
    backlog = trackable.filter(b => {
      const dd = dateKey(b.detectedDate);
      if (!dd || dd >= firstStart) return false;
      if (isCompletedOrNoRepro(b)) {
        const cd = bugFixedDate(b);
        return !cd || cd >= firstStart;
      }
      return true;
    }).length;
  }

  for (const m of sorted) {
    const total = backlog + m.totalDetected;
    const inactiveInPeriod = trackable.filter(b => 
      isCompletedOrNoRepro(b) && 
      dateInRange(bugFixedDate(b), m.period.startDate, m.period.endDate)
    ).length;
    backlog = total - inactiveInPeriod;
    m.backlogEnd = backlog;
    m.fixRatePercent = rd(m.totalFixed, total);
  }
  // Return in reverse chronological order
  return sorted.reverse();
}

/* ── Lifecycle ────────────────────────────────────────── */

function buildLifecycle(bugs: BugRecord[]): LifecycleMetric[] {
  const stages: BugLifecycleStage[] = ["New", "In Progress", "Resolved", "Deployed", "Reopened", "Pending", "Closed", "Cancel"];
  const counts = new Map<string, number>();
  for (const b of bugs) {
    const s = (b.status ?? "New").trim();
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return stages.map(stage => ({ stage, count: counts.get(stage) ?? 0 })).filter(m => m.count > 0);
}

/* ── Insights / Anomaly Detection ─────────────────────── */

function buildInsights(teamMetrics: TeamPeriodMetric[], bugs: BugRecord[], persons: Person[]): Insight[] {
  const insights: Insight[] = [];
  if (teamMetrics.length === 0) return insights;

  const latest = teamMetrics[0];
  const devs = latest.byPerson.filter(p => {
    const person = persons.find(pp => pp.code === p.personCode);
    return person?.role === "developer";
  });

  if (devs.length < 2) return insights;

  const avgFixed = devs.reduce((s, d) => s + d.bugsFixed, 0) / devs.length;

  for (const dev of devs) {
    const person = persons.find(p => p.code === dev.personCode)!;
    const diff = avgFixed > 0 ? ((dev.bugsFixed - avgFixed) / avgFixed) * 100 : 0;

    if (diff > 50) {
      insights.push({
        id: `perf-high-${dev.personCode}`,
        severity: "good",
        title: `${person.code} dẫn đầu năng suất`,
        detail: `${dev.bugsFixed} bugs fixed (${dev.bugsPerDay} bugs/ngày) — cao hơn ${Math.abs(Math.round(diff))}% so với trung bình nhóm`,
        personCode: dev.personCode,
        metric: "bugsFixed",
        value: dev.bugsFixed,
      });
    } else if (diff < -50 && avgFixed > 2) {
      insights.push({
        id: `perf-low-${dev.personCode}`,
        severity: "danger",
        title: `${person.code} năng suất thấp — cần giải trình`,
        detail: `Chỉ fix ${dev.bugsFixed} bugs — thấp hơn ${Math.abs(Math.round(diff))}% so với trung bình nhóm (${avgFixed.toFixed(1)})`,
        personCode: dev.personCode,
        metric: "bugsFixed",
        value: dev.bugsFixed,
        suggestion: "Cần điều chỉnh: giảm task, tăng mentoring, hoặc đánh giá lại độ ưu tiên",
      });
    }
  }

  // HuyenTN review check
  const huyenMetric = latest.byPerson.find(p => p.personCode === "HuyenTN");
  if (huyenMetric && huyenMetric.bugsReviewed === 0) {
    insights.push({
      id: "lead-no-review",
      severity: "warning",
      title: "HuyenTN chưa review bug nào trong kỳ",
      detail: `Quản lý (HuyenTN) không thực hiện review lỗi nào trong kỳ ${latest.period.label}`,
      personCode: "HuyenTN",
      suggestion: "Cần review ít nhất resolved bugs để đảm bảo kiểm soát chất lượng",
    });
  }

  // Re-open without root cause
  const reopenedBugs = bugs.filter(isTrackable).filter(isReopened);
  const noRootCause = reopenedBugs.filter(b => !b.rootCause);
  if (noRootCause.length > 0) {
    insights.push({
      id: "reopen-no-root",
      severity: "warning",
      title: `${noRootCause.length} bug Re-open chưa có phân tích nguyên nhân`,
      detail: "Bug re-open cần có Root Cause Analysis để khắc phục triệt để",
      suggestion: "Phân tích nguyên nhân gốc rễ tại sao lỗi bị mở lại",
    });
  }

  // Week-over-week trend
  if (teamMetrics.length >= 2) {
    const prev = teamMetrics[1];
    const fixDelta = latest.totalFixed - prev.totalFixed;
    const pct = prev.totalFixed > 0 ? (fixDelta / prev.totalFixed) * 100 : 0;
    if (pct < -40) {
      insights.push({
        id: "trend-drop",
        severity: "danger",
        title: "Năng suất fix bug giảm mạnh",
        detail: `Giảm ${Math.abs(Math.round(pct))}% so với kỳ trước (${prev.totalFixed} → ${latest.totalFixed})`,
        suggestion: "Kiểm tra nguyên nhân: thiếu resource, task quá khó, hay phân bổ không hợp lý",
      });
    } else if (pct > 40 && latest.totalFixed > 5) {
      insights.push({
        id: "trend-spike",
        severity: "info",
        title: "Năng suất tăng đột biến",
        detail: `Tăng ${Math.round(pct)}% so với kỳ trước (${prev.totalFixed} → ${latest.totalFixed})`,
      });
    }
  }

  return insights;
}

/* ── Benchmark An ─────────────────────────────────────── */

function buildBenchmark(bugs: BugRecord[]): BenchmarkSnapshot {
  const anPerson = BENCHMARK_PERSON;

  const months: BenchmarkMonthSummary[] = [
    // Month 6 (June) - Word report values based on 22 working days (excluding Sat/Sun)
    {
      month: "2026-06",
      label: "Tháng 6/2026",
      totalDetected: 217,
      totalFixed: 135,
      backlogEnd: 178,
      fixRatePercent: 38.4,
      avgBugsPerDay: 6.1,
      weeks: [
        { label: "Tuần 5", startDate: "2026-06-29", endDate: "2026-06-30", detected: 13, newFixed: 6, newOpen: 7, fixedInWeek: 3, backlogEnd: 178, fixRatePercent: 1.7 },
        { label: "Tuần 4", startDate: "2026-06-22", endDate: "2026-06-28", detected: 54, newFixed: 24, newOpen: 30, fixedInWeek: 2, backlogEnd: 168, fixRatePercent: 1.2 },
        { label: "Tuần 3", startDate: "2026-06-15", endDate: "2026-06-21", detected: 22, newFixed: 16, newOpen: 6, fixedInWeek: 0, backlogEnd: 116, fixRatePercent: 0.0 },
        { label: "Tuần 2", startDate: "2026-06-08", endDate: "2026-06-14", detected: 55, newFixed: 35, newOpen: 20, fixedInWeek: 78, backlogEnd: 94, fixRatePercent: 45.3 },
        { label: "Tuần 1", startDate: "2026-06-01", endDate: "2026-06-07", detected: 73, newFixed: 54, newOpen: 19, fixedInWeek: 28, backlogEnd: 117, fixRatePercent: 19.3 },
      ]
    },
    // Month 5 (May) - Word report values based on 21 working days (excluding Sat/Sun)
    {
      month: "2026-05",
      label: "Tháng 5/2026",
      totalDetected: 97,
      totalFixed: 80,
      backlogEnd: 72,
      fixRatePercent: 63.5,
      avgBugsPerDay: 3.8,
      weeks: [
        { label: "Tuần 4", startDate: "2026-05-25", endDate: "2026-05-31", detected: 20, newFixed: 15, newOpen: 5, fixedInWeek: 21, backlogEnd: 72, fixRatePercent: 22.6 },
        { label: "Tuần 3", startDate: "2026-05-18", endDate: "2026-05-24", detected: 23, newFixed: 15, newOpen: 8, fixedInWeek: 44, backlogEnd: 73, fixRatePercent: 37.6 },
        { label: "Tuần 2", startDate: "2026-05-11", endDate: "2026-05-17", detected: 33, newFixed: 29, newOpen: 4, fixedInWeek: 24, backlogEnd: 94, fixRatePercent: 20.3 },
        { label: "Tuần 1", startDate: "2026-05-01", endDate: "2026-05-10", detected: 21, newFixed: 21, newOpen: 0, fixedInWeek: 36, backlogEnd: 85, fixRatePercent: 29.8 },
      ]
    },
    // Month 4 (April) - Hardcoded from Notion
    {
      month: "2026-04",
      label: "Tháng 4/2026",
      totalDetected: 119,
      totalFixed: 103,
      backlogEnd: 100,
      fixRatePercent: 46.5,
      avgBugsPerDay: 4.7,
      weeks: [
        { label: "Tuần 4", startDate: "2026-04-20", endDate: "2026-04-26", detected: 38, newFixed: 29, newOpen: 9, fixedInWeek: 33, backlogEnd: 100, fixRatePercent: 24.8 },
        { label: "Tuần 3", startDate: "2026-04-13", endDate: "2026-04-19", detected: 47, newFixed: 40, newOpen: 7, fixedInWeek: 20, backlogEnd: 95, fixRatePercent: 17.4 },
        { label: "Tuần 2", startDate: "2026-04-06", endDate: "2026-04-12", detected: 28, newFixed: 28, newOpen: 0, fixedInWeek: 32, backlogEnd: 68, fixRatePercent: 32.0 },
        { label: "Tuần 1", startDate: "2026-04-01", endDate: "2026-04-05", detected: 6, newFixed: 6, newOpen: 0, fixedInWeek: 2, backlogEnd: 72, fixRatePercent: 2.7 },
      ]
    }
  ];

  return { person: anPerson, months };
}

/* ── Breakdown helpers ────────────────────────────────── */

function buildBreakdown(bugs: BugRecord[], keySelector: (b: BugRecord) => string[]): any[] {
  const map = new Map<string, { total: number; fixed: number; open: number }>();
  for (const b of bugs) {
    const keys = keySelector(b);
    for (const key of keys) {
      const name = key || "(empty)";
      const current = map.get(name) || { total: 0, fixed: 0, open: 0 };
      current.total++;
      if (isFixed(b)) {
        current.fixed++;
      } else {
        current.open++;
      }
      map.set(name, current);
    }
  }
  return Array.from(map.entries()).map(([name, val]) => ({
    name,
    totalBugs: val.total,
    fixedBugs: val.fixed,
    openBugs: val.open,
  })).sort((a, b) => b.openBugs - a.openBugs || a.name.localeCompare(b.name));
}

function normalizeBugs(bugs: BugRecord[]): BugRecord[] {
  const allPersons = [...PERSONNEL, BENCHMARK_PERSON];
  const lead = PERSONNEL.find(p => p.role === "lead") || PERSONNEL[0];

  return bugs.map(bug => {
    let fixedByIds = bug.fixedByIds ?? [];
    let reviewerIds = bug.reviewerIds ?? [];

    // Rule 1: Use GitHub PR Author as source of truth for the fixer
    if (bug.pullRequestUrl && bug.prAuthor) {
      const dev = allPersons.find(p => matchesGithub(p, bug.prAuthor));
      if (dev) {
        // If the dev is inside reviewerIds in Notion, but they are the actual PR Author (fixer),
        // it means the columns "Fixed by" and "Reviewers" were swapped in Notion by mistake.
        const devInReviewer = reviewerIds.some(id => matchesPerson(dev, id));
        if (devInReviewer) {
          // Remove dev from reviewers
          reviewerIds = reviewerIds.filter(id => !matchesPerson(dev, id));
          
          // Add the other person from fixedByIds to reviewers (swap case)
          const actualReviewers = fixedByIds.filter(id => !matchesPerson(dev, id));
          if (actualReviewers.length > 0) {
            reviewerIds = [...reviewerIds, ...actualReviewers];
          }
          
          // Set dev as the fixer
          fixedByIds = [dev.notionIds[0]];
        }
      }
    }

    // Rule 2: Developers do not review. If a developer is in reviewerIds, replace them with the lead (HuyenTN)
    const devs = PERSONNEL.filter(p => p.role === "developer");
    reviewerIds = reviewerIds.map(rid => {
      const matchedDev = devs.find(d => matchesPerson(d, rid));
      if (matchedDev) {
        return lead.notionIds[0]; // Replace developer with lead (HuyenTN)
      }
      return rid;
    });

    // Group any location that contains "metadata" (case-insensitive) into "Metadata"
    let location = (bug.location ?? []).map(loc => {
      if (loc.toLowerCase().includes("metadata")) {
        return "Metadata";
      }
      return loc;
    });

    return {
      ...bug,
      fixedByIds,
      reviewerIds: Array.from(new Set(reviewerIds)), // deduplicate
      location: Array.from(new Set(location)), // deduplicate
    };
  });
}

/* ── Build full view ──────────────────────────────────── */

export function buildDashboardView(
  bugs: BugRecord[],
  filters: DashboardFilters,
  checklist: ChecklistItem[],
  conclusions?: Record<string, any>,
): DashboardView {
  const normalized = normalizeBugs(bugs);
  const periodType = filters.periodType || "week";
  const teamStartDate = "2026-06-29";

  // Filter bugs to only those belonging to the active team (HuyenTN, HoNX, HoangGV, HuyDH)
  const teamBugs = normalized.filter(b => {
    if (!isTrackable(b)) return false;
    return PERSONNEL.some(p => bugBelongsTo(b, p));
  });

  const periods = buildPeriods(teamBugs, periodType).filter(p => p.endDate >= teamStartDate);

  // Only compute metrics for limited periods to avoid O(n*p) explosion
  const metricsLimit = filters.periodKey ? 1 : 6;
  const periodsForMetrics = filters.periodKey
    ? periods.filter(p => p.key === filters.periodKey)
    : periods.slice(0, metricsLimit);

  let teamMetrics = periodsForMetrics.map(p => buildTeamPeriodMetric(teamBugs, p, PERSONNEL, conclusions));
  teamMetrics = computeBacklogs(teamMetrics, teamBugs);

  // If filtering by person, filter byPerson
  if (filters.personCode) {
    teamMetrics = teamMetrics.map(m => ({
      ...m,
      byPerson: m.byPerson.filter(p => p.personCode === filters.personCode),
    }));
  }

  // Use first 2 computed metrics for insights (avoid recomputing)
  const insightMetrics = teamMetrics.slice(0, 2);

  // Always compute 8 weeks of metrics
  const weekPeriods = buildPeriods(teamBugs, "week").filter(p => p.endDate >= teamStartDate);
  let weeklyMetrics = weekPeriods.slice(0, 8).map(p => buildTeamPeriodMetric(teamBugs, p, PERSONNEL, conclusions));
  weeklyMetrics = computeBacklogs(weeklyMetrics, teamBugs);

  // Always compute all monthly metrics
  const monthPeriods = buildPeriods(teamBugs, "month").filter(p => p.endDate >= teamStartDate);
  let monthlyMetrics = monthPeriods.map(p => buildTeamPeriodMetric(teamBugs, p, PERSONNEL, conclusions));
  monthlyMetrics = computeBacklogs(monthlyMetrics, teamBugs);

  // Don't send full bug objects to frontend — only send recent/relevant ones
  const recentBugs = teamBugs.filter(b => {
    const d = dateKey(b.detectedDate) ?? bugFixedDate(b);
    if (!d) return false;
    // Only include bugs from the last 60 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    return d >= cutoff.toISOString().slice(0, 10);
  });

  return {
    syncedAt: new Date().toISOString(),
    personnel: PERSONNEL,
    bugs: teamBugs,
    lifecycle: buildLifecycle(teamBugs),
    insights: buildInsights(insightMetrics, teamBugs, PERSONNEL),
    teamMetrics,
    weeklyMetrics,
    monthlyMetrics,
    byTestcase: buildBreakdown(teamBugs, (b) => [b.testcaseName || "(empty)"]),
    byLocation: buildBreakdown(teamBugs, (b) => b.location && b.location.length > 0 ? b.location : ["(empty)"]),
    benchmark: buildBenchmark(normalized), // benchmark uses ALL bugs to access AnPD historical data
    availablePeriods: periods,
    checklist,
    totalDatabaseBugs: normalized.filter(isTrackable).length,
  };
}
