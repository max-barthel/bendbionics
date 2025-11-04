import { hoverStates } from '@/styles/design-tokens';
import { cn } from '@/styles/tahoe-utils';
import TahoeGlass from '@/components/ui/TahoeGlass';
import { useAppState } from '@/providers';
import { UserAvatarIcon } from './UserAvatarIcon';

export function UserDropdownMenu() {
  const appState = useAppState();

  return (
    <TahoeGlass className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
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
      <div className="p-1">
        <button
          onClick={() => appState.setShowUserSettings(true)}
          className={cn(
            'w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
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
            'w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors',
            hoverStates.menu
          )}
        >
          Sign Out
        </button>
      </div>
    </TahoeGlass>
  );
}
