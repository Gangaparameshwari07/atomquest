"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, Users as UsersIcon, PieChart as PieIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AnalyticsClient({
  thrustData, uomData, statusData, qoqData, deptData, managerData,
  cycleName, scope,
}: {
  thrustData: { name: string; value: number }[];
  uomData: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
  qoqData: { quarter: string; avgScore: number; goalsTracked: number }[];
  deptData: { name: string; completion: number; total: number }[];
  managerData: { name: string; count: number }[];
  cycleName: string;
  scope: "team" | "org";
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={28} /> Analytics
        </h1>
        <p className="text-slate-600 mt-1">
          {scope === "team" ? "Team-level insights" : "Organization-wide insights"} • {cycleName}
        </p>
      </div>

      {/* Row 1: QoQ Trend + Status */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" /> Quarter-on-Quarter Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={qoqData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={3} name="Avg Score %" />
              <Line type="monotone" dataKey="goalsTracked" stroke="#10b981" strokeWidth={2} name="Goals Tracked" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieIcon size={18} className="text-purple-600" /> Goal Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {statusData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Thrust Areas + UoM */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Goal Distribution by Thrust Area
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={thrustData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis type="category" dataKey="name" stroke="#64748b" width={140} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">UoM Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={uomData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={(entry) => `${entry.value}`}
              >
                {uomData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Department Heatmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
        <h3 className="font-semibold text-slate-900 mb-4">
          Department Completion Heatmap
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deptData.map((d) => (
            <div
              key={d.name}
              className="p-4 rounded-lg border border-slate-200"
              style={{
                background: `linear-gradient(135deg, rgba(59,130,246,${d.completion / 100}) 0%, rgba(16,185,129,${d.completion / 150}) 100%)`,
              }}
            >
              <p className="text-xs text-slate-700 font-medium">{d.name}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{d.completion}%</p>
              <p className="text-xs text-slate-600 mt-1">{d.total} goals</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Manager Effectiveness (Admin only) */}
      {scope === "org" && managerData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UsersIcon size={18} className="text-green-600" /> Manager Effectiveness
            (Check-ins Completed)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={managerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}