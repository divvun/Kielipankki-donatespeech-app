import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { TermsWelcome } from "../components/TermsWelcome";
import { TermsContent } from "../components/TermsContent";
import { TermsAcceptSection } from "../components/TermsAcceptSection";

export default function TermsPage() {
  const navigate = useNavigate();
  const { getString } = useTranslation();

  const handleAccept = () => {
    // Mark onboarding as completed
    localStorage.setItem("onboardingCompleted", "true");
    // Navigate to themes page
    navigate("/themes");
  };

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <TermsWelcome
          title={getString("TermsHelloTitle")}
          body={getString("TermsHelloBody")}
        />

        <TermsContent getString={getString} onOpenLink={openLink} />

        <TermsAcceptSection
          body={getString("TermsAcceptBody")}
          acceptLabel={getString("TermsAccept")}
          onAccept={handleAccept}
        />
      </div>
    </div>
  );
}
