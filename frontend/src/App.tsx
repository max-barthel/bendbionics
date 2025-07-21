import axios from "axios";
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get<{ message: string }>("http://localhost:8000/api/ping")
      .then((res) => setMessage(res.data.message))
      .catch((err: unknown) => {
        console.error("Backend error:", err);
        setMessage("Failed to connect to backend");
      });
  }, []);

  return (
    <div className="p-10 text-center text-xl">
      Backend says: <strong>{message}</strong>
    </div>
  );
}

export default App;
