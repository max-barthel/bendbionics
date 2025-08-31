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
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const tabWidth = 100 / tabs.length;

  return (
    <div className={`border-b border-gray-200/60 h-10 ${className}`}>
      <div className="flex w-full overflow-hidden h-full relative">
        {/* Sliding highlight background using CSS custom properties */}
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b-2 border-blue-500 transition-all duration-300 ease-in-out"
          style={{
            left: `${activeIndex * tabWidth}%`,
            width: `${tabWidth}%`,
          }}
        />

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-0 px-1 py-2 text-xs font-medium border-b-2 border-transparent transition-colors duration-200 flex-1 h-full relative z-10 ${
              activeTab === tab.id
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
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
