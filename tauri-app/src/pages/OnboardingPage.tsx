import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { getString } = useTranslation();

  const handleContinue = () => {
    navigate("/terms");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Language Selector at top */}
      <div className="p-4">
        <LanguageSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo placeholder - you can replace with actual logo */}
          <div className="flex justify-center">
            <div className="w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center text-white text-6xl font-bold">
              🎙️
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-blue-500">
            {getString("OnboardingTitle")}
          </h1>

          {/* Body Text */}
          <p className="text-lg text-gray-700 whitespace-pre-line px-4">
            {getString("OnboardingBody")}
          </p>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg"
          >
            {getString("ContinueSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
}
