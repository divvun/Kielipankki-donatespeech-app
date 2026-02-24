import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ThemesPage from "./pages/ThemesPage";
import SchedulePage from "./pages/SchedulePage";
import TestPage from "./pages/TestPage";
import DetailsPage from "./pages/DetailsPage";
import { getClientId } from "./utils/clientId";
import "./App.css";

function App() {
  // Fix any existing recordings that have test-client-id
  useEffect(() => {
    const fixExistingRecordings = async () => {
      try {
        const clientId = getClientId();
        const updated = await invoke<number>("fix_client_ids", {
          realClientId: clientId,
        });
        if (updated > 0) {
          console.log(`Fixed client IDs for ${updated} recordings`);
        }
      } catch (error) {
        console.error("Failed to fix client IDs:", error);
      }
    };

    fixExistingRecordings();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Default route - redirect to themes */}
        <Route path="/" element={<Navigate to="/themes" replace />} />

        {/* Themes page - main entry point */}
        <Route path="/themes" element={<ThemesPage />} />

        {/* Test page for development */}
        <Route path="/test" element={<TestPage />} />

        {/* Schedule page - display schedule items */}
        <Route path="/schedule/:scheduleId" element={<SchedulePage />} />

        {/* Details page - view and manage recordings */}
        <Route path="/details" element={<DetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
