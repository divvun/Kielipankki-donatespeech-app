import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ThemesPage from "./pages/ThemesPage";
import SchedulePage from "./pages/SchedulePage";
import TestPage from "./pages/TestPage";
import DetailsPage from "./pages/DetailsPage";
import "./App.css";

function App() {
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
