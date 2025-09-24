interface SkeletonLoaderProps {
  type?: 'text' | 'input' | 'button' | 'card';
  lines?: number;
  className?: string;
}

// Helper function to get width class based on index
const getWidthClass = (index: number): string => {
  if (index === 0) {
    return 'w-4/5';
  }
  if (index === 1) {
    return 'w-3/4';
  }
  return 'w-2/3';
};

function SkeletonLoader({
  type = 'text',
  lines = 1,
  className = '',
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={`h-4 bg-gray-200 rounded animate-pulse ${getWidthClass(index)}`}
              />
            ))}
          </div>
        );

      case 'input':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        );

      case 'button':
        return (
          <div className={`h-10 bg-gray-200 rounded animate-pulse ${className}`} />
        );

      case 'card':
        return (
          <div
            className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}
          >
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderSkeleton();
}

export default SkeletonLoader;
