import { Typography } from '@/components/ui';

interface AuthFormHeaderProps {
  readonly title: string;
  readonly description: string;
}

/**
 * AuthFormHeader - Reusable header component for authentication forms
 *
 * Extracted from LoginFormHeader and RegisterFormHeader to eliminate duplication.
 * Provides consistent header styling across all auth forms.
 */
export function AuthFormHeader({ title, description }: Readonly<AuthFormHeaderProps>) {
  return (
    <div className="text-center mb-6">
      <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
        {title}
      </Typography>
      <Typography variant="body" color="gray" className="text-gray-600">
        {description}
      </Typography>
    </div>
  );
}
