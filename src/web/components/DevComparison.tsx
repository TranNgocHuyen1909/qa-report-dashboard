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

export function DevComparison({ view, periodType, periodKey, onUpdate }: { view: DashboardView; periodType?: PeriodType; periodKey?: string; onUpdate?: () => Promise<void> }) {
  // Find active period details from topbar filters
  const activePeriod = useMemo(() => {
    if (periodKey) {
      return view.availablePeriods.find(p => p.key === periodKey);
    }
    // Default to latest period if "Tất cả kỳ" is selected
    return view.availablePeriods[0];
  }, [view.availablePeriods, periodKey]);

  const developers = useMemo(() => {
    return view.personnel.filter(p => p.role !== "benchmark" && (!p.startDate || p.startDate <= (activePeriod?.endDate ?? "")));
  }, [view.personnel, activePeriod]);

  const [selectedReopenedBugs, setSelectedReopenedBugs] = useState<any[] | null>(null);
  const [selectedPrBugs, setSelectedPrBugs] = useState<any[] | null>(null);
  const [selectedReviewsList, setSelectedReviewsList] = useState<any[] | null>(null);
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

  const handleSaveMd = async () => {
    if (!activePeriod) return;
    setSavingMd(true);
    try {
      const currentConclusion = view.conclusions?.[activePeriod.key];
      const good = currentConclusion?.good || "";
      const bad = currentConclusion?.bad || "";
      const risks = currentConclusion?.risks || "";
      
      await saveConclusion(activePeriod.key, good, bad, risks, manDaysOverrides);
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
    if (bug.pullRequestUrl && bug.prAuthor) {
      if (dev.githubUsername && bug.prAuthor.toLowerCase() === dev.githubUsername.toLowerCase()) return true;
      if (developers.some(p => p.code !== dev.code && p.githubUsername && p.githubUsername.toLowerCase() === bug.prAuthor.toLowerCase())) return false;
    }
    const notionIds = dev.notionIds || [];
    return (bug.fixedByIds ?? []).some(id => notionIds.includes(id));
  };

  // Helper to get bug fixed date (PR date or last edited date)
  const bugFixedDate = (b: BugRecord) => {
    if (b.pullRequestUrl && b.prCreatedAt) {
      return dateKey(b.prCreatedAt);
    }
    return dateKey(b.lastEditedTime) ?? dateKey(b.confirmedDate);
  };

  const isNoRepro = (b: BugRecord) => {
    const note = (b.note ?? "").toLowerCase();
    const hasNoReproNote = note.includes("không tái hiện") || note.includes("ko tái hiện");
    return hasNoReproNote || !b.pullRequestUrl;
  };

  const isFixed = (b: BugRecord) => {
    return ["closed", "deployed", "resolved"].includes((b.status ?? "").toLowerCase()) && !isNoRepro(b);
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
          isFixed(b) && 
          dateInRange(bugFixedDate(b), activePeriod.startDate, activePeriod.endDate)
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
          dateInRange(dateKey(b.reopenedDate) ?? dateKey(b.lastEditedTime), activePeriod.startDate, activePeriod.endDate)
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
    // Find previous period for trend tracking (if active period is weekly)
    const weeklyIdx = view.weeklyMetrics.findIndex(m => m.period.key === activePeriod?.key);
    const prevMetric = (weeklyIdx !== -1 && weeklyIdx + 1 < view.weeklyMetrics.length)
      ? view.weeklyMetrics[weeklyIdx + 1]
      : null;

    return developers.map(dev => {
      const devRows = devStats.filter(r => r.dev.code === dev.code);
      
      const closedCount = devRows.reduce((sum, r) => sum + r.closedCount, 0);
      const resolvedCount = devRows.reduce((sum, r) => sum + r.resolvedCount, 0);
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
      const completedBugs = devBugs.filter(b => 
        isFixed(b) && 
        dateInRange(bugFixedDate(b), activePeriod.startDate, activePeriod.endDate)
      );
      const solvedWithPrBugs = completedBugs.filter(b => !!b.pullRequestUrl);
      const solvedWithPr = solvedWithPrBugs.length;
      const totalComments = solvedWithPrBugs.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
      const commentsPerTask = solvedWithPr > 0 ? totalComments / solvedWithPr : 0;
      
      const prBugsList = solvedWithPrBugs.map(b => ({
        bugId: b.bugId || b.id,
        title: b.title,
        url: b.url,
        prUrl: b.pullRequestUrl,
        commentsCount: b.prCommentsByTruong ?? 0,
      }));
      
      const activeMetric = view.teamMetrics.find(m => m.period.key === activePeriod?.key);
      const pMetric = activeMetric?.byPerson.find(p => p.personCode === dev.code);
      
      // Use local overrides if defined, otherwise fallback to the backend metric's value
      const manDays = manDaysOverrides[dev.code] !== undefined
        ? manDaysOverrides[dev.code]
        : (pMetric ? pMetric.manDays : 0);

      const reopenRate = (closedCount + resolvedCount) > 0 
        ? (reopenedCount / (closedCount + resolvedCount)) * 100 
        : 0;

      const locParts = devRows
        .filter(r => (r.closedCount + r.resolvedCount) > 0 && r.location !== "—")
        .map(r => `${r.location} (${r.closedCount + r.resolvedCount})`);
      const locationText = locParts.length > 0 ? locParts.join(", ") : "—";

      // Trend comparison for review comments
      const prevPMetric = prevMetric?.byPerson.find(p => p.personCode === dev.code);
      let prevCommentsPerTask = 0;
      if (prevPMetric && prevPMetric.bugsList) {
        const prevSolvedWithPr = prevPMetric.bugsList.filter(b => !!b.pullRequestUrl);
        const prevTotalComments = prevSolvedWithPr.reduce((sum, b) => sum + (b.prCommentsByTruong ?? 0), 0);
        prevCommentsPerTask = prevSolvedWithPr.length > 0 ? prevTotalComments / prevSolvedWithPr.length : 0;
      }

      const bugsPerDay = manDays > 0 ? (closedCount + resolvedCount) / manDays : 0;

      // Count reviews performed by this person in this period based on Notion reviewerIds
      let reviewsCount = 0;
      const reviewedBugsList: any[] = [];

      view.bugs.forEach(b => {
        if ((b.status ?? "").toLowerCase() !== "cancel") {
          const isReviewer = (b.reviewerIds ?? []).some(id => dev.notionIds.includes(id));
          if (isReviewer) {
            const reviewDate = b.confirmedDate || dateKey(b.prCreatedAt) || dateKey(b.lastEditedTime);
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
      if (d.bugsPerDay < 1.0 && d.fixed > 0) {
        abnormalNotes.push(
          <span key={`lowperf-${d.code}`}>⚠️ Năng suất của <strong>{d.code}</strong> thấp (<strong>{d.bugsPerDay.toFixed(1)} bug/ngày</strong>) so với tốc độ tham chiếu.</span>
        );
      }
    });

    // Check Leader effort distribution
    const huyen = activeMetric.byPerson.find(p => p.personCode === "HuyenTN");
    const huyenReviewed = huyen ? huyen.bugsReviewed : 0;
    if (huyenReviewed === 0) {
      leaderNotes.push(
        <span key="leader-warn">⚠️ Lead (HuyenTN) <strong>chưa ghi nhận review PR/task nào</strong> trong kỳ. Cần đảm bảo phân bổ tối thiểu <strong>20% thời gian (~1.6 giờ/ngày)</strong> cho việc review/check PR và kiểm soát chất lượng để tránh lọt lỗi.</span>
      );
    } else {
      leaderNotes.push(
        <span key="leader-ok">✔️ Lead (HuyenTN) đã ghi nhận review <strong>{huyenReviewed} PR/task</strong> trong kỳ. Cần duy trì tỷ lệ tối thiểu 20% nỗ lực hàng ngày cho hoạt động kiểm soát chất lượng này.</span>
      );
    }

    // proposed resource coordination actions
    const lowPerfDevs = devPerformance.filter(d => d.bugsPerDay < 1.0 && d.code !== "HuyenTN").map(d => d.code);
    const highPerfDevs = devPerformance.filter(d => d.bugsPerDay >= 3.0).map(d => d.code);
    
    if (lowPerfDevs.length > 0) {
      coordinationNotes.push(
        <span key="coord-low">👉 <strong>Điều phối hỗ trợ:</strong> Cần trao đổi làm rõ rào cản kỹ thuật hoặc <strong>giảm tải bớt task / lùi deadline / thay đổi độ ưu tiên</strong> cho <strong>{lowPerfDevs.join(", ")}</strong> do năng suất sửa lỗi thấp (&lt; 1.0 bug/ngày).</span>
      );
    }
    if (highPerfDevs.length > 0) {
      coordinationNotes.push(
        <span key="coord-high">👉 <strong>Phân bổ tài nguyên tối ưu:</strong> Tận dụng và giao thêm các task phức tạp/độ khó cao hơn cho <strong>{highPerfDevs.join(", ")}</strong> do năng suất sửa lỗi đạt mức xuất sắc (&gt;= 3.0 bug/ngày).</span>
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
            onClick={handleSaveMd}
            disabled={savingMd}
          >
            {savingMd ? "🔄 Đang lưu..." : "💾 Lưu Thay Đổi Ngày Công (MD)"}
          </button>
        )}
      </div>



      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Nhân sự</th>
                <th style={{ textAlign: "left" }} className="has-tooltip" data-tooltip="Vị trí lỗi (component) của bug">Vị trí lỗi</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã hoàn thành, review xong và deploy thành công (Closed, Deployed) trong kỳ">Đã Close</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đã sửa xong nhưng chưa được review hoặc merge (Resolved) trong kỳ">Resolved</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số bug đóng trực tiếp không qua PR (Ví dụ: Không tái hiện, Trùng lặp, Không phải lỗi, v.v.)">Không tái hiện</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Tỷ lệ bug bị mở lại sau khi dev báo sửa xong:&#10;(Số bug Reopen / Tổng số bug đã sửa xong (Closed + Resolved)) * 100%&#10;Mục tiêu: < 15%">Tỷ lệ Reopen</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Man-Days: Số ngày công làm việc thực tế ghi nhận trong kỳ (Có thể tùy chỉnh)">MD</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Năng suất sửa lỗi trung bình mỗi ngày công: (Đã Close + Resolved) / MD">Bug/Ngày</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Đối với Lead (HuyenTN): Tổng số task đã trực tiếp review trong kỳ.&#10;Đối với Dev: Số task của dev đã được Lead review trong kỳ.">Lead Review</th>
                <th style={{ textAlign: "right" }} className="has-tooltip" data-tooltip="Số review comment trung bình nhận từ anh T trên mỗi PR task:&#10;Tổng review comments / Số task sửa qua PR">Comments/Task</th>
                <th style={{ textAlign: "center" }} className="has-tooltip" data-tooltip="Số lượng bug vi phạm các bài học kinh nghiệm được lưu trong Checklist">Lỗi Lặp</th>
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
                        padding: "12px 10px"
                      }}
                    >
                      <strong>{row.dev.displayName}</strong>
                      <div style={{ color: "var(--text-3)", fontSize: "11px", fontWeight: "normal", marginTop: 2 }}>
                        {row.dev.role === "lead" ? "👑 Lead" : "💻 Dev"} ({row.dev.code})
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
                    <td style={{ textAlign: "left", fontSize: "13px", color: "var(--text-2)", fontWeight: "500", paddingLeft: "12px" }}>
                      {row.locationText}
                    </td>
                    <td className="td-num" style={{ color: row.closedCount > 0 ? "var(--green)" : "var(--text-3)" }}>{row.closedCount}</td>
                    <td className="td-num" style={{ color: row.resolvedCount > 0 ? "var(--blue)" : "var(--text-3)" }}>{row.resolvedCount}</td>
                    <td className="td-num" style={{ color: "var(--text-3)" }}>{row.noRepro}</td>
                    <td 
                      className="td-num has-tooltip" 
                      style={{ 
                        color: row.reopenedCount > 0 ? "var(--red)" : "var(--text-2)", 
                        cursor: row.reopenedCount > 0 ? "pointer" : "default",
                        textDecoration: row.reopenedCount > 0 ? "underline dashed" : "none"
                      }}
                      data-tooltip={row.reopenedCount > 0 ? row.reopenedList.map(b => `[${b.bugId}] ${b.title}`).join('\n') : "0 bug bị reopen"}
                      onClick={() => row.reopenedCount > 0 && setSelectedReopenedBugs(row.reopenedList)}
                    >
                      {row.reopenedCount > 0 ? `${row.reopenRate.toFixed(1)}% (${row.reopenedCount})` : "0.0%"}
                    </td>
                    <td className="td-num" style={{ verticalAlign: "middle", padding: "8px 10px" }}>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="31"
                        style={{ 
                          width: "55px", 
                          textAlign: "right", 
                          padding: "4px 6px", 
                          fontSize: "13px", 
                          border: "1px solid var(--border-3)", 
                          borderRadius: "4px",
                          background: "var(--surface-2)",
                          color: "var(--text)"
                        }}
                        value={row.manDays}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setManDaysOverrides(prev => ({
                            ...prev,
                            [row.dev.code]: isNaN(val) ? 0 : val
                          }));
                        }}
                      />
                    </td>
                    <td className="td-num" style={{ fontWeight: "bold", color: "var(--cyan)", verticalAlign: "middle" }}>
                      {row.bugsPerDay.toFixed(1)}
                    </td>
                    <td 
                      className="td-num has-tooltip" 
                      style={{ 
                        color: row.bugsReviewed > 0 ? "var(--green)" : "var(--text-3)",
                        cursor: row.bugsReviewed > 0 ? "pointer" : "default",
                        textDecoration: row.bugsReviewed > 0 ? "underline dashed" : "none",
                        fontWeight: "bold",
                        verticalAlign: "middle"
                      }}
                      data-tooltip={row.bugsReviewed > 0 ? `Tổng số ${row.bugsReviewed} PR đã được ${row.dev.code} review:\n` + row.reviewedBugsList.map(b => `[${b.bugId}] của ${b.author}: ${b.title}`).join('\n') : "Chưa thực hiện review nào"}
                      onClick={() => {
                        if (row.bugsReviewed > 0) {
                          setSelectedReviewsList(row.reviewedBugsList);
                          setSelectedDevCode(row.dev.code);
                        }
                      }}
                    >
                      <div>{row.bugsReviewed}</div>
                      {row.bugsReviewed > 0 && (
                        <div style={{ fontSize: "10px", fontWeight: "normal", color: "var(--text-3)", marginTop: "2px" }}>
                          đã duyệt
                        </div>
                      )}
                    </td>
                    <td 
                      className="td-num has-tooltip" 
                      style={{ 
                        color: row.commentsPerTask > 3 ? "var(--yellow)" : "var(--green)",
                        cursor: row.prBugsList && row.prBugsList.length > 0 ? "pointer" : "default",
                        textDecoration: row.prBugsList && row.prBugsList.length > 0 ? "underline dashed" : "none"
                      }}
                      data-tooltip={row.prBugsList && row.prBugsList.length > 0 ? row.prBugsList.map(b => `[${b.bugId}] ${b.title}: ${b.commentsCount} comments`).join('\n') : "0 task có PR"}
                      onClick={() => {
                        if (row.prBugsList && row.prBugsList.length > 0) {
                          setSelectedPrBugs(row.prBugsList);
                          setSelectedDevCode(row.dev.code);
                        }
                      }}
                    >
                      <div>{row.commentsPerTask.toFixed(1)}/task</div>
                      {row.hasPrevData && (() => {
                        const diff = row.commentsPerTask - row.prevCommentsPerTask;
                        if (diff < -0.1) {
                          return (
                            <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "2px" }} title={`Tuần trước: ${row.prevCommentsPerTask.toFixed(1)}`}>
                              📉 ({row.prevCommentsPerTask.toFixed(1)})
                            </div>
                          );
                        } else if (diff > 0.1) {
                          return (
                            <div style={{ fontSize: "11px", color: "var(--red)", marginTop: "2px" }} title={`Tuần trước: ${row.prevCommentsPerTask.toFixed(1)}`}>
                              📈 ({row.prevCommentsPerTask.toFixed(1)})
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {row.repeatedCount === 0 ? (
                        <span style={{ color: "var(--green)", fontSize: "11px" }}>✔️ Không</span>
                      ) : (
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                          <span style={{ color: "var(--red)", fontWeight: "bold", fontSize: "13px" }}>{row.repeatedCount} lỗi</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", justifyContent: "center", marginTop: "4px", maxWidth: "200px" }}>
                            {row.repeatedDetails.map(det => (
                              <span key={det.code} title={det.title} className="tag tag-red" style={{ fontSize: "11px", padding: "1px 4px" }}>
                                {det.code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto Evaluation Summary */}
      <div className="card" style={{ marginTop: "16px", background: "rgba(99,102,241,0.05)", borderLeft: "4px solid var(--accent)" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", color: "var(--accent-2)" }}>
          📝 Đánh giá Năng suất &amp; Chất lượng (Tự động)
        </div>
        {getAutoEvaluation()}
      </div>
      {/* Guide Card */}
      <div className="card" style={{ marginTop: "20px", background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(6,182,212,0.03))" }}>
        <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>💡 Hướng dẫn Đọc Chỉ số Chất lượng:</div>
        <div style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: "1.6" }}>
          - <strong>Đã Close:</strong> Số bug đã được review xong và deploy thành công (Closed, Deployed).
          <br />
          - <strong>Resolved:</strong> Số bug được dev sửa xong và gửi đi nhưng chưa hoàn thành review/deploy.
          <br />
          - <strong>Tỷ lệ Reopen:</strong> Tỷ lệ phần trạng thái bug bị mở lại sau khi báo sửa xong. Mục tiêu dưới <strong>15%</strong>.
          <br />
          - <strong>Comments/Task:</strong> Số lượng review comment trung bình nhận được từ anh T trên mỗi PR task. Review comment nhiều chứng tỏ code chưa trau chuốt kỹ.
          <br />
          - <strong>Lỗi Lặp:</strong> Số lỗi bị lặp lại các bài học kinh nghiệm trong danh sách <strong>Checklist</strong>. Việc lặp lại lỗi đã được comment trước đó là điểm trừ chất lượng lớn.
        </div>
      </div>
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
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
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
          <div className="modal" style={{ width: "750px", padding: "20px", borderRadius: "8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💬</span> Chi tiết Review Comments trên Task ({selectedDevCode})
              </h3>
              <button 
                type="button" 
                className="ctrl" 
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px" }} 
                onClick={() => { setSelectedPrBugs(null); setSelectedDevCode(""); }}
              >
                Đóng
              </button>
            </div>
            
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-2)", borderRadius: "6px", background: "var(--bg-2)" }}>
              {selectedPrBugs.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-3)", textAlign: "center" }}>Không có task nào.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-3)", borderBottom: "1px solid var(--border-2)" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>BUG ID</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Tiêu đề lỗi</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Link PR</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Review Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrBugs.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-3)", background: "var(--bg-1)" }}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>
                          {b.url ? (
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                              {b.bugId}
                            </a>
                          ) : (
                            b.bugId
                          )}
                        </td>
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
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: b.commentsCount > 3 ? "var(--red)" : b.commentsCount > 0 ? "var(--yellow)" : "var(--green)" }}>
                          {b.commentsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-2)", textAlign: "right" }}>
              * Mật độ comment trung bình = Tổng comments / Tổng số task có PR.
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
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
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
    </div>
  );
}
