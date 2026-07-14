// components/lgi/LGIDashboardClient.tsx
'use client';

import Link from 'next/link';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid,
//   Tooltip, ResponsiveContainer, PieChart, Pie,
//   Cell, Legend
// } from 'recharts'

import {
  BarChartDynamic as BarChart,
  PieChartDynamic as PieChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  Cell,
  Legend,
} from '@/components/charts/RechartsComponents';

import { ReportDownloader } from '@/components/reports/ReportDownloader';
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  ShieldX,
  ChevronRight,
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  member_count: number;
  total_sessions: number;
  avg_attendance_pct: number;
}

interface Props {
  totalMembers: number;
  avgAttendance: number;
  eligible: number;
  notEligible: number;
  groups: Group[];
  recentSessions: any[];
  trendData: { month: string; sessions: number }[];
}

const COLORS = ['#006400', '#dc2626'];

export function LGIDashboardClient({
  totalMembers,
  avgAttendance,
  eligible,
  notEligible,
  groups,
  recentSessions,
  trendData,
}: Props) {
  const pieData = [
    { name: 'Eligible', value: eligible },
    { name: 'Not eligible', value: notEligible },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">LGA Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <ReportDownloader />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Corps members',
            value: totalMembers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'LGA avg attendance',
            value: `${avgAttendance}%`,
            icon: CalendarCheck,
            color: avgAttendance >= 75 ? 'text-green-700' : 'text-red-600',
            bg: avgAttendance >= 75 ? 'bg-green-50' : 'bg-red-50',
          },
          {
            label: 'Clearance eligible',
            value: eligible,
            icon: ShieldCheck,
            color: 'text-green-700',
            bg: 'bg-green-50',
          },
          {
            label: 'Not yet eligible',
            value: notEligible,
            icon: ShieldX,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div
              className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}
            >
              <k.icon size={18} className={k.color} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sessions trend bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Sessions per month
          </h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={trendData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="sessions" fill="#006400" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No session data yet
            </div>
          )}
        </div>

        {/* Clearance pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Clearance eligibility
          </h2>
          {totalMembers > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={false}
                    legendType="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                    formatter={(value) => [`${value} members`, ''] as any}
                  />
                  {/* <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: '12px' }}
                  formatter={(value) => value}
                /> */}
                </PieChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-full bg-green-700 inline-block flex-shrink-0" />
                  Eligible ({eligible})
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block flex-shrink-0" />
                  Not eligible ({notEligible})
                </span>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No member data yet
            </div>
          )}
        </div>
      </div>

      {/* Group comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Group attendance comparison
          </h2>
          <span className="text-xs text-gray-400">{groups.length} groups</span>
        </div>

        {groups.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={Math.max(groups.length * 40, 120)}
          >
            <BarChart
              data={groups.map((g) => ({
                name: g.name,
                pct: g.avg_attendance_pct ?? 0,
                members: g.member_count,
              }))}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 10, fill: '#374151' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
                formatter={(value) => [`${value}%`, 'Attendance']}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} legendType="none">
                {groups.map((g, i) => (
                  <Cell
                    key={i}
                    fill={
                      (g.avg_attendance_pct ?? 0) >= 75 ? '#006400' : '#dc2626'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No groups yet
          </p>
        )}

        {/* 75% threshold legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-green-700 inline-block" />{' '}
            ≥75% eligible
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />{' '}
            &lt;75% at risk
          </span>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Recent sessions
          </h2>
          <Link
            href="/lgi/audit"
            className="text-xs text-blue-700 hover:underline flex items-center gap-0.5"
          >
            Audit log <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSessions.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.cds_groups?.name} ·{' '}
                  {new Date(s.start_time).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
          {recentSessions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No sessions yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
