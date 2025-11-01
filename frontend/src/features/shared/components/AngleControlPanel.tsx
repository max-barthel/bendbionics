import React, { useState } from 'react';
import {
  PanelContainer,
  SliderInput,
  SubsectionTitle,
  UnitSelector,
} from '../../../components/ui';
import { panelVariants } from '../../../styles/design-tokens';
import { combineStyles } from '../../../styles/tahoe-utils';
import {
  MAX_ANGLE_DEGREES,
  MAX_ANGLE_RADIANS,
  convertFromSI,
  convertToSI,
  getUnits,
} from '../../../utils/unitConversions';

interface AngleControlPanelProps {
  values: number[];
  onChange: (values: number[]) => void;
  onFieldCommit?: () => void;
}

export const AngleControlPanel: React.FC<AngleControlPanelProps> = ({
  values,
  onChange,
  onFieldCommit,
}) => {
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [useDegrees, setUseDegrees] = useState(true);
  const angleUnits = getUnits('angle');

  const updateSegmentValue = (index: number, newValueRadians: number) => {
    const newValues = [...values];
    newValues[index] = newValueRadians;
    onChange(newValues);
  };

  const updateSegmentValueDegrees = (index: number, newValueDegrees: number) => {
    const newValueRadians = convertToSI(newValueDegrees, 'deg', 'angle');
    updateSegmentValue(index, newValueRadians);
  };

  const updateSegmentValueRadians = (index: number, newValueRadians: number) => {
    updateSegmentValue(index, newValueRadians);
  };

  return (
    <div className="space-y-4">
      {/* Segment Selector */}
      <div className="space-y-2">
        <SubsectionTitle title="Select Segment to Adjust" />
        <PanelContainer
          variant="segmentSelector"
          className="flex flex-wrap gap-2 text-xs"
        >
          {values.map((value, index) => {
            const segmentButtonClasses = combineStyles(
              'w-[calc(50%-4px)] h-16 flex flex-col justify-center flex-shrink-0 p-3 rounded-xl cursor-pointer',
              selectedSegment === index
                ? panelVariants.segmentSelected
                : panelVariants.segmentUnselected
            );

            const displayDegrees = convertFromSI(value, 'deg', 'angle');
            const displayRadians = convertFromSI(value, 'rad', 'angle');

            return (
              <button
                key={`segment-${index}-${value}`}
                type="button"
                className={segmentButtonClasses}
                onClick={() => setSelectedSegment(index)}
              >
                <div className="font-medium text-center">Segment {index + 1}</div>
                <div className="text-gray-600 text-center text-xs leading-tight">
                  {useDegrees ? (
                    <>
                      {displayDegrees.toFixed(1)}° ({displayRadians.toFixed(3)} rad)
                    </>
                  ) : (
                    <>
                      {displayRadians.toFixed(3)} rad ({displayDegrees.toFixed(1)}°)
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </PanelContainer>
      </div>

      {/* Individual Segment Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SubsectionTitle title={`Segment ${selectedSegment + 1} Value`} />
          <UnitSelector
            units={angleUnits}
            selectedUnit={useDegrees ? 'deg' : 'rad'}
            onUnitChange={unit => setUseDegrees(unit === 'deg')}
            ariaLabel="Angle"
          />
        </div>

        <div className="mt-6">
          <SliderInput
            value={
              useDegrees
                ? convertFromSI(values[selectedSegment] ?? 0, 'deg', 'angle')
                : convertFromSI(values[selectedSegment] ?? 0, 'rad', 'angle')
            }
            onChange={(value: number) => {
              if (useDegrees) {
                updateSegmentValueDegrees(selectedSegment, value);
              } else {
                updateSegmentValueRadians(selectedSegment, value);
              }
            }}
            {...(onFieldCommit && { onBlur: onFieldCommit })}
            min={useDegrees ? -MAX_ANGLE_DEGREES : -MAX_ANGLE_RADIANS}
            max={useDegrees ? MAX_ANGLE_DEGREES : MAX_ANGLE_RADIANS}
            step={useDegrees ? 1 : MAX_ANGLE_RADIANS / MAX_ANGLE_DEGREES}
            placeholder={`#${selectedSegment + 1}`}
            label=""
          />
        </div>
      </div>
    </div>
  );
};
