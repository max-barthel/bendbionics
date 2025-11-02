import { ControlIcon, RobotIcon } from '@/components/icons';
import { TabPanel, Tabs } from '@/components/ui';
import { DEBOUNCE_DELAYS, STATE_SYNC_DELAYS } from '@/constants/timing';
import { useConfigurationLoader } from '@/features/presets/hooks/useConfigurationLoader';
import {
  createPCCParams,
  handleRegularComputation,
  handleTendonComputation,
} from '@/features/robot-config/utils/computation-helpers';
import { ErrorDisplay } from '@/features/shared/components/ErrorDisplay';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import type { RobotConfiguration, User } from '@/types';
import { validateRobotConfiguration } from '@/utils/formValidation';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useRobotState } from '../hooks/useRobotState';
import { ControlTab } from './tabs/ControlTab';
import { RobotSetupTab } from './tabs/RobotSetupTab';

type FormTabsProps = {
  onResult: (segments: number[][][], configuration: RobotConfiguration) => void;
  initialConfiguration?: RobotConfiguration;
  user?: User | null;
  currentConfiguration?: RobotConfiguration;
  onLoadPreset?: (configuration: RobotConfiguration) => void;
  navigate?: (path: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  onShowPresetManager?: () => void;
};

export type FormTabsRef = {
  handleSubmit: () => Promise<void>;
};

const FormTabs = forwardRef<FormTabsRef, FormTabsProps>(
  (
    { onResult, initialConfiguration, user, onLoadingChange, onShowPresetManager },
    ref
  ) => {
    const [robotState, setRobotState] = useRobotState();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('setup');

    const { error, showError, hideError, handleApiError } = useUnifiedErrorHandler();
    useConfigurationLoader(initialConfiguration as Record<string, unknown> | undefined);

    const handleSubmit = useCallback(async () => {
      hideError();
      if (!(await validateRobotConfiguration(robotState, showError))) {
        return;
      }

      setLoading(true);

      try {
        const params = createPCCParams(robotState);

        if (robotState.tendonConfig) {
          await handleTendonComputation(params, robotState, onResult);
        } else {
          await handleRegularComputation(params, robotState, onResult);
        }
      } catch (err: unknown) {
        handleApiError(err, 'computation');
      } finally {
        setLoading(false);
      }
    }, [robotState, showError, hideError, onResult]);

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    // External compute trigger removed in favor of auto-compute on field commit

    useImperativeHandle(ref, () => ({
      handleSubmit,
    }));

    // Auto-compute after a preset is loaded/applied (only on actual preset load, not state changes)
    const lastPresetRef = useRef<string>('');
    const handleSubmitRef = useRef(handleSubmit);
    handleSubmitRef.current = handleSubmit; // Keep ref up to date

    useEffect(() => {
      if (!initialConfiguration) {
        return;
      }
      // Only trigger if this is a genuinely new preset (not a re-render with same config)
      const configString = JSON.stringify(initialConfiguration);
      if (configString === lastPresetRef.current) {
        return;
      }
      lastPresetRef.current = configString;
      // Small delay to let useConfigurationLoader apply state
      const timer = setTimeout(() => {
        if (!loading) {
          void handleSubmitRef.current();
        }
      }, STATE_SYNC_DELAYS.CONFIGURATION_LOADER);
      return () => clearTimeout(timer);
    }, [initialConfiguration, loading]);

    const onFieldCommit = (() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (loading) return;
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          void handleSubmit();
        }, DEBOUNCE_DELAYS.FIELD_COMMIT);
      };
    })();

    const tabs = [
      {
        id: 'setup',
        label: 'Robot Setup',
        icon: <RobotIcon className="w-3 h-3" />,
      },
      {
        id: 'control',
        label: 'Control',
        icon: <ControlIcon className="w-3 h-3" />,
      },
    ];

    return (
      <div className="h-full flex flex-col" data-testid="form-tabs">
        {error.visible && <ErrorDisplay message={error.message} onClose={hideError} />}

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="flex-shrink-0 mt-4"
        />

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white/10 to-white/5 min-h-0 scrollbar-hide relative">
          <TabPanel id="setup" activeTab={activeTab}>
            <RobotSetupTab
              {...(onShowPresetManager && { onShowPresetManager })}
              robotState={robotState}
              setRobotState={setRobotState}
              onFieldCommit={onFieldCommit}
            />
          </TabPanel>

          <TabPanel id="control" activeTab={activeTab}>
            <ControlTab
              {...(user && { user })}
              {...(onShowPresetManager && { onShowPresetManager })}
              robotState={robotState}
              setRobotState={setRobotState}
              onFieldCommit={onFieldCommit}
            />
          </TabPanel>
        </div>
      </div>
    );
  }
);

export default FormTabs;
