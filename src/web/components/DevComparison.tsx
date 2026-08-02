import { useMemo, useState, useEffect } from "react";
import type { DashboardView, BugRecord, PeriodType } from "../../shared/types";
import { saveConclusion } from "../api";

// Helper to extract date key YYYY-MM-DD
function dateKey(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const k = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined;
}

// Helper to check if a date is within a range
function dateInRange(d: string | undefined, start: string, end: string): boolean {
  return !!d && d >= start && d <= end;
}

// Helper to check if bug has a valid PR
function hasPR(b: BugRecord): boolean {
  return Boolean(b.pullRequestUrl && b.pullRequestUrl.trim().length > 0);
}

const LOCATION_PRIORITY = ["Flow", "Prompt", "Metadata", "Docs"];

// Helper to pick 1 single primary location by priority: Flow > Prompt > Metadata > Docs > Others
function getPrimaryLocation(locs: string[] | undefined): string {
  if (!locs || locs.length === 0) return "Others";
  for (const prio of LOCATION_PRIORITY) {
    const match = locs.find(l => l.toLowerCase().includes(prio.toLowerCase()));
    if (match) {
      if (prio === "Flow") return "Flow";
      if (prio === "Prompt") return "Prompt";
      if (prio === "Metadata") return "Metadata";
      if (prio === "Docs") return "Docs";
      return match;
    }
  }
  return locs[0] || "Others";
}

