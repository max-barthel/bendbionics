import { useState } from "react";
import Card from "./components/Card";
import Form from "./components/Form";
import Header from "./components/Header";
import Visualizer3D from "./components/Visualizer3D";

function App() {
  const [segments, setSegments] = useState<number[][][]>([]);

  return (
    <div>
      <Header />
      <Card className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Form onResult={setSegments} />
        <Visualizer3D segments={segments} />
      </Card>
    </div>
  );
}

export default App;
