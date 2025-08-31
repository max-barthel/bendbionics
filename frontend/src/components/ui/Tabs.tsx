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
    <div className={`border-b border-gray-200/60 ${className}`}>
      <div className="flex w-full overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-0 px-1 py-2 text-xs font-medium border-b-2 transition-all duration-200 flex-1 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            {tab.icon && <span className="w-3 h-3">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
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
  if (id !== activeTab) return null;

  return <div className={`${className}`}>{children}</div>;
}
