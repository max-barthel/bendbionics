import axios from "axios";
import React, { useState } from "react";
import ArrayInputGroup from "./ArrayInputGroup";
import Card from "./Card";
import NumberInput from "./NumberInput";
import SubmitButton from "./SubmitButton";

type FormProps = {
  onResult: React.Dispatch<React.SetStateAction<number[][][]>>;
};

type BackendResponse = {
  segments?: number[][][];
  [key: string]: any;
};

function Form({ onResult }: FormProps) {
  const [bendingAngles, setBendingAngles] = useState([
    0.628319, 0.628319, 0.628319,
  ]);
  const [rotationAngles, setRotationAngles] = useState([
    1.0472, 1.0472, 1.0472,
  ]);
  const [backboneLengths, setBackboneLengths] = useState([70.0, 70.0, 70.0]);
  const [couplingLengths, setCouplingLengths] = useState([
    30.0, 30.0, 30.0, 15.0,
  ]);
  const [discretizationSteps, setDiscretizationSteps] = useState(1000);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post<BackendResponse>(
        "http://localhost:8000/pcc",
        {
          bending_angles: bendingAngles,
          rotation_angles: rotationAngles,
          backbone_lengths: backboneLengths,
          coupling_lengths: couplingLengths,
          discretization_steps: discretizationSteps,
        }
      );

      if (data?.segments) {
        onResult(data.segments);
      } else {
        console.warn("Backend response did not include 'segments'");
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col space-y-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-800">
          Soft Robot Parameters
        </h2>

        <ArrayInputGroup
          label="Bending Angles"
          values={bendingAngles}
          onChange={setBendingAngles}
        />
        <ArrayInputGroup
          label="Rotation Angles"
          values={rotationAngles}
          onChange={setRotationAngles}
        />
        <ArrayInputGroup
          label="Backbone Lengths"
          values={backboneLengths}
          onChange={setBackboneLengths}
        />
        <ArrayInputGroup
          label="Coupling Lengths"
          values={couplingLengths}
          onChange={setCouplingLengths}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="discretization" className="text-sm text-neutral-600">
            Discretization Steps
          </label>
          <NumberInput
            value={discretizationSteps}
            onChange={setDiscretizationSteps}
            placeholder="Discretization Steps"
            id="discretization"
          />
        </div>

        <div className="pt-2">
          <SubmitButton onClick={handleSubmit} loading={loading} />
        </div>
      </form>
    </Card>
  );
}

export default Form;
