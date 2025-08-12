import { useEffect, useState } from "react";
import Form from "./components/Form";
import { Card, Header, LoadingSpinner, Typography } from "./components/ui";
import Visualizer3D from "./components/Visualizer3D";

function App() {
  const [segments, setSegments] = useState<number[][][]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" color="primary" className="mb-4" />
          <Typography variant="h2" color="primary" className="mb-2">
            Loading Soft Robot App
          </Typography>
          <Typography variant="body" color="gray">
            Initializing components...
          </Typography>
        </div>
      </div>
    );
  }

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
