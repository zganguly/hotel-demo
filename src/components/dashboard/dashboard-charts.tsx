"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAVY = "#173B57";
const TEAL = "#0F766E";
const GOLD = "#C89B5D";
const SLATE = "#64748B";
const GRID = "#E2E8F0";

export type OccupancyPoint = {
  date: string;
  label: string;
  occupancy: number;
  rooms: number;
  isToday: boolean;
};

export type RevenuePoint = {
  date: string;
  label: string;
  payments: number;
  charges: number;
};

export type StatusSlice = { name: string; value: number; color: string };
export type SourceSlice = { name: string; value: number };
export type RoomTypeOccupancy = {
  name: string;
  occupied: number;
  available: number;
};

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
  money,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  suffix?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-[var(--shadow-float)]">
      <p className="font-semibold text-text">{label}</p>
      {payload.map((item) => (
        <p key={String(item.name)} className="mt-0.5 flex items-center gap-1.5 text-text-muted">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: item.color ?? NAVY }}
          />
          {item.name}:{" "}
          <span className="font-semibold tabular text-text">
            {money
              ? `₹${Number(item.value ?? 0).toLocaleString("en-IN")}`
              : `${item.value}${suffix ?? ""}`}
          </span>
        </p>
      ))}
    </div>
  );
}

export function OccupancyTrendChart({ data }: { data: OccupancyPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: SLATE }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval="preserveStartEnd"
          />
          <YAxis
            unit="%"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: SLATE }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Area
            type="monotone"
            dataKey="occupancy"
            name="Occupancy"
            stroke={TEAL}
            strokeWidth={2.5}
            fill="url(#occFill)"
            dot={false}
            activeDot={{ r: 4, fill: TEAL, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: SLATE }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: SLATE }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<ChartTooltip money />} cursor={{ fill: "rgba(23,59,87,0.05)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar dataKey="charges" name="Charges" fill={NAVY} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="payments" name="Payments" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonutChart({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="relative h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold tabular text-text">{total}</p>
        <p className="text-xs text-text-muted">bookings · 30d</p>
      </div>
    </div>
  );
}

export function SourceMixChart({ data }: { data: SourceSlice[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={82}
            tick={{ fontSize: 11, fill: SLATE }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(23,59,87,0.05)" }} />
          <Bar dataKey="value" name="Bookings" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={index % 2 === 0 ? TEAL : NAVY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RoomTypeOccupancyChart({ data }: { data: RoomTypeOccupancy[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={{ fontSize: 11, fill: SLATE }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(23,59,87,0.05)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar dataKey="occupied" name="Occupied tonight" stackId="a" fill={NAVY} radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="available" name="Open" stackId="a" fill={GRID} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
