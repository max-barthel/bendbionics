import { PrimaryButton } from '@/components/ui';
import { buttonVariants } from '@/styles/design-tokens';
import type { AppState } from '@/types/app';

interface SignInButtonProps {
  readonly appState: AppState;
}

export function SignInButton({ appState }: Readonly<SignInButtonProps>) {
  return (
    <PrimaryButton
      onClick={() => appState.navigate('/auth')}
      className="relative z-[60] px-4 py-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      <span className={buttonVariants.primaryText}>Sign In</span>
    </PrimaryButton>
  );
}
