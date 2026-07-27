import { useMemo } from "react";
import type {
  BenchmarkMonthSummary,
  DashboardView,
  PeriodInfo,
  Person,
  PersonPeriodMetric,
} from "../../shared/types";

const WORKING_DAYS_PER_WEEK = 5;

type TargetLevel = {
  label: string;
  percent: number;
  description: string;
};

type WeeklyTargetRow = {
  period: PeriodInfo;
  person: Person;
  onboardingWeek: number;
  level: TargetLevel;
  target: number;
  actual: number;
  remaining: number;
  achievementPercent: number;
  isCurrentWeek: boolean;
  targetBasis: string;
};

const TARGET_LEVELS: TargetLevel[] = [
  { label: "T1", percent: 50, description: "Tuần 1–4: làm quen quy trình và codebase" },
  { label: "T2", percent: 70, description: "Tuần 5–8: tự chủ xử lý bug" },
  { label: "T3", percent: 90, description: "Từ tuần 9: tiệm cận benchmark An" },
];

function parseUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function startOfIsoWeek(date: string): Date {
  const value = parseUtcDate(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value;
}

function getOnboardingWeek(person: Person, period: PeriodInfo): number {
  const startWeek = startOfIsoWeek(person.startDate);
  const periodWeek = startOfIsoWeek(period.startDate);
  const diffMs = periodWeek.getTime() - startWeek.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function getTargetLevel(onboardingWeek: number): TargetLevel {
  if (onboardingWeek <= 4) return TARGET_LEVELS[0];
  if (onboardingWeek <= 8) return TARGET_LEVELS[1];
  return TARGET_LEVELS[2];
}

function getPrimaryBenchmark(months: BenchmarkMonthSummary[]): BenchmarkMonthSummary | undefined {
  return months.find(month => month.month === "2026-05") ?? months[0];
}

function getPersonActual(metric: PersonPeriodMetric | undefined): number {
  return metric?.bugsFixed ?? 0;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TargetView({ view }: { view: DashboardView }) {
  const benchmarkMonth = getPrimaryBenchmark(view.benchmark?.months ?? []);
  const benchmarkPerWeek = (benchmarkMonth?.avgBugsPerDay ?? 0) * WORKING_DAYS_PER_WEEK;
  const today = formatDate(new Date());

  const rows = useMemo<WeeklyTargetRow[]>(() => {
    const developers = view.personnel.filter(person => person.role === "developer");

    // view.weeklyMetrics is ordered descending (newest week at index 0)
    return view.weeklyMetrics.flatMap((metric, metricIndex) => {
      const isCurrentWeek = today >= metric.period.startDate && today <= metric.period.endDate;

      // Older weeks for calculating 2-week moving average
      const prev1Metric = view.weeklyMetrics[metricIndex + 1];
      const prev2Metric = view.weeklyMetrics[metricIndex + 2];

      return developers
        .filter(person => person.startDate <= metric.period.endDate)
        .map(person => {
          const onboardingWeek = getOnboardingWeek(person, metric.period);
          const level = getTargetLevel(onboardingWeek);
          const onboardingFloor = Math.ceil((benchmarkPerWeek * level.percent) / 100);
          const actual = getPersonActual(
            metric.byPerson.find(personMetric => personMetric.personCode === person.code),
          );

          // Get previous 2 completed weeks actual performance
          const p1 = prev1Metric?.byPerson.find(pm => pm.personCode === person.code);
          const p2 = prev2Metric?.byPerson.find(pm => pm.personCode === person.code);

          const actualPrev1 = p1?.bugsFixed;
          const actualPrev2 = p2?.bugsFixed;

          let target: number;
          let targetBasis: string;

          if (actualPrev1 !== undefined) {
            const avgTwo = actualPrev2 !== undefined ? (actualPrev1 + actualPrev2) / 2 : actualPrev1;
            const basePrev = Math.max(actualPrev1, avgTwo);
            const movingTarget = Math.ceil(basePrev * 1.1); // +10% growth over recent high/average

            if (movingTarget >= onboardingFloor) {
              target = movingTarget;
              targetBasis = `Tuần trước ${actualPrev1} bug ➔ Target +10% (${movingTarget} bug)`;
            } else {
              target = onboardingFloor;
              targetBasis = `Mức sàn ${level.label} (${onboardingFloor} bug)`;
            }
          } else {
            // First week or no history -> fallback to onboarding floor
            target = onboardingFloor;
            targetBasis = `Mức sàn Onboarding ${level.label}`;
          }

          return {
            period: metric.period,
            person,
            onboardingWeek,
            level,
            target,
            actual,
            remaining: Math.max(0, target - actual),
            achievementPercent: target > 0 ? (actual / target) * 100 : 0,
            isCurrentWeek,
            targetBasis,
          };
        });
    });
  }, [benchmarkPerWeek, today, view.personnel, view.weeklyMetrics]);

  const latestPeriod = view.weeklyMetrics[0]?.period;
  const latestRows = latestPeriod
    ? rows.filter(row => row.period.key === latestPeriod.key)
    : [];
  const teamTarget = latestRows.reduce((sum, row) => sum + row.target, 0);
  const teamActual = latestRows.reduce((sum, row) => sum + row.actual, 0);
  const latestMetric = view.weeklyMetrics[0];
  const backlog = latestMetric?.backlogEnd ?? 0;
  const estimatedWeeks = teamTarget > 0 ? Math.ceil(backlog / teamTarget) : 0;

  if (!benchmarkMonth || benchmarkPerWeek <= 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
        Chưa có dữ liệu benchmark An để thiết lập target theo tuần.
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">🎯 Target theo tuần (Option 2 - Dynamic Moving Average)</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Cơ sở thiết lập mục tiêu động</div>
            <div className="card-subtitle">
              Target mỗi tuần được tính tự động = <strong>Trung bình 2 tuần gần nhất × 1.1 (+10% tăng trưởng)</strong>.
              Đồng thời bảo đảm mức sàn tối thiểu theo giai đoạn Onboarding (
              {TARGET_LEVELS.map(l => `${l.label}: ${Math.ceil((benchmarkPerWeek * l.percent) / 100)} bug/tuần`).join(" · ")}
              ).
            </div>
          </div>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="kpi kpi-cyan">
            <div className="kpi-value">{benchmarkPerWeek.toFixed(0)}</div>
            <div className="kpi-label">Benchmark An / tuần</div>
          </div>
          {TARGET_LEVELS.map(level => (
            <div className="kpi kpi-accent" key={level.label}>
              <div className="kpi-value">{Math.ceil((benchmarkPerWeek * level.percent) / 100)}</div>
              <div className="kpi-label">Sàn {level.label} · {level.percent}% benchmark</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-2)" }}>
          {TARGET_LEVELS.map(level => `${level.label}: ${level.description}`).join(" · ")}
        </div>
      </div>

      {latestPeriod && (
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Kế hoạch {latestPeriod.label}</div>
                <div className="card-subtitle">
                  {latestPeriod.startDate} → {latestPeriod.endDate}
                  {latestRows.some(row => row.isCurrentWeek) ? " · Đang diễn ra, chưa dùng để kết luận cuối kỳ" : ""}
                </div>
              </div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="kpi kpi-accent">
                <div className="kpi-value">{teamTarget}</div>
                <div className="kpi-label">Target team</div>
              </div>
              <div className="kpi kpi-green">
                <div className="kpi-value">{teamActual}</div>
                <div className="kpi-label">Đã hoàn thành</div>
              </div>
              <div className="kpi kpi-yellow">
                <div className="kpi-value">{Math.max(0, teamTarget - teamActual)}</div>
                <div className="kpi-label">Còn thiếu target</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Ước lượng backlog</div>
                <div className="card-subtitle">Giả định không phát sinh bug mới và team duy trì target tuần hiện tại</div>
              </div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div className="kpi kpi-yellow">
                <div className="kpi-value">{backlog}</div>
                <div className="kpi-label">Tồn cuối kỳ</div>
              </div>
              <div className="kpi kpi-cyan">
                <div className="kpi-value">{estimatedWeeks || "—"}</div>
                <div className="kpi-label">Tuần dự kiến xử lý hết</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Theo dõi target từng thành viên</div>
            <div className="card-subtitle">Target được tính tự động từ phong độ 2 tuần gần nhất (+10%); Actual là số bug hoàn thành trong tuần.</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tuần</th>
                <th>Thành viên</th>
                <th style={{ textAlign: "right" }}>Tuần onboarding</th>
                <th>Cơ sở Target</th>
                <th style={{ textAlign: "right" }}>Target bug/tuần</th>
                <th style={{ textAlign: "right" }}>Actual</th>
                <th style={{ textAlign: "right" }}>Còn thiếu</th>
                <th style={{ textAlign: "right" }}>Tiến độ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-3)", padding: 24 }}>
                    Chưa có dữ liệu tuần để đối chiếu target.
                  </td>
                </tr>
              ) : rows.map(row => {
                const metTarget = row.actual >= row.target;
                const statusClass = row.isCurrentWeek ? "tag-blue" : metTarget ? "tag-green" : "tag-yellow";
                const statusText = row.isCurrentWeek ? "Đang thực hiện" : metTarget ? "Đạt target" : "Chưa đạt";

                return (
                  <tr key={`${row.period.key}-${row.person.code}`}>
                    <td>
                      <strong>{row.period.label}</strong>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                        {row.period.startDate} → {row.period.endDate}
                      </div>
                    </td>
                    <td><strong>{row.person.code}</strong></td>
                    <td className="td-num">{row.onboardingWeek}</td>
                    <td>
                      <span className="tag tag-gray" title={row.targetBasis}>{row.targetBasis}</span>
                    </td>
                    <td className="td-num" style={{ color: "var(--accent-2)", fontWeight: 700 }}>{row.target}</td>
                    <td className="td-num" style={{ color: "var(--green)", fontWeight: 700 }}>{row.actual}</td>
                    <td className="td-num" style={{ color: row.remaining > 0 ? "var(--yellow)" : "var(--text-3)" }}>{row.remaining}</td>
                    <td className="td-num">{row.achievementPercent.toFixed(0)}%</td>
                    <td><span className={`tag ${statusClass}`}>{statusText}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

