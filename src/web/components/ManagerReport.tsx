import { useState, useEffect, useMemo } from "react";
import type { DashboardView, PeriodType } from "../../shared/types";
import { saveConclusion, saveCustomTargetsApi } from "../api";

export function ManagerReport({
  view,
  periodType,
  periodKey,
  personCode,
  onUpdate
}: {
  view: DashboardView;
  periodType?: PeriodType;
  periodKey?: string;
  personCode?: string;
  onUpdate: () => void;
}) {
  const dateKey = (v?: string) => {
    if (!v) return undefined;
    const k = String(v).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined;
  };

  const dateInRange = (d?: string, start?: string, end?: string) => {
    if (!d || !start || !end) return false;
    return d >= start && d <= end;
  };

  const bugFixedDate = (b: any) => {
    return (
      dateKey(b.prCreatedAt) ??
      dateKey(b.prLastCommitAt) ??
      dateKey(b.confirmedDate)
    );
  };

  const isNoRepro = (b: any) => {
    const note = (b.note ?? "").toLowerCase();
    const st = (b.status ?? "").toLowerCase();
    return note.includes("không tái hiện") || note.includes("ko tái hiện") || note.includes("no repro") || note.includes("không phải lỗi") || st.includes("không tái hiện") || st.includes("ko tái hiện");
  };

  const getDisplayName = (code: string) => {
    return view.personnel.find(p => p.code === code)?.displayName || code;
  };

  const isInvalidBug = (b: any) => {
    const hasPR = Boolean(b.pullRequestUrl && b.pullRequestUrl.trim().length > 0);
    const note = (b.note ?? "").toLowerCase();
    const title = (b.title ?? "").toLowerCase();
    const status = (b.status ?? "").toLowerCase();
    const hasNoRepro = note.includes("không tái hiện") || note.includes("ko tái hiện") || note.includes("no repro") || note.includes("không phải lỗi");
    const hasDuplicate = note.includes("trùng") || note.includes("duplicate") || title.includes("trùng") || status.includes("duplicate");
    return !hasPR || hasNoRepro || hasDuplicate;
  };

  const huyenNotionId = "38ad872b-594c-81b9-8150-000220c17a19";
  const bugs = view.bugs;

  const activeDev = useMemo(() => {
    if (personCode && personCode !== "all") {
      return view.personnel.find(p => p.code === personCode);
    }
    return undefined;
  }, [view.personnel, personCode]);

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
    return view.availablePeriods[0];
  }, [view.availablePeriods, periodKey]);

  // Base dev-filtered valid PR bugs
  const baseDevPrBugs = useMemo(() => {
    return bugs.filter(b => {
      if ((b.status ?? "").toLowerCase().trim() === "cancel") return false;
      if (isInvalidBug(b)) return false;

      // Filter by active dev if selected in topbar
      if (activeDev) {
        const pList = [...(b.fixedByIds ?? []), ...(b.causedByIds ?? [])];
        const isDev = activeDev.notionIds.some(id => pList.includes(id)) || 
          ((b as any).assignee && activeDev.aliases.some(a => String((b as any).assignee).toLowerCase().includes(a)));
        if (!isDev) return false;
      }

      return true;
    });
  }, [bugs, activeDev]);

  // Active Bugs on Notion WITH PR EXCEPT Closed, Cancel, and Pending
  const activeExcludingPendingBugs = useMemo(() => {
    return baseDevPrBugs.filter(b => {
      const st = (b.status ?? "").toLowerCase().trim();
      return st !== "closed" && st !== "cancel" && st !== "pending";
    });
  }, [baseDevPrBugs]);

  const totalActiveExcludingPending = activeExcludingPendingBugs.length;

  // 1. Closed Bugs with PR & Child Duplicate Tasks (Lọc BẮT BUỘC theo b.confirmedDate - Ngày xác nhận)
  const closedBugs = useMemo(() => {
    const directClosed = baseDevPrBugs.filter(b => {
      const st = (b.status ?? "").toLowerCase().trim();
      if (st !== "closed" && st !== "deployed") return false;
      if (periodKey && periodKey !== "all" && activePeriod) {
        const confDate = dateKey(b.confirmedDate);
        if (!confDate || confDate < activePeriod.startDate || confDate > activePeriod.endDate) {
          return false;
        }
      }
      return true;
    });

    const resultList: any[] = [];
    const seenKeys = new Set<string>();

    directClosed.forEach(b => {
      const key = b.bugId || b.id;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        resultList.push(b);
      }

      if (b.duplicateIds && b.duplicateIds.length > 0) {
        b.duplicateIds.forEach((childId: string) => {
          const childObj = bugs.find(orig => orig.id === childId || orig.bugId === childId);
          const childKey = childObj ? (childObj.bugId || childObj.id) : childId;
          if (!seenKeys.has(childKey)) {
            const childSt = (childObj?.status ?? "").toLowerCase();
            if (childSt !== "cancel" && childSt !== "không lỗi" && childSt !== "wontfix") {
              seenKeys.add(childKey);
              resultList.push({
                ...(childObj || {}),
                bugId: childObj?.bugId || childId.slice(0, 8),
                id: childId,
                status: (childObj?.status || "CLOSED").toUpperCase(),
                isChild: true,
                parentBugId: key,
                pullRequestUrl: childObj?.pullRequestUrl || b.pullRequestUrl,
                location: childObj?.location && childObj.location.length > 0 ? childObj.location : b.location,
                title: childObj ? `${childObj.title} (Task trùng lặp của [${key}])` : `Task trùng lặp của [${key}]`,
                confirmedDate: b.confirmedDate
              });
            }
          }
        });
      }
    });

    return resultList;
  }, [baseDevPrBugs, bugs, periodKey, activePeriod]);

  // 2. IN REVIEW / RESOLVED (CHƯA REVIEW) -> Active bug with status = in review / resolved (chưa xong review)
  const resolvedPendingReviewBugs = useMemo(() => {
    return activeExcludingPendingBugs.filter(b => {
      const st = (b.status ?? "").toLowerCase().trim();
      if (st === "in review" || st === "in-review" || st === "doing") return true;
      if (st !== "resolved") return false;
      const ghLbls = (b.ghLabels ?? []).map(l => l.toLowerCase());
      const isWait = st.includes("wait") || ghLbls.some(l => l.includes("wait"));
      const hasHuyenReviewer = (b.reviewerIds ?? []).includes(huyenNotionId);
      const hasComment = (b.prCommentsByHuyen ?? 0) > 0;
      return !isWait && !hasHuyenReviewer && !hasComment;
    });
  }, [activeExcludingPendingBugs, huyenNotionId]);

  // 3. REVIEWED (ĐÃ REVIEW / WAIT) -> Active bug where status is reviewed or wait for dev
  const reviewedWaitingDeployBugs = useMemo(() => {
    return activeExcludingPendingBugs.filter(b => {
      const st = (b.status ?? "").toLowerCase().trim();
      if (st === "reviewed") return true;
      const ghLbls = (b.ghLabels ?? []).map(l => l.toLowerCase());
      const isWait = st.includes("wait") || ghLbls.some(l => l.includes("wait"));
      const hasHuyenReviewer = (b.reviewerIds ?? []).includes(huyenNotionId);
      const hasComment = (b.prCommentsByHuyen ?? 0) > 0;
      return isWait || (st === "resolved" && (hasHuyenReviewer || hasComment || ghLbls.includes("wait for deployment")));
    });
  }, [activeExcludingPendingBugs, huyenNotionId]);

  // 4. Deployed (Đã up Prod, chờ OP nghiệm thu Close)
  const deployedBugs = useMemo(() => {
    return activeExcludingPendingBugs.filter(b => (b.status ?? "").toLowerCase().trim() === "deployed");
  }, [activeExcludingPendingBugs]);

  // 5. Reopened (Lọc BẮT BUỘC theo b.reopenedDate - Ngày mở lại)
  const reopenedBugs = useMemo(() => {
    return baseDevPrBugs.filter(b => {
      const st = (b.status ?? "").toLowerCase().trim();
      if (st !== "reopened") return false;
      if (periodKey && periodKey !== "all" && activePeriod) {
        const reDate = dateKey(b.reopenedDate) || dateKey(b.lastEditedTime);
        if (!reDate || reDate < activePeriod.startDate || reDate > activePeriod.endDate) {
          return false;
        }
      }
      return true;
    });
  }, [baseDevPrBugs, periodKey, activePeriod]);

  const totalAllTrackable = closedBugs.length + totalActiveExcludingPending;
  const overallCloseRate = totalAllTrackable > 0 ? ((closedBugs.length / totalAllTrackable) * 100).toFixed(1) : "0";

  // Latest period summary
  const latest = view.teamMetrics[0];

  // Conclusion Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [risks, setRisks] = useState("");
  const [manDaysOverrides, setManDaysOverrides] = useState<Record<string, number>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Selected Dev Filter for Chart ("all" for total team, or specific person code)
  const [selectedDevFilter, setSelectedDevFilter] = useState<string>(personCode || "all");

  useEffect(() => {
    if (personCode && personCode !== "") {
      setSelectedDevFilter(personCode);
    }
  }, [personCode]);

  // Custom targets per person code, persisted in localStorage
  const [customTargets, setCustomTargets] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem("qa_custom_targets");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load custom targets from localStorage", e);
    }
    return {
      HuyenTN: [10, 18, 25, 30, 32, 35, 38, 40, 42, 45],
      HoangGV: [4, 6, 8, 8, 10, 12, 14, 15, 16, 17],
      HoNX: [4, 6, 6, 4, 6, 8, 10, 11, 12, 13],
      HuyDH: [5, 7, 8, 8, 10, 12, 14, 15, 16, 17]
    };
  });

  const [isEditingTargetsModalOpen, setIsEditingTargetsModalOpen] = useState(false);
  const [tempTargetValues, setTempTargetValues] = useState<number[]>([]);

  // Selected KPI card for drilldown filtering
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<"all" | "active" | "in_review" | "reviewed" | "reopened" | "closed" | null>(null);

  const kpiFilteredBugs = useMemo(() => {
    if (!selectedKpiFilter) return [];
    if (selectedKpiFilter === "active") return activeExcludingPendingBugs;
    if (selectedKpiFilter === "in_review") return resolvedPendingReviewBugs;
    if (selectedKpiFilter === "reviewed") return reviewedWaitingDeployBugs;
    if (selectedKpiFilter === "reopened") return reopenedBugs;
    if (selectedKpiFilter === "closed") return closedBugs;
    return [];
  }, [selectedKpiFilter, activeExcludingPendingBugs, resolvedPendingReviewBugs, reviewedWaitingDeployBugs, reopenedBugs, closedBugs]);

  const kpiFilterTitle = useMemo(() => {
    if (selectedKpiFilter === "active") return "Tổng hiện tại (Đang xử lý)";
    if (selectedKpiFilter === "in_review") return "In Review / Resolved";
    if (selectedKpiFilter === "reviewed") return "Reviewed / Wait for Dev";
    if (selectedKpiFilter === "reopened") return "Re-opened / Lỗi lặp";
    if (selectedKpiFilter === "closed") return "Đã Close hoàn tất";
    return "";
  }, [selectedKpiFilter]);

  // Load existing conclusion when active period changes
  const activePeriodKey = latest?.period.key;
  const activeConclusion = activePeriodKey && view.conclusions ? view.conclusions[activePeriodKey] : null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qa_custom_targets");
      const localCustom = saved ? JSON.parse(saved) : {};
      setCustomTargets(prev => ({ ...prev, ...(view.customTargets || {}), ...localCustom }));
    } catch (e) {
      console.error("Failed to load local custom targets", e);
    }
  }, [view.customTargets]);

  useEffect(() => {
    if (activeConclusion) {
      setGood(activeConclusion.good);
      setBad(activeConclusion.bad);
      setRisks(activeConclusion.risks);
      setManDaysOverrides(activeConclusion.manDaysOverrides || {});
      setExplanations(activeConclusion.explanations || {});
    } else {
      setGood("");
      setBad("");
      setRisks("");
      setManDaysOverrides({});
      setExplanations({});
    }
  }, [activePeriodKey, activeConclusion]);

  // Weekly Targets Trajectory for Developers (Ambitious Capacity Milestone Curve from 5 to 18 Bugs/Week)
  const weeklyTargetTrajectory = [
    { weekLabel: "Tuần 1", targetPerDev: 5, milestoneLabel: "Mức 0: Làm quen codebase & quy trình (5 bug/tuần)" },
    { weekLabel: "Tuần 2", targetPerDev: 7, milestoneLabel: "Mức Onboarding: Tự chủ fix bug độc lập (7 bug/tuần)" },
    { weekLabel: "Tuần 3", targetPerDev: 8, milestoneLabel: "Mốc T1: Đạt chuẩn tiến độ người mới (8 bug/tuần)" },
    { weekLabel: "Tuần 4", targetPerDev: 10, milestoneLabel: "Mốc T2: Tự làm các task luồng khó (10 bug/tuần)" },
    { weekLabel: "Tuần 5", targetPerDev: 12, milestoneLabel: "Mốc T3: Nâng cao sản lượng ổn định (12 bug/tuần)" },
    { weekLabel: "Tuần 6", targetPerDev: 14, milestoneLabel: "Mốc 100%: Năng suất thực tế tiêu chuẩn (14 Bug/Tuần)" },
    { weekLabel: "Tuần 7", targetPerDev: 15, milestoneLabel: "Mốc Tăng Trưởng: Nâng cao sản lượng (15 Bug/Tuần)" },
    { weekLabel: "Tuần 8", targetPerDev: 16, milestoneLabel: "Mốc Cao Điểm: Hoàn thiện năng suất (16 Bug/Tuần)" },
    { weekLabel: "Tuần 9", targetPerDev: 17, milestoneLabel: "Mốc Tối Đa: Hiệu năng đỉnh cao (17 Bug/Tuần)" },
    { weekLabel: "Tuần 10", targetPerDev: 18, milestoneLabel: "Mốc Tối Đa: Hiệu năng đỉnh cao (18 Bug/Tuần)" },
  ];

  // Weekly Targets Trajectory for Lead Reviewer (100% PR Team Capacity Target Curve)
  // Ensures target progressively increases over time and never drops to 0 or arbitrary static values.
  const leadReviewTargetTrajectory = [
    { weekLabel: "Tuần 1", target: 17, milestoneLabel: "👑 Mốc Onboarding: Review Code & Nghiệm thu 100% PRs (~17 PRs/tuần)" },
    { weekLabel: "Tuần 2", target: 25, milestoneLabel: "👑 Mốc T1: Kiểm soát chất lượng PRs toàn team (~25 PRs/tuần)" },
    { weekLabel: "Tuần 3", target: 28, milestoneLabel: "👑 Mốc T2: Tăng tốc nghiệm thu PRs (~28 PRs/tuần)" },
    { weekLabel: "Tuần 4", target: 30, milestoneLabel: "👑 Mốc T3: Review & nghiệm thu tối đa sản lượng team (~30 PRs/tuần)" },
    { weekLabel: "Tuần 5", target: 35, milestoneLabel: "👑 Mốc Tiệm Cận Cao Điểm: Review PRs chất lượng cao (~35 PRs/tuần)" },
    { weekLabel: "Tuần 6", target: 40, milestoneLabel: "👑 Mốc 100%: Năng suất Review tiêu chuẩn (~40 PRs/Tuần)" },
    { weekLabel: "Tuần 7", target: 42, milestoneLabel: "👑 Duy trì năng suất Review tiêu chuẩn (~42 PRs/Tuần)" },
    { weekLabel: "Tuần 8", target: 42, milestoneLabel: "👑 Duy trì năng suất Review tiêu chuẩn (~42 PRs/Tuần)" },
    { weekLabel: "Tuần 9", target: 45, milestoneLabel: "👑 Mốc Tối Đa: Duy trì năng suất Review đỉnh cao (~45 PRs/Tuần)" },
    { weekLabel: "Tuần 10", target: 45, milestoneLabel: "👑 Mốc Tối Đa: Duy trì năng suất Review đỉnh cao (~45 PRs/Tuần)" },
  ];

  const handleAutoDraft = () => {
    if (!latest) return;
    
    let goodText = "";
    const totalFixed = latest.totalFixed;
    const totalDetected = latest.totalDetected;
    if (totalFixed >= totalDetected) {
      goodText += `Team kiểm soát tốt tiến độ: đã sửa xong ${totalFixed} bug/tuần trong khi phát sinh ${totalDetected} bug mới.\n`;
    }
    
    const devs = latest.byPerson;
    devs.forEach((p: any) => {
      const fixed = p.bugsFixed;
      const name = getDisplayName(p.personCode);
      if (fixed >= 10) {
        goodText += `- ${name} đạt sản lượng tốt: ${fixed} bug/tuần.\n`;
      }
    });
    if (!goodText) goodText = "- Năng suất sửa bug theo tuần duy trì ở mức ổn định.";
    
    let badText = "";
    devs.forEach((p: any) => {
      const name = getDisplayName(p.personCode);
      if (p.bugsReopened > 0) {
        badText += `- ${name} có ${p.bugsReopened} lỗi bị Re-open trong tuần. Cần rà soát kỹ tự test.\n`;
      }
      const fixed = p.bugsFixed;
      if (fixed < 5 && p.manDays > 2) {
        badText += `- ${name} năng suất tuần này hạn chế: ${fixed} bug/tuần (dành 1-2 ngày xử lý task luồng khó).\n`;
      }
    });
    if (!badText) badText = "- Chưa ghi nhận vấn đề nghiêm trọng về năng suất tuần.";

    let risksText = "Đề xuất hành động của Ban Quản lý:\n";
    risksText += "- Bám sát Target số bug sửa theo tuần để nâng cao năng suất.\n";
    risksText += "- Tự kiểm tra đủ 6 mục Pre-handover checklist trước khi mở PR.\n";
    risksText += "- Phân tích root cause 11 lỗi chất lượng phát sinh.";

    const draftExp: Record<string, string> = {};
    devs.forEach((p: any) => {
      if (p.personCode === "HoangGV") {
        draftExp["HoangGV"] = "Tuần này assign task luồng nghiệp vụ (flow) khó, mất 1-2 ngày xử lý + review code.";
      } else if (p.personCode === "HoNX") {
        draftExp["HoNX"] = "Năng suất tuần tốt nhưng bị 3 bug reopen và dính 1 lỗi lặp do chưa tự test kỹ.";
      } else if (p.personCode === "HuyDH") {
        draftExp["HuyDH"] = "Thành viên mới đang trong giai đoạn làm quen dự án và quy trình.";
      } else if (p.personCode === "HuyenTN") {
        draftExp["HuyenTN"] = "Lead dành 20% thời gian review/quản lý + trực tiếp fix task trọng tâm.";
      }
    });
    
    setGood(goodText.trim());
    setBad(badText.trim());
    setRisks(risksText.trim());
    setExplanations(prev => ({ ...draftExp, ...prev }));
  };

  const handleSaveConclusion = async () => {
    if (!activePeriodKey) return;
    setSaving(true);
    try {
      await saveConclusion(activePeriodKey, good, bad, risks, manDaysOverrides, explanations);
      setIsEditing(false);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu kết luận");
    } finally {
      setSaving(false);
    }
  };

  const activeDevsCount = view.personnel.filter(p => p.role !== "benchmark").length || 3;

  const getOnboardingWeek = (startDate: string, periodStartDate: string) => {
    const start = new Date(`${startDate}T00:00:00Z`);
    const periodStart = new Date(`${periodStartDate}T00:00:00Z`);
    const startDay = start.getUTCDay() || 7;
    const periodDay = periodStart.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - startDay + 1);
    periodStart.setUTCDate(periodStart.getUTCDate() - periodDay + 1);
    return Math.max(1, Math.floor((periodStart.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const [y1, m1, d1] = start.split("-");
    const [y2, m2, d2] = end.split("-");
    if (!d1 || !d2) return `${start} → ${end}`;
    if (y1 === y2 && m1 === m2) {
      return `${d1}/${m1} — ${d2}/${m2}/${y1}`;
    }
    return `${d1}/${m1}/${y1} — ${d2}/${m2}/${y2}`;
  };

  // Chart follows each person's onboarding timeline, not one shared team week.
  const selectedDev = selectedDevFilter !== "all"
    ? view.personnel.find(p => p.code === selectedDevFilter)
    : undefined;
  const chartMetrics = useMemo(() => {
    return [...view.weeklyMetrics]
      .filter(metric => !selectedDev || metric.period.endDate >= selectedDev.startDate)
      .sort((a, b) => a.period.startDate.localeCompare(b.period.startDate))
      .slice(0, 10);
  }, [view.weeklyMetrics, selectedDev]);

  const chartSlots = Array.from({ length: 10 }, (_, index) => chartMetrics[index]);
  const todayStr = new Date().toISOString().slice(0, 10);

  const computedTargetsMap = useMemo(() => {
    if (selectedDevFilter === "all") return {};

    const customTrajectory = customTargets[selectedDevFilter];
    if (customTrajectory && customTrajectory.length === 10) {
      return { [selectedDevFilter]: customTrajectory };
    }
    if (selectedDevFilter === "HuyenTN") {
      return { HuyenTN: [10, 18, 25, 30, 32, 35, 38, 40, 42, 45] };
    }

    const pastActuals: number[] = [];
    chartSlots.forEach((m) => {
      if (m) {
        const personData = m.byPerson.find((p) => p.personCode === selectedDevFilter);
        pastActuals.push(personData ? personData.bugsFixed : 0);
      }
    });

    const currentWeekIdx = 3;
    const tu4Metric = chartSlots[currentWeekIdx];
    const tu4PersonData = tu4Metric?.byPerson.find((p) => p.personCode === selectedDevFilter);
    const tu4Actual = tu4PersonData ? tu4PersonData.bugsFixed : 3;

    const baseMilestones = [4, 6, 8, Math.max(4, tu4Actual)];
    const targets: number[] = [];
    let runningTarget = Math.max(4, tu4Actual + 1);

    for (let i = 0; i < 10; i++) {
      if (i <= currentWeekIdx) {
        targets.push(baseMilestones[i] || Math.max(4, tu4Actual));
      } else {
        targets.push(runningTarget);
        runningTarget = Math.min(18, runningTarget + 1);
      }
    }

    return { [selectedDevFilter]: targets };
  }, [selectedDevFilter, customTargets, chartSlots]);

  const chartData = chartSlots.map((matchedMetric, index) => {
    let displayActual = 0;
    let displayTarget = 0;
    let weekLabel = weeklyTargetTrajectory[index].weekLabel;
    let milestoneLabel = weeklyTargetTrajectory[index].milestoneLabel;

    let startDate = matchedMetric?.period.startDate || "";
    let endDate = matchedMetric?.period.endDate || "";

    if (!startDate && chartMetrics[0]?.period.startDate) {
      const firstStart = new Date(`${chartMetrics[0].period.startDate}T00:00:00Z`);
      const weekStart = new Date(firstStart);
      weekStart.setUTCDate(firstStart.getUTCDate() + index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      startDate = weekStart.toISOString().slice(0, 10);
      endDate = weekEnd.toISOString().slice(0, 10);
    }

    const isCurrentWeek = Boolean(startDate && endDate && todayStr >= startDate && todayStr <= endDate);
    const dateRangeLabel = formatDateRange(startDate, endDate);

    const isLead = selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead";

    if (selectedDevFilter === "all") {
      const teamTotalFixed = matchedMetric ? matchedMetric.totalFixed : 0;
      displayActual = teamTotalFixed;
      displayTarget = matchedMetric ? view.personnel
        .filter(person => person.role !== "benchmark" && person.startDate <= matchedMetric.period.endDate)
        .reduce((sum, person) => {
          const week = getOnboardingWeek(person.startDate, matchedMetric.period.startDate);
          return sum + (weeklyTargetTrajectory[week - 1]?.targetPerDev ?? weeklyTargetTrajectory.at(-1)?.targetPerDev ?? 0);
        }, 0) : weeklyTargetTrajectory[index].targetPerDev * activeDevsCount;
      if (matchedMetric) {
        weekLabel = `Tuần ${index + 1}`;
        milestoneLabel = "Theo tuần lịch";
      }
    } else if (isLead) {
      const personData = matchedMetric?.byPerson.find(p => p.personCode === selectedDevFilter);
      displayActual = personData ? personData.bugsReviewed : 0;
      const onboardingWeek = matchedMetric && selectedDev
        ? getOnboardingWeek(selectedDev.startDate, matchedMetric.period.startDate)
        : index + 1;
      const customTrajectory = customTargets[selectedDevFilter] || customTargets["HuyenTN"] || [0, 10, 18, 25, 30, 35, 40, 42, 45, 45];
      displayTarget = customTrajectory[onboardingWeek - 1] ?? customTrajectory.at(-1) ?? 45;
      weekLabel = `Tuần ${onboardingWeek}`;
      milestoneLabel = `Target Review Lộ Trình: ${displayTarget} PRs/tuần`;
    } else {
      const devPerson = view.personnel.find(p => p.code === selectedDevFilter);
      if (devPerson && startDate && endDate) {
        const bugBelongsToDev = (b: any) => {
          const pList = [...(b.fixedByIds ?? []), ...(b.causedByIds ?? [])];
          const isFixedByDev = devPerson.notionIds.some(id => pList.includes(id));
          const prAuthor = b.prAuthor?.toLowerCase();
          const isPrDev = devPerson.githubUsername && prAuthor === devPerson.githubUsername.toLowerCase();
          return isFixedByDev || isPrDev;
        };

        const devBugs = view.bugs.filter(b => bugBelongsToDev(b) && (b.status ?? "").toLowerCase() !== "cancel");

        // Calculate Unique Notion Task Cards belonging to Dev with PR creation date strictly in period (1 Task with multiple PRs = 1 Task)
        const uniquePrTaskCards = new Map<string, any>();

        devBugs.forEach(b => {
          const st = (b.status ?? "").toLowerCase();
          if (st !== "resolved" && st !== "closed" && st !== "deployed" && st !== "reviewed") return;
          if (isNoRepro(b)) return;
          if (!b.pullRequestUrl || !b.pullRequestUrl.trim()) return;

          const prDate = bugFixedDate(b);
          if (prDate && dateInRange(prDate, startDate, endDate)) {
            const taskId = b.bugId || b.id;
            uniquePrTaskCards.set(taskId, b);
          }
        });

        displayActual = uniquePrTaskCards.size;
      } else {
        const personData = matchedMetric?.byPerson.find(p => p.personCode === selectedDevFilter);
        displayActual = personData ? personData.bugsFixed : 0;
      }

      const onboardingWeek = matchedMetric && selectedDev
        ? getOnboardingWeek(selectedDev.startDate, matchedMetric.period.startDate)
        : index + 1;
      const dynamicTrajectory = (computedTargetsMap as Record<string, number[]>)[selectedDevFilter] || customTargets[selectedDevFilter];
      if (dynamicTrajectory && dynamicTrajectory[onboardingWeek - 1] !== undefined) {
        displayTarget = dynamicTrajectory[onboardingWeek - 1];
        milestoneLabel = `Target Công Thức (TB 3 Tuần + 15%/tuần): ${displayTarget} bug/tuần`;
      } else {
        const targetStep = weeklyTargetTrajectory[onboardingWeek - 1] ?? weeklyTargetTrajectory.at(-1);
        displayTarget = targetStep?.targetPerDev ?? 14;
        milestoneLabel = targetStep?.milestoneLabel ?? "Năng suất tiêu chuẩn (~14 Bug/Tuần)";
      }
      weekLabel = `Tuần ${onboardingWeek}`;
    }

    const maxScale = selectedDevFilter === "all"
      ? Math.max(45 * activeDevsCount, displayTarget, displayActual)
      : Math.max(50, displayTarget, displayActual);
    const targetPct = Math.min((displayTarget / maxScale) * 100, 100);
    const actualPct = Math.min((displayActual / maxScale) * 100, 100);
    const achieveRate = displayTarget > 0 ? Math.round((displayActual / displayTarget) * 100) : 0;
    const isTargetMet = displayActual >= displayTarget;

    return {
      weekLabel,
      milestoneLabel,
      startDate,
      endDate,
      dateRangeLabel,
      isCurrentWeek,
      displayActual,
      displayTarget,
      targetPct,
      actualPct,
      achieveRate,
      isTargetMet,
      maxScale
    };
  });

  const currentWeekItem = chartData.find(d => d.isCurrentWeek);

  // SVG Line Chart Points calculation (Expanded Height & Clean Padding)
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingTop = 40;
  const paddingBottom = 50;
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingTop - paddingBottom;

  const targetPoints = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
    const y = svgHeight - paddingBottom - (d.targetPct / 100) * usableH;
    return `${x},${y}`;
  }).join(" ");

  const actualPoints = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
    const y = svgHeight - paddingBottom - (d.actualPct / 100) * usableH;
    return `${x},${y}`;
  }).join(" ");

  const selectedDevName = selectedDevFilter !== "all" ? getDisplayName(selectedDevFilter) : "Tổng Cả Team";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Streamlined Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="section-title" style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.025em", color: "var(--text-1)" }}>
            Báo cáo Quản lý & Tiến độ Tuần
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-2)", fontWeight: "500", margin: 0 }}>
            Tổng hợp các task bug có PR URL trên Notion (đã trừ lỗi Không tái hiện / Trùng): <strong style={{ color: "var(--text-1)", fontWeight: "700" }}>{activePeriod && activePeriod.key !== "all" ? `${activePeriod.startDate} — ${activePeriod.endDate}` : "Tất cả các kỳ"}{activeDev ? ` • Nhân sự: ${activeDev.displayName}` : " • Tất cả nhân sự"}</strong>
          </p>
        </div>
        {activePeriodKey && (
          <button 
            className="ctrl ctrl-primary" 
            style={{ fontSize: "12px", padding: "8px 16px", fontWeight: "bold" }}
            onClick={() => setIsEditing(true)}
          >
            {activeConclusion ? "Sửa kết luận & Giải trình" : "Viết kết luận & Giải trình"}
          </button>
        )}
      </div>

      {/* Single Unified 5-Card KPI Row (Clickable & Filterable) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
        <div 
          className="card" 
          onClick={() => setSelectedKpiFilter(prev => prev === "active" ? null : "active")}
          style={{ 
            padding: "12px 14px", 
            borderLeft: "4px solid #2eaadc", 
            background: selectedKpiFilter === "active" ? "rgba(46, 170, 220, 0.18)" : "rgba(46, 170, 220, 0.05)",
            outline: selectedKpiFilter === "active" ? "2px solid #2eaadc" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>TỔNG HIỆN TẠI (ĐANG XỬ LÝ)</span>
            {selectedKpiFilter === "active" && <span style={{ color: "#2eaadc" }}>✓</span>}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#2eaadc", marginTop: "2px" }}>{totalActiveExcludingPending}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Trừ Closed, Cancel &amp; Pending</div>
        </div>

        <div 
          className="card" 
          onClick={() => setSelectedKpiFilter(prev => prev === "in_review" ? null : "in_review")}
          style={{ 
            padding: "12px 14px", 
            borderLeft: "4px solid #e06c55", 
            background: selectedKpiFilter === "in_review" ? "rgba(224, 108, 85, 0.18)" : "rgba(224, 108, 85, 0.05)",
            outline: selectedKpiFilter === "in_review" ? "2px solid #e06c55" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>IN REVIEW / RESOLVED</span>
            {selectedKpiFilter === "in_review" && <span style={{ color: "#ad4d3a" }}>✓</span>}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ad4d3a", marginTop: "2px" }}>{resolvedPendingReviewBugs.length}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Đang review / Chưa test xong</div>
        </div>

        <div 
          className="card" 
          onClick={() => setSelectedKpiFilter(prev => prev === "reviewed" ? null : "reviewed")}
          style={{ 
            padding: "12px 14px", 
            borderLeft: "4px solid #e06c55", 
            background: selectedKpiFilter === "reviewed" ? "rgba(224, 108, 85, 0.18)" : "rgba(224, 108, 85, 0.05)",
            outline: selectedKpiFilter === "reviewed" ? "2px solid #e06c55" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>REVIEWED / WAIT FOR DEV</span>
            {selectedKpiFilter === "reviewed" && <span style={{ color: "#ad4d3a" }}>✓</span>}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ad4d3a", marginTop: "2px" }}>{reviewedWaitingDeployBugs.length}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Đã review / Wait for Dev/Deploy</div>
        </div>

        <div 
          className="card" 
          onClick={() => setSelectedKpiFilter(prev => prev === "reopened" ? null : "reopened")}
          style={{ 
            padding: "12px 14px", 
            borderLeft: "4px solid #9f6b53", 
            background: selectedKpiFilter === "reopened" ? "rgba(159, 107, 83, 0.18)" : "rgba(159, 107, 83, 0.05)",
            outline: selectedKpiFilter === "reopened" ? "2px solid #9f6b53" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>RE-OPENED / LỖI LẶP</span>
            {selectedKpiFilter === "reopened" && <span style={{ color: "#704838" }}>✓</span>}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#704838", marginTop: "2px" }}>{reopenedBugs.length}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Lỗi bị mở lại</div>
        </div>

        <div 
          className="card" 
          onClick={() => setSelectedKpiFilter(prev => prev === "closed" ? null : "closed")}
          style={{ 
            padding: "12px 14px", 
            borderLeft: "4px solid #448361", 
            background: selectedKpiFilter === "closed" ? "rgba(68, 131, 97, 0.18)" : "rgba(68, 131, 97, 0.05)",
            outline: selectedKpiFilter === "closed" ? "2px solid #448361" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>ĐÃ CLOSE HOÀN TẤT</span>
            {selectedKpiFilter === "closed" && <span style={{ color: "#2b593f" }}>✓</span>}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#2b593f", marginTop: "2px" }}>{closedBugs.length}</div>
          <div style={{ fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}>Tỷ lệ Close: {overallCloseRate}%</div>
        </div>
      </div>

      {/* KPI Card Drilldown Bug List Table */}
      {selectedKpiFilter && (
        <div className="card" style={{ padding: "16px", border: "1px solid var(--accent)", background: "var(--surface)", animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-3)", paddingBottom: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-1)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📋 Danh sách Task Bug thuộc mục</span>
              <span style={{ color: "var(--accent)" }}>{kpiFilterTitle}</span>
              <span className="tag" style={{ fontSize: "11px", background: "rgba(59, 130, 246, 0.12)", color: "var(--accent)", fontWeight: "bold" }}>
                {kpiFilteredBugs.length} tasks
              </span>
            </div>
            <button className="ctrl ctrl-sm" style={{ fontSize: "12px", padding: "4px 10px", fontWeight: "bold" }} onClick={() => setSelectedKpiFilter(null)}>Đóng danh sách ✕</button>
          </div>

          {kpiFilteredBugs.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              Không có bug nào trong nhóm này với bộ lọc hiện tại.
            </div>
          ) : (
            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="table" style={{ width: "100%", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>Mã Bug</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>Tiêu đề Bug</th>
                    <th style={{ textAlign: "center", padding: "8px 10px" }}>Trạng thái</th>
                    <th style={{ textAlign: "center", padding: "8px 10px" }}>Link PR</th>
                    <th style={{ textAlign: "center", padding: "8px 10px" }}>Ngày tạo PR</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiFilteredBugs.map((b, idx) => (
                    <tr key={b.id || idx}>
                      <td style={{ padding: "8px 10px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                        <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                          {b.bugId || b.id.slice(0, 8)}
                        </a>
                      </td>
                      <td style={{ padding: "8px 10px" }}>{b.title}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span className="tag" style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(59, 130, 246, 0.1)", color: "var(--accent)", fontWeight: "600" }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {b.pullRequestUrl ? (
                          <a href={b.pullRequestUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "500" }}>
                            Link PR ↗
                          </a>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap", color: "var(--text-2)" }}>
                        {dateKey(b.prCreatedAt) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FULL-WIDTH CHART CARD */}
      <div 
        className="card" 
        style={{ 
          padding: "24px", 
          background: "var(--surface)",
          border: "1px solid var(--border-2)",
          borderRadius: "6px",
          boxShadow: "var(--shadow)"
        }}
      >
        {/* Header with Selector */}
        <div style={{ marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--border-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: "10px" }}>
              Biểu Đồ Lộ Trình Target Tiến Độ Theo Tuần — <span style={{ color: "var(--blue)" }}>{selectedDevName}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>
                {selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead"
                  ? "Mốc lộ trình Năng suất Review Code & Nghiệm thu chất lượng PRs của Lead theo các tuần."
                  : "Mốc lộ trình tăng trưởng năng suất sửa bug thực tế trên Notion vs Target thiết lập qua các tuần."}
              </span>
              {currentWeekItem && (
                <span className="tag" style={{ fontSize: "11px", background: "var(--blue-bg)", color: "var(--blue)", border: "1px solid var(--blue)", fontWeight: "bold" }}>
                  {currentWeekItem.weekLabel} (Tuần hiện tại: {currentWeekItem.dateRangeLabel})
                </span>
              )}
            </div>
          </div>
          
          {/* Person Selector Dropdown & Target Edit Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-2)", fontWeight: "bold" }}>Xem biểu đồ theo:</span>
            <select 
              className="ctrl"
              value={selectedDevFilter} 
              onChange={e => setSelectedDevFilter(e.target.value)}
              style={{ fontSize: "12px", fontWeight: "bold", padding: "6px 12px" }}
            >
              <option value="all">Tất cả thành viên (Tổng Cả Team)</option>
              {view.personnel.filter(p => p.role !== "benchmark").map(p => (
                <option key={p.code} value={p.code}>{p.displayName} ({p.code})</option>
              ))}
            </select>

            <button
              type="button"
              className="ctrl ctrl-primary"
              onClick={() => {
                const current = customTargets[selectedDevFilter] || (
                  selectedDevFilter === "HuyenTN" || selectedDev?.role === "lead"
                    ? [0, 10, 18, 25, 30, 35, 40, 42, 45, 45]
                    : [4, 6, 8, 10, 11, 12, 13, 14, 14, 14]
                );
                setTempTargetValues([...current]);
                setIsEditingTargetsModalOpen(true);
              }}
              style={{ fontSize: "12px", fontWeight: "bold", padding: "6px 12px" }}
            >
              Sửa Mốc Target Lộ Trình
            </button>
          </div>
        </div>

        {/* SVG Curve Visualization Top Layer */}
        <div style={{ marginBottom: "20px", background: "var(--surface-2)", borderRadius: "6px", padding: "16px 20px", border: "1px solid var(--border-3)" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-1)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
            <span>Đồ Thị Đường Tăng Trưởng Thực Tế vs Target Curve</span>
            <div style={{ display: "flex", gap: "20px", fontSize: "11px" }}>
              <span style={{ color: "var(--blue)", fontWeight: "bold" }}>
                ── Target Curve
              </span>
              <span style={{ color: "var(--green)", fontWeight: "bold" }}>
                ── Thực Tế Progress
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "220px", overflow: "visible" }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {chartData.length === 0 && (
              <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="var(--text-2)" fontSize="13">
                Chưa có dữ liệu trong thời gian làm việc của thành viên này
              </text>
            )}

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => (
              <line 
                key={i}
                x1={paddingX} 
                y1={paddingTop + ratio * usableH} 
                x2={svgWidth - paddingX} 
                y2={paddingTop + ratio * usableH} 
                stroke="var(--border-3)" 
                strokeDasharray="4 4"
              />
            ))}

            {/* Target Area Fill & Line */}
            <polygon 
              points={`${paddingX},${svgHeight - paddingBottom} ${targetPoints} ${svgWidth - paddingX},${svgHeight - paddingBottom}`} 
              fill="url(#targetGradient)" 
            />
            <polyline 
              points={targetPoints} 
              fill="none" 
              stroke="var(--cyan)" 
              strokeWidth="2.5" 
              strokeDasharray="5 4"
            />

            {/* Actual Area Fill & Line */}
            <polygon 
              points={`${paddingX},${svgHeight - paddingBottom} ${actualPoints} ${svgWidth - paddingX},${svgHeight - paddingBottom}`} 
              fill="url(#actualGradient)" 
            />
            <polyline 
              points={actualPoints} 
              fill="none" 
              stroke="var(--green)" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points & Smart Non-Colliding Labels */}
            {chartData.map((d, i) => {
              const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * usableW;
              const yTarget = svgHeight - paddingBottom - (d.targetPct / 100) * usableH;
              const yActual = svgHeight - paddingBottom - (d.actualPct / 100) * usableH;

              // Smart offset logic to guarantee ZERO collision with dots or X-axis labels
              const targetYPos = yTarget - 12;
              
              // Place actual badge cleanly above or below depending on proximity
              const isCloseToTarget = Math.abs(yActual - yTarget) < 28;
              const isActualBelow = yActual > yTarget;
              
              let actualBadgeY = yActual - 24;
              if (isCloseToTarget && !isActualBelow) {
                actualBadgeY = yActual - 26;
              } else if (isCloseToTarget && isActualBelow) {
                actualBadgeY = yActual + 10;
              } else if (yActual < 35) {
                actualBadgeY = yActual + 10;
              }

              const shortDates = d.startDate && d.endDate
                ? `${d.startDate.slice(8,10)}/${d.startDate.slice(5,7)} - ${d.endDate.slice(8,10)}/${d.endDate.slice(5,7)}`
                : "";

              return (
                <g key={i}>
                  {/* Current Week Highlight Column */}
                  {d.isCurrentWeek && (
                    <rect 
                      x={x - 28} 
                      y={paddingTop - 5} 
                      width="56" 
                      height={usableH + 10} 
                      rx="6" 
                      fill="rgba(6,182,212,0.12)" 
                      stroke="rgba(6,182,212,0.4)" 
                      strokeDasharray="3 3" 
                    />
                  )}

                  {/* Target Dot & Label */}
                  <circle cx={x} cy={yTarget} r="4.5" fill="var(--cyan)" />
                  <text 
                    x={x} 
                    y={targetYPos} 
                    textAnchor="middle" 
                    fill="var(--cyan)" 
                    fontSize="11" 
                    fontWeight="800"
                  >
                    🎯 {d.displayTarget}
                  </text>

                  {/* Actual Glowing Dot */}
                  <circle cx={x} cy={yActual} r="6.5" fill="var(--green)" stroke="var(--card-bg)" strokeWidth="2.5" />

                  {/* Actual Value High-Contrast Pill Badge */}
                  <g>
                    <rect 
                      x={x - 22} 
                      y={actualBadgeY} 
                      width="44" 
                      height="18" 
                      rx="5" 
                      fill="var(--surface-3)" 
                      stroke="var(--green)" 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x={x} 
                      y={actualBadgeY + 13} 
                      textAnchor="middle" 
                      fill="var(--green)" 
                      fontSize="12" 
                      fontWeight="800"
                    >
                      {d.displayActual}
                    </text>
                  </g>

                  {/* Week X-Axis Label (Placed safely at bottom) */}
                  <text 
                    x={x} 
                    y={svgHeight - 20} 
                    textAnchor="middle" 
                    fill={d.isCurrentWeek ? "var(--cyan)" : "var(--text-1)"} 
                    fontSize="12" 
                    fontWeight="bold"
                  >
                    {d.weekLabel}{d.isCurrentWeek ? " 🔥" : ""}
                  </text>
                  {shortDates && (
                    <text 
                      x={x} 
                      y={svgHeight - 6} 
                      textAnchor="middle" 
                      fill={d.isCurrentWeek ? "var(--cyan)" : "var(--text-3)"} 
                      fontSize="9" 
                      fontWeight={d.isCurrentWeek ? "bold" : "normal"}
                    >
                      {shortDates}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>


      </div>



      {/* Edit Conclusion Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: "680px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-1)" }}>Viết kết luận & Giải trình năng suất tuần: {latest?.period.label}</h2>
              <button 
                type="button"
                className="ctrl ctrl-primary" 
                style={{ fontSize: "11px", padding: "6px 12px" }}
                onClick={handleAutoDraft}
              >
                Điền nháp tự động
              </button>
            </div>
            
            {/* Man-Days Overrides & Explanations per Dev */}
            <div style={{ marginBottom: "16px", padding: "12px", background: "var(--surface-2)", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
              <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "10px", color: "var(--text-1)" }}>
                Điều chỉnh ngày công Man-Days & Giải trình năng suất tuần từng người:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {latest?.byPerson.map((p: any) => {
                  const devName = getDisplayName(p.personCode);
                  const currentVal = manDaysOverrides[p.personCode] !== undefined 
                    ? manDaysOverrides[p.personCode] 
                    : p.workingDays;
                  const currentExp = explanations[p.personCode] || "";

                  return (
                    <div key={p.personCode} style={{ background: "var(--surface)", padding: "10px 12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-1)" }}>{devName} ({p.personCode}):</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Man-Days tuần:</span>
                          <input 
                            type="number" 
                            step="0.5" 
                            min="0" 
                            max="31"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setManDaysOverrides(prev => ({
                                ...prev,
                                [p.personCode]: isNaN(val) ? 0 : val
                              }));
                            }}
                            style={{ 
                              width: "60px", 
                              padding: "4px 6px", 
                              fontSize: "12px", 
                              border: "1px solid var(--border-2)", 
                              borderRadius: "4px", 
                              background: "var(--surface-2)", 
                              color: "var(--text-1)",
                              textAlign: "right"
                            }}
                          />
                        </div>
                      </div>
                      <input 
                        type="text"
                        placeholder={`Lý do/giải trình năng suất tuần của ${devName}...`}
                        value={currentExp}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExplanations(prev => ({
                            ...prev,
                            [p.personCode]: val
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "11px",
                          border: "1px solid var(--border-2)",
                          borderRadius: "4px",
                          background: "var(--surface-2)",
                          color: "var(--text-1)"
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "var(--text-1)" }}>Điểm tốt / Đạt yêu cầu tuần:</label>
            <textarea 
              value={good} 
              onChange={e => setGood(e.target.value)} 
              placeholder="Ví dụ: Team kiểm soát tốt tiến độ tuần..."
              style={{ minHeight: "65px", marginBottom: "12px", width: "100%", fontSize: "12px", background: "var(--surface-2)", color: "var(--text-1)", border: "1px solid var(--border-2)", borderRadius: "4px", padding: "8px" }}
            />

            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "var(--text-1)" }}>Điểm xấu / Tồn tại & Lỗi chất lượng tuần:</label>
            <textarea 
              value={bad} 
              onChange={e => setBad(e.target.value)} 
              placeholder="Ví dụ: Phân tích 11 lỗi chất lượng cơ bản..."
              style={{ minHeight: "65px", marginBottom: "12px", width: "100%", fontSize: "12px", background: "var(--surface-2)", color: "var(--text-1)", border: "1px solid var(--border-2)", borderRadius: "4px", padding: "8px" }}
            />

            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px", color: "var(--text-1)" }}>Action / Hành động chỉ đạo:</label>
            <textarea 
              value={risks} 
              onChange={e => setRisks(e.target.value)} 
              placeholder="Ví dụ: Áp dụng checklist trong PR template..."
              style={{ minHeight: "65px", marginBottom: "12px", width: "100%", fontSize: "12px", background: "var(--surface-2)", color: "var(--text-1)", border: "1px solid var(--border-2)", borderRadius: "4px", padding: "8px" }}
            />

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button 
                className="ctrl" 
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button 
                className="ctrl ctrl-primary" 
                onClick={handleSaveConclusion}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu kết luận & Giải trình"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Curve Customization Modal (Fixed High Z-Index Overlay Popup) */}
      {isEditingTargetsModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "rgba(0, 0, 0, 0.7)", 
            zIndex: 99999, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div 
            className="modal" 
            style={{ 
              width: "560px", 
              maxWidth: "95vw",
              padding: "24px", 
              background: "var(--surface)", 
              borderRadius: "8px", 
              border: "1px solid var(--accent)", 
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)" 
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-1)" }}>
                🎯 Thiết Lập Target Lộ Trình — <span style={{ color: "var(--blue)" }}>{selectedDevName}</span>
              </div>
              <button 
                type="button"
                className="ctrl ctrl-sm" 
                style={{ fontSize: "12px", padding: "2px 8px" }}
                onClick={() => setIsEditingTargetsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "16px", lineHeight: "1.5" }}>
              Nhập số bug / PRs target mong muốn cho từng tuần (từ Tuần 1 đến Tuần 10). Bấm <strong>Lưu Target Lộ Trình</strong> để áp dụng đường cong mới ngay lập tức.
            </div>

            {/* Template Buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <button 
                type="button" 
                className="ctrl" 
                style={{ fontSize: "11px", padding: "4px 8px", background: "var(--surface-2)", fontWeight: "600" }}
                onClick={() => setTempTargetValues([4, 6, 8, 8, 9, 10, 10, 10, 10, 10])}
              >
                🎯 Mẫu Dev Tiêu Chuẩn (4 → 10)
              </button>
              <button 
                type="button" 
                className="ctrl" 
                style={{ fontSize: "11px", padding: "4px 8px", background: "var(--surface-2)", fontWeight: "600" }}
                onClick={() => setTempTargetValues([8, 8, 8, 8, 8, 8, 8, 8, 8, 8])}
              >
                ⚖️ Mẫu Cố Định Vừa Sức (8 bug/tuần)
              </button>
              <button 
                type="button" 
                className="ctrl" 
                style={{ fontSize: "11px", padding: "4px 8px", background: "var(--surface-2)", fontWeight: "600" }}
                onClick={() => setTempTargetValues([0, 10, 18, 25, 28, 30, 30, 30, 30, 30])}
              >
                ⚡ Mẫu Lead Review (0 → 30)
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", maxHeight: "320px", overflowY: "auto", marginBottom: "18px", paddingRight: "4px" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-2)" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-1)" }}>Tuần {i + 1}:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      className="ctrl"
                      style={{ width: "65px", padding: "4px 8px", fontSize: "13px", fontWeight: "700", textAlign: "center", background: "var(--surface)", color: "var(--text-1)", border: "1px solid var(--border-2)" }}
                      value={tempTargetValues[i] ?? 0}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setTempTargetValues(prev => {
                          const copy = [...prev];
                          copy[i] = val;
                          return copy;
                        });
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "600" }}>task</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-2)", paddingTop: "14px" }}>
              <button type="button" className="ctrl" style={{ fontSize: "12px" }} onClick={() => setIsEditingTargetsModalOpen(false)}>Hủy</button>
              <button 
                type="button" 
                className="ctrl ctrl-primary" 
                onClick={async () => {
                  const updated = {
                    ...customTargets,
                    [selectedDevFilter]: tempTargetValues
                  };
                  setCustomTargets(updated);
                  try {
                    localStorage.setItem("qa_custom_targets", JSON.stringify(updated));
                    await saveCustomTargetsApi(updated);
                  } catch (e) {
                    console.error("Failed to save custom targets to server API", e);
                  }
                  setIsEditingTargetsModalOpen(false);
                  if (onUpdate) onUpdate();
                }}
                style={{ fontWeight: "800", fontSize: "12px" }}
              >
                Lưu Target Lộ Trình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
