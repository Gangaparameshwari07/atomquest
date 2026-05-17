"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

type Notification = {
  id: string;
  field: string | null;
  newValue: string | null;
  oldValue: string | null;
  action: string;
  timestamp: Date;
};

export default function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const count = notifications.length;

  const typeIcons: Record<string, string> = {
    NOTIFY_GOAL_SUBMITTED: "📝",
    NOTIFY_GOAL_APPROVED: "✅",
    NOTIFY_GOAL_RETURNED: "↩️",
    NOTIFY_CHECKIN_REMINDER: "⏰",
    NOTIFY_SHARED_KPI: "🔗",
    NOTIFY_GOAL_UNLOCKED: "🔓",
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-slate-100 transition">
        <Bell size={20} className="text-slate-600" />
        {count > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-slate-500 text-sm">No notifications yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{typeIcons[n.action] || "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{n.field}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.newValue}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}