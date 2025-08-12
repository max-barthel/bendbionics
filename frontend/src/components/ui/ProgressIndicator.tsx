interface ProgressIndicatorProps {
  progress: number; // 0-100
  message?: string;
  className?: string;
}

function ProgressIndicator({
  progress,
  message = "Processing...",
  className = "",
}: ProgressIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{message}</span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out w-[${progress}%]`}
        />
      </div>
    </div>
  );
}

export default ProgressIndicator;
