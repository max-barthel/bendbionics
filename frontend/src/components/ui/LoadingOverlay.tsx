import LoadingSpinner from "./LoadingSpinner";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  backdrop?: boolean;
}

function LoadingOverlay({
  isVisible,
  message = "Loading...",
  backdrop = true,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        backdrop ? "bg-black bg-opacity-50" : ""
      }`}
    >
      <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center">
        <LoadingSpinner size="lg" color="primary" className="mb-4" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
