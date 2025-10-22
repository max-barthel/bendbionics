import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { robotAPI, type PCCParams } from '../../../api/client';
import { ControlIcon, RobotIcon } from '../../../components/icons';
import { TabPanel, Tabs } from '../../../components/ui';
import { type RobotConfiguration, type User } from '../../../types/robot';
import { validateRobotConfiguration } from '../../../utils/formValidation';
import { useConfigurationLoader } from '../../presets/hooks/useConfigurationLoader';
import { ErrorDisplay } from '../../shared/components/ErrorDisplay';
import { useErrorHandler } from '../../shared/hooks/useErrorHandler';
import { useRobotState } from '../hooks/useRobotState';
import { ControlTab } from './tabs/ControlTab';
import { RobotSetupTab } from './tabs/RobotSetupTab';

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
  triggerComputation?: boolean;
  onComputationTriggered?: () => void;
  onShowPresetManager?: () => void;
};

type FormTabsRef = {
  handleSubmit: () => Promise<void>;
};

const FormTabs = forwardRef<FormTabsRef, FormTabsProps>(
  (
    {
      onResult,
      initialConfiguration,
      user,
      onLoadingChange,
      triggerComputation,
      onComputationTriggered,
      onShowPresetManager,
    },
    ref
  ) => {
    const [robotState, setRobotState] = useRobotState();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('setup');

    const { error, showError, hideError } = useErrorHandler();
    useConfigurationLoader(initialConfiguration as Record<string, unknown> | undefined);

    const handleSubmit = useCallback(async () => {
      hideError();
      if (!(await validateRobotConfiguration(robotState, showError))) {
        return;
      }

      setLoading(true);

      try {
        const params: PCCParams = {
          bending_angles: robotState.bendingAngles,
          rotation_angles: robotState.rotationAngles,
          backbone_lengths: robotState.backboneLengths,
          coupling_lengths: robotState.couplingLengths,
          discretization_steps: robotState.discretizationSteps,
          ...(robotState.tendonConfig && { tendon_config: robotState.tendonConfig }),
        };

        // Use tendon endpoint if tendon configuration is provided
        let result;
        if (robotState.tendonConfig) {
          result = await robotAPI.computePCCWithTendons(params);
          // Extract segments from tendon result - fix nested data access
          const segments = isApiResponseWithResult(result)
            ? result.data.result.robot_positions
            : [];

          // Extract tendon analysis data from the response
          const tendonAnalysis =
            isApiResponseWithResult(result) &&
            result.data.result.actuation_commands &&
            result.data.result.coupling_data &&
            result.data.result.tendon_analysis
              ? {
                  actuation_commands: result.data.result.actuation_commands as Record<
                    string,
                    {
                      length_change_m: number;
                      pull_direction: string;
                      magnitude: number;
                    }
                  >,
                  coupling_data: result.data.result.coupling_data as {
                    positions: number[][];
                    orientations: number[][][];
                  },
                  tendon_analysis: result.data.result.tendon_analysis as {
                    routing_points: number[][][];
                  },
                }
              : undefined;

          const configuration: RobotConfiguration = {
            segments: robotState.segments,
            bendingAngles: robotState.bendingAngles,
            rotationAngles: robotState.rotationAngles,
            backboneLengths: robotState.backboneLengths,
            couplingLengths: robotState.couplingLengths,
            discretizationSteps: robotState.discretizationSteps,
            tendonConfig: robotState.tendonConfig,
            ...(tendonAnalysis && { tendonAnalysis }),
          };

          onResult(segments, configuration);
        } else {
          result = await robotAPI.computePCC(params);

          const configuration: RobotConfiguration = {
            segments: robotState.segments,
            bendingAngles: robotState.bendingAngles,
            rotationAngles: robotState.rotationAngles,
            backboneLengths: robotState.backboneLengths,
            couplingLengths: robotState.couplingLengths,
            discretizationSteps: robotState.discretizationSteps,
          };

          onResult(result.data.segments || [], configuration);
        }
      } catch (err: unknown) {
        // Error handled by error handler
        const error = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        showError(
          'server',
          error.response?.data?.detail ?? error.message ?? 'Computation failed'
        );
      } finally {
        setLoading(false);
      }
    }, [robotState, showError, hideError, onResult]);

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    // Handle external computation trigger
    useEffect(() => {
      if (triggerComputation && !loading) {
        void handleSubmit();
        onComputationTriggered?.();
      }
    }, [triggerComputation, loading, onComputationTriggered, handleSubmit]);

    useImperativeHandle(ref, () => ({
      handleSubmit,
    }));

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
            />
          </TabPanel>

          <TabPanel id="control" activeTab={activeTab}>
            <ControlTab
              {...(user && { user })}
              {...(onShowPresetManager && { onShowPresetManager })}
              robotState={robotState}
              setRobotState={setRobotState}
            />
          </TabPanel>
        </div>
      </div>
    );
  }
);

export default FormTabs;
