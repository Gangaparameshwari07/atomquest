import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight, Clock, CheckCircle2, FileText } from "lucide-react";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });

  const reportees = await prisma.user.findMany({
    where: { managerId: user.id },
    include: {
      goals: {
        where: { cycleId: cycle?.id },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-600 mt-1">
          Review and approve goal sheets for {cycle?.name}
        </p>
      </div>

      <div className="grid gap-3">
        {reportees.map((emp) => {
          const total = emp.goals.length;
          const submitted = emp.goals.filter((g) => g.status === "SUBMITTED").length;
          const approved = emp.goals.filter((g) => g.status === "APPROVED").length;
          const draft = emp.goals.filter((g) => g.status === "DRAFT").length;

          let statusBadge;
          if (approved === total && total > 0) {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={12} /> All Approved
              </span>
            );
          } else if (submitted > 0) {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                <Clock size={12} /> Awaiting Approval
              </span>
            );
          } else if (draft > 0) {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                <FileText size={12} /> In Draft
              </span>
            );
          } else {
            statusBadge = (
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                Not Started
              </span>
            );
          }

          return (
            <Link
              key={emp.id}
              href={`/dashboard/team/${emp.id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{emp.name}</h3>
                  <p className="text-sm text-slate-500">{emp.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Goals: {total} • Submitted: {submitted} • Approved: {approved}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge}
                <ChevronRight className="text-slate-400" />
              </div>
            </Link>
          );
        })}

        {reportees.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
            <Users className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500">No team members assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
}