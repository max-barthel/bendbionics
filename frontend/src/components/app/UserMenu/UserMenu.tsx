import { SignedInUserMenu } from './SignedInUserMenu';
import { SignInButton } from './SignInButton';
import type { AppState } from './types';

interface UserMenuProps {
  readonly appState: AppState;
}

export function UserMenu({ appState }: Readonly<UserMenuProps>) {
  return (
    <div className="fixed top-4 right-4 z-50">
      {appState.user ? (
        <SignedInUserMenu appState={appState} />
      ) : (
        <SignInButton appState={appState} />
      )}
    </div>
  );
}
