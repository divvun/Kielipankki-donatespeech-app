import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ThemesPage from "./pages/ThemesPage";
import TestPage from "./pages/TestPage";
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

        {/* Placeholder routes - to be implemented */}
        <Route
          path="/schedule/:scheduleId"
          element={<div>Schedule page coming soon...</div>}
        />
        <Route
          path="/details"
          element={<div>Details page coming soon...</div>}
        />
      </Routes>
    </Router>
  );
}

export default App;
