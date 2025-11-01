import { type User } from '@/api/auth';
import { robotAPI, type PCCParams } from '@/api/client';
import { ControlIcon, RobotIcon } from '@/components/icons';
import { TabPanel, Tabs } from '@/components/ui';
import { useConfigurationLoader } from '@/features/presets/hooks/useConfigurationLoader';
import { ErrorDisplay } from '@/features/shared/components/ErrorDisplay';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { type RobotConfiguration } from '@/types/robot';
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

// Helper function to create PCC parameters
const createPCCParams = (
  robotState: ReturnType<typeof useRobotState>[0]
): PCCParams => ({
  bending_angles: robotState.bendingAngles,
  rotation_angles: robotState.rotationAngles,
  backbone_lengths: robotState.backboneLengths,
  coupling_lengths: robotState.couplingLengths,
  discretization_steps: robotState.discretizationSteps,
  ...(robotState.tendonConfig && { tendon_config: robotState.tendonConfig }),
});

// Helper function to create base robot configuration
const createBaseConfiguration = (
  robotState: ReturnType<typeof useRobotState>[0]
): Omit<RobotConfiguration, 'tendonAnalysis'> => ({
  segments: robotState.segments,
  bendingAngles: robotState.bendingAngles,
  rotationAngles: robotState.rotationAngles,
  backboneLengths: robotState.backboneLengths,
  couplingLengths: robotState.couplingLengths,
  discretizationSteps: robotState.discretizationSteps,
  ...(robotState.tendonConfig && { tendonConfig: robotState.tendonConfig }),
});

// Helper function to extract tendon analysis data
const extractTendonAnalysis = (result: unknown) => {
  if (!isApiResponseWithResult(result)) return undefined;

  const { actuation_commands, coupling_data, tendon_analysis } = result.data.result;

  if (!actuation_commands || !coupling_data || !tendon_analysis) return undefined;

  return {
    actuation_commands: actuation_commands as Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >,
    coupling_data: coupling_data as {
      positions: number[][];
      orientations: number[][][];
    },
    tendon_analysis: tendon_analysis as {
      routing_points: number[][][];
      segment_lengths: number[][];
      total_lengths: number[][];
      length_changes: number[][];
      segment_length_changes: number[][];
    },
  };
};

// Helper function to handle tendon computation
const handleTendonComputation = async (
  params: PCCParams,
  robotState: ReturnType<typeof useRobotState>[0],
  onResult: (segments: number[][][], configuration: RobotConfiguration) => void
) => {
  const result = await robotAPI.computePCCWithTendons(params);
  const segments = isApiResponseWithResult(result)
    ? result.data.result.robot_positions
    : [];
  const tendonAnalysis = extractTendonAnalysis(result);

  const configuration: RobotConfiguration = {
    ...createBaseConfiguration(robotState),
    ...(tendonAnalysis && { tendonAnalysis }),
  };

  onResult(segments, configuration);
};

// Helper function to handle regular PCC computation
const handleRegularComputation = async (
  params: PCCParams,
  robotState: ReturnType<typeof useRobotState>[0],
  onResult: (segments: number[][][], configuration: RobotConfiguration) => void
) => {
  const result = await robotAPI.computePCC(params);
  const configuration = createBaseConfiguration(robotState);
  onResult(result.data.segments || [], configuration);
};

// Type guard for API response with result
const isApiResponseWithResult = (
  response: unknown
): response is {
  data: {
    result: {
      robot_positions: number[][][];
      segments?: number[][][];
      actuation_commands?: Record<string, unknown>;
      coupling_data?: unknown;
      tendon_analysis?: unknown;
    };
  };
} => {
  return (
    response !== null &&
    typeof response === 'object' &&
    'data' in response &&
    response.data !== null &&
    typeof response.data === 'object' &&
    'result' in response.data &&
    response.data.result !== null &&
    typeof response.data.result === 'object' &&
    'robot_positions' in response.data.result
  );
};

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
      }, 100);
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
        }, 250);
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
