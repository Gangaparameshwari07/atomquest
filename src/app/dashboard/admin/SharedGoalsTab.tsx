"use client";

import { useState, useTransition } from "react";
import { Share2, CheckCircle2, AlertCircle, Users as UsersIcon } from "lucide-react";
import { createSharedGoal } from "./actions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
};

type ThrustArea = { id: string; name: string };

export default function SharedGoalsTab({
  employees,
  thrustAreas,
  primaryOwnerOptions,
}: {
  employees: User[];
  thrustAreas: ThrustArea[];
  primaryOwnerOptions: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  function showMsg(t: "success" | "error", text: string) {
    setMsg({ type: t, text });
    setTimeout(() => setMsg(null), 4000);
  }

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreate(formData: FormData) {
    if (selectedEmployees.length < 2) {
      showMsg("error", "Select at least 2 employees to share a KPI");
      return;
    }
    formData.append("employeeIds", selectedEmployees.join(","));
    startTransition(async () => {
      const r = await createSharedGoal(formData);
      if (r.success) {
        showMsg("success", `🎉 Shared KPI pushed to ${selectedEmployees.length} employees!`);
        setSelectedEmployees([]);
        (document.getElementById("shared-form") as HTMLFormElement)?.reset();
      } else {
        showMsg("error", r.error || "Failed");
      }
    });
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Share2 className="text-purple-600" size={20} /> Push Departmental KPI
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Share a single goal across multiple employees. Recipients can only adjust their <strong>own weightage</strong>. Title & Target stay locked. Achievement syncs from the primary owner.
        </p>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <form id="shared-form" action={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Thrust Area</label>
            <select name="thrustAreaId" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1">
              {thrustAreas.map((ta) => (
                <option key={ta.id} value={ta.id}>{ta.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">UoM Type</label>
            <select name="uomType" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1">
              <option value="NUMERIC_HIGHER_BETTER">Numeric (Higher is Better)</option>
              <option value="NUMERIC_LOWER_BETTER">Numeric (Lower is Better)</option>
              <option value="TIMELINE">Timeline</option>
              <option value="ZERO_BASED">Zero-Based</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">KPI Title (Read-only for recipients)</label>
          <input name="title" required placeholder="e.g., Department Q-Sales Target: ₹2Cr" className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea name="description" rows={2} className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Target (Read-only for recipients)</label>
            <input name="target" type="number" required step="any" className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Default Weightage % (editable per employee)</label>
            <input name="weightage" type="number" required min={10} max={100} defaultValue={20} className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Primary Owner (their achievement syncs to others)</label>
          <select name="primaryOwnerId" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1">
            {primaryOwnerOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
            <UsersIcon size={14} /> Recipients ({selectedEmployees.length} selected)
          </label>
          <div className="mt-2 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
            {employees.map((e) => (
              <label key={e.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selectedEmployees.includes(e.id) ? "bg-blue-50 border border-blue-300" : "hover:bg-slate-50"}`}>
                <input type="checkbox" checked={selectedEmployees.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
                <span>{e.name} <span className="text-xs text-slate-500">({e.department})</span></span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 font-medium">
          <Share2 size={16} /> {isPending ? "Pushing KPI..." : `Push to ${selectedEmployees.length} Employees`}
        </button>
      </form>
    </div>
  );
}