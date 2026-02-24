import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

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
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getString("TermsHelloTitle")}
          </h1>
          <p className="text-base text-gray-700">
            {getString("TermsHelloBody")}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-8 mb-8">
          {/* General Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsGeneralTitle")}
            </h2>
            <p className="text-gray-700 whitespace-pre-line mb-3">
              {getString("TermsGeneralBody")}
            </p>
            <button
              onClick={() => openLink(getString("TermsGeneralUrl"))}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {getString("TermsGeneralLink")}
            </button>
          </section>

          {/* Ownership Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsOwnershipTitle")}
            </h2>
            <p className="text-gray-700">
              {getString("TermsOwnershipBody1")}
              <button
                onClick={() => openLink(getString("TermsOwnershipLinkUrl"))}
                className="text-blue-600 hover:text-blue-800 underline mx-1"
              >
                {getString("TermsOwnershipLink")}
              </button>
              {getString("TermsOwnershipBody2")}
            </p>
          </section>

          {/* Voluntary Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsVoluntaryTitle")}
            </h2>
            <p className="text-gray-700">{getString("TermsVoluntaryBody")}</p>
          </section>

          {/* Privacy Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsPrivacyTitle")}
            </h2>
            <p className="text-gray-700 mb-3">
              {getString("TermsPrivacyBody")}
            </p>
            <button
              onClick={() => openLink(getString("TermsPrivacyUrl"))}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {getString("TermsPrivacyLink")}
            </button>
          </section>

          {/* Rights Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsRightsTitle")}
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {getString("TermsRightsBody")}
            </p>
          </section>

          {/* Appropriate Use Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsAppropriateUseTitle")}
            </h2>
            <p className="text-gray-700">
              {getString("TermsAppropriateUseBody")}
            </p>
          </section>

          {/* Additional Info Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {getString("TermsAdditionalTitle")}
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                {getString("TermsAdditionalWebsite")}
                <button
                  onClick={() =>
                    openLink(getString("TermsAdditionalWebsiteUrl"))
                  }
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {getString("TermsAdditionalWebsiteLink")}
                </button>
              </p>
              <p>{getString("TermsAdditionalContact")}</p>
              <p>
                <button
                  onClick={() => openLink(getString("TermsAdditionalUrl"))}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {getString("TermsAdditionalLink")}
                </button>
              </p>
              <p>
                <a
                  href={`mailto:${getString("TermsAdditionalEmail")}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {getString("TermsAdditionalEmail")}
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="border-t pt-6 text-center">
          <p className="text-gray-700 mb-6">{getString("TermsAcceptBody")}</p>
          <button
            onClick={handleAccept}
            className="bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg"
          >
            {getString("TermsAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
