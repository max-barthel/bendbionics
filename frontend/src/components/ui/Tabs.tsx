import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabsProps) {
  return (
    <div
      className={`flex bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-2xl shadow-black/5 gap-1 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative w-24 h-8 flex items-center justify-center flex-1 text-xs font-medium rounded-full transition-all duration-300 ease-out ${
            activeTab === tab.id
              ? "bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-gray-900 shadow-lg border border-blue-400/30 shadow-blue-500/20"
              : "text-gray-600 hover:text-gray-800 hover:bg-white/20"
          }`}
          aria-label={`${tab.label} tab`}
        >
          <div className="flex items-center justify-center gap-1.5">
            {tab.icon && (
              <span className="w-3 h-3 flex-shrink-0">{tab.icon}</span>
            )}
            <span className="text-xs font-medium">{tab.label}</span>
          </div>
          {activeTab === tab.id && (
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({
  id,
  activeTab,
  children,
  className = "",
}: TabPanelProps) {
  const isActive = id === activeTab;

  return (
    <div
      className={`${className} transition-opacity duration-300 ${
        isActive
          ? "opacity-100"
          : "opacity-0 pointer-events-none absolute inset-0"
      }`}
    >
      {children}
    </div>
  );
}
