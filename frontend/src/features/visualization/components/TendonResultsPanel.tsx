import { Button, PanelContainer, Typography } from '@/components/ui';
import { tableCellVariants, unitSelectorVariants } from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import { getTendonColorClasses } from '@/utils/tendonColors';
import { convertFromSI } from '@/utils/unitConversions';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Constants for dynamic height calculations
const HEIGHT_CONSTANTS = {
  TENDON_CARD_HEIGHT: 80,
  PADDING: 100,
  MIN_HEIGHT: 200,
  MAX_HEIGHT_FACTOR: 0.9, // 90% of viewport height
  BOTTOM_MARGIN: 16, // Margin from bottom of viewport to avoid scrollbar
  RIGHT_MARGIN: 16, // Margin from right edge of viewport to avoid scrollbar
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
  const [panelHeight, setPanelHeight] = useState(400); // Default height

  // Keep ref in sync with state
  useEffect(() => {
    currentPanelHeightRef.current = panelHeight;
  }, [panelHeight]);
  const [isResizing, setIsResizing] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [optimalWidth, setOptimalWidth] = useState(384); // Width where no scroll is needed
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isAutoAdjustingRef = useRef(false);
  const isMeasuringHeightRef = useRef(false);
  const currentPanelHeightRef = useRef(400);
  const lastTendonCountRef = useRef(0);
  const lastSegmentCountRef = useRef(0);

  const formatLength = (length: number, targetUnit: LengthUnit) => {
    const converted = convertFromSI(length, targetUnit, 'length');
    return converted.toFixed(2);
  };

  const formatLengthChange = (change: number, targetUnit: LengthUnit) => {
    const converted = convertFromSI(change, targetUnit, 'length');
    const sign = converted >= 0 ? '+' : '';
    return `${sign}${converted.toFixed(2)}`;
  };

  // Measure and update panel height based on table content
  const measureContentHeight = useCallback(() => {
    // Prevent recursive updates
    if (isMeasuringHeightRef.current || !contentRef.current || !isVisible) return;

    isMeasuringHeightRef.current = true;

    // Use requestAnimationFrame to batch DOM reads/writes and prevent loops
    requestAnimationFrame(() => {
      if (!contentRef.current) {
        isMeasuringHeightRef.current = false;
        return;
      }

      // Measure the actual table element instead of the scrollable container
      const table = contentRef.current.querySelector('table');
      if (!table) {
        isMeasuringHeightRef.current = false;
        return;
      }

      // Get the actual rendered height of the table
      const tableHeight = table.getBoundingClientRect().height;

      // Get the unit selector height (the div above the table)
      const unitSelector = contentRef.current.querySelector(
        '.flex.items-center.justify-between'
      );
      const unitSelectorHeight = unitSelector
        ? unitSelector.getBoundingClientRect().height
        : 0;

      // Add padding: content container has p-4 pl-6 pb-6
      // Top padding: 16px (p-4)
      // Bottom padding: 24px (pb-6)
      // Space between unit selector and table: ~16px (space-y-4)
      const topPadding = 16;
      const bottomPadding = 24;
      const spacing = 16;
      const panelContainerPadding = 16; // PanelContainer padding/borders
      const closeButtonSpace = 12; // Space for toggle button

      const calculatedHeight =
        unitSelectorHeight +
        spacing +
        tableHeight +
        topPadding +
        bottomPadding +
        panelContainerPadding +
        closeButtonSpace;

      // Calculate max height based on viewport (90% of window height) minus bottom margin
      const maxHeight =
        window.innerHeight * HEIGHT_CONSTANTS.MAX_HEIGHT_FACTOR -
        HEIGHT_CONSTANTS.BOTTOM_MARGIN;

      // Apply min/max constraints
      const clampedHeight = Math.min(
        Math.max(calculatedHeight, HEIGHT_CONSTANTS.MIN_HEIGHT),
        maxHeight
      );

      // Only update if height changed significantly (threshold to prevent loops)
      const heightDifference = Math.abs(currentPanelHeightRef.current - clampedHeight);
      if (heightDifference > 2) {
        currentPanelHeightRef.current = clampedHeight;
        setPanelHeight(clampedHeight);
      }

      isMeasuringHeightRef.current = false;
    });
  }, [isVisible]);

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

      // Account for right margin when calculating width
      const newWidth = window.innerWidth - e.clientX - HEIGHT_CONSTANTS.RIGHT_MARGIN;
      const minWidth = 360;
      // Use optimal width as max, but don't exceed 80% of screen width minus right margin
      const maxWidth = Math.min(
        optimalWidth,
        window.innerWidth * 0.8 - HEIGHT_CONSTANTS.RIGHT_MARGIN
      );

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

  // Check for horizontal scroll and measure height on mount and when tendon analysis changes
  useEffect(() => {
    if (tendonAnalysis && isVisible) {
      // Use setTimeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        checkHorizontalScroll();
        measureContentHeight();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tendonAnalysis, isVisible, checkHorizontalScroll, measureContentHeight]);

  // Add ResizeObserver to detect when table content changes (both width and height)
  useEffect(() => {
    if (!contentRef.current || !isVisible) return;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      checkHorizontalScroll();
      // Also measure height when table size changes
      measureContentHeight();
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
  }, [checkHorizontalScroll, measureContentHeight, isVisible]);

  // Check on window resize (both width and height)
  useEffect(() => {
    const handleResize = () => {
      checkHorizontalScroll();
      measureContentHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkHorizontalScroll, measureContentHeight]);

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
      const maxAllowed = Math.min(
        calculatedOptimalWidth,
        window.innerWidth * 0.8 - HEIGHT_CONSTANTS.RIGHT_MARGIN
      );
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

  // Measure height when content structure changes (tendon/segment counts)
  useEffect(() => {
    if (!contentRef.current || !isVisible || !tendonAnalysis) return;

    // Update refs when counts change
    const tendonCountChanged = currentTendonCount !== lastTendonCountRef.current;
    const segmentCountChanged = currentSegmentCount !== lastSegmentCountRef.current;

    if (tendonCountChanged || segmentCountChanged) {
      lastTendonCountRef.current = currentTendonCount;
      lastSegmentCountRef.current = currentSegmentCount;
    }

    // Measure after DOM updates when structure changes
    const timer = setTimeout(() => {
      measureContentHeight();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [
    tendonAnalysis,
    isVisible,
    currentTendonCount,
    currentSegmentCount,
    measureContentHeight,
  ]);

  const firstTendonEntry = tendonEntries[0];

  if (!tendonAnalysis?.actuation_commands) {
    return (
      <Button
        variant="toggle"
        onClick={onToggle}
        className="fixed top-1/2 right-4 transform -translate-y-1/2"
        aria-label="Show tendon results"
        isOpen={false}
        direction="left-right"
      />
    );
  }

  return (
    <>
      {/* Simple Toggle Button (when folded) */}
      {!isVisible && firstTendonEntry && (
        <Button
          variant="toggle"
          onClick={onToggle}
          className="fixed bottom-8 right-42"
          aria-label="Show tendon results"
          isOpen={false}
        />
      )}

      {/* Bottom-Right Panel */}
      <div
        className={cn(
          'fixed bottom-0 transition-all duration-500 ease-in-out z-40',
          isVisible ? 'translate-y-0 opacity-100' : 'h-0 translate-y-full opacity-0'
        )}
        style={{
          width: `${panelWidth}px`,
          height: isVisible ? `${panelHeight}px` : '0',
          maxHeight: isVisible ? `${panelHeight}px` : '0',
          right: `${HEIGHT_CONSTANTS.RIGHT_MARGIN}px`,
          bottom: `${HEIGHT_CONSTANTS.BOTTOM_MARGIN}px`,
          willChange: isResizing ? 'width' : 'auto',
        }}
        ref={panelRef}
      >
        <PanelContainer className="h-full relative">
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
              <Button
                variant="toggle"
                onClick={onToggle}
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                aria-label={isVisible ? 'Hide tendon results' : 'Show tendon results'}
                isOpen={isVisible}
              />
            )}
            {/* Content */}
            <div ref={contentRef} className="flex-1 p-4 pl-6 pb-6 overflow-x-auto">
              <div className="space-y-4">
                {/* Unit Selection */}
                <div className="flex items-center justify-between mb-4">
                  <Typography variant="label" color="primary" className="font-semibold">
                    Tendon Length Changes
                  </Typography>
                  <div className={unitSelectorVariants.container}>
                    {(['mm', 'cm', 'm'] as const).map(unitOption => (
                      <button
                        key={unitOption}
                        onClick={() => setUnit(unitOption)}
                        className={
                          unit === unitOption
                            ? unitSelectorVariants.buttonSelected
                            : unitSelectorVariants.buttonUnselected
                        }
                        aria-label={`Select ${unitOption} unit`}
                      >
                        {unitOption}
                        {unit === unitOption && (
                          <div className={unitSelectorVariants.buttonSelectedOverlay} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tendon Length Changes Table */}
                {tendonAnalysis?.tendon_analysis?.segment_length_changes && (
                  <div className="overflow-x-auto flex justify-end">
                    <table
                      className="border-collapse table-fixed"
                      style={{ width: 'auto' }}
                    >
                      <colgroup>
                        <col style={{ width: '80px' }} />
                        {tendonEntries.map(([tendonId]) => (
                          <col key={`col-${tendonId}`} style={{ width: '90px' }} />
                        ))}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className={cn(tableCellVariants.headerFirst)}>
                            <span className="text-lg font-bold text-gray-600">Δ</span>
                          </th>
                          {tendonEntries.map(([tendonId]) => {
                            const colorClasses = getTendonColorClasses(tendonId);
                            return (
                              <th
                                key={tendonId}
                                className={cn(tableCellVariants.header)}
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
                          ?.map((_, segmentIndex) => {
                            const segmentKey = `segment-${segmentIndex}`;
                            return (
                              <tr key={segmentKey}>
                                <td className={cn(tableCellVariants.bodyFirst)}>
                                  Seg {segmentIndex + 1}
                                </td>
                                {tendonAnalysis.tendon_analysis?.segment_length_changes.map(
                                  (tendonLengths, tendonIndex) => (
                                    <td
                                      key={`tendon-${tendonIndex}-segment-${segmentIndex}`}
                                      className={cn(tableCellVariants.body)}
                                    >
                                      {formatLengthChange(
                                        tendonLengths[segmentIndex] ?? 0,
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
                          <td className={cn(tableCellVariants.bodyFirst)}>Total</td>
                          {tendonEntries.map(([tendonId], tendonIndex) => {
                            // Calculate sum of all segments
                            const segmentLengthChanges =
                              tendonAnalysis.tendon_analysis?.segment_length_changes[
                                tendonIndex
                              ];
                            const totalFromSegments = segmentLengthChanges
                              ? segmentLengthChanges
                                  .reduce((sum, change) => sum + (change ?? 0), 0)
                              : 0;

                            return (
                              <td
                                key={tendonId}
                                className={cn(tableCellVariants.total)}
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
        </PanelContainer>
      </div>
    </>
  );
};
