import { Typography } from '../../../components/ui';
import { getTendonColorClasses } from '../../../utils/tendonColors';

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
      positions: number[][][];
      orientations: number[][][];
    };
    tendon_analysis?: {
      routing_points: number[][][];
    };
  };
  isVisible: boolean;
  onToggle: () => void;
};

export const TendonResultsPanel: React.FC<TendonResultsPanelProps> = ({
  tendonAnalysis,
  isVisible,
  onToggle,
}) => {
  const formatLengthChange = (change: number) => {
    const mm = change * 1000; // Convert to mm
    const sign = change > 0 ? '+' : '';
    return `${sign}${mm.toFixed(2)} mm`;
  };

  const getPullDirectionIcon = (lengthChange: number) => {
    if (lengthChange < 0) {
      // Pull (negative) - downward arrow
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v14m0 0l-4-4m4 4l4-4"
          />
        </svg>
      );
    } else if (lengthChange > 0) {
      // Release (positive) - upward arrow
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19V5m0 0l-4 4m4-4l4 4"
          />
        </svg>
      );
    } else {
      // Hold (zero) - horizontal line
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      );
    }
  };

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
  const dynamicHeight = Math.min(Math.max(totalTendons * 80 + 100, 200), 800);
  const dynamicHeightClass = `h-[${dynamicHeight}px] max-h-[${dynamicHeight}px]`;

  const firstTendonEntry = tendonEntries[0];
  const firstTendonId = firstTendonEntry?.[0];
  const firstTendonData = firstTendonEntry?.[1];
  const firstTendonColorClasses = firstTendonId
    ? getTendonColorClasses(firstTendonId)
    : { bg: 'bg-gray-400' };

  return (
    <>
      {/* First Card as Toggle Button (when folded) */}
      {!isVisible && firstTendonEntry && (
        <div className="fixed bottom-8 right-4 w-80 h-16 z-50">
          {/* Stack effect - background cards */}
          <div className="absolute top-1 left-1 w-full h-full border border-white/15 rounded-2xl bg-white/5 backdrop-blur-xl"></div>
          <div className="absolute top-2 left-2 w-full h-full border border-white/10 rounded-2xl bg-white/3 backdrop-blur-lg"></div>

          {/* Main clickable card */}
          <button
            onClick={onToggle}
            className="relative w-full h-full border border-white/20 rounded-2xl transition-all duration-300 bg-white/10 backdrop-blur-2xl shadow-lg hover:bg-white/15 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] overflow-hidden"
            aria-label="Show tendon results"
          >
            <div className="flex items-center justify-between p-3 h-full">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${firstTendonColorClasses.bg} border border-white/30`}
                  title={`Color identifier for Tendon ${firstTendonId}`}
                />
                <Typography variant="label" color="primary" className="font-semibold">
                  Tendon {firstTendonId}
                </Typography>
              </div>
              <div className="flex-1 flex justify-center">
                <div
                  className={`px-3 py-1 rounded-full backdrop-blur-xl border shadow-lg relative ${
                    firstTendonData.pull_direction.toLowerCase() === 'pull'
                      ? 'border-red-400/30 bg-gradient-to-br from-red-500/25 to-red-600/25 shadow-red-500/20'
                      : firstTendonData.pull_direction.toLowerCase() === 'release'
                        ? 'border-green-400/30 bg-gradient-to-br from-green-500/25 to-green-600/25 shadow-green-500/20'
                        : 'border-white/20 bg-gradient-to-br from-white/15 to-white/5 shadow-black/10'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {formatLengthChange(firstTendonData.length_change_m)}
                  </span>
                  <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getPullDirectionIcon(firstTendonData.length_change_m)}
                <Typography variant="body" color="gray" className="text-sm">
                  {firstTendonData.pull_direction}
                </Typography>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Bottom-Right Panel */}
      <div
        className={`fixed bottom-0 right-0 w-96 transition-all duration-500 ease-in-out z-40 ${
          isVisible
            ? `${dynamicHeightClass} translate-y-0 opacity-100`
            : 'h-0 translate-y-full opacity-0'
        }`}
      >
        <div className="w-96 h-full relative">
          <div className="flex flex-col h-full">
            {/* Close Button - positioned over content */}
            {isVisible && (
              <button
                onClick={onToggle}
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-105 z-10"
                aria-label="Close tendon results"
              >
                <svg
                  className="w-3 h-3 text-gray-600"
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
            )}
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pl-6 pb-0 min-h-0">
              <div className="space-y-4">
                {/* Tendon Details */}
                <div className="space-y-3 pb-4">
                  {tendonEntries.map(([tendonId, data]) => {
                    const colorClasses = getTendonColorClasses(tendonId);

                    return (
                      <div
                        key={tendonId}
                        className="border border-white/20 rounded-2xl transition-all duration-300 bg-white/10 backdrop-blur-2xl shadow-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${colorClasses.bg} border border-white/30`}
                              title={`Color identifier for Tendon ${tendonId}`}
                            />
                            <Typography
                              variant="label"
                              color="primary"
                              className="font-semibold"
                            >
                              Tendon {tendonId}
                            </Typography>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div
                              className={`px-3 py-1 rounded-full backdrop-blur-xl border shadow-lg relative ${
                                data.length_change_m < 0
                                  ? 'border-red-400/30 bg-gradient-to-br from-red-500/25 to-red-600/25 shadow-red-500/20'
                                  : data.length_change_m > 0
                                    ? 'border-green-400/30 bg-gradient-to-br from-green-500/25 to-green-600/25 shadow-green-500/20'
                                    : 'border-yellow-400/30 bg-gradient-to-br from-yellow-500/25 to-yellow-600/25 shadow-yellow-500/20'
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {formatLengthChange(data.length_change_m)}
                              </span>
                              <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Typography variant="body" color="gray" className="text-sm">
                              {data.pull_direction}
                            </Typography>
                            {getPullDirectionIcon(data.length_change_m)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
