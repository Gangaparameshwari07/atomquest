"use client";

import { useState, useTransition } from "react";
import { UOM_LABELS, GOAL_RULES, validateGoalSheet } from "@/lib/logic";
import { Plus, Trash2, Send, Save, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { createGoal, deleteGoal, submitGoals, updateGoal } from "./actions";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  isLocked: boolean;
  isShared: boolean;
  thrustAreaId: string;
  thrustArea: { name: string };
};

type ThrustArea = { id: string; name: string };

export default function GoalSheetClient({
  initialGoals,
  thrustAreas,
  cycleId,
  cycleName,
  cyclePhase,
}: {
  initialGoals: Goal[];
  thrustAreas: ThrustArea[];
  cycleId: string;
  cycleName: string;
  cyclePhase: string;
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  const validation = validateGoalSheet(goals);
  const allLocked = goals.length > 0 && goals.every((g) => g.isLocked);
  const anySubmitted = goals.some((g) => g.status === "SUBMITTED");
  const anyReturned = goals.some((g) => g.status === "RETURNED");
  const isReadOnly = allLocked || (anySubmitted && !anyReturned) || cyclePhase !== "GOAL_SETTING";

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleAddGoal(formData: FormData) {
    startTransition(async () => {
      const result = await createGoal(formData);
      if (result.success && result.goal) {
        setGoals([...goals, result.goal as any]);
        setShowForm(false);
        showMessage("success", "Goal added!");
      } else {
        showMessage("error", result.error || "Failed");
      }
    });
  }

  async function handleDelete(goalId: string) {
    startTransition(async () => {
      const result = await deleteGoal(goalId);
      if (result.success) {
        setGoals(goals.filter((g) => g.id !== goalId));
        showMessage("success", "Goal deleted");
      } else {
        showMessage("error", result.error || "Failed");
      }
    });
  }

  async function handleUpdate(goalId: string, field: string, value: string | number) {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)));
  }

  async function handleSaveAll() {
    startTransition(async () => {
      for (const g of goals) {
        await updateGoal(g.id, { weightage: Number(g.weightage), target: Number(g.target) });
      }
      showMessage("success", "All goals saved!");
    });
  }

  async function handleSubmit() {
    if (!validation.valid) {
      showMessage("error", validation.errors[0]);
      return;
    }
    startTransition(async () => {
      const result = await submitGoals(cycleId);
      if (result.success) {
        setGoals(goals.map((g) => ({ ...g, status: "SUBMITTED" })));
        showMessage("success", "Submitted for approval! 🎉");
      } else {
        showMessage("error", result.error || "Failed");
      }
    });
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Goal Sheet</h1>
          <p className="text-slate-600 mt-1">
            Cycle: {cycleName} • Phase: {cyclePhase.replace("_", " ")}
          </p>
        </div>
        {allLocked && (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
            <Lock size={14} /> Locked (Approved)
          </span>
        )}
        {anySubmitted && !allLocked && (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm">
            Pending Manager Approval
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

      {/* Locked goals banner */}
      {allLocked && (
        <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-slate-100 border border-slate-300 text-slate-800">
          <Lock size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">🔒 Your Goal Sheet is Locked</p>
            <p className="text-sm mt-1">
              Your goals are approved and locked for this cycle. To make changes, request your Admin/HR to unlock specific goals. New goals can be added in the next cycle.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Total Weightage ({goals.length}/{GOAL_RULES.MAX_GOALS} goals)
          </span>
          <span className={`text-sm font-bold ${
            totalWeightage === 100 ? "text-green-600" : totalWeightage > 100 ? "text-red-600" : "text-amber-600"
          }`}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              totalWeightage === 100 ? "bg-green-500" : totalWeightage > 100 ? "bg-red-500" : "bg-amber-500"
            }`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          ></div>
        </div>
        {!validation.valid && goals.length > 0 && (
          <div className="mt-3 text-xs text-red-600 space-y-1">
            {validation.errors.map((e, i) => (
              <p key={i}>• {e}</p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {goals.map((g, idx) => (
          <div key={g.id} className={`bg-white border rounded-xl p-5 ${g.isShared ? "border-purple-300 bg-gradient-to-r from-purple-50/30 to-white" : "border-slate-200"}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {g.thrustArea.name}
                  </span>
                  {g.isShared && (
                    <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full font-medium" title="Shared KPI — Title & Target locked. You can adjust your own weightage.">
                      🔗 Shared KPI
                    </span>
                  )}
                  {g.isLocked && <Lock size={12} className="text-slate-400" />}
                </div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {idx + 1}. {g.title}
                  {g.isShared && <span className="text-purple-600 text-xs" title="Title locked by Admin">🔒</span>}
                </h3>
                {g.description && (
                  <p className="text-sm text-slate-600 mt-1">{g.description}</p>
                )}
                {g.isShared && (
                  <p className="text-xs text-purple-600 mt-1 italic">
                    💡 This is a shared departmental KPI. Achievement syncs from Primary Owner.
                  </p>
                )}
              </div>
              {!isReadOnly && !g.isShared && (
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded"
                  disabled={isPending}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">UoM</label>
                <p className="text-sm font-medium text-slate-700">
                  {UOM_LABELS[g.uomType as keyof typeof UOM_LABELS]}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 flex items-center gap-1">
                  Target {g.isShared && <span className="text-purple-600">🔒</span>}
                </label>
                <input
                  type="number"
                  value={g.target}
                  onChange={(e) => handleUpdate(g.id, "target", e.target.value)}
                  disabled={g.isLocked || g.isShared || (isReadOnly && !g.isShared)}
                  className="w-full text-sm font-medium text-slate-900 border border-slate-200 rounded px-2 py-1 disabled:bg-slate-100 disabled:text-slate-700 disabled:opacity-100"
                />
                {g.isShared && <p className="text-[10px] text-purple-600 mt-0.5">Locked by Admin</p>}
              </div>
              <div>
                <label className="text-xs text-slate-500">Weightage (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={g.weightage}
                  onChange={(e) => handleUpdate(g.id, "weightage", e.target.value)}
                  disabled={g.isLocked || (isReadOnly && !g.isShared)}
                  className="w-full text-sm font-medium text-slate-900 border border-slate-200 rounded px-2 py-1 disabled:bg-slate-100 disabled:text-slate-700 disabled:opacity-100"
                />
                {g.isShared && <p className="text-[10px] text-purple-600 mt-0.5">You can edit this</p>}
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-500">No goals yet. Click "Add Goal" to start.</p>
          </div>
        )}
      </div>

      {showForm && !isReadOnly && (
        <form action={handleAddGoal} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6 space-y-3">
          <input type="hidden" name="cycleId" value={cycleId} />
          <h3 className="font-semibold text-slate-900">Add New Goal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600">Thrust Area</label>
              <select name="thrustAreaId" required className="w-full text-slate-900 border border-slate-300 rounded px-2 py-1.5 text-sm">
                {thrustAreas.map((ta) => (
                  <option key={ta.id} value={ta.id}>{ta.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600">UoM Type</label>
              <select name="uomType" required className="w-full text-slate-900 border border-slate-300 rounded px-2 py-1.5 text-sm">
                {Object.entries(UOM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600">Goal Title</label>
            <input name="title" required className="w-full text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded px-2 py-1.5 text-sm" placeholder="e.g., Achieve ₹50L sales" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Description (optional)</label>
            <textarea name="description" rows={2} className="w-full text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600">Target</label>
              <input name="target" type="number" required step="any" className="w-full text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Weightage (%)</label>
              <input name="weightage" type="number" required min={10} max={100} className="w-full text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {isPending ? "Adding..." : "Add Goal"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!isReadOnly && (
        <div className="flex gap-3">
          {!showForm && goals.length < GOAL_RULES.MAX_GOALS && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
              <Plus size={16} /> Add Goal
            </button>
          )}
          {goals.length > 0 && (
            <>
              <button onClick={handleSaveAll} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                <Save size={16} /> Save Changes
              </button>
              <button onClick={handleSubmit} disabled={isPending || !validation.valid} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed ml-auto">
                <Send size={16} /> Submit for Approval
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}