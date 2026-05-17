import { prisma } from "@/lib/prisma";
import { setCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
  });

  async function loginAs(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    await setCurrentUser(userId);
    redirect("/dashboard");
  }

  const roleIcons: Record<string, React.ReactNode> = {
    ADMIN: <Shield size={24} className="text-purple-600" />,
    MANAGER: <Users size={24} className="text-blue-600" />,
    EMPLOYEE: <Zap size={24} className="text-green-600" />,
  };

  const roleGradients: Record<string, string> = {
    ADMIN: "from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400",
    MANAGER: "from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400",
    EMPLOYEE: "from-green-50 to-green-100 border-green-200 hover:border-green-400",
  };

  const roleDescriptions: Record<string, string> = {
    ADMIN: "Manage cycles, users & escalations",
    MANAGER: "Review & approve team goals",
    EMPLOYEE: "Set goals & track achievements",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              🎯 AtomQuest
            </div>
          </div>
          <p className="text-2xl font-semibold text-white mb-2">
            Goal Setting & Tracking
          </p>
          <p className="text-blue-200 mb-1">
            For Atomberg Hackathon 1.0
          </p>
          <p className="text-sm text-blue-300 italic">
            ✨ Select a role to explore the platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {users.map((user: typeof users[number]) => (
            <form key={user.id} action={loginAs} className="group">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className={`w-full bg-gradient-to-br ${roleGradients[user.role]} border-2 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white/80 rounded-lg group-hover:bg-white transition-colors">
                    {roleIcons[user.role]}
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-600 group-hover:translate-x-1 transition-transform"
                  />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">
                  {user.name}
                </h3>
                <p className="text-xs text-slate-600 font-medium mb-2">
                  {user.role}
                </p>
                <p className="text-sm text-slate-700 mb-1">
                  {roleDescriptions[user.role]}
                </p>
                <p className="text-xs text-slate-500 mt-2">📧 {user.email}</p>
              </button>
            </form>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
          <p className="text-sm text-blue-200">
            💡 <strong>Demo Mode:</strong> No password required. Click any role to explore.
          </p>
        </div>

        <p className="text-center text-xs text-blue-300/60 mt-8 font-medium">
          Built with ❤️ for Atomberg • Vercel Deployment
        </p>
      </div>
    </div>
  );
}