import React, { useState } from "react";
import {
  SliderInput,
  SubsectionTitle,
  UnitSelector,
} from "../../../components/ui";

interface AngleControlPanelProps {
  values: number[];
  onChange: (values: number[]) => void;
}

export const AngleControlPanel: React.FC<AngleControlPanelProps> = ({
  values,
  onChange,
}) => {
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [useDegrees, setUseDegrees] = useState(true);
  const angleUnits = ["deg", "rad"] as const;

  const updateSegmentValue = (index: number, newValueRadians: number) => {
    const newValues = [...values];
    newValues[index] = newValueRadians;
    onChange(newValues);
  };

  const updateSegmentValueDegrees = (
    index: number,
    newValueDegrees: number
  ) => {
    const newValueRadians = (newValueDegrees * Math.PI) / 180;
    updateSegmentValue(index, newValueRadians);
  };

  const updateSegmentValueRadians = (
    index: number,
    newValueRadians: number
  ) => {
    updateSegmentValue(index, newValueRadians);
  };

  return (
    <div className="space-y-4">
      {/* Segment Selector */}
      <div className="space-y-2">
        <SubsectionTitle title="Select Segment to Adjust" />
        <div className="flex flex-wrap gap-2 text-xs bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/5">
          {values.map((value, index) => (
            <div
              key={index}
              className={`w-[calc(50%-4px)] h-16 flex flex-col justify-center flex-shrink-0 p-3 rounded-xl cursor-pointer ${
                selectedSegment === index
                  ? "bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-gray-900 shadow-lg border border-blue-400/30 shadow-blue-500/10"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/20"
              }`}
              onClick={() => setSelectedSegment(index)}
            >
              <div className="font-medium text-center">Segment {index + 1}</div>
              <div className="text-gray-600 text-center text-xs leading-tight">
                {useDegrees ? (
                  <>
                    {((value * 180) / Math.PI).toFixed(1)}° ({value.toFixed(3)}{" "}
                    rad)
                  </>
                ) : (
                  <>
                    {value.toFixed(3)} rad (
                    {((value * 180) / Math.PI).toFixed(1)}°)
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Segment Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SubsectionTitle title={`Segment ${selectedSegment + 1} Value`} />
          <UnitSelector
            units={angleUnits}
            selectedUnit={useDegrees ? "deg" : "rad"}
            onUnitChange={(unit) => setUseDegrees(unit === "deg")}
            ariaLabel="Angle"
          />
        </div>

        <div className="mt-6">
          <SliderInput
            value={
              useDegrees
                ? (values[selectedSegment] * 180) / Math.PI
                : values[selectedSegment]
            }
            onChange={(value: number) => {
              if (useDegrees) {
                updateSegmentValueDegrees(selectedSegment, value);
              } else {
                updateSegmentValueRadians(selectedSegment, value);
              }
            }}
            min={useDegrees ? -180 : -Math.PI}
            max={useDegrees ? 180 : Math.PI}
            step={useDegrees ? 1 : Math.PI / 180}
            placeholder={`#${selectedSegment + 1}`}
            label=""
          />
        </div>
      </div>
    </div>
  );
};
