"use client";

import React from "react";

interface MobileBottomNavProps {
  activeTab: "reminders" | "notifications" | "identity" | "settings";
  onSelectTab: (tab: "reminders" | "notifications" | "identity" | "settings") => void;
  notificationCount?: number;
  isIdentityVerified?: boolean;
}

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
  notificationCount = 0,
  isIdentityVerified = false,
}: MobileBottomNavProps) {
  const tabs = [
    {
      id: "reminders" as const,
      label: "İlaçlarım",
      icon: "💊",
    },
    {
      id: "notifications" as const,
      label: "Bildirimler",
      icon: "🔔",
      badge: notificationCount > 0 ? notificationCount : undefined,
    },
    {
      id: "identity" as const,
      label: "Kimliğim",
      icon: "🆔",
      dot: !isIdentityVerified,
    },
    {
      id: "settings" as const,
      label: "Ayarlar",
      icon: "⚙️",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 md:hidden px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg transition-colors">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl relative transition-all duration-150 ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative text-xl mb-0.5">
                <span>{tab.icon}</span>

                {/* Number Badge */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 bg-primary text-white text-[10px] font-black rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}

                {/* Verification Alert Dot */}
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
                )}
              </div>

              <span className="text-[10px] tracking-tight truncate max-w-[70px]">
                {tab.label}
              </span>

              {isActive && (
                <span className="w-4 h-0.5 bg-primary rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
