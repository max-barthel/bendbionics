import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const panelRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 360;
      const maxWidth = window.innerWidth * 0.8; // Allow up to 80% of screen width

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

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

  if (!tendonAnalysis?.actuation_commands) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105"
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

  const tendonEntries = Object.entries(tendonAnalysis.actuation_commands);
  const totalTendons = tendonEntries.length;

  // Calculate dynamic height based on number of tendons
  // Each tendon card is ~80px tall, plus padding and close button space
  const dynamicHeight = Math.min(
    Math.max(
      totalTendons * HEIGHT_CONSTANTS.TENDON_CARD_HEIGHT + HEIGHT_CONSTANTS.PADDING,
      HEIGHT_CONSTANTS.MIN_HEIGHT
    ),
    HEIGHT_CONSTANTS.MAX_HEIGHT
  );
  const dynamicHeightClass = `h-[${dynamicHeight}px] max-h-[${dynamicHeight}px]`;

  const firstTendonEntry = tendonEntries[0];

  return (
    <>
      {/* Simple Toggle Button (when folded) */}
      {!isVisible && firstTendonEntry && (
        <button
          onClick={onToggle}
          className="fixed bottom-8 right-42 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105"
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
        }}
        ref={panelRef}
      >
        <div className="h-full relative bg-white/20 backdrop-blur-2xl border border-white/30 rounded-tl-2xl shadow-2xl shadow-black/10">
          {/* Resize Handle */}
          <button
            className="absolute left-0 top-0 w-1 h-full bg-transparent hover:bg-blue-400/30 cursor-col-resize transition-colors duration-200 z-20 border-none p-0"
            onMouseDown={handleMouseDown}
            aria-label="Resize panel"
            type="button"
          />
          <div className="flex flex-col h-full">
            {/* Close Button - positioned over content */}
            {isVisible && (
              <button
                onClick={onToggle}
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out z-10 hover:scale-105"
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
            <div className="flex-1 overflow-y-auto p-4 pl-6 pb-6 min-h-0">
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
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed">
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
