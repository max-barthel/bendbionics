import { useState } from "react";
import { api } from "./api/client";

function App() {
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    const data = {
      bending_angles: [0.628319, 0.628319, 0.628319],
      rotation_angles: [1.0472, 1.0472, 1.0472],
      backbone_lengths: [70.0, 70.0, 70.0],
      coupling_lengths: [30.0, 30.0, 30.0, 15.0],
      discretization_steps: 5,
    };

    try {
      const res = await api.post("/pcc", data);
      console.log("Backend response:", res.data);
      setResult(res.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Soft Robot Kinematics</h1>
      <button onClick={handleSubmit}>Send Test Input</button>

      {result && (
        <pre style={{ marginTop: "2rem", background: "#eee", padding: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