export function DevComparison({ view, periodType, periodKey, onUpdate }: { view: DashboardView; periodType?: PeriodType; periodKey?: string; onUpdate?: () => Promise<void> }) {
  // Find active period details from topbar filters
  const activePeriod = useMemo(() => {
    if (periodKey && periodKey !== "all") {
      const found = view.availablePeriods.find(p => p.key === periodKey);
      if (found) return found;
    }
    if (periodKey === "all") {
      return {
        key: "all",
        label: "Tất cả các kỳ",
        startDate: "2020-01-01",
        endDate: "2099-12-31"
      };
    }
    // Default to latest period if invalid
    return view.availablePeriods.find(p => p.key !== "all") ?? view.availablePeriods[0];
  }, [view.availablePeriods, periodKey]);

  const developers = useMemo(() => {
    return view.personnel.filter(p => p.role !== "benchmark" && (!p.startDate || p.startDate <= (activePeriod?.endDate ?? "")));
  }, [view.personnel, activePeriod]);

  const [selectedReopenedBugs, setSelectedReopenedBugs] = useState<any[] | null>(null);
  const [selectedPrBugs, setSelectedPrBugs] = useState<any[] | null>(null);
  const [selectedReviewsList, setSelectedReviewsList] = useState<any[] | null>(null);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<{
    totalCount: number;
    groups: Array<{ parentBugId: string; parentTitle: string; childTasks: any[] }>;
  } | null>(null);
  const [selectedDevCode, setSelectedDevCode] = useState<string>("");

  const [manDaysOverrides, setManDaysOverrides] = useState<Record<string, number>>({});
  const [savingMd, setSavingMd] = useState(false);

  // Sync local overrides with loaded database conclusions when period changes
  useEffect(() => {
    if (activePeriod && view.conclusions?.[activePeriod.key]?.manDaysOverrides) {
      setManDaysOverrides(view.conclusions[activePeriod.key].manDaysOverrides || {});
    } else {
      setManDaysOverrides({});
    }
  }, [activePeriod, view.conclusions]);

  const hasMdChanges = useMemo(() => {
    if (!activePeriod) return false;
    const activeMetric = view.teamMetrics.find(m => m.period.key === activePeriod.key);
    if (!activeMetric) return false;

    return developers.some(dev => {
      const pMetric = activeMetric.byPerson.find(p => p.personCode === dev.code);
      const originalMD = pMetric ? pMetric.manDays : 0;
      const currentMD = manDaysOverrides[dev.code] !== undefined ? manDaysOverrides[dev.code] : originalMD;
      return currentMD !== originalMD;
    });
  }, [developers, view.teamMetrics, activePeriod, manDaysOverrides]);

  const handleSaveMd = async (overrideData?: Record<string, number>) => {
    if (!activePeriod) return;
    setSavingMd(true);
    try {
      const currentConclusion = view.conclusions?.[activePeriod.key];
      const good = currentConclusion?.good || "";
      const bad = currentConclusion?.bad || "";
      const risks = currentConclusion?.risks || "";
      const dataToSave = overrideData || manDaysOverrides;
      
      await saveConclusion(activePeriod.key, good, bad, risks, dataToSave);
      if (onUpdate) {
        await onUpdate();
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu ngày công (MD)");
    } finally {
      setSavingMd(false);
    }
  };

  // Helper to match a bug to a developer (with PR priority)
  const bugBelongsToDev = (bug: BugRecord, dev: typeof developers[0]) => {
    const prAuthor = bug.prAuthor?.toLowerCase();
    if (bug.pullRequestUrl && prAuthor) {
      if (dev.githubUsername && prAuthor === dev.githubUsername.toLowerCase()) return true;
      if (developers.some(p => p.code !== dev.code && p.githubUsername && p.githubUsername.toLowerCase() === prAuthor)) return false;
    }
    const notionIds = dev.notionIds || [];
    return (bug.fixedByIds ?? []).some(id => notionIds.includes(id));
  };

  // Helper to get bug fixed date (last PR commit date, confirmed date, PR date, or created time)
  const bugFixedDate = (b: BugRecord) => {
    return (
      dateKey(b.prLastCommitAt) ??
      dateKey(b.confirmedDate) ??
      dateKey(b.prCreatedAt) ??
      dateKey(b.createdTime)
    );
  };

  const isNoRepro = (b: BugRecord) => {
    const note = (b.note ?? "").toLowerCase();
    const st = (b.status ?? "").toLowerCase();
    const hasNoReproNote = note.includes("không tái hiện") || note.includes("ko tái hiện") || note.includes("no repro") || note.includes("không phải lỗi") || st.includes("không tái hiện") || st.includes("ko tái hiện");
    return hasNoReproNote || !b.pullRequestUrl;
  };

  const isFixed = (b: BugRecord) => {
    return ["closed", "deployed", "resolved"].includes((b.status ?? "").toLowerCase()) && !isNoRepro(b);
  };

  const isReviewedByHuyen = (b: BugRecord) => {
    if (!b.pullRequestUrl) return false;
    if (isNoRepro(b)) return false;
    const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
    const status = (b.status ?? "").toLowerCase();
    const huyenComments = b.prCommentsByHuyen ?? 0;
    const ghLbls = (b.ghLabels ?? []).map((l) => l.toLowerCase());
    const isWaitLabelOnPR = ghLbls.some((l) => l.includes("wait"));
    const hasHuyenInReviewers = (b.reviewerIds ?? []).includes(huyenNotionId);
    return (
      hasHuyenInReviewers ||
      huyenComments > 0 ||
      isWaitLabelOnPR ||
      status === "wait for development" ||
      status.includes("wait")
    );
  };

  const isReviewedByTruong = (b: BugRecord) => {
    if (!b.pullRequestUrl) return false;
    if (isNoRepro(b)) return false;
    const truongComments = b.prCommentsByTruong ?? 0;
    const ghReviews = b.ghReviews ?? [];
    return truongComments > 0 || ghReviews.some(r => r.author.toLowerCase() === "truongtc" || r.author.toLowerCase() === "dract");
  };

  const devStats = useMemo(() => {
    if (!activePeriod) return [];

    const rows: any[] = [];

    developers.forEach(dev => {
      // Find all bugs belonging to this developer in this period
      const devBugs = view.bugs.filter(b => bugBelongsToDev(b, dev));
      
      // Get all unique locations for this developer's bugs in this period (assigned or fixed)
      const locations = new Set<string>();
      devBugs.forEach(b => {
        const locs = b.location && b.location.length > 0 ? b.location : ["Chưa phân loại"];
        locs.forEach(loc => locations.add(loc));
      });

      if (locations.size === 0) {
        locations.add("—");
      }

      locations.forEach(loc => {
        // Filter developer's bugs to only those belonging to this specific location
        const locBugs = devBugs.filter(b => {
          const locs = b.location && b.location.length > 0 ? b.location : ["Chưa phân loại"];
          if (loc === "—") return true;
          return locs.includes(loc);
        });

        const assignedBugs = locBugs.filter(b => 
          dateInRange(dateKey(b.detectedDate) ?? dateKey(b.createdTime), activePeriod.startDate, activePeriod.endDate)
        );

        const completedBugs = locBugs.filter(b => 
          isFixed(b) && dateInRange(bugFixedDate(b), activePeriod.startDate, activePeriod.endDate)
        );

        const total = assignedBugs.length;
        const closed = completedBugs.filter(b => ["closed", "deployed"].includes((b.status ?? "").toLowerCase()));
        const resolved = completedBugs.filter(b => (b.status ?? "").toLowerCase() === "resolved");

        const noRepro = locBugs.filter(b => 
          isNoRepro(b) && 
          dateInRange(bugFixedDate(b), activePeriod.startDate, activePeriod.endDate)
        ).length;

        const solvedWithPr = completedBugs.filter(b => !!b.pullRequestUrl);

        const reopenedBugsList = locBugs.filter(b => 
          ((b.status ?? "").toLowerCase() === "reopened" || b.reopenedDate) &&
          dateInRange(dateKey(b.reopenedDate) ?? dateKey(b.confirmedDate) ?? dateKey(b.createdTime), activePeriod.startDate, activePeriod.endDate)
        );

        const reopenRate = completedBugs.length > 0 ? (reopenedBugsList.length / completedBugs.length) * 100 : 0;
        const totalComments = solvedWithPr.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
        const commentsPerTask = solvedWithPr.length > 0 ? totalComments / solvedWithPr.length : 0;

        const repeatedBugs = solvedWithPr.filter(b => {
          return view.checklist.some(item => 
            item.prs.some(pr => b.pullRequestUrl?.toLowerCase().includes(pr.toLowerCase()))
          );
        });

        const repeatedCodesMap = new Map<string, string>();
        repeatedBugs.forEach(b => {
          const matched = view.checklist.filter(item => 
            item.prs.some(pr => b.pullRequestUrl?.toLowerCase().includes(pr.toLowerCase()))
          );
          matched.forEach(m => {
            repeatedCodesMap.set(m.code, m.title);
          });
        });

        const repeatedDetails = Array.from(repeatedCodesMap.entries()).map(([code, title]) => ({ code, title }));

        rows.push({
          dev,
          location: loc,
          total,
          closedCount: closed.length,
          resolvedCount: resolved.length,
          noRepro,
          solvedWithPr: solvedWithPr.length,
          reopenedCount: reopenedBugsList.length,
          reopenedList: reopenedBugsList.map(b => ({ bugId: b.bugId || b.id, title: b.title, url: b.url })),
          reopenRate,
          commentsPerTask,
          repeatedCount: repeatedBugs.length,
          repeatedDetails,
        });
      });
    });

    return rows;
  }, [developers, view.bugs, view.checklist, activePeriod]);

  const aggregatedDevStats = useMemo(() => {
    if (!activePeriod) return [];

    // Find previous period for trend tracking (if active period is weekly)
    const weeklyIdx = view.weeklyMetrics.findIndex(m => m.period.key === activePeriod.key);
    const prevMetric = (weeklyIdx !== -1 && weeklyIdx + 1 < view.weeklyMetrics.length)
      ? view.weeklyMetrics[weeklyIdx + 1]
      : null;

    return developers.map(dev => {
      const devRows = devStats.filter(r => r.dev.code === dev.code);
      
      const noRepro = devRows.reduce((sum, r) => sum + r.noRepro, 0);
      const reopenedCount = devRows.reduce((sum, r) => sum + r.reopenedCount, 0);
      const repeatedCount = devRows.reduce((sum, r) => sum + r.repeatedCount, 0);
      
      const reopenedList: any[] = [];
      devRows.forEach(r => {
        if (r.reopenedList) {
          reopenedList.push(...r.reopenedList);
        }
      });
      
      const repeatedMap = new Map<string, string>();
      devRows.forEach(r => {
        r.repeatedDetails.forEach((d: any) => {
          repeatedMap.set(d.code, d.title);
        });
      });
      const repeatedDetails = Array.from(repeatedMap.entries()).map(([code, title]) => ({ code, title }));

      // Calculate comments per task directly from the developer's bugs in the period
      const devBugs = view.bugs.filter(b => bugBelongsToDev(b, dev) && (b.status ?? "").toLowerCase() !== "cancel");
      // 1. TỔNG PR: Direct unique PR tasks belonging to dev in active period (does not include child duplicate tasks)
      const directPrBugs = devBugs.filter(b => {
        if (!hasPR(b)) return false;
        const d = bugFixedDate(b);
        return isFixed(b) && dateInRange(d, activePeriod.startDate, activePeriod.endDate);
      });
      const solvedWithPrBugs = directPrBugs;
      const solvedWithPr = directPrBugs.length;
      const totalComments = directPrBugs.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
      const commentsPerTask = solvedWithPr > 0 ? totalComments / solvedWithPr : 0;

      const prBugsList = directPrBugs.map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        hasPR: true,
        status: (b.status ?? "RESOLVED").toUpperCase(),
        location: b.location && b.location.length > 0 ? b.location.join(", ") : "Chưa phân loại",
        commentsCount: (b.prCommentsByHuyen ?? 0) + (b.prCommentsByTruong ?? 0),
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
      }));

      // 2. CLOSE: Fixed by + confirmedDate (Ngày xác nhận) in active period
      const closedBugsMap = new Map<string, any>();
      view.bugs.forEach(b => {
        const st = (b.status ?? "").toLowerCase();
        if (st !== "closed" && st !== "deployed") return;
        if (isNoRepro(b)) return;

        const isFixedByDev = (b.fixedByIds ?? []).some(id => dev.notionIds.includes(id));
        const prAuthor = b.prAuthor?.toLowerCase();
        const isPrDev = dev.githubUsername && prAuthor === dev.githubUsername.toLowerCase();
        if (!isFixedByDev && !isPrDev) return;

        // Strict filter: Must have b.confirmedDate (Ngày xác nhận) in active period AND non-empty Pull Request link!
        const closedDate = dateKey(b.confirmedDate);
        if (!closedDate || !dateInRange(closedDate, activePeriod.startDate, activePeriod.endDate)) return;
        if (!b.pullRequestUrl || !b.pullRequestUrl.trim()) return;

        const key = b.bugId || b.id;
        if (!closedBugsMap.has(key)) {
          closedBugsMap.set(key, b);
        }

        if (b.duplicateIds && b.duplicateIds.length > 0) {
          b.duplicateIds.forEach((childId: string) => {
            const childObj = view.bugs.find(orig => orig.id === childId || orig.bugId === childId);
            const childKey = childObj ? (childObj.bugId || childObj.id) : childId;
            if (!closedBugsMap.has(childKey)) {
              const childSt = (childObj?.status ?? "").toLowerCase();
              if (childSt !== "cancel" && childSt !== "không lỗi" && childSt !== "wontfix") {
                closedBugsMap.set(childKey, {
                  ...(childObj || {}),
                  bugId: childObj?.bugId || childId.slice(0, 8),
                  id: childId,
                  status: (childObj?.status || "CLOSED").toUpperCase(),
                  isChild: true,
                  parentBugId: key,
                  pullRequestUrl: childObj?.pullRequestUrl || b.pullRequestUrl,
                  location: childObj?.location && childObj.location.length > 0 ? childObj.location : b.location,
                  title: childObj ? `${childObj.title} (Task trùng lặp của [${key}])` : `Task trùng lặp của [${key}]`
                });
              }
            }
          });
        }
      });

      const closedBugs = Array.from(closedBugsMap.values());
      const resolvedBugsMap = new Map<string, any>();
      devBugs.forEach(b => {
        const st = (b.status ?? "").toLowerCase();
        if (st !== "resolved" && st !== "closed" && st !== "deployed" && st !== "reviewed") return;
        if (isNoRepro(b)) return;
        if (!b.pullRequestUrl || !b.pullRequestUrl.trim()) return;

        const prDate = dateKey(b.prCreatedAt) || dateKey(b.prLastCommitAt) || dateKey(b.confirmedDate) || dateKey(b.lastEditedTime);
        if (prDate && dateInRange(prDate, activePeriod.startDate, activePeriod.endDate)) {
          const taskId = b.bugId || b.id;
          resolvedBugsMap.set(taskId, b);
        }
      });
      const resolvedBugs = Array.from(resolvedBugsMap.values());

      const closedCount = closedBugs.length;
      const resolvedCount = resolvedBugs.length;

      const closedBugsList = closedBugs.map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        hasPR: !!b.pullRequestUrl,
        status: (b.status ?? "").toUpperCase(),
        location: getPrimaryLocation(b.location),
        commentsCount: (b.prCommentsByHuyen ?? 0) + (b.prCommentsByTruong ?? 0),
        commitsCount: b.ghCommitsCount ?? 1,
        date: dateKey(b.confirmedDate) || bugFixedDate(b) || dateKey(b.prCreatedAt) || "—",
        isChild: b.isChild,
        parentBugId: b.parentBugId
      }));

      const resolvedBugsList = resolvedBugs.map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        hasPR: !!b.pullRequestUrl,
        status: "RESOLVED",
        location: getPrimaryLocation(b.location),
        commentsCount: (b.prCommentsByHuyen ?? 0) + (b.prCommentsByTruong ?? 0),
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
        isChild: (b as any).isChild,
        parentBugId: (b as any).parentBugId
      }));

      const targetBugs = view.bugs;

      const closedBugsWithPr = targetBugs.filter(b => {
        const st = (b.status ?? "").toLowerCase();
        if (st !== "closed" && st !== "deployed") return false;
        if (isNoRepro(b)) return false;
        if (!bugBelongsToDev(b, dev)) return false;
        const closedDate = dateKey(b.confirmedDate);
        if (!closedDate || !dateInRange(closedDate, activePeriod.startDate, activePeriod.endDate)) return false;
        return Boolean(b.pullRequestUrl && b.pullRequestUrl.trim());
      }).length;

      let duplicateChildCount = 0;
      const seenChildKeys = new Set<string>();
      closedBugs.forEach(b => {
        if (b.isChild) return;
        if (b.duplicateIds && b.duplicateIds.length > 0) {
          b.duplicateIds.forEach((childId: string) => {
            const childObj = view.bugs.find(orig => orig.id === childId || orig.bugId === childId);
            const childKey = childObj ? (childObj.bugId || childObj.id) : childId;
            const childSt = (childObj?.status ?? "").toLowerCase();
            if (childSt !== "cancel" && childSt !== "không lỗi" && childSt !== "wontfix") {
              if (!seenChildKeys.has(childKey)) {
                seenChildKeys.add(childKey);
                duplicateChildCount++;
              }
            }
          });
        }
      });
      const closedBugsNoPr = closedBugsList.filter(b => !b.hasPR).length;
      const resolvedBugsWithPr = resolvedBugs.length;
      const resolvedBugsNoPr = resolvedBugsList.filter(b => !b.hasPR).length;

      const closedUniquePrs = new Set(
        closedBugsList
          .map(b => b.prUrl)
          .filter((url): url is string => Boolean(url && url.trim().length > 0))
      ).size;

      const resolvedUniquePrs = new Set(
        resolvedBugsList
          .map(b => b.prUrl)
          .filter((url): url is string => Boolean(url && url.trim().length > 0))
      ).size;

      // Closed location summary text
      const closedLocMap = new Map<string, { total: number; withPr: number; noPr: number }>();
      closedBugs.forEach(b => {
        const loc = getPrimaryLocation(b.location);
        const hasPr = !!b.pullRequestUrl;
        if (!closedLocMap.has(loc)) closedLocMap.set(loc, { total: 0, withPr: 0, noPr: 0 });
        const item = closedLocMap.get(loc)!;
        item.total++;
        if (hasPr) item.withPr++; else item.noPr++;
      });
      const closedLocParts = Array.from(closedLocMap.entries()).map(([loc, d]) => {
        if (d.noPr > 0 && d.withPr > 0) return `${loc} (${d.total}: ${d.withPr} PR, ${d.noPr} chưa PR)`;
        if (d.noPr > 0) return `${loc} (${d.total} chưa PR)`;
        return `${loc} (${d.total})`;
      });
      const closedLocText = closedLocParts.length > 0 ? closedLocParts.join(", ") : "";

      // Resolved location summary text
      const resolvedLocMap = new Map<string, { total: number; withPr: number; noPr: number }>();
      resolvedBugs.forEach(b => {
        const loc = getPrimaryLocation(b.location);
        const hasPr = !!b.pullRequestUrl;
        if (!resolvedLocMap.has(loc)) resolvedLocMap.set(loc, { total: 0, withPr: 0, noPr: 0 });
        const item = resolvedLocMap.get(loc)!;
        item.total++;
        if (hasPr) item.withPr++; else item.noPr++;
      });
      const resolvedLocParts = Array.from(resolvedLocMap.entries()).map(([loc, d]) => {
        if (d.noPr > 0 && d.withPr > 0) return `${loc} (${d.total}: ${d.withPr} PR, ${d.noPr} chưa PR)`;
        if (d.noPr > 0) return `${loc} (${d.total} chưa PR)`;
        return `${loc} (${d.total})`;
      });
      const resolvedLocText = resolvedLocParts.length > 0 ? resolvedLocParts.join(", ") : "";

      // Group location breakdown details from closedBugsList and resolvedBugsList
      const locDetailsMap = new Map<string, {
        location: string;
        closedWithPr: number;
        closedNoPr: number;
        resolvedWithPr: number;
        resolvedNoPr: number;
        bugList: any[];
      }>();

      const allReportBugs = [...closedBugsList, ...resolvedBugsList];
      allReportBugs.forEach(b => {
        const loc = b.location;
        const isClosed = b.status !== "RESOLVED";
        const isRes = b.status === "RESOLVED";
        const hasPr = b.hasPR;

        if (!locDetailsMap.has(loc)) {
          locDetailsMap.set(loc, {
            location: loc,
            closedWithPr: 0,
            closedNoPr: 0,
            resolvedWithPr: 0,
            resolvedNoPr: 0,
            bugList: [],
          });
        }
        const item = locDetailsMap.get(loc)!;
        if (isClosed) {
          if (hasPr) item.closedWithPr++; else item.closedNoPr++;
        }
        if (isRes) {
          if (hasPr) item.resolvedWithPr++; else item.resolvedNoPr++;
        }
        if (!item.bugList.some(exist => exist.bugId === b.bugId)) {
          item.bugList.push(b);
        }
      });

      const locationDetailsList = Array.from(locDetailsMap.values()).sort((a, b) => {
        const order = ["Flow", "Prompt", "Metadata", "Docs", "Others"];
        const idxA = order.indexOf(a.location);
        const idxB = order.indexOf(b.location);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      });
      
      const activeMetric = view.teamMetrics.find(m => m.period.key === activePeriod.key);
      const pMetric = activeMetric?.byPerson.find(p => p.personCode === dev.code);
      
      // Use local overrides if defined, otherwise fallback to the backend metric's value (default 5 MD)
      const manDays = manDaysOverrides[dev.code] !== undefined
        ? manDaysOverrides[dev.code]
        : (pMetric && pMetric.manDays > 0 ? pMetric.manDays : 5);

      const reCommitBugsList = devBugs.filter(b => {
        if (!b.pullRequestUrl) return false;
        
        const createdDate = dateKey(b.prCreatedAt) ?? dateKey(b.createdTime);
        const fixDate = bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.lastEditedTime);

        // 1. PR created BEFORE active period (opened in an earlier period)
        const isCreatedEarlier = !!createdDate && createdDate < activePeriod.startDate;

        // 2. Received new commits / updates within active period
        const isUpdatedInPeriod = dateInRange(fixDate, activePeriod.startDate, activePeriod.endDate);

        // 3. Has extra commits / re-commits / review comments
        const hasExtraCommitsOrEdits =
          (b.ghCommitsCount ?? 1) > 1 ||
          (b.prCommentsByHuyen ?? 0) > 0 ||
          (b.prCommentsByTruong ?? 0) > 0 ||
          (b.prCommentsByAuthor ?? 0) > 0 ||
          (b.huyenReviewRounds ?? 0) > 1 ||
          (fixDate && createdDate && fixDate > createdDate);

        return isCreatedEarlier && isUpdatedInPeriod && hasExtraCommitsOrEdits;
      }).map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commitsCount: b.ghCommitsCount ?? 1,
        commentsCount: (b.prCommentsByHuyen ?? 0) + (b.prCommentsByTruong ?? 0),
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
        prCreatedAt: dateKey(b.prCreatedAt) || "—",
      }));
      const reCommitCount = reCommitBugsList.length;
      const reCommitRate = solvedWithPr > 0 ? (reCommitCount / solvedWithPr) * 100 : 0;

      const isDuplicateBugRecord = (b: BugRecord) => {
        if (b.isDuplicate) return true;
        if (b.duplicateIds && b.duplicateIds.length > 0) return true;
        const note = (b.note ?? "").toLowerCase();
        const title = (b.title ?? "").toLowerCase();
        const status = (b.status ?? "").toLowerCase();
        const solution = (b.solution ?? "").toLowerCase();
        return note.includes("trùng") || note.includes("duplicate") || title.includes("trùng") || status.includes("duplicate") || status.includes("trùng") || solution.includes("trùng");
      };

      const duplicateBugsInPeriod = view.bugs.filter(b => {
        if ((b.status ?? "").toLowerCase() === "cancel") return false;
        if (!isDuplicateBugRecord(b)) return false;
        const d = dateKey(b.detectedDate) ?? dateKey(b.createdTime) ?? bugFixedDate(b);
        if (!dateInRange(d, activePeriod.startDate, activePeriod.endDate)) return false;
        if (dev.code === "HuyenTN") return true;
        return bugBelongsToDev(b, dev);
      });

      const getParentBugRef = (b: BugRecord): { parentId: string; parentTitle: string } => {
        const text = `${b.title} ${b.note ?? ''} ${b.solution ?? ''}`;
        const matches = text.match(/\[?([A-Z0-9]+-\d+)\]?/g) || [];
        const validMatches = matches.map(m => m.replace(/[\[\]]/g, '').toUpperCase()).filter(m => m !== (b.bugId || '').toUpperCase());
        if (validMatches.length > 0) {
          const parentId = validMatches[0];
          const parentBug = view.bugs.find(orig => (orig.bugId || '').toUpperCase() === parentId);
          return {
            parentId,
            parentTitle: parentBug ? parentBug.title : `Bug gốc (${parentId})`
          };
        }
        return {
          parentId: b.bugId || b.id,
          parentTitle: b.title
        };
      };

      const dupGroupMap = new Map<string, { parentBugId: string; parentTitle: string; parentUrl?: string; childTasks: any[] }>();

      // First check Notion Duplicates relations
      duplicateBugsInPeriod.forEach(b => {
        if (b.duplicateIds && b.duplicateIds.length > 0) {
          const parentKey = b.bugId || b.id;
          const childTasks = b.duplicateIds.map(childId => {
            const childObj = view.bugs.find(orig => orig.id === childId || orig.bugId === childId);
            return {
              bugId: childObj ? (childObj.bugId || childObj.id) : childId,
              title: childObj ? childObj.title : `Task trùng (${childId.slice(0, 8)}...)`,
              url: childObj?.url,
              prUrl: childObj?.pullRequestUrl,
              date: childObj ? (bugFixedDate(childObj) || dateKey(childObj.confirmedDate) || dateKey(childObj.createdTime) || "—") : "—",
              note: childObj?.note || childObj?.solution || ""
            };
          });

          dupGroupMap.set(parentKey, {
            parentBugId: parentKey,
            parentTitle: b.title,
            parentUrl: b.url,
            childTasks
          });
        }
      });

      // Second check text-based or standalone duplicate bugs
      duplicateBugsInPeriod.forEach(b => {
        const isAlreadyInGroup = Array.from(dupGroupMap.values()).some(g =>
          g.parentBugId === (b.bugId || b.id) || g.childTasks.some(c => c.bugId === (b.bugId || b.id))
        );

        if (!isAlreadyInGroup) {
          const { parentId, parentTitle } = getParentBugRef(b);
          if (!dupGroupMap.has(parentId)) {
            dupGroupMap.set(parentId, {
              parentBugId: parentId,
              parentTitle,
              childTasks: []
            });
          }
          dupGroupMap.get(parentId)!.childTasks.push({
            bugId: b.bugId || b.id,
            title: b.title,
            url: b.url,
            prUrl: b.pullRequestUrl,
            date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.createdTime) || "—",
            note: b.note || b.solution || ""
          });
        }
      });

      const duplicateGroups = Array.from(dupGroupMap.values());
      const totalChildTasks = duplicateGroups.reduce((sum, g) => sum + g.childTasks.length, 0);
      const duplicateCount = totalChildTasks > 0 ? totalChildTasks : duplicateBugsInPeriod.length;

      const duplicateBugsList = duplicateBugsInPeriod.map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.createdTime) || "—",
      }));

      const huyenReviewedBugsList = solvedWithPrBugs.filter(b => isReviewedByHuyen(b)).map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commentsCount: b.prCommentsByHuyen ?? 0,
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
      }));

      const truongReviewedBugsList = solvedWithPrBugs.filter(b => isReviewedByTruong(b)).map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commentsCount: b.prCommentsByTruong ?? 0,
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
      }));

      const pendingReviewBugsList = solvedWithPrBugs.filter(b => 
        !isReviewedByHuyen(b) && !isReviewedByTruong(b) && (b.status ?? "").toLowerCase() === "resolved"
      ).map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commitsCount: b.ghCommitsCount ?? 1,
        date: bugFixedDate(b) || dateKey(b.confirmedDate) || dateKey(b.prCreatedAt) || "—",
      }));

      const reopenRate = (closedCount + resolvedCount) > 0 
        ? (reopenedCount / (closedCount + resolvedCount)) * 100 
        : 0;

      const locParts = locationDetailsList.map(r => `${r.location} (${r.closedWithPr + r.closedNoPr + r.resolvedWithPr + r.resolvedNoPr})`);
      const locationText = locParts.length > 0 ? locParts.join(", ") : "—";

      // Trend comparison for review comments
      const prevPMetric = prevMetric?.byPerson.find(p => p.personCode === dev.code);
      let prevCommentsPerTask = 0;
      if (prevPMetric && prevPMetric.bugsList) {
        const prevSolvedWithPr = prevPMetric.bugsList.filter(b => !!b.pullRequestUrl);
        const prevTotalComments = prevSolvedWithPr.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
        prevCommentsPerTask = prevSolvedWithPr.length > 0 ? prevTotalComments / prevSolvedWithPr.length : 0;
      }

      const bugsPerDay = manDays > 0 ? resolvedCount / manDays : 0;

      // Count reviews performed by this person in this period based on Notion reviewerIds
      let reviewsCount = 0;
      const reviewedBugsList: any[] = [];

      view.bugs.forEach(b => {
        if ((b.status ?? "").toLowerCase() !== "cancel") {
          const isReviewer = (b.reviewerIds ?? []).some(id => dev.notionIds.includes(id));
          if (isReviewer) {
            const reviewDate = dateKey(b.huyenLastCommentAt) || dateKey(b.lastEditedTime) || b.confirmedDate || dateKey(b.prCreatedAt);
            if (reviewDate && dateInRange(reviewDate, activePeriod.startDate, activePeriod.endDate)) {
              reviewsCount++;
              
              // Find who fixed this bug
              const fixerDev = developers.find(d => bugBelongsToDev(b, d));
              
              reviewedBugsList.push({
                bugId: b.bugId || b.id,
                title: b.title,
                url: b.url,
                prUrl: b.pullRequestUrl,
                state: b.status || "Resolved",
                submittedAt: b.confirmedDate || b.prCreatedAt || b.lastEditedTime || b.createdTime,
                author: fixerDev ? fixerDev.code : "Dev"
              });
            }
          }
        }
      });

      return {
        dev,
        locationText,
        closedCount,
        resolvedCount,
        noRepro,
        reopenedCount,
        reopenedList,
        reopenRate,
        reCommitCount,
        reCommitRate,
        reCommitBugsList,
        huyenReviewedCount: huyenReviewedBugsList.length,
        truongReviewedCount: truongReviewedBugsList.length,
        duplicateCount: duplicateBugsList.length,
        duplicateBugsList,
        duplicateGroups,
        closedBugsList,
        resolvedBugsList,
        closedBugsWithPr,
        closedBugsNoPr,
        duplicateChildCount,
        closedUniquePrs,
        resolvedBugsWithPr,
        resolvedBugsNoPr,
        resolvedUniquePrs,
        closedLocText,
        resolvedLocText,
        locationDetailsList,
        pendingReviewCount: pendingReviewBugsList.length,
        huyenReviewedCountList: huyenReviewedBugsList,
        huyenReviewedBugsList,
        truongReviewedBugsList,
        pendingReviewBugsList,
        solvedWithPr,
        manDays,
        bugsPerDay,
        bugsReviewed: reviewsCount,
        reviewedBugsList,
        commentsPerTask,
        repeatedCount,
        repeatedDetails,
        prevCommentsPerTask,
        prBugsList,
        hasPrevData: !!prevPMetric,
      };
    });
  }, [developers, devStats, view.weeklyMetrics, view.teamMetrics, activePeriod, view.bugs, manDaysOverrides]);



  const devPerformance = useMemo(() => {
    if (!activePeriod) return [];
    const activeMetric = view.teamMetrics.find(m => m.period.key === activePeriod.key);
    if (!activeMetric) return [];

    // Find previous period for trend tracking (if active period is weekly)
    const weeklyIdx = view.weeklyMetrics.findIndex(m => m.period.key === activePeriod.key);
    const prevMetric = (weeklyIdx !== -1 && weeklyIdx + 1 < view.weeklyMetrics.length)
      ? view.weeklyMetrics[weeklyIdx + 1]
      : null;

    const may = view.benchmark?.months?.find(m => m.month === "2026-05");
    const benchmarkAvg = may ? Number(may.avgBugsPerDay) : 2.1;
    return developers.map(dev => {
      const pMetric = activeMetric.byPerson.find(p => p.personCode === dev.code);
      
      // Use local overrides if defined, otherwise fallback to the backend metric's value
      const finalMD = manDaysOverrides[dev.code] !== undefined
        ? manDaysOverrides[dev.code]
        : (pMetric ? pMetric.manDays : 0);

      const fixedCount = devStats.filter(r => r.dev.code === dev.code).reduce((sum, r) => sum + r.closedCount + r.resolvedCount, 0);
      const bugsPerDay = finalMD > 0 ? fixedCount / finalMD : 0;
      const pct = benchmarkAvg > 0 ? (bugsPerDay / benchmarkAvg) * 100 : 0;
      
      const devRows = devStats.filter(r => r.dev.code === dev.code && r.location !== "—");
      const locBreakdownText = devRows.map(r => `${r.location} (${r.closedCount + r.resolvedCount} bug)`).join(", ") || "chưa phân loại";

      const reopened = pMetric ? pMetric.bugsReopened : 0;
      const repeatedCount = devStats.filter(r => r.dev.code === dev.code).reduce((sum, r) => sum + r.repeatedCount, 0);

      // Calculate comments per task directly for this period
      const devBugs = view.bugs.filter(b => bugBelongsToDev(b, dev) && (b.status ?? "").toLowerCase() !== "cancel");
      const completedBugs = devBugs.filter(b => 
        isFixed(b) && 
        dateInRange(bugFixedDate(b), activePeriod.startDate, activePeriod.endDate)
      );
      const solvedWithPrBugs = completedBugs.filter(b => !!b.pullRequestUrl);
      const totalComments = solvedWithPrBugs.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
      const commentsPerTask = solvedWithPrBugs.length > 0 ? totalComments / solvedWithPrBugs.length : 0;

      // Trend comparison with previous week
      const prevPMetric = prevMetric?.byPerson.find(p => p.personCode === dev.code);
      const prevBugsPerDay = prevPMetric ? Number(prevPMetric.bugsPerDay) : 0;
      const progressPercent = prevBugsPerDay > 0
        ? ((bugsPerDay - prevBugsPerDay) / prevBugsPerDay) * 100
        : (bugsPerDay > 0 ? 100 : 0);

      return {
        code: dev.code,
        name: dev.displayName,
        fixed: devStats.filter(r => r.dev.code === dev.code).reduce((sum, r) => sum + r.closedCount + r.resolvedCount, 0),
        bugsPerDay,
        pct,
        reopened,
        noRepro: devStats.filter(r => r.dev.code === dev.code).reduce((sum, r) => sum + r.noRepro, 0),
        repeatedCount,
        locBreakdownText,
        prevBugsPerDay,
        progressPercent,
        commentsPerTask,
        hasPrevData: !!prevPMetric,
      };
    });
  }, [developers, devStats, view.teamMetrics, view.weeklyMetrics, activePeriod, view.bugs, manDaysOverrides]);

  const sortedDevs = useMemo(() => {
    return [...devPerformance].sort((a, b) => b.bugsPerDay - a.bugsPerDay);
  }, [devPerformance]);

  const mayBenchmarkVal = useMemo(() => {
    const may = view.benchmark?.months?.find(m => m.month === "2026-05");
    return may ? Number(may.avgBugsPerDay) : 2.1;
  }, [view.benchmark]);

  const getAutoEvaluation = () => {
    if (!activePeriod) return null;
    const activeMetric = view.teamMetrics.find(m => m.period.key === activePeriod.key);
    if (!activeMetric) return <div style={{ color: "var(--text-3)" }}>Chưa có đủ số liệu tổng hợp cho kỳ này.</div>;
    
    const abnormalNotes: React.ReactNode[] = [];
    const leaderNotes: React.ReactNode[] = [];
    const coordinationNotes: React.ReactNode[] = [];
    
    // Check abnormals for each developer
    devPerformance.forEach(d => {
      if (d.reopened > 0) {
        abnormalNotes.push(
          <span key={`reopen-${d.code}`}>⚠️ <strong>{d.code}</strong> có <strong>{d.reopened} lỗi bị Reopen</strong> trong kỳ. Tỷ lệ Reopen tăng cao chỉ ra vấn đề về chất lượng tự kiểm thử cục bộ trước bàn giao.</span>
        );
      }
      if (d.commentsPerTask > 2.0) {
        abnormalNotes.push(
          <span key={`comment-${d.code}`}>⚠️ <strong>{d.code}</strong> có mật độ review comment cao (<strong>{d.commentsPerTask.toFixed(1)}/task</strong>), cho thấy code nhiều lỗi vặt hoặc chưa đúng thiết kế ban đầu.</span>
        );
      }
      if (d.repeatedCount > 0) {
        abnormalNotes.push(
          <span key={`repeated-${d.code}`}>⚠️ <strong>{d.code}</strong> tái phạm <strong>{d.repeatedCount} lỗi lặp checklist</strong> bài học kinh nghiệm. Cần nghiêm túc tuân thủ checklist cũ.</span>
        );
      }
      if (d.bugsPerDay < 0.8 && d.fixed > 0 && d.code !== "HuyenTN") {
        abnormalNotes.push(
          <span key={`lowperf-${d.code}`}>⚠️ Năng suất của <strong>{d.code}</strong> thấp (<strong>{d.bugsPerDay.toFixed(1)} bug/ngày</strong>) so với mốc tiêu chuẩn (&gt;= 1.0 bug/ngày).</span>
        );
      }
    });

    // Check Leader (HuyenTN) effort & review performance
    const huyen = activeMetric.byPerson.find(p => p.personCode === "HuyenTN");
    const huyenStat = devPerformance.find(d => d.code === "HuyenTN");
    const huyenReviewed = huyenStat ? ((huyenStat as any).huyenReviewedCount ?? (huyenStat as any).bugsReviewed ?? 0) : (huyen ? huyen.bugsReviewed : 0);
    const totalTeamPrs = devPerformance.reduce((sum, d) => sum + (d as any).solvedWithPr, 0);

    if (huyenReviewed === 0 && totalTeamPrs > 0) {
      leaderNotes.push(
        <span key="leader-warn">⚠️ Lead (HuyenTN) <strong>chưa ghi nhận review PR/task nào</strong> trong kỳ. Mục tiêu trọng tâm của Lead là review code & nghiệm thu PRs để đảm bảo chất lượng hệ thống.</span>
      );
    } else {
      leaderNotes.push(
        <span key="leader-ok">✔️ Lead (HuyenTN) đã hoàn thành review <strong>{huyenReviewed} / {totalTeamPrs} PR tasks</strong> của team trong kỳ. Tỷ lệ Review đạt <strong>{totalTeamPrs > 0 ? ((huyenReviewed / totalTeamPrs) * 100).toFixed(0) : 100}%</strong> mục tiêu kiểm soát chất lượng.</span>
      );
    }

    // proposed resource coordination actions
    const lowPerfDevs = devPerformance.filter(d => d.bugsPerDay < 0.8 && d.code !== "HuyenTN").map(d => d.code);
    const highPerfDevs = devPerformance.filter(d => d.bugsPerDay >= 2.0 && d.code !== "HuyenTN").map(d => d.code);
    
    if (lowPerfDevs.length > 0) {
      coordinationNotes.push(
        <span key="coord-low">👉 <strong>Điều phối hỗ trợ:</strong> Cần trao đổi làm rõ rào cản kỹ thuật hoặc <strong>giảm tải bớt task / lùi deadline / thay đổi độ ưu tiên</strong> cho <strong>{lowPerfDevs.join(", ")}</strong> do năng suất sửa lỗi dưới mốc kỳ vọng (&lt; 0.8 bug/ngày).</span>
      );
    }
    if (highPerfDevs.length > 0) {
      coordinationNotes.push(
        <span key="coord-high">👉 <strong>Phân bổ tài nguyên tối ưu:</strong> Tận dụng và giao thêm các task phức tạp/độ khó cao hơn cho <strong>{highPerfDevs.join(", ")}</strong> do năng suất sửa lỗi đạt mức vượt trội (&gt;= 2.0 bug/ngày).</span>
      );
    }
    
    const highReopenDevs = devPerformance.filter(d => d.reopened > 0).map(d => d.code);
    if (highReopenDevs.length > 0) {
      coordinationNotes.push(
        <span key="coord-reopen">👉 <strong>Chấn chỉnh quy trình:</strong> Yêu cầu <strong>{highReopenDevs.join(", ")}</strong> dành thời gian rà soát kỹ testcase cục bộ trước khi bàn giao các task tiếp theo nhằm khắc phục triệt để lỗi reopen.</span>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        


        {/* Row 2: Điểm bất thường (Abnormalities) */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--red)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            🚨 Điểm Bất Thường Cần Lưu Ý (Abnormal)
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {abnormalNotes.length === 0 ? (
              <li style={{ color: "var(--green)" }}>✔️ Chưa phát hiện điểm bất thường nào trong kỳ này.</li>
            ) : (
              abnormalNotes.map((note, idx) => <li key={idx}>{note}</li>)
            )}
          </ul>
        </div>

        {/* Row 3: Phân bổ nỗ lực của Leader */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--cyan)", fontSize: "14px" }}>
            👑 Phân Bổ Nỗ Lực Leader Tiêu Chuẩn (Một ngày 8 tiếng)
          </div>
          <div style={{ color: "var(--text-2)" }}>
            Phân bổ tiêu chuẩn: <strong>5% quản lý</strong> (~1.2 giờ), <strong>20% review/check PR</strong> (~1.6 giờ), còn lại <strong>75% trực tiếp fix bug</strong> (~5.2 giờ).
            <ul style={{ margin: "6px 0 0 18px", padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {leaderNotes.map((note, idx) => <li key={idx}>{note}</li>)}
            </ul>
          </div>
        </div>

        {/* Row 4: Đề xuất điều phối tài nguyên */}
        <div style={{ background: "rgba(234,179,8,0.05)", padding: "12px", borderRadius: "8px", border: "1px dashed var(--yellow)", borderLeft: "4px solid var(--yellow)" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--yellow)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            💡 Đề Xuất Quyết Định Điều Phối Tài Nguyên (Lead/Manager Decision)
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {coordinationNotes.length === 0 ? (
              <li>✔️ Tiến độ và chất lượng ổn định, không yêu cầu thay đổi tài nguyên gấp.</li>
            ) : (
              coordinationNotes.map((note, idx) => <li key={idx} style={{ color: "var(--text-1)" }}>{note}</li>)
            )}
          </ul>
        </div>

      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: "4px" }}>📊 So sánh Chất lượng Code ({activePeriod?.label ?? "Tất cả kỳ"})</h1>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>
            Đang so sánh dữ liệu trong kỳ: <strong>{activePeriod?.label}</strong> ({activePeriod?.startDate} - {activePeriod?.endDate}). Thay đổi bộ lọc ở góc trên bên phải để so sánh các mốc thời gian khác nhau.
          </p>
        </div>
        {hasMdChanges && (
          <button 
            type="button" 
            className="ctrl ctrl-primary" 
            style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px" }}
            onClick={() => handleSaveMd()}
            disabled={savingMd}
          >
            {savingMd ? "🔄 Đang lưu..." : "💾 Lưu Thay Đổi Ngày Công (MD)"}
          </button>
        )}
      </div>



      <div style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ fontSize: "11px", background: "var(--surface-2)", borderBottom: "2px solid var(--border-2)" }}>
                <th style={{ textAlign: "left", padding: "12px 14px", color: "var(--text-1)", width: "26%" }}>Nhân sự</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "12%" }} title="Số bug đã hoàn thành, review xong và có Ngày Xác Nhận trong kỳ">Close</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "12%" }} title="Số lượng task con trùng case ăn theo bug gốc được Closed">Task Trùng</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "12%" }} title="Số bug đã sửa xong (Resolved) trong kỳ">Resolved</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "14%" }} title="Tỷ lệ bug bị mở lại sau khi dev báo sửa xong: (Reopen / (Closed + Resolved)) * 100%">Reopen</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "12%" }} title="Man-Days: Số ngày công làm việc thực tế ghi nhận trong kỳ (Có thể tùy chỉnh)">MD</th>
                <th style={{ textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap", color: "var(--text-1)", width: "12%" }} title="Năng suất sửa lỗi trung bình mỗi ngày công: (Closed + Resolved) / MD">Bug/Ngày</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedDevStats.map((row, devIdx) => {
                const groupBg = devIdx % 2 === 1 ? "rgba(99, 102, 241, 0.015)" : "transparent";

                return (
                  <tr 
                    key={row.dev.code} 
                    style={{ 
                      background: groupBg,
                      borderBottom: "1px solid var(--border-2)" 
                    }}
                  >
                    <td 
                      style={{ 
                        textAlign: "left", 
                        verticalAlign: "middle", 
                        fontWeight: "bold",
                        padding: "8px 6px"
                      }}
                    >
                      <strong>{row.dev.displayName}</strong>
                      <div style={{ color: "var(--text-3)", fontSize: "11px", fontWeight: "normal", marginTop: 2 }}>
                        ({row.dev.code})
                      </div>
                      {(() => {
                        const exp = activePeriod && view.conclusions?.[activePeriod.key]?.explanations?.[row.dev.code];
                        if (exp) {
                          return (
                            <div style={{ fontSize: "10px", color: "var(--cyan)", fontWeight: "normal", marginTop: 4, fontStyle: "italic" }}>
                              💡 {exp}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td 
                      className="td-num" 
                      style={{ 
                        padding: "8px 10px", 
                        textAlign: "center",
                        fontSize: "12px", 
                        color: row.closedCount > 0 ? "var(--green)" : "var(--text-3)",
                        cursor: row.closedCount > 0 ? "pointer" : "default",
                        textDecoration: row.closedCount > 0 ? "underline dashed" : "none"
                      }}
                      title={
                        row.closedCount > 0
                          ? `[CLOSED: ${row.closedBugsWithPr} bug có PR (${row.closedCount} bug trùng case)]\n• Vị trí lỗi: ${row.closedLocText || "Chưa phân loại"}`
                          : "0 task Closed"
                      }
                      onClick={() => {
                        if (row.closedCount > 0) {
                          setSelectedPrBugs(row.closedBugsList);
                          setSelectedDevCode(`${row.dev.displayName} - CLOSED`);
                        }
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {row.closedBugsWithPr}
                      </div>
                    </td>
                    <td 
                      className="td-num" 
                      style={{ 
                        padding: "8px 10px", 
                        textAlign: "center",
                        fontSize: "12px", 
                        color: row.duplicateChildCount > 0 ? "var(--purple)" : "var(--text-3)",
                        cursor: row.duplicateChildCount > 0 ? "pointer" : "default",
                      }}
                      title={
                        row.duplicateChildCount > 0
                          ? `${row.duplicateChildCount} task con trùng case ăn theo bug gốc`
                          : "0 task trùng"
                      }
                      onClick={() => {
                        const childBugs = row.closedBugsList.filter((b: any) => b.isChild);
                        if (childBugs.length > 0) {
                          setSelectedPrBugs(childBugs);
                          setSelectedDevCode(`${row.dev.displayName} - TASK TRÙNG`);
                        }
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                        {row.duplicateChildCount > 0 ? `${row.duplicateChildCount}` : "0"}
                      </div>
                    </td>
                    <td 
                      className="td-num" 
                      style={{ 
                        padding: "8px 10px", 
                        textAlign: "center",
                        fontSize: "12px", 
                        color: row.resolvedCount > 0 ? "var(--blue)" : "var(--text-3)",
                        cursor: row.resolvedCount > 0 ? "pointer" : "default",
                        textDecoration: row.resolvedCount > 0 ? "underline dashed" : "none"
                      }}
                      title={
                        row.resolvedCount > 0
                          ? `[RESOLVED: ${row.resolvedCount} bug]\n• Vị trí lỗi: ${row.resolvedLocText || "Chưa phân loại"}\n• PR status: ${row.resolvedBugsWithPr} CÓ PR, ${row.resolvedBugsNoPr} KHÔNG PR`
                          : "0 task Resolved"
                      }
                      onClick={() => {
                        if (row.resolvedCount > 0) {
                          setSelectedPrBugs(row.resolvedBugsList);
                          setSelectedDevCode(`${row.dev.displayName} - RESOLVED`);
                        }
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {row.resolvedBugsWithPr}
                      </div>
                    </td>
                    <td 
                      className="td-num" 
                      style={{ 
                        padding: "8px 6px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: row.reopenedCount > 0 ? "var(--red)" : "var(--text-2)", 
                        cursor: row.reopenedCount > 0 ? "pointer" : "default",
                        textDecoration: row.reopenedCount > 0 ? "underline dashed" : "none"
                      }}
                      title={row.reopenedCount > 0 ? row.reopenedList.map(b => `[${b.bugId}] ${b.title}`).join('\n') : "0 bug bị reopen"}
                      onClick={() => row.reopenedCount > 0 && setSelectedReopenedBugs(row.reopenedList)}
                    >
                      {row.reopenedCount > 0 ? `${row.reopenRate.toFixed(1)}% (${row.reopenedCount})` : "0.0%"}
                    </td>

                    <td className="td-num" style={{ verticalAlign: "middle", textAlign: "center", padding: "8px 6px" }}>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="31"
                        title="Bấm để nhập lại ngày công (MD), tự động lưu khi nhấn Enter hoặc click ra ngoài"
                        style={{ 
                          width: "52px", 
                          textAlign: "center", 
                          padding: "3px 4px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          border: "1px solid var(--border-2)", 
                          borderRadius: "4px",
                          background: "var(--surface-2)",
                          color: "var(--text-1)",
                          cursor: "text"
                        }}
                        value={row.manDays}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const newOverrides = {
                            ...manDaysOverrides,
                            [row.dev.code]: isNaN(val) ? 0 : val
                          };
                          setManDaysOverrides(newOverrides);
                        }}
                        onBlur={() => handleSaveMd()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                            handleSaveMd();
                          }
                        }}
                      />
                    </td>
                    <td className="td-num" style={{ fontWeight: "bold", textAlign: "center", color: "var(--blue)", verticalAlign: "middle" }}>
                      {row.bugsPerDay.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Breakdown Grid Cards */}
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📂</span> Phân Rã Chi Tiết Vị Trí Lỗi Theo Nhân Sự ({activePeriod?.label})
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {aggregatedDevStats.map(row => (
            <div key={row.dev.code} className="card" style={{ padding: "14px", borderRadius: "8px", borderTop: "3px solid var(--accent)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-1)", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{row.dev.displayName} ({row.dev.code})</span>
                <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "normal" }}>Ngày công: {row.manDays} MD</span>
              </div>
              
              {row.locationDetailsList.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-3)", fontStyle: "italic", padding: "8px 0" }}>Không có bug nào được sửa trong kỳ này.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {row.locationDetailsList.map(l => (
                    <div
                      key={l.location}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border-3)",
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                      title="Bấm để xem danh sách bug thuộc vị trí này"
                      onClick={() => {
                        setSelectedPrBugs(l.bugList);
                        setSelectedDevCode(`${row.dev.displayName} - Vị trí: ${l.location}`);
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--accent-2)" }}>
                        🏷️ {l.location} ({l.bugList.length} bug)
                      </div>
                      <div style={{ display: "flex", gap: "6px", fontSize: "11px" }}>
                        {l.closedWithPr + l.closedNoPr > 0 && (
                          <span style={{ color: "var(--green)", fontWeight: 700 }}>
                            {l.closedWithPr + l.closedNoPr} Closed ({l.closedWithPr} PR)
                          </span>
                        )}
                        {l.resolvedWithPr + l.resolvedNoPr > 0 && (
                          <span style={{ color: "var(--blue)", fontWeight: 700 }}>
                            {l.resolvedWithPr + l.resolvedNoPr} Resolved ({l.resolvedWithPr} PR)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto Evaluation Summary */}

      {/* Reopened Bugs Detail Modal */}
      {selectedReopenedBugs && (
        <div className="modal-overlay" onClick={() => setSelectedReopenedBugs(null)}>
          <div className="modal" style={{ width: "600px", padding: "20px", borderRadius: "8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🚨</span> Danh sách Bug bị Reopen trong kỳ
              </h3>
              <button 
                type="button" 
                className="ctrl" 
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px" }} 
                onClick={() => setSelectedReopenedBugs(null)}
              >
                Đóng
              </button>
            </div>
            
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-2)", borderRadius: "6px", background: "var(--bg-2)" }}>
              {selectedReopenedBugs.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", textAlign: "center" }}>Không có bug nào.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-3)", borderBottom: "1px solid var(--border-2)" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>BUG ID</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Tiêu đề lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReopenedBugs.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: "var(--bg-1)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>
                          {b.url ? (
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: "700", textDecoration: "underline" }}>
                              {b.bugId}
                            </a>
                          ) : (
                            b.bugId
                          )}
                        </td>
                        <td style={{ padding: "10px", color: "var(--text-1)" }}>{b.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PR Tasks & Comments Detail Modal */}
      {selectedPrBugs && (
        <div className="modal-overlay" onClick={() => { setSelectedPrBugs(null); setSelectedDevCode(""); }}>
          <div className="modal" style={{ width: "850px", padding: "24px", borderRadius: "6px", background: "var(--surface)", border: "1px solid var(--border-2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "var(--text-1)" }}>
                Chi tiết Task có PR trong kỳ {activePeriod?.label} ({selectedDevCode})
              </h3>
              <button 
                type="button" 
                className="ctrl" 
                style={{ padding: "4px 12px", fontSize: "12px" }} 
                onClick={() => { setSelectedPrBugs(null); setSelectedDevCode(""); }}
              >
                Đóng
              </button>
            </div>
            
            {/* Highlight Banner if there are duplicate child bugs resolved via PR */}
            {selectedPrBugs.some(b => b.isChild) && (
              <div style={{ 
                background: "var(--blue-bg)", 
                border: "1px solid var(--blue)", 
                borderRadius: "4px", 
                padding: "10px 14px", 
                marginBottom: "14px", 
                fontSize: "12px", 
                color: "var(--blue)",
                fontWeight: "500"
              }}>
                <strong>Thành quả xử lý Root Cause:</strong> 1 PR merged đã giải quyết triệt để vấn đề cốt lõi, kéo theo <strong>{selectedPrBugs.filter(b => b.isChild).length} bug trùng lặp (cùng case)</strong> tự động được nghiệm thu & Closed!
              </div>
            )}

            <div style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid var(--border-2)", borderRadius: "4px", background: "var(--surface)" }}>
              {selectedPrBugs.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", textAlign: "center" }}>Không có task nào.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-2)", color: "var(--text-1)", fontWeight: "700", fontSize: "11px" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>BUG ID</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>VỊ TRÍ LỖI</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>TRẠNG THÁI</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>TRẠNG THÁI PR & CLUSTER</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>TIÊU ĐỀ LỖI</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>NGÀY TÍNH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrBugs.map((b, idx) => {
                      const isClosed = (b.status ?? "").toLowerCase().includes("close") || (b.status ?? "").toLowerCase().includes("deploy");
                      const isRes = (b.status ?? "").toLowerCase().includes("resolve");
                      const isChild = Boolean(b.isChild);

                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: "1px solid var(--border-3)", 
                            background: isChild ? "var(--surface-2)" : "var(--surface)" 
                          }}
                        >
                          <td style={{ padding: "10px 12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                            {b.url ? (
                              <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: "700", textDecoration: "underline" }}>
                                {b.bugId}
                              </a>
                            ) : (
                              b.bugId
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "var(--surface-2)",
                                color: "var(--text-1)",
                                border: "1px solid var(--border-2)",
                              }}
                            >
                              {b.location || "Chưa phân loại"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: isClosed
                                  ? "rgba(22, 163, 74, 0.12)"
                                  : isRes
                                  ? "var(--blue-bg)"
                                  : "var(--surface-2)",
                                color: isClosed ? "var(--green)" : isRes ? "var(--blue)" : "var(--text-2)",
                                border: isClosed
                                  ? "1px solid var(--green)"
                                  : isRes
                                  ? "1px solid var(--blue)"
                                  : "1px solid var(--border-2)",
                              }}
                            >
                              {b.status || (isClosed ? "CLOSED" : isRes ? "RESOLVED" : "DONE")}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {b.prUrl ? (
                              <a
                                href={b.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: "var(--blue-bg)",
                                  color: "var(--blue)",
                                  border: "1px solid var(--blue)",
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {isChild ? `PR ${b.parentBugId || "Chung"} ↗` : "CÓ PR ↗"}
                              </a>
                            ) : isChild ? (
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: "var(--surface-2)",
                                  color: "var(--text-2)",
                                  border: "1px solid var(--border-2)",
                                }}
                              >
                                ↳ TRÙNG CASE [{b.parentBugId}]
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: "rgba(217, 119, 6, 0.12)",
                                  color: "var(--yellow)",
                                  border: "1px solid var(--yellow)",
                                }}
                              >
                                PR EMPTY
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--text-1)" }}>
                            {isChild ? (
                              <span>
                                <span style={{ color: "var(--text-2)", fontWeight: 600, marginRight: "4px" }}>↳ Cùng Root Cause:</span>
                                {b.title.replace(/ \(Task trùng lặp của \[.*\]\)/, "")}
                              </span>
                            ) : (
                              b.title
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap", color: "var(--text-3)", fontSize: "12px" }}>
                            {b.date || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-2)", textAlign: "right" }}>
              * Mật độ comment trung bình = Tổng comments / Tổng số task có PR trong kỳ.
            </div>
          </div>
        </div>
      )}

      {/* Review PR Details Modal */}
      {selectedReviewsList && (
        <div className="modal-overlay" onClick={() => { setSelectedReviewsList(null); setSelectedDevCode(""); }}>
          <div className="modal" style={{ width: "750px", padding: "20px", borderRadius: "8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔍</span> Chi tiết PR đã Review bởi {selectedDevCode}
              </h3>
              <button 
                type="button" 
                className="ctrl" 
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px" }} 
                onClick={() => { setSelectedReviewsList(null); setSelectedDevCode(""); }}
              >
                Đóng
              </button>
            </div>
            
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-2)", borderRadius: "6px", background: "var(--bg-2)" }}>
              {selectedReviewsList.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", textAlign: "center" }}>Không có PR nào được review.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-3)", borderBottom: "1px solid var(--border-2)" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>BUG ID</th>
                      {selectedDevCode === "HuyenTN" && <th style={{ padding: "10px", textAlign: "left" }}>Tác giả (Dev)</th>}
                      <th style={{ padding: "10px", textAlign: "left" }}>Tiêu đề lỗi</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Link PR</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Trạng thái Review</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReviewsList.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: "var(--bg-1)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>
                          {b.url ? (
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: "700", textDecoration: "underline" }}>
                              {b.bugId}
                            </a>
                          ) : (
                            b.bugId
                          )}
                        </td>
                        {selectedDevCode === "HuyenTN" && (
                          <td style={{ padding: "10px", fontWeight: "600", color: "var(--text-2)" }}>
                            {b.author}
                          </td>
                        )}
                        <td style={{ padding: "10px", color: "var(--text-1)" }}>{b.title}</td>
                        <td style={{ padding: "10px" }}>
                          {b.prUrl ? (
                            <a href={b.prUrl} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", textDecoration: "underline" }}>
                              GitHub PR 🔗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span style={{ 
                            padding: "2px 6px", 
                            borderRadius: "4px", 
                            fontSize: "11px",
                            fontWeight: "bold",
                            background: b.state === "APPROVED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                            color: b.state === "APPROVED" ? "var(--green)" : "var(--yellow)"
                          }}>
                            {b.state}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", color: "var(--text-3)" }}>
                          {new Date(b.submittedAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Duplicate Bugs Detail Modal */}
      {selectedDuplicateGroup && (
        <div className="modal-overlay" onClick={() => setSelectedDuplicateGroup(null)}>
          <div className="modal" style={{ width: "750px", padding: "20px", borderRadius: "8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔍</span> Danh sách Lỗi Trùng Lặp do Lead Huyền Lọc ({selectedDuplicateGroup.totalCount} bug trùng)
              </h3>
              <button 
                type="button" 
                className="ctrl" 
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px" }} 
                onClick={() => setSelectedDuplicateGroup(null)}
              >
                Đóng
              </button>
            </div>
            
            <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid var(--border-2)", borderRadius: "6px", background: "var(--bg-2)", padding: "12px" }}>
              {selectedDuplicateGroup.groups.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", textAlign: "center" }}>Không có bug trùng lặp nào trong kỳ này.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {selectedDuplicateGroup.groups.map((group, gIdx) => (
                    <div key={gIdx} style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-3)" }}>
                      <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--cyan)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        📌 Bug Gốc: <span style={{ color: "var(--accent-2)" }}>[{group.parentBugId}]</span> {group.parentTitle}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "12px", borderLeft: "2px solid var(--cyan)" }}>
                        {group.childTasks.map((child: any, cIdx: number) => (
                          <div key={cIdx} style={{ background: "var(--surface-3)", padding: "8px 10px", borderRadius: "6px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <span style={{ fontWeight: "bold", color: "var(--orange, #f97316)" }}>↳ 🔗 Task trùng: [{child.bugId}]</span>
                              <span style={{ color: "var(--text-1)", marginLeft: "6px" }}>{child.title}</span>
                              {child.note && (
                                <div style={{ fontSize: "11px", color: "var(--text-3)", fontStyle: "italic", marginTop: "2px" }}>
                                  📝 Ghi chú: {child.note}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                              <span style={{ color: "var(--text-3)" }}>{child.date}</span>
                              {child.url && (
                                <a href={child.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: "700", textDecoration: "underline" }}>
                                  Notion 🔗
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-2)", textAlign: "right" }}>
              * Danh sách được tổng hợp dựa trên liên kết Bug Gốc &amp; các task trùng lặp do Lead Huyền lọc.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
