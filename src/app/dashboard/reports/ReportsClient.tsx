"use client";

import { FileText, Download, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";
import { UOM_LABELS, computeScore } from "@/lib/logic";

type Goal = {
  id: string;
  title: string;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  user: { name: string; email: string; department: string };
  thrustArea: { name: string };
  achievements: {
    quarter: string;
    actual: number | null;
    progressStatus: string;
    score: number | null;
  }[];
};

type Completion = {
  id: string;
  name: string;
  role: string;
  department: string;
  totalGoals: number;
  completion: Record<string, number>;
};

export default function ReportsClient({
  goals,
  completionData,
  cycleName,
}: {
  goals: Goal[];
  completionData: Completion[];
  cycleName: string;
}) {
  function exportAchievementReport() {
    const rows = goals.map((g) => {
      const q1 = g.achievements.find((a) => a.quarter === "Q1");
      const q2 = g.achievements.find((a) => a.quarter === "Q2");
      const q3 = g.achievements.find((a) => a.quarter === "Q3");
      const q4 = g.achievements.find((a) => a.quarter === "Q4");

      return {
        Employee: g.user.name,
        Email: g.user.email,
        Department: g.user.department,
        "Thrust Area": g.thrustArea.name,
        Goal: g.title,
        UoM: UOM_LABELS[g.uomType as keyof typeof UOM_LABELS],
        Target: g.target,
        "Weightage (%)": g.weightage,
        Status: g.status,
        "Q1 Actual": q1?.actual ?? "—",
        "Q1 Score (%)": q1?.actual != null ? Math.round(Math.min(computeScore(g.uomType as any, g.target, q1.actual), 100)) : "—",
        "Q2 Actual": q2?.actual ?? "—",
        "Q2 Score (%)": q2?.actual != null ? Math.round(Math.min(computeScore(g.uomType as any, g.target, q2.actual), 100)) : "—",
        "Q3 Actual": q3?.actual ?? "—",
        "Q3 Score (%)": q3?.actual != null ? Math.round(Math.min(computeScore(g.uomType as any, g.target, q3.actual), 100)) : "—",
        "Q4 Actual": q4?.actual ?? "—",
        "Q4 Score (%)": q4?.actual != null ? Math.round(Math.min(computeScore(g.uomType as any, g.target, q4.actual), 100)) : "—",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Achievement Report");
    XLSX.writeFile(wb, `AtomQuest_Achievement_${cycleName.replace(/ /g, "_")}.xlsx`);
  }

  function exportCompletionReport() {
    const rows = completionData.map((u) => ({
      Name: u.name,
      Role: u.role,
      Department: u.department,
      "Total Goals": u.totalGoals,
      "Q1 Completion (%)": u.completion.Q1,
      "Q2 Completion (%)": u.completion.Q2,
      "Q3 Completion (%)": u.completion.Q3,
      "Q4 Completion (%)": u.completion.Q4,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completion Dashboard");
    XLSX.writeFile(wb, `AtomQuest_Completion_${cycleName.replace(/ /g, "_")}.xlsx`);
  }

  function exportCSV() {
    const rows = goals.map((g) => ({
      Employee: g.user.name,
      Goal: g.title,
      Target: g.target,
      Weightage: g.weightage,
      Status: g.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AtomQuest_Goals_${cycleName.replace(/ /g, "_")}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={28} /> Reports
        </h1>
        <p className="text-slate-600 mt-1">
          Export achievement & completion data for {cycleName}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Achievement Report</h3>
          <p className="text-sm text-slate-600 mb-4">
            Planned Target vs Actual Achievement for all employees across all quarters.
          </p>
          <button
            onClick={exportAchievementReport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} /> Download Excel
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="text-green-600" size={24} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Completion Dashboard</h3>
          <p className="text-sm text-slate-600 mb-4">
            Quarterly check-in completion rates per employee & manager.
          </p>
          <button
            onClick={exportCompletionReport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={16} /> Download Excel
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="text-purple-600" size={24} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Goals CSV</h3>
          <p className="text-sm text-slate-600 mb-4">
            Lightweight CSV export of all goals for quick analysis.
          </p>
          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>

      {/* Live Completion Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Completion Dashboard (Live Preview)
        </h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Employee</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-center px-3 py-2">Goals</th>
              <th className="text-center px-3 py-2">Q1</th>
              <th className="text-center px-3 py-2">Q2</th>
              <th className="text-center px-3 py-2">Q3</th>
              <th className="text-center px-3 py-2">Q4</th>
            </tr>
          </thead>
          <tbody>
            {completionData.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2 text-slate-600">{u.role}</td>
                <td className="px-3 py-2 text-center">{u.totalGoals}</td>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <td key={q} className="px-3 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        u.completion[q] === 100
                          ? "bg-green-100 text-green-700"
                          : u.completion[q] > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.completion[q]}%
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}