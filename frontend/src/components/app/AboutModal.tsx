import { Modal } from '@/components/ui/Modal';
import { useEffect, useRef } from 'react';

interface AboutModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const LINKEDIN_SCRIPT_URL = 'https://platform.linkedin.com/badges/js/profile.js';

interface LinkedInWindow extends Window {
  LI?: {
    parse?: () => void;
    reinitialize?: () => void;
  };
}

export function AboutModal({ isOpen, onClose }: Readonly<AboutModalProps>) {
  const badgeContainerRef = useRef<HTMLDivElement>(null);

  // Load LinkedIn script once on component mount
  useEffect(() => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      `script[src="${LINKEDIN_SCRIPT_URL}"]`
    );

    if (existingScript) {
      return; // Script already loaded
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = LINKEDIN_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.type = 'text/javascript';

    document.head.appendChild(script);

    // No cleanup needed - script should persist
    return undefined;
  }, []); // Run once on mount

  // Process badge when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const processBadge = () => {
      const linkedInWindow = globalThis as unknown as LinkedInWindow;
      if (linkedInWindow.LI?.parse) {
        linkedInWindow.LI.parse();
      } else if (linkedInWindow.LI?.reinitialize) {
        linkedInWindow.LI.reinitialize();
      }
    };

    let checkLinkedInInterval: ReturnType<typeof setInterval> | undefined;

    const waitForLinkedInScript = () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      checkLinkedInInterval = setInterval(() => {
        attempts++;
        const linkedInWindow = globalThis as unknown as LinkedInWindow;
        if (linkedInWindow.LI || attempts >= maxAttempts) {
          if (checkLinkedInInterval) {
            clearInterval(checkLinkedInInterval);
            checkLinkedInInterval = undefined;
          }
          if (linkedInWindow.LI) {
            processBadge();
          }
        }
      }, 100);
    };

    // Wait for React to finish rendering and badge to be in DOM
    const ensureBadgeProcessed = () => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Double-check badge is in DOM
        if (!badgeContainerRef.current) {
          return;
        }

        const badgeElement =
          badgeContainerRef.current.querySelector('.LI-profile-badge');

        if (!badgeElement) {
          return;
        }

        const linkedInWindow = globalThis as unknown as LinkedInWindow;
        if (linkedInWindow.LI) {
          // Script is loaded, process the badge
          processBadge();
        } else {
          // Script not loaded yet, wait for it
          waitForLinkedInScript();
        }
      });
    };

    // Small delay to ensure modal and badge are fully rendered
    const timeoutId = setTimeout(ensureBadgeProcessed, 50);

    return () => {
      clearTimeout(timeoutId);
      if (checkLinkedInInterval) {
        clearInterval(checkLinkedInInterval);
      }
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About" size="md">
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-700 text-center">
          Connect with me on LinkedIn to reach out or learn more about my work.
        </p>
        <div
          ref={badgeContainerRef}
          className="flex justify-center"
          dangerouslySetInnerHTML={{
            __html: `<div class="badge-base LI-profile-badge" data-locale="en_US" data-size="large" data-theme="light" data-type="HORIZONTAL" data-vanity="max-barthel-27317b22b" data-version="v1"><a class="badge-base__link LI-simple-link" href="https://de.linkedin.com/in/max-barthel-27317b22b?trk=profile-badge">Max Barthel</a></div>`,
          }}
        />
      </div>
    </Modal>
  );
}
