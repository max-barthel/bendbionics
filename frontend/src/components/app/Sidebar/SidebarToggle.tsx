import { IconButton } from '../../ui';
import type { AppState } from '../UserMenu/types';

interface SidebarToggleProps {
  readonly appState: AppState;
  readonly toggleSidebar: () => void;
}

export function SidebarToggle({
  appState,
  toggleSidebar,
}: Readonly<SidebarToggleProps>) {
  return (
    <IconButton
      onClick={toggleSidebar}
      aria-label={appState.sidebarCollapsed ? 'Show parameters' : 'Hide parameters'}
      variant="glass"
      size="md"
      className={`fixed top-1/2 transform -translate-y-1/2 z-50 ${
        appState.sidebarCollapsed
          ? 'left-4 translate-x-0'
          : 'left-[calc(384px-16px)] translate-x-0'
      }`}
    >
      <svg
        className="w-4 h-4 text-gray-600 transition-transform duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={appState.sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
        />
      </svg>
    </IconButton>
  );
}
