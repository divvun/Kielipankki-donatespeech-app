import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { TermsWelcome } from "../components/TermsWelcome";
import { TermsContent } from "../components/TermsContent";
import { TermsAcceptSection } from "../components/TermsAcceptSection";

export default function TermsPage() {
  const navigate = useNavigate();
  const { getString } = useTranslation();

  const handleAccept = () => {
    localStorage.setItem("onboardingCompleted", "true");
    navigate("/themes");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <TermsWelcome
          title={getString("TermsPageTitle")}
          body={getString("TermsPageSubtitle")}
        />

        <TermsContent getString={getString} />

        <TermsAcceptSection
          acceptLabel={getString("TermsAccept")}
          onAccept={handleAccept}
        />
      </div>
    </div>
  );
}
