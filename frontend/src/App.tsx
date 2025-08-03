import { useState } from "react";
import Form from "./components/Form";
import Header from "./components/Header";
import Visualizer3D from "./components/Visualizer3D";

function App() {
  const [segments, setSegments] = useState<number[][][]>([]);

  return (
    <div className="App">
      <Header />
      <Form onResult={setSegments} />
      <Visualizer3D segments={segments} />
    </div>
  );
}

export default App;
