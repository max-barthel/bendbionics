import { useState } from "react";
import { Badge, Button, Typography } from "./ui";

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
  const [expandedTendons, setExpandedTendons] = useState<Set<string>>(
    new Set()
  );

  const toggleTendonExpansion = (tendonId: string) => {
    const newExpanded = new Set(expandedTendons);
    if (newExpanded.has(tendonId)) {
      newExpanded.delete(tendonId);
    } else {
      newExpanded.add(tendonId);
    }
    setExpandedTendons(newExpanded);
  };

  const formatLengthChange = (change: number) => {
    const mm = change * 1000; // Convert to mm
    return `${mm.toFixed(2)} mm`;
  };

  const getLengthChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getLengthChangeBadgeVariant = (change: number) => {
    if (change > 0) return "success" as const;
    if (change < 0) return "error" as const;
    return "secondary" as const;
  };

  const getPullDirectionIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case "pull":
        return (
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
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        );
      case "push":
        return (
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
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
        );
      default:
        return (
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
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        );
    }
  };

  if (!tendonAnalysis?.actuation_commands) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          variant="outline"
          onClick={onToggle}
          className="px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:bg-white/30 hover:shadow-2xl transition-all duration-300 rounded-full hover:scale-105"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Show Results
        </Button>
      </div>
    );
  }

  const tendonEntries = Object.entries(tendonAnalysis.actuation_commands);
  const totalTendons = tendonEntries.length;
  const activeTendons = tendonEntries.filter(
    ([, data]) => Math.abs(data.length_change_m) > 0.001
  ).length;

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          variant="outline"
          onClick={onToggle}
          className="px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:bg-white/30 hover:shadow-2xl transition-all duration-300 rounded-full hover:scale-105"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Tendon Results
          <Badge variant="primary" size="sm" className="ml-2">
            {activeTendons}/{totalTendons}
          </Badge>
        </Button>
      </div>

      {/* Results Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-6 left-6 z-50 max-h-[50vh] transition-all duration-500 ease-in-out">
          <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div>
                  <Typography
                    variant="h4"
                    color="primary"
                    className="font-semibold"
                  >
                    Tendon Analysis Results
                  </Typography>
                  <Typography variant="body" color="gray" className="text-sm">
                    Length changes and actuation commands
                  </Typography>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="text-gray-700 hover:text-gray-900 transition-all duration-300 p-1 rounded-lg hover:bg-white/30 backdrop-blur-sm"
                aria-label="Close results panel"
              >
                <svg
                  className="w-5 h-5"
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

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500/25 via-indigo-500/20 to-purple-500/15 border border-blue-400/40 backdrop-blur-md rounded-xl">
                    <div className="text-center">
                      <Typography
                        variant="h5"
                        color="primary"
                        className="font-bold"
                      >
                        {totalTendons}
                      </Typography>
                      <Typography
                        variant="body"
                        color="gray"
                        className="text-sm"
                      >
                        Total Tendons
                      </Typography>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500/25 via-emerald-500/20 to-teal-500/15 border border-green-400/40 backdrop-blur-md rounded-xl">
                    <div className="text-center">
                      <Typography
                        variant="h5"
                        color="primary"
                        className="font-bold"
                      >
                        {activeTendons}
                      </Typography>
                      <Typography
                        variant="body"
                        color="gray"
                        className="text-sm"
                      >
                        Active Tendons
                      </Typography>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-500/25 via-red-500/20 to-pink-500/15 border border-orange-400/40 backdrop-blur-md rounded-xl">
                    <div className="text-center">
                      <Typography
                        variant="h5"
                        color="primary"
                        className="font-bold"
                      >
                        {tendonEntries
                          .reduce(
                            (sum, [, data]) =>
                              sum + Math.abs(data.length_change_m),
                            0
                          )
                          .toFixed(3)}
                      </Typography>
                      <Typography
                        variant="body"
                        color="gray"
                        className="text-sm"
                      >
                        Total ΔL (m)
                      </Typography>
                    </div>
                  </div>
                </div>

                {/* Tendon Details */}
                <div className="space-y-3">
                  <Typography
                    variant="h5"
                    color="primary"
                    className="font-semibold mb-3"
                  >
                    Individual Tendon Results
                  </Typography>

                  {tendonEntries.map(([tendonId, data]) => {
                    const isExpanded = expandedTendons.has(tendonId);
                    const isActive = Math.abs(data.length_change_m) > 0.001;

                    return (
                      <div
                        key={tendonId}
                        className={`border border-white/30 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-500/25 to-indigo-500/20 border-blue-400/40 backdrop-blur-md"
                            : "bg-white/20 backdrop-blur-md"
                        }`}
                      >
                        <button
                          onClick={() => toggleTendonExpansion(tendonId)}
                          className="w-full p-3 text-left hover:bg-white/30 transition-all duration-300 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isActive
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                                    : "bg-gray-400"
                                }`}
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>
                              </div>
                              <div>
                                <Typography
                                  variant="label"
                                  color="primary"
                                  className="font-semibold"
                                >
                                  {tendonId}
                                </Typography>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={getLengthChangeBadgeVariant(
                                      data.length_change_m
                                    )}
                                    size="sm"
                                  >
                                    {formatLengthChange(data.length_change_m)}
                                  </Badge>
                                  {isActive && (
                                    <Badge variant="success" size="sm">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {getPullDirectionIcon(data.pull_direction)}
                                <Typography
                                  variant="body"
                                  color="gray"
                                  className="text-sm"
                                >
                                  {data.pull_direction}
                                </Typography>
                              </div>
                              <svg
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-gray-200/60 pt-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Typography
                                  variant="label"
                                  color="neutral"
                                  className="text-sm font-medium"
                                >
                                  Length Change
                                </Typography>
                                <div className="flex items-center gap-2 mt-1">
                                  <Typography
                                    variant="body"
                                    className={`font-mono text-lg ${getLengthChangeColor(
                                      data.length_change_m
                                    )}`}
                                  >
                                    {formatLengthChange(data.length_change_m)}
                                  </Typography>
                                  <Typography
                                    variant="body"
                                    color="gray"
                                    className="text-sm"
                                  >
                                    ({data.length_change_m.toFixed(6)} m)
                                  </Typography>
                                </div>
                              </div>
                              <div>
                                <Typography
                                  variant="label"
                                  color="neutral"
                                  className="text-sm font-medium"
                                >
                                  Magnitude
                                </Typography>
                                <Typography
                                  variant="body"
                                  color="primary"
                                  className="font-mono text-lg mt-1"
                                >
                                  {data.magnitude.toFixed(4)}
                                </Typography>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Typography
                                variant="label"
                                color="neutral"
                                className="text-sm font-medium"
                              >
                                Pull Direction
                              </Typography>
                              <div className="flex items-center gap-2 mt-1">
                                {getPullDirectionIcon(data.pull_direction)}
                                <Typography
                                  variant="body"
                                  color="primary"
                                  className="capitalize"
                                >
                                  {data.pull_direction}
                                </Typography>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
