export type OrderRow = { created_at: string; total?: number; quantity?: number };

export type OverviewDay = { key: string; count: number; future: boolean };
export type OverviewWeek = { label: string; days: OverviewDay[] };
export type OverviewMilestone = { index: number; amount: number };

export type OverviewModel = {
  weeks: OverviewWeek[];
  revenue: number;
  orderCount: number;
  units: number;
  activeDays: number;
  longest: number;
  current: number;
  series: number[];
  milestones: OverviewMilestone[];
};

const WEEKS = 26;
const MILESTONES = [1_000, 5_000, 10_000, 50_000, 100_000];

function dayKey(time: number) {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function midnight(time: number) {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function addDays(time: number, days: number) {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
}

export function buildOverview(orders: OrderRow[], now = Date.now()): OverviewModel {
  const byDay: Record<string, { n: number; total: number; qty: number }> = {};
  for (const order of orders) {
    const parsed = new Date(order.created_at).getTime();
    if (Number.isNaN(parsed)) continue;
    const key = dayKey(parsed);
    const cell = byDay[key] ?? { n: 0, total: 0, qty: 0 };
    cell.n += 1;
    cell.total += Number(order.total) || 0;
    cell.qty += Number(order.quantity) || 0;
    byDay[key] = cell;
  }

  const today = midnight(now);
  const monday = addDays(today, -((new Date(today).getDay() + 6) % 7));
  const start = addDays(monday, -(WEEKS - 1) * 7);

  const weeks: OverviewWeek[] = [];
  let previousMonth = -1;
  for (let week = 0; week < WEEKS; week++) {
    const weekStart = addDays(start, week * 7);
    const month = new Date(weekStart).getMonth();
    const label = month === previousMonth ? "" : new Date(weekStart).toLocaleDateString("th-TH", { month: "short" });
    previousMonth = month;
    const days = Array.from({ length: 7 }, (_, day) => {
      const time = addDays(weekStart, day);
      const key = dayKey(time);
      return { key, count: byDay[key]?.n ?? 0, future: time > today };
    });
    weeks.push({ label, days });
  }

  const keys = weeks.flatMap((week) => week.days.filter((day) => !day.future).map((day) => day.key));
  let revenue = 0;
  let orderCount = 0;
  let units = 0;
  let activeDays = 0;
  let run = 0;
  let longest = 0;
  for (const key of keys) {
    const cell = byDay[key];
    if (!cell || cell.n === 0) {
      run = 0;
      continue;
    }
    revenue += cell.total;
    orderCount += cell.n;
    units += cell.qty;
    activeDays += 1;
    run += 1;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let index = keys.length - 1; index >= 0; index--) {
    if ((byDay[keys[index]]?.n ?? 0) === 0) break;
    current += 1;
  }

  const series: number[] = [];
  let cumulative = 0;
  for (const week of weeks) {
    for (const day of week.days) {
      if (!day.future) cumulative += byDay[day.key]?.total ?? 0;
    }
    series.push(cumulative);
  }

  return {
    weeks,
    revenue,
    orderCount,
    units,
    activeDays,
    longest,
    current,
    series,
    milestones: MILESTONES.flatMap((amount) => {
      const index = series.findIndex((value) => value >= amount);
      return index >= 0 ? [{ index, amount }] : [];
    }),
  };
}

export const OVERVIEW_WEEKS = WEEKS;
