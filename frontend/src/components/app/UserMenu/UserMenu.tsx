import { useAppState } from '@/providers';
import { SignedInUserMenu } from './SignedInUserMenu';
import { SignInButton } from './SignInButton';

export function UserMenu() {
  const appState = useAppState();

  return (
    <div className="fixed top-4 right-4 z-50">
      {appState.user ? <SignedInUserMenu /> : <SignInButton />}
    </div>
  );
}
