import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import { Typography } from "./ui";

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
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      // Temporarily remove height constraint to measure true content height
      const element = contentRef.current;
      const parent = element.parentElement;

      if (parent) {
        // Store original maxHeight
        const originalMaxHeight = parent.style.maxHeight;
        // Temporarily set to auto to measure
        parent.style.maxHeight = "none";

        // Measure the true height
        const height = element.scrollHeight;

        // Restore original maxHeight
        parent.style.maxHeight = originalMaxHeight;

        // Set the measured height with extra padding for shadows
        setContentHeight(height + 60);
      }
    }
  }, [children]);

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
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden ${isOpen ? "opacity-100" : "opacity-0"}`}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          transition:
            "max-height 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          ref={contentRef}
          className="pl-8 pr-4 pb-8 space-y-4"
          style={{
            transition:
              "transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isOpen ? "translateY(0)" : "translateY(-8px)",
            opacity: isOpen ? 1 : 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
