import { Typography } from '@/components/ui';

interface AuthFormFooterProps {
  readonly promptText: string;
  readonly switchText: string;
  readonly onSwitch: () => void;
}

/**
 * AuthFormFooter - Reusable footer component for authentication forms
 *
 * Extracted from LoginFormFooter and RegisterFormFooter to eliminate duplicate
 * footer link patterns with consistent styling.
 */
export function AuthFormFooter({
  promptText,
  switchText,
  onSwitch,
}: Readonly<AuthFormFooterProps>) {
  return (
    <div className="mt-6 text-center">
      <Typography variant="body" color="gray" className="text-gray-600">
        {promptText}{' '}
        <button
          onClick={onSwitch}
          className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
        >
          {switchText}
        </button>
      </Typography>
    </div>
  );
}
