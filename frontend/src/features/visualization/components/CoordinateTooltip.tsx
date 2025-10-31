import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Typography } from '../../../components/ui';
import TahoeGlass from '../../../components/ui/TahoeGlass';

type CoordinateUnit = 'mm' | 'cm' | 'm';

type CoordinateTooltipProps = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly onClose: () => void;
};

export const CoordinateTooltip: React.FC<CoordinateTooltipProps> = ({
  x,
  y,
  z,
  screenX,
  screenY,
  onClose,
}) => {
  const [unit, setUnit] = useState<CoordinateUnit>('mm');
  const tooltipRef = useRef<HTMLDialogElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState({
    left: screenX,
    top: screenY,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle drag start - check if we should drag or not
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tooltipRef.current) return;

    // Don't drag if clicking on interactive elements (buttons or coordinate area)
    const target = e.target as HTMLElement;
    if (
      target.closest('button[aria-label="Close coordinates"]') ||
      target.closest('button[aria-label*="Select"]') ||
      target.closest('[aria-label="Coordinate values - click to select and copy"]')
    ) {
      return;
    }

    // Prevent default behavior and start dragging
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    const rect = tooltipRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Handle keyboard drag (for accessibility)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!tooltipRef.current) return;

      // Don't handle keyboard events if focus is on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button[aria-label="Close coordinates"]') ||
        target.closest('button[aria-label*="Select"]') ||
        target.closest('[aria-label="Coordinate values - click to select and copy"]')
      ) {
        return;
      }

      const step = 10; // pixels to move per key press
      let newLeft = adjustedPosition.left;
      let newTop = adjustedPosition.top;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newLeft = Math.max(0, adjustedPosition.left - step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newLeft = Math.min(window.innerWidth - 200, adjustedPosition.left + step);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newTop = Math.max(0, adjustedPosition.top - step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newTop = Math.min(window.innerHeight - 200, adjustedPosition.top + step);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Focus the first interactive element
          {
            const firstButton = tooltipRef.current.querySelector('button');
            if (firstButton) {
              firstButton.focus();
            }
          }
          break;
        default:
          return;
      }

      setAdjustedPosition({ left: newLeft, top: newTop });
    },
    [adjustedPosition]
  );

  // Handle drag move - update DOM directly for smooth dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !tooltipRef.current) return;

      e.preventDefault();
      const newLeft = e.clientX - dragOffset.x;
      const newTop = e.clientY - dragOffset.y;

      // Update DOM directly for smooth dragging without React re-renders
      tooltipRef.current.style.left = `${newLeft}px`;
      tooltipRef.current.style.top = `${newTop}px`;
    },
    [isDragging, dragOffset]
  );

  // Handle drag end - sync final position to state
  const handleMouseUp = useCallback(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setAdjustedPosition({ left: rect.left, top: rect.top });
    }
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Convert from meters to target unit
  const convertCoordinate = (value: number, targetUnit: CoordinateUnit) => {
    const mm = value * 1000; // Convert from meters to mm
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

  const formatCoordinate = (value: number, targetUnit: CoordinateUnit) => {
    const converted = convertCoordinate(value, targetUnit);
    return converted.toFixed(3);
  };

  // Adjust position to keep tooltip within viewport
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const offset = 10; // Offset from click position

    let left = screenX + offset;
    let top = screenY - offset;

    // Check right boundary
    if (left + tooltipRect.width > viewportWidth) {
      left = screenX - tooltipRect.width - offset;
    }

    // Check left boundary
    if (left < 0) {
      left = offset;
    }

    // Check bottom boundary
    if (top + tooltipRect.height > viewportHeight) {
      top = screenY - tooltipRect.height - offset;
    }

    // Check top boundary
    if (top < 0) {
      top = offset;
    }

    setAdjustedPosition({ left, top });
  }, [screenX, screenY]);

  return (
    <dialog
      ref={tooltipRef}
      className={`fixed z-50 outline-none focus:outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${adjustedPosition.left}px`,
        top: `${adjustedPosition.top}px`,
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'transparent',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      aria-label="Coordinate information panel"
      aria-modal="false"
    >
      <div
        className="w-full h-full bg-transparent border-none p-0 relative group cursor-grab active:cursor-grabbing outline-none focus:outline-none"
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        role="button" // NOSONAR typescript:S6819
        tabIndex={0}
        aria-label="Drag coordinate panel"
      >
        <TahoeGlass className="min-w-[160px] shadow-2xl" size="md">
          <div className="flex flex-col gap-2">
            {/* Header with close button - not selectable */}
            <div className="flex items-center justify-between select-none">
              <Typography variant="label" className="font-semibold text-gray-800">
                Coordinates
              </Typography>
              <button
                onClick={onClose}
                onMouseDown={e => e.stopPropagation()}
                className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-white/30"
                aria-label="Close coordinates"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Unit selector - not selectable */}
            <div className="flex bg-white/3 border border-white/8 rounded-full p-1 shadow-lg gap-1 select-none">
              {(['mm', 'cm', 'm'] as const).map(unitOption => (
                <button
                  key={unitOption}
                  onClick={() => setUnit(unitOption)}
                  onMouseDown={e => e.stopPropagation()}
                  className={`relative flex-1 h-6 px-2 flex items-center justify-center text-xs font-medium rounded-full transition-colors duration-200 border-2 ${
                    unit === unitOption
                      ? 'bg-blue-500/20 text-gray-900 border-blue-400/30'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/20 border-transparent'
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

            {/* Coordinate values - highlightable div for easy selection */}
            <div
              className="w-full bg-white/2 border border-white/5 rounded-lg p-2 select-text cursor-text hover:bg-white/4 transition-colors outline-none focus:outline-none"
              title="Click to select all coordinates"
              onMouseDown={e => e.stopPropagation()}
              role="textbox" // NOSONAR typescript:S6819
              tabIndex={0}
              aria-label="Coordinate values - click to select and copy"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <Typography
                    variant="body"
                    className="text-sm text-gray-700 font-medium select-none"
                  >
                    X:
                  </Typography>
                  <span className="text-sm text-gray-900 font-mono select-text">
                    {formatCoordinate(x, unit)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Typography
                    variant="body"
                    className="text-sm text-gray-700 font-medium select-none"
                  >
                    Y:
                  </Typography>
                  <span className="text-sm text-gray-900 font-mono select-text">
                    {formatCoordinate(y, unit)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <Typography
                    variant="body"
                    className="text-sm text-gray-700 font-medium select-none"
                  >
                    Z:
                  </Typography>
                  <span className="text-sm text-gray-900 font-mono select-text">
                    {formatCoordinate(z, unit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TahoeGlass>
      </div>
    </dialog>
  );
};
