"use client";

import { useState, useTransition } from "react";
import SharedGoalsTab from "./SharedGoalsTab";
import {
  Settings, Users, Unlock, Calendar, CheckCircle2, AlertCircle, Play, Share2,
} from "lucide-react";
import {
  updateCyclePhase, activateCycle, unlockGoal, createCycle,
} from "./actions";
import EscalationTab from "./EscalationTab";

type Cycle = {
  id: string;
  name: string;
  phase: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: { name: string } | null;
  _count: { goals: number };
};

type LockedGoal = {
  id: string;
  title: string;
  user: { name: string };
  thrustArea: { name: string };
};

const PHASES = ["GOAL_SETTING", "Q1_CHECKIN", "Q2_CHECKIN", "Q3_CHECKIN", "Q4_ANNUAL"];

export default function AdminClient({
  cycles, users, lockedGoals: initialLocked, escalationLogs, userMap,
  employees, thrustAreas,
}: {
  cycles: Cycle[];
  users: User[];
  lockedGoals: LockedGoal[];
  escalationLogs: any[];
  userMap: Record<string, string>;
  employees: any[];
  thrustAreas: any[];
}) {
  const [tab, setTab] = useState<"cycles" | "users" | "unlock" | "escalation" | "shared">("cycles");
  const [lockedGoals, setLockedGoals] = useState(initialLocked);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showNewCycle, setShowNewCycle] = useState(false);

  function showMsg(t: "success" | "error", text: string) {
    setMsg({ type: t, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handlePhaseChange(cycleId: string, phase: string) {
    startTransition(async () => {
      const r = await updateCyclePhase(cycleId, phase);
      if (r.success) showMsg("success", `Phase updated to ${phase.replace("_", " ")}`);
      else showMsg("error", r.error || "Failed");
    });
  }

  async function handleActivate(cycleId: string) {
    startTransition(async () => {
      const r = await activateCycle(cycleId);
      if (r.success) showMsg("success", "Cycle activated");
      else showMsg("error", r.error || "Failed");
    });
  }

  async function handleUnlock(goalId: string) {
    startTransition(async () => {
      const r = await unlockGoal(goalId);
      if (r.success) {
        setLockedGoals(lockedGoals.filter((g) => g.id !== goalId));
        showMsg("success", "Goal unlocked — employee can now edit");
      } else showMsg("error", r.error || "Failed");
    });
  }

  async function handleNewCycle(formData: FormData) {
    startTransition(async () => {
      const r = await createCycle(formData);
      if (r.success) {
        showMsg("success", "Cycle created");
        setShowNewCycle(false);
      } else showMsg("error", r.error || "Failed");
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={28} /> Admin Panel
        </h1>
        <p className="text-slate-600 mt-1">Manage cycles, users, and exceptions</p>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-white p-1 border border-slate-200 rounded-lg w-fit flex-wrap">
        <button onClick={() => setTab("cycles")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${tab === "cycles" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          <Calendar size={14} /> Cycles
        </button>
        <button onClick={() => setTab("users")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${tab === "users" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          <Users size={14} /> Users
        </button>
        <button onClick={() => setTab("unlock")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${tab === "unlock" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          <Unlock size={14} /> Unlock Goals ({lockedGoals.length})
        </button>
        <button onClick={() => setTab("escalation")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${tab === "escalation" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          <AlertCircle size={14} /> Escalations
        </button>
        <button onClick={() => setTab("shared")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${tab === "shared" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          <Share2 size={14} /> Shared KPIs
        </button>
      </div>

      {tab === "cycles" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowNewCycle(!showNewCycle)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              + New Cycle
            </button>
          </div>

          {showNewCycle && (
            <form action={handleNewCycle} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-4 space-y-3">
              <h3 className="font-semibold">Create New Cycle</h3>
              <input name="name" required placeholder="e.g., FY 2026-27" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600">Start Date</label>
                  <input name="startDate" type="date" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600">End Date</label>
                  <input name="endDate" type="date" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Create
              </button>
            </form>
          )}

          <div className="space-y-3">
            {cycles.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      {c.name}
                      {c.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(c.startDate).toISOString().split("T")[0]} → {new Date(c.endDate).toISOString().split("T")[0]}
                    </p>
                  </div>
                  {!c.isActive && (
                    <button onClick={() => handleActivate(c.id)} disabled={isPending} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs">
                      <Play size={12} /> Activate
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-600">Current Phase</label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PHASES.map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePhaseChange(c.id, p)}
                        disabled={isPending}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          c.phase === p ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {p.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Dept</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Goals</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      u.role === "MANAGER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.department}</td>
                  <td className="px-4 py-3 text-slate-600">{u.manager?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{u._count.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "unlock" && (
        <div className="space-y-3">
          {lockedGoals.length === 0 && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
              <p className="text-slate-500">No locked goals.</p>
            </div>
          )}
          {lockedGoals.map((g) => (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{g.thrustArea.name}</span>
                <h3 className="font-semibold text-slate-900 mt-1">{g.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Owner: {g.user.name}</p>
              </div>
              <button onClick={() => handleUnlock(g.id)} disabled={isPending} className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200">
                <Unlock size={14} /> Unlock
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "escalation" && (
        <EscalationTab initialLogs={escalationLogs} userMap={userMap} />
      )}

      {tab === "shared" && (
        <SharedGoalsTab
          employees={employees}
          thrustAreas={thrustAreas}
          primaryOwnerOptions={employees}
        />
      )}
    </div>
  );
}