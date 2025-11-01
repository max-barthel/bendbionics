import React from 'react';
import { tabVariants } from '@/styles/design-tokens';
import { combineStyles } from '@/styles/tahoe-utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  readonly tabs: Tab[];
  readonly activeTab: string;
  readonly onTabChange: (tabId: string) => void;
  readonly className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={combineStyles(tabVariants.container, className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={combineStyles(
            activeTab === tab.id ? tabVariants.buttonActive : tabVariants.buttonInactive
          )}
          aria-label={`${tab.label} tab`}
        >
          <div className="flex items-center justify-center gap-1.5">
            {tab.icon && <span className="w-3 h-3 flex-shrink-0">{tab.icon}</span>}
            <span className="text-xs font-medium">{tab.label}</span>
          </div>
          {activeTab === tab.id && (
            <div className={tabVariants.buttonActiveOverlay} />
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  readonly id: string;
  readonly activeTab: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function TabPanel({ id, activeTab, children, className = '' }: TabPanelProps) {
  const isActive = id === activeTab;

  return (
    <div
      className={`${className} transition-all duration-200 ease-in-out ${
        isActive
          ? 'opacity-100 translate-x-0 block'
          : 'opacity-0 translate-x-2 pointer-events-none hidden'
      }`}
    >
      {children}
    </div>
  );
}
