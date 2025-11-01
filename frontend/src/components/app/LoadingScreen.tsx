import { LoadingSpinner, Typography } from '../ui';

interface LoadingScreenProps {
  readonly isLoading: boolean;
  readonly isInitializing: boolean;
}

export function LoadingScreen({
  isLoading,
  isInitializing: _isInitializing,
}: Readonly<LoadingScreenProps>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" color="primary" className="mb-4" />
        <Typography variant="h2" color="primary" className="mb-2">
          Loading BendBionics App
        </Typography>
        <Typography variant="body" color="gray">
          {isLoading ? 'Checking authentication...' : 'Initializing components...'}
        </Typography>
      </div>
    </div>
  );
}
