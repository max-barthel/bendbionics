import { Button } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { GuestDropdownMenu } from './GuestDropdownMenu';

export function GuestMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in globalThis || navigator.maxTouchPoints > 0);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const isMouseDevice = !isTouchDevice;

  return (
    <div
      ref={containerRef}
      className="group relative"
      onMouseEnter={isMouseDevice ? () => setIsOpen(true) : undefined}
      onMouseLeave={isMouseDevice ? () => setIsOpen(false) : undefined}
    >
      <Button
        variant="primary"
        className="px-4 py-2"
        aria-label="User menu"
        aria-expanded={isOpen ? 'true' : 'false'}
        data-testid="user-menu-button"
        onClick={handleToggle}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
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
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
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
      <GuestDropdownMenu isOpen={isOpen} />
    </div>
  );
}
