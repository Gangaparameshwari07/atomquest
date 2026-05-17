import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: true,
      goal: { include: { user: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  const actionColors: Record<string, string> = {
    GOAL_CREATED: "bg-blue-100 text-blue-700",
    GOAL_SUBMITTED: "bg-amber-100 text-amber-700",
    APPROVED_LOCKED: "bg-green-100 text-green-700",
    MANAGER_EDIT: "bg-purple-100 text-purple-700",
    ADMIN_UNLOCKED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert size={28} /> Audit Trail
        </h1>
        <p className="text-slate-600 mt-1">
          Complete log of all goal modifications & system events
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">When</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actor</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Goal</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Field</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Old → New</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium">{log.actor.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${actionColors[log.action] || "bg-slate-100 text-slate-700"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                  {log.goal?.title || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {log.goal?.user.name || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{log.field || "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {log.oldValue && log.newValue
                    ? `${log.oldValue} → ${log.newValue}`
                    : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  No audit logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Showing latest 200 events • {logs.length} total
      </p>
    </div>
  );
}