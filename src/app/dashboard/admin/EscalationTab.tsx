"use client";

import { useState, useTransition } from "react";
import { Zap, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { runEscalationCheck, getEscalationLogs } from "./actions";

type EscalationLog = {
  id: string;
  employeeId: string;
  managerId: string | null;
  reason: string;
  level: number;
  resolved: boolean;
  createdAt: Date;
};

export default function EscalationTab({
  initialLogs,
  userMap,
}: {
  initialLogs: EscalationLog[];
  userMap: Record<string, string>;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function handleRun() {
    startTransition(async () => {
      const r = await runEscalationCheck();
      if (r.success) {
        setLogs(r.logs as EscalationLog[]);
        setMsg(`✅ Escalation check completed. ${r.newCount} new escalation(s) generated.`);
        setTimeout(() => setMsg(null), 4000);
      }
    });
  }

  const levelColors: Record<number, string> = {
    1: "bg-amber-100 text-amber-700 border-amber-200",
    2: "bg-orange-100 text-orange-700 border-orange-200",
    3: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="text-blue-600" size={20} /> Rule-Based Escalation Engine
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Triggers based on: <strong>Goal not submitted</strong> • <strong>Approval pending {">"} 7 days</strong> • <strong>Check-in skipped</strong>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Escalation chain: Employee → Manager → Skip-level / HR
            </p>
          </div>
          <button
            onClick={handleRun}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
          >
            <Zap size={16} /> {isPending ? "Running..." : "Run Escalation Check"}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} /> {msg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">When</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Escalation Chain</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Level</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-700">{log.reason}</td>
                <td className="px-4 py-3 font-medium">{userMap[log.employeeId] || "—"}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-600">
                    Employee <ArrowRight size={12} />
                    {log.level >= 1 && <span>Manager</span>}
                    {log.level >= 2 && <><ArrowRight size={12} /><span>Skip-Level</span></>}
                    {log.level >= 3 && <><ArrowRight size={12} /><span className="font-semibold text-red-600">HR</span></>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${levelColors[log.level]}`}>
                    L{log.level}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">
                  <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  No escalations. Click "Run Escalation Check" to scan the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}