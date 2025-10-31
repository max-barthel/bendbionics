import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from '../../../components/ui';
import { getTendonColorClasses } from '../../../utils/tendonColors';

// Constants for dynamic height calculations
const HEIGHT_CONSTANTS = {
  TENDON_CARD_HEIGHT: 80,
  PADDING: 100,
  MIN_HEIGHT: 200,
  MAX_HEIGHT: 800,
} as const;

type TendonResultsPanelProps = {
  tendonAnalysis?: {
    actuation_commands: Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >;
    coupling_data?: {
      positions: number[][];
      orientations: number[][][];
    };
    tendon_analysis?: {
      routing_points: number[][][];
      segment_lengths: number[][];
      total_lengths: number[][];
      length_changes: number[][];
      segment_length_changes: number[][];
    };
  };
  isVisible: boolean;
  onToggle: () => void;
};

type LengthUnit = 'mm' | 'cm' | 'm';

export const TendonResultsPanel: React.FC<TendonResultsPanelProps> = ({
  tendonAnalysis,
  isVisible,
  onToggle,
}) => {
  const [unit, setUnit] = useState<LengthUnit>('mm');
  const [panelWidth, setPanelWidth] = useState(384); // Default width (w-96 = 384px)
  const [isResizing, setIsResizing] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [optimalWidth, setOptimalWidth] = useState(384); // Width where no scroll is needed
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isAutoAdjustingRef = useRef(false);
  const lastTendonCountRef = useRef(0);
  const lastSegmentCountRef = useRef(0);

  const convertLength = (length: number, targetUnit: LengthUnit) => {
    const mm = length * 1000; // Convert from meters to mm
    switch (targetUnit) {
      case 'mm':
        return mm;
      case 'cm':
        return mm / 10;
      case 'm':
        return mm / 1000;
      default:
        return mm;
    }
  };

  const formatLength = (length: number, targetUnit: LengthUnit) => {
    const converted = convertLength(length, targetUnit);
    return converted.toFixed(2);
  };

  const formatLengthChange = (change: number, targetUnit: LengthUnit) => {
    const converted = convertLength(change, targetUnit);
    const sign = converted >= 0 ? '+' : '';
    return `${sign}${converted.toFixed(2)}`;
  };

  // Simple scroll check without debouncing to avoid infinite loops
  const checkHorizontalScroll = useCallback(() => {
    if (!contentRef.current) return;

    // Skip updates during auto-adjustment to prevent feedback loops
    if (isAutoAdjustingRef.current) return;

    const table = contentRef.current.querySelector('table');
    const tableContainer = contentRef.current.querySelector('.overflow-x-auto');

    // Check multiple elements for horizontal scroll
    const contentHasScroll =
      contentRef.current.scrollWidth > contentRef.current.clientWidth;
    const tableHasScroll = table && table.scrollWidth > table.clientWidth;
    const containerHasScroll =
      tableContainer && tableContainer.scrollWidth > tableContainer.clientWidth;

    const hasScroll = contentHasScroll || tableHasScroll || containerHasScroll;

    // Only update state if values actually changed to prevent unnecessary re-renders
    const newHasScroll = Boolean(hasScroll);
    setHasHorizontalScroll(prev => (prev === newHasScroll ? prev : newHasScroll));

    // Calculate optimal width
    const contentScrollWidth = contentRef.current.scrollWidth;
    const tableScrollWidth = table?.scrollWidth || 0;
    const containerScrollWidth = tableContainer?.scrollWidth || 0;

    const maxScrollWidth = Math.max(
      contentScrollWidth,
      tableScrollWidth,
      containerScrollWidth
    );

    const padding = 48; // Account for panel padding and borders
    const newOptimalWidth = Math.max(maxScrollWidth + padding, 360);

    // Only update if width actually changed
    setOptimalWidth(prev => (prev === newOptimalWidth ? prev : newOptimalWidth));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Always allow resizing when the handle is visible
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 360;
      // Use optimal width as max, but don't exceed 80% of screen width
      const maxWidth = Math.min(optimalWidth, window.innerWidth * 0.8);

      // Always allow resizing within bounds
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        // Update DOM directly for smooth resizing without React re-renders
        panelRef.current.style.width = `${newWidth}px`;
        // Don't check scroll during resize - only at the end
      }
    },
    [isResizing, optimalWidth]
  );

  const handleMouseUp = useCallback(() => {
    // Sync final width to state when resizing ends
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelWidth(rect.width);
      // Check scroll after resize ends
      checkHorizontalScroll();
    }
    setIsResizing(false);
  }, [checkHorizontalScroll]);

  // Check for horizontal scroll on mount and when tendon analysis changes
  useEffect(() => {
    if (tendonAnalysis && isVisible) {
      // Use setTimeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        checkHorizontalScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tendonAnalysis, isVisible, checkHorizontalScroll]);

  // Add ResizeObserver to detect when table content changes
  useEffect(() => {
    if (!contentRef.current || !isVisible) return;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      checkHorizontalScroll();
    });

    // Observe the content container and any tables
    resizeObserverRef.current.observe(contentRef.current);
    const table = contentRef.current.querySelector('table');
    if (table) {
      resizeObserverRef.current.observe(table);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [checkHorizontalScroll, isVisible]);

  // Check on window resize
  useEffect(() => {
    const handleResize = () => {
      checkHorizontalScroll();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkHorizontalScroll]);

  // Calculate current tendon and segment counts
  const currentTendonCount =
    tendonAnalysis?.tendon_analysis?.segment_length_changes?.length ?? 0;
  const currentSegmentCount = tendonAnalysis?.tendon_analysis?.segment_length_changes[0]
    ?.length
    ? tendonAnalysis.tendon_analysis.segment_length_changes[0].length - 1
    : 0;

  // Auto-adjust panel width only when tendon/segment counts change (not on every optimalWidth change)
  useEffect(() => {
    if (!isVisible || isResizing || !panelRef.current || !tendonAnalysis) return;

    const tendonCountChanged = currentTendonCount !== lastTendonCountRef.current;
    const segmentCountChanged = currentSegmentCount !== lastSegmentCountRef.current;

    // Only adjust when counts actually change
    if (!tendonCountChanged && !segmentCountChanged) {
      return;
    }

    // Update refs
    lastTendonCountRef.current = currentTendonCount;
    lastSegmentCountRef.current = currentSegmentCount;

    // Wait a bit for DOM to update, then calculate and adjust
    const timer = setTimeout(() => {
      if (!contentRef.current) return;

      // Temporarily enable auto-adjust flag
      isAutoAdjustingRef.current = true;

      // Calculate panel width to match table width exactly
      const table = contentRef.current.querySelector('table');
      if (!table) {
        isAutoAdjustingRef.current = false;
        return;
      }

      // Get the actual rendered width of the table
      const tableWidth = table.getBoundingClientRect().width;

      // Add padding: content div has pl-6 (24px left) + p-4 (16px right) = 40px total horizontal padding
      const contentPadding = 40; // 24px left + 16px right
      const calculatedOptimalWidth = Math.max(tableWidth + contentPadding, 360);

      const minWidth = 360;
      const maxAllowed = Math.min(calculatedOptimalWidth, window.innerWidth * 0.8);
      const clamped = Math.max(minWidth, Math.min(maxAllowed, calculatedOptimalWidth));

      // Always update to match table size (small threshold to avoid infinite loops)
      const difference = Math.abs(panelWidth - clamped);
      if (difference > 2) {
        setPanelWidth(clamped);
      }

      // Clear auto-adjust flag after adjustment settles
      setTimeout(() => {
        isAutoAdjustingRef.current = false;
        // Re-enable scroll checking after adjustment
        checkHorizontalScroll();
      }, 200);
    }, 50);

    return () => clearTimeout(timer);
  }, [
    currentTendonCount,
    currentSegmentCount,
    isVisible,
    isResizing,
    tendonAnalysis,
    panelWidth,
    checkHorizontalScroll,
  ]);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Memoize expensive calculations - always call hooks
  const tendonEntries = useMemo(
    () =>
      tendonAnalysis?.actuation_commands
        ? Object.entries(tendonAnalysis.actuation_commands)
        : [],
    [tendonAnalysis?.actuation_commands]
  );

  const totalTendons = tendonEntries.length;

  // Memoize dynamic height calculation
  const dynamicHeight = useMemo(() => {
    return Math.min(
      Math.max(
        totalTendons * HEIGHT_CONSTANTS.TENDON_CARD_HEIGHT + HEIGHT_CONSTANTS.PADDING,
        HEIGHT_CONSTANTS.MIN_HEIGHT
      ),
      HEIGHT_CONSTANTS.MAX_HEIGHT
    );
  }, [totalTendons]);

  const dynamicHeightClass = useMemo(
    () => `h-[${dynamicHeight}px] max-h-[${dynamicHeight}px]`,
    [dynamicHeight]
  );

  const firstTendonEntry = tendonEntries[0];

  if (!tendonAnalysis?.actuation_commands) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 shadow-2xl hover:bg-white/10 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105"
        aria-label="Show tendon results"
      >
        <svg
          className="w-4 h-4 text-gray-600 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Simple Toggle Button (when folded) */}
      {!isVisible && firstTendonEntry && (
        <button
          onClick={onToggle}
          className="fixed bottom-8 right-42 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 shadow-2xl hover:bg-white/10 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105"
          aria-label="Show tendon results"
        >
          <svg
            className="w-4 h-4 text-gray-600 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {/* Bottom-Right Panel */}
      <div
        className={`fixed bottom-0 transition-all duration-500 ease-in-out z-40 ${
          isVisible
            ? `${dynamicHeightClass} translate-y-0 opacity-100`
            : 'h-0 translate-y-full opacity-0'
        }`}
        style={{
          width: `${panelWidth}px`,
          right: 0,
          willChange: isResizing ? 'width' : 'auto',
        }}
        ref={panelRef}
      >
        <div className="h-full relative bg-white/2 backdrop-blur-sm border border-white/5 rounded-tl-2xl shadow-2xl shadow-black/10">
          {/* Resize Handle - show when panel can be resized */}
          {(hasHorizontalScroll || panelWidth < optimalWidth) && (
            <div className="absolute left-0 top-0 w-1 h-full z-20 group">
              <button
                className="w-full h-full bg-transparent hover:bg-blue-400/30 cursor-col-resize transition-colors duration-200 border-none p-0"
                onMouseDown={handleMouseDown}
                aria-label="Resize panel"
                type="button"
              />
              {/* Visual indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          )}
          <div className="flex flex-col h-full">
            {/* Close Button - positioned over content */}
            {isVisible && (
              <button
                onClick={onToggle}
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 shadow-2xl hover:bg-white/10 hover:shadow-2xl transition-all duration-300 ease-in-out z-10 hover:scale-105"
                aria-label={isVisible ? 'Hide tendon results' : 'Show tendon results'}
              >
                <svg
                  className="w-4 h-4 text-gray-600 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isVisible ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
                  />
                </svg>
              </button>
            )}
            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-4 pl-6 pb-6 min-h-0"
            >
              <div className="space-y-4">
                {/* Unit Selection */}
                <div className="flex items-center justify-between mb-4">
                  <Typography variant="label" color="primary" className="font-semibold">
                    Tendon Length Changes
                  </Typography>
                  <div className="flex bg-white/10 border border-white/20 rounded-full p-1 shadow-lg gap-1">
                    {(['mm', 'cm', 'm'] as const).map(unitOption => (
                      <button
                        key={unitOption}
                        onClick={() => setUnit(unitOption)}
                        className={`relative flex-1 h-7 px-3 flex items-center justify-center text-xs font-medium rounded-full transition-colors duration-200 border-2 ${
                          unit === unitOption
                            ? 'bg-blue-500/30 text-gray-900 border-blue-400/50'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/30 border-transparent'
                        }`}
                        aria-label={`Select ${unitOption} unit`}
                      >
                        {unitOption}
                        {unit === unitOption && (
                          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tendon Length Changes Table */}
                {tendonAnalysis?.tendon_analysis?.segment_length_changes && (
                  <div className="overflow-x-auto flex justify-end">
                    <table className="w-auto border-collapse table-fixed">
                      <thead>
                        <tr>
                          <th className="w-18 px-3 py-2 text-center text-sm font-medium text-gray-700 bg-white/10 border border-white/20 rounded-tl-lg">
                            <span className="text-lg font-bold text-gray-600">Δ</span>
                          </th>
                          {tendonEntries.map(([tendonId]) => {
                            const colorClasses = getTendonColorClasses(tendonId);
                            return (
                              <th
                                key={tendonId}
                                className="w-20 px-3 py-2 text-center text-sm font-medium text-gray-700 bg-white/10 border border-white/20"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${colorClasses.bg} border border-white/30`}
                                  />
                                  T{tendonId}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {tendonAnalysis.tendon_analysis.segment_length_changes[0]
                          ?.slice(1)
                          .map((_, segmentIndex) => {
                            const segmentKey = `segment-${segmentIndex + 1}`;
                            return (
                              <tr key={segmentKey}>
                                <td className="w-16 px-3 py-2 text-sm font-medium text-gray-700 bg-white/10 border border-white/20">
                                  Seg {segmentIndex + 1}
                                </td>
                                {tendonAnalysis.tendon_analysis?.segment_length_changes.map(
                                  (tendonLengths, tendonIndex) => (
                                    <td
                                      key={`tendon-${tendonIndex}-segment-${segmentIndex + 1}`}
                                      className="w-20 px-3 py-2 text-sm text-center text-gray-600 bg-white/5 border border-white/20"
                                    >
                                      {formatLengthChange(
                                        tendonLengths[segmentIndex + 1] ?? 0,
                                        unit
                                      )}
                                    </td>
                                  )
                                )}
                              </tr>
                            );
                          })}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300/60">
                          <td className="w-16 px-3 py-2 text-sm font-bold text-gray-800 bg-white/15 border border-white/20 rounded-bl-lg">
                            Total
                          </td>
                          {tendonEntries.map(([tendonId], tendonIndex) => {
                            // Calculate sum of segments starting from index 1
                            const segmentLengthChanges =
                              tendonAnalysis.tendon_analysis?.segment_length_changes[
                                tendonIndex
                              ];
                            const totalFromSegments = segmentLengthChanges
                              ? segmentLengthChanges
                                  .slice(1)
                                  .reduce((sum, change) => sum + (change ?? 0), 0)
                              : 0;

                            return (
                              <td
                                key={tendonId}
                                className="w-20 px-3 py-2 text-sm font-bold text-center text-gray-800 bg-white/15 border border-white/20"
                              >
                                {formatLength(totalFromSegments, unit)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
