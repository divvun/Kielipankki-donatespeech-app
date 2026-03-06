import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import OnboardingPage from "./pages/OnboardingPage";
import TermsPage from "./pages/TermsPage";
import ThemesPage from "./pages/ThemesPage";
import ScheduleStartPage from "./pages/ScheduleStartPage";
import SchedulePage from "./pages/SchedulePage";
import ScheduleFinishPage from "./pages/ScheduleFinishPage";
import TestPage from "./pages/TestPage";
import DetailsPage from "./pages/DetailsPage";
import { getClientId } from "./utils/clientId";
import { platformApi } from "./platform";
import "./App.css";

function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  // Check if onboarding is completed
  useEffect(() => {
    const completed = localStorage.getItem("onboardingCompleted") === "true";
    setOnboardingCompleted(completed);
  }, []);

  // Fix any existing recordings that have test-client-id
  useEffect(() => {
    const fixExistingRecordings = async () => {
      try {
        const clientId = getClientId();
        const updated = await platformApi.fixClientIds(clientId);
        if (updated > 0) {
          console.log(`Fixed client IDs for ${updated} recordings`);
        }
      } catch (error) {
        console.error("Failed to fix client IDs:", error);
      }
    };

    fixExistingRecordings();
  }, []);

  // Show loading state while checking onboarding status
  if (onboardingCompleted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Default route - redirect based on onboarding status */}
        <Route
          path="/"
          element={
            <Navigate
              to={onboardingCompleted ? "/themes" : "/onboarding"}
              replace
            />
          }
        />

        {/* Onboarding flow */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Themes page - main entry point after onboarding */}
        <Route path="/themes" element={<ThemesPage />} />

        {/* Test page for development */}
        <Route path="/test" element={<TestPage />} />

        {/* Schedule flow - start page, schedule items, finish page */}
        <Route
          path="/schedule/:scheduleId/start"
          element={<ScheduleStartPage />}
        />
        <Route path="/schedule/:scheduleId" element={<SchedulePage />} />
        <Route
          path="/schedule/:scheduleId/finish"
          element={<ScheduleFinishPage />}
        />

        {/* Details page - view and manage recordings */}
        <Route path="/details" element={<DetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
