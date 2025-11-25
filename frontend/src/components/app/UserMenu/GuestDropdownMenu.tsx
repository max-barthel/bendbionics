import TahoeGlass from '@/components/ui/TahoeGlass';
import { useAppState } from '@/providers';
import { hoverStates } from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import { UserAvatarIcon } from './UserAvatarIcon';

interface GuestDropdownMenuProps {
  readonly isOpen: boolean;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onMouseLeave?: (() => void) | undefined;
}

export function GuestDropdownMenu({
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: GuestDropdownMenuProps) {
  const appState = useAppState();
  const isLoggedIn = !!appState.user;

  return (
    <TahoeGlass
      data-testid="guest-dropdown-menu"
      className={cn(
        'absolute top-full right-0 mt-2 w-48 transition-opacity duration-200 z-50',
        isOpen
          ? 'opacity-100 visible pointer-events-auto'
          : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isLoggedIn && (
        <div className={cn('p-3 border-b border-white/20')}>
          <div className="flex items-center gap-2">
            <UserAvatarIcon size="w-8 h-8" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {appState.user?.username}
              </p>
              <p className="text-xs text-gray-600">Signed in</p>
            </div>
          </div>
        </div>
      )}
      <div className="p-1">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => appState.setShowUserSettings(true)}
              className={cn(
                'w-full text-center px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
                hoverStates.menu
              )}
            >
              Profile
            </button>
            <button
              onClick={() => {
                appState.logout();
                appState.navigate('/');
              }}
              className={cn(
                'w-full text-center px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
                hoverStates.menu
              )}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => appState.navigate('/auth')}
            className={cn(
              'w-full text-center px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
              hoverStates.menu
            )}
            data-testid="sign-in-button"
          >
            Sign In
          </button>
        )}
        <button
          onClick={() => appState.setShowAboutModal(true)}
          className={cn(
            'w-full text-center px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
            hoverStates.menu
          )}
        >
          About
        </button>
      </div>
    </TahoeGlass>
  );
}
