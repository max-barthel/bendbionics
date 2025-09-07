import React from "react";
import { CloseIcon, ErrorIcon } from "./icons";

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onClose,
}) => {
  return (
    <div className="mx-6 mt-4 p-4 border-l-4 bg-red-50 border-red-400 text-red-800 flex-shrink-0">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ErrorIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close error message"
          className="text-red-500 hover:bg-red-100 focus:ring-red-500 inline-flex rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
