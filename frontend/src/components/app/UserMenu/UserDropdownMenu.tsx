import TahoeGlass from '@/components/ui/TahoeGlass';
import { UserAvatarIcon } from './UserAvatarIcon';
import type { AppState } from '@/types/app';

interface UserDropdownMenuProps {
  readonly appState: AppState;
}

export function UserDropdownMenu({ appState }: Readonly<UserDropdownMenuProps>) {
  return (
    <TahoeGlass className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
      <div className="p-3 border-b border-white/20">
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
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
        >
          Profile
        </button>
        <button
          onClick={() => {
            appState.logout();
            appState.navigate('/');
          }}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </TahoeGlass>
  );
}
