import TahoeGlass from '@/components/ui/TahoeGlass';
import { UserAvatarIcon } from './UserAvatarIcon';
import { UserDropdownMenu } from './UserDropdownMenu';
import type { AppState } from '@/types/app';

interface SignedInUserMenuProps {
  readonly appState: AppState;
}

export function SignedInUserMenu({ appState }: Readonly<SignedInUserMenuProps>) {
  return (
    <div className="group relative">
      <TahoeGlass as="button" className="flex items-center gap-2 hover:scale-105">
        <UserAvatarIcon />
        <span className="text-sm font-medium text-gray-800">
          {appState.user?.username}
        </span>
        <svg
          className="w-4 h-4 text-gray-600 transition-transform group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </TahoeGlass>
      <UserDropdownMenu appState={appState} />
    </div>
  );
}
