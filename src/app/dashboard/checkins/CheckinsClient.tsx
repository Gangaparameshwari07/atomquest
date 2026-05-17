"use client";

import { useState, useTransition } from "react";
import { UOM_LABELS, computeScore } from "@/lib/logic";
import { CheckCircle2, AlertCircle, TrendingUp, Save } from "lucide-react";
import { updateAchievement } from "./actions";

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
  uomType: string;
  target: number;
  weightage: number;
  thrustArea: { name: string };
  achievements: Achievement[];
  parentGoalId: string | null;
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const PHASE_TO_QUARTER: Record<string, string> = {
  Q1_CHECKIN: "Q1",
  Q2_CHECKIN: "Q2",
  Q3_CHECKIN: "Q3",
  Q4_ANNUAL: "Q4",
};

export default function CheckinsClient({
  goals,
  cyclePhase,
  cycleName,
}: {
  goals: Goal[];
  cyclePhase: string;
  cycleName: string;
}) {
  const [activeQuarter, setActiveQuarter] = useState<string>(
    PHASE_TO_QUARTER[cyclePhase] || "Q1"
  );
  const [isPending, startTransition] = useTransition();
  const [localData, setLocalData] = useState<
    Record<string, { actual: string; status: string }>
  >(() => {
    const data: Record<string, { actual: string; status: string }> = {};
    goals.forEach((g) => {
      g.achievements.forEach((a) => {
        data[`${g.id}_${a.quarter}`] = {
          actual: a.actual?.toString() || "",
          status: a.progressStatus,
        };
      });
    });
    return data;
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function getKey(goalId: string) {
    return `${goalId}_${activeQuarter}`;
  }

  function getData(goalId: string) {
    return localData[getKey(goalId)] || { actual: "", status: "NOT_STARTED" };
  }

  function updateLocal(goalId: string, field: "actual" | "status", value: string) {
    setLocalData({
      ...localData,
      [getKey(goalId)]: { ...getData(goalId), [field]: value },
    });
  }

  async function handleSave(goalId: string) {
    const d = getData(goalId);
    startTransition(async () => {
      const result = await updateAchievement({
        goalId,
        quarter: activeQuarter,
        actual: d.actual ? Number(d.actual) : null,
        progressStatus: d.status,
      });
      if (result.success) showMsg("success", "Saved!");
      else showMsg("error", result.error || "Failed");
    });
  }

  async function handleSaveAll() {
    startTransition(async () => {
      for (const g of goals) {
        const d = getData(g.id);
        if (d.actual || d.status !== "NOT_STARTED") {
          await updateAchievement({
            goalId: g.id,
            quarter: activeQuarter,
            actual: d.actual ? Number(d.actual) : null,
            progressStatus: d.status,
          });
        }
      }
      showMsg("success", `All ${activeQuarter} achievements saved!`);
    });
  }

  if (goals.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Quarterly Check-ins</h1>
        <p className="text-slate-600 mb-6">Cycle: {cycleName}</p>
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-500">
            No approved goals yet. Get your goals approved by your manager first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Quarterly Check-ins</h1>
        <p className="text-slate-600 mt-1">
          Cycle: {cycleName} • Current Phase: {cyclePhase.replace("_", " ")}
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Quarter Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 border border-slate-200 rounded-lg w-fit">
        {QUARTERS.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQuarter(q)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeQuarter === q
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {goals.map((g, idx) => {
          const d = getData(g.id);
          const actualNum = d.actual ? Number(d.actual) : null;
          const score = actualNum !== null
            ? computeScore(g.uomType as any, g.target, actualNum)
            : 0;

          return (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {g.thrustArea.name}
                  </span>
                  <h3 className="font-semibold text-slate-900 mt-2">
                    {idx + 1}. {g.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {UOM_LABELS[g.uomType as keyof typeof UOM_LABELS]} • Weight: {g.weightage}%
                  </p>
                </div>
                {actualNum !== null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Score</p>
                    <p
                      className={`text-2xl font-bold ${
                        score >= 80
                          ? "text-green-600"
                          : score >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(Math.min(score, 100))}%
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Planned Target</label>
                  <p className="text-sm font-medium text-slate-700 mt-1">{g.target}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">
                    Actual ({activeQuarter})
                  </label>
                  <input
                    type="number"
                    value={d.actual}
                    onChange={(e) => updateLocal(g.id, "actual", e.target.value)}
                    placeholder="Enter actual"
                    disabled={g.parentGoalId !== null}
                    className={`w-full text-sm border border-slate-200 rounded px-2 py-1.5 mt-1 ${
                      g.parentGoalId !== null ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                    }`}
                  />
                  {g.parentGoalId && (
                    <p className="text-xs text-slate-500 mt-1">
                      🔗 Achievement synced from Primary Owner (read-only)
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Status</label>
                  <select
                    value={d.status}
                    onChange={(e) => updateLocal(g.id, "status", e.target.value)}
                    disabled={g.parentGoalId !== null}
                    className={`w-full text-sm border border-slate-200 rounded px-2 py-1.5 mt-1 ${
                      g.parentGoalId !== null ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Save size={16} /> Save All {activeQuarter} Achievements
        </button>
      </div>
    </div>
  );
}