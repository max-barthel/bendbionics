// Color palette for tendon identification
export const TENDON_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

// Function to get consistent color for a tendon ID
// Backend uses 1-based indexing (1, 2, 3, ...), so we convert to 0-based for color array
export const getTendonColor = (tendonId: string): string => {
  const index = parseInt(tendonId, 10) - 1; // Convert from 1-based to 0-based
  return TENDON_COLORS[index % TENDON_COLORS.length] ?? '#6b7280';
};

// Function to get Tailwind color classes for tendon identification
export const getTendonColorClasses = (
  tendonId: string
): {
  bg: string;
  border: string;
  text: string;
} => {
  const index = parseInt(tendonId, 10) - 1; // Convert from 1-based to 0-based
  const colorIndex = index % TENDON_COLORS.length;

  const colorMap = [
    { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
    { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' },
    { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600' },
    { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600' },
    { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600' },
    { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600' },
    { bg: 'bg-lime-500', border: 'border-lime-500', text: 'text-lime-600' },
    { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600' },
    { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600' },
    { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600' },
    { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600' },
    { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600' },
  ];

  return (
    colorMap[colorIndex] ?? {
      bg: 'bg-gray-400',
      border: 'border-gray-400',
      text: 'text-gray-600',
    }
  );
};
