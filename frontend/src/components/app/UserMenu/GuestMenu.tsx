import { Button } from '@/components/ui';
import { GuestDropdownMenu } from './GuestDropdownMenu';

export function GuestMenu() {
  return (
    <div className="group relative">
      <Button
        variant="primary"
        className="px-4 py-2"
        aria-label="User menu"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            className="w-4 h-4 transition-transform group-hover:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </Button>
      <GuestDropdownMenu />
    </div>
  );
}

