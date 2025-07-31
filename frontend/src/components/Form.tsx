import axios from "axios";
import React, { useState } from "react";
import ArrayInputGroup from "./ArrayInputGroup";
import "./Form.css";
import NumberInput from "./NumberInput";
import SubmitButton from "./SubmitButton";

const Form: React.FC = () => {
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
  const [discretizationSteps, setDiscretizationSteps] = useState(5);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    try {
      const { data } = await axios.post("http://localhost:8000/pcc", {
        bending_angles: bendingAngles,
        rotation_angles: rotationAngles,
        backbone_lengths: backboneLengths,
        coupling_lengths: couplingLengths,
        discretization_steps: discretizationSteps,
      });
      setResult(data);
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  return (
    <div className="form-container">
      <h2>Soft Robot Parameters</h2>
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
      <NumberInput
        label="Discretization Steps"
        value={discretizationSteps}
        onChange={setDiscretizationSteps}
        step={1}
      />
      <SubmitButton onClick={handleSubmit} />

      {result && (
        <div className="output">
          <h3>Backend Response:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Form;
