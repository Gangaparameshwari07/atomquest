"use client";

import { useState, useTransition } from "react";
import { UOM_LABELS, computeScore } from "@/lib/logic";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Lock,
  MessageSquare, Send,
} from "lucide-react";
import Link from "next/link";
import {
  approveGoals, returnGoals, updateGoalByManager, saveCheckIn,
} from "./actions";

type Achievement = {
  id: string;
  quarter: string;
  actual: number | null;
  progressStatus: string;
  score: number | null;
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  isLocked: boolean;
  thrustArea: { name: string };
  achievements: Achievement[];
};

type CheckIn = {
  id: string;
  quarter: string;
  comment: string;
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function ApprovalClient({
  employee, goals: initialGoals, cycleName,
  checkIns: initialCheckIns, managerId, cycleId,
}: {
  employee: { id: string; name: string; email: string };
  goals: Goal[];
  cycleName: string;
  checkIns: CheckIn[];
  managerId: string;
  cycleId: string;
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns);
  const [activeTab, setActiveTab] = useState<"goals" | "Q1" | "Q2" | "Q3" | "Q4">("goals");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const anySubmitted = goals.some((g) => g.status === "SUBMITTED");
  const allSubmitted = anySubmitted;
  const allApproved = goals.length > 0 && goals.every((g) => g.status === "APPROVED");
  const submittedGoals = goals.filter((g) => g.status === "SUBMITTED");
  const total = goals.reduce((s, g) => s + Number(g.weightage), 0); // Total of ALL goals
  const submittedTotal = submittedGoals.reduce((s, g) => s + Number(g.weightage), 0); // Total of submitted only

  function showMsg(t: "success" | "error", text: string) {
    setMessage({ type: t, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleEdit(goalId: string, field: string, value: string | number) {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)));
  }

  async function handleApprove() {
    if (submittedTotal !== 100) {
      showMsg("error", `Weightage must be 100% (now ${submittedTotal}%)`);
      return;
    }
    if (submittedGoals.some((g) => Number(g.weightage) < 10)) {
      showMsg("error", "Each goal must be ≥10%");
      return;
    }
    startTransition(async () => {
      for (const g of goals) {
        await updateGoalByManager(g.id, {
          weightage: Number(g.weightage),
          target: Number(g.target),
        });
      }
      const result = await approveGoals(employee.id);
      if (result.success) {
        setGoals(goals.map((g) => ({ ...g, status: "APPROVED", isLocked: true })));
        showMsg("success", "Approved & Locked! 🎉");
      } else showMsg("error", result.error || "Failed");
    });
  }

  async function handleReturn() {
    startTransition(async () => {
      const r = await returnGoals(employee.id);
      if (r.success) {
        setGoals(goals.map((g) => ({ ...g, status: "RETURNED" })));
        showMsg("success", "Returned to employee");
      }
    });
  }

  async function handleCheckIn(quarter: string) {
    if (!comment.trim()) {
      showMsg("error", "Comment required");
      return;
    }
    startTransition(async () => {
      const r = await saveCheckIn({
        employeeId: employee.id,
        cycleId,
        quarter,
        comment,
        goalIds: goals.map((g) => g.id),
      });
      if (r.success) {
        setCheckIns([
          ...checkIns.filter((c) => c.quarter !== quarter),
          { id: r.id!, quarter, comment },
        ]);
        setComment("");
        showMsg("success", `${quarter} check-in saved!`);
      } else showMsg("error", r.error || "Failed");
    });
  }

  const existingCheckIn = (q: string) => checkIns.find((c) => c.quarter === q);

  return (
    <div>
      <Link href="/dashboard/team" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-4">
        <ArrowLeft size={16} /> Back to Team
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
          <p className="text-slate-600 mt-1">{employee.email} • {cycleName}</p>
        </div>
        {allApproved && (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
            <Lock size={14} /> Approved & Locked
          </span>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white p-1 border border-slate-200 rounded-lg w-fit">
        <button onClick={() => setActiveTab("goals")} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "goals" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
          Goal Sheet
        </button>
        {allApproved && QUARTERS.map((q) => (
          <button key={q} onClick={() => setActiveTab(q as any)} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === q ? "bg-blue-600 text-white" : "text-slate-600"}`}>
            {q} Check-in {existingCheckIn(q) && "✓"}
          </button>
        ))}
      </div>

      {activeTab === "goals" && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-700">Total Weightage</span>
              <span className={`text-sm font-bold ${total === 100 ? "text-green-600" : "text-red-600"}`}>
                {total}% / 100%
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {goals.map((g, idx) => (
              <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{g.thrustArea.name}</span>
                    <h3 className="font-semibold text-slate-900 mt-2">{idx + 1}. {g.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    g.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    g.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" :
                    g.status === "RETURNED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}>{g.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">UoM</label>
                    <p className="text-sm font-medium">{UOM_LABELS[g.uomType as keyof typeof UOM_LABELS]}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Target</label>
                    <input type="number" value={g.target} onChange={(e) => handleEdit(g.id, "target", e.target.value)} disabled={allApproved} className="w-full text-sm border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Weightage (%)</label>
                    <input type="number" value={g.weightage} onChange={(e) => handleEdit(g.id, "weightage", e.target.value)} disabled={allApproved} className="w-full text-sm border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allSubmitted && !allApproved && (
            <div className="flex gap-3 justify-end">
              <button onClick={handleReturn} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                <XCircle size={16} /> Return for Rework
              </button>
              <button onClick={handleApprove} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle2 size={16} /> Approve & Lock
              </button>
            </div>
          )}
        </>
      )}

      {QUARTERS.includes(activeTab) && (
        <div>
          <div className="space-y-3 mb-6">
            {goals.map((g, idx) => {
              const a = g.achievements.find((x) => x.quarter === activeTab);
              const score = a?.actual != null ? Math.min(computeScore(g.uomType as any, g.target, a.actual), 100) : 0;
              return (
                <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{g.thrustArea.name}</span>
                      <h3 className="font-semibold text-slate-900 mt-2">{idx + 1}. {g.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Weight: {g.weightage}%</p>
                    </div>
                    {a?.actual != null && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Score</p>
                        <p className={`text-2xl font-bold ${score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600"}`}>{Math.round(score)}%</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><label className="text-xs text-slate-500">Planned</label><p className="font-medium">{g.target}</p></div>
                    <div><label className="text-xs text-slate-500">Actual</label><p className="font-medium">{a?.actual ?? "—"}</p></div>
                    <div><label className="text-xs text-slate-500">Status</label><p className="font-medium">{a?.progressStatus?.replace("_", " ") ?? "Not started"}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900">{activeTab} Check-in Comment</h3>
            </div>
            {existingCheckIn(activeTab) ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-slate-700">{existingCheckIn(activeTab)?.comment}</p>
              </div>
            ) : null}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Add structured feedback on planned vs actual performance..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3"
            />
            <button onClick={() => handleCheckIn(activeTab)} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Send size={16} /> {existingCheckIn(activeTab) ? "Update" : "Save"} {activeTab} Check-in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}