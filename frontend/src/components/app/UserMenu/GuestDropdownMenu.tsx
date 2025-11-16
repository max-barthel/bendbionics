import { hoverStates } from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import TahoeGlass from '@/components/ui/TahoeGlass';
import { useAppState } from '@/providers';
import { UserAvatarIcon } from './UserAvatarIcon';

export function GuestDropdownMenu() {
  const appState = useAppState();
  const isLoggedIn = !!appState.user;

  return (
    <TahoeGlass className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
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

