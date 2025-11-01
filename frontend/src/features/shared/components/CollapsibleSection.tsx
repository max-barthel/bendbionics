import React, { useRef } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { Typography } from '@/components/ui';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  icon,
  iconBg,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left hover:bg-gray-50/50 p-2 rounded-full transition-colors"
      >
        <div
          className={`w-6 h-6 ${iconBg} rounded-full flex items-center justify-center`}
        >
          {icon}
        </div>
        <Typography variant="h4" color="primary">
          {title}
        </Typography>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform duration-700 ease-out ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-[2000px]' : 'max-h-0'
        }`}
      >
        <div
          ref={contentRef}
          className={`pl-8 pr-4 pb-8 space-y-4 transition-all duration-300 ease-out ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
