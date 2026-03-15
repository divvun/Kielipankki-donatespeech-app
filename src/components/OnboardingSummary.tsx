import { useTranslation } from "../hooks/useTranslation";


const iconContainerClassName = "flex justify-center";
const iconClassName =
  "w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center text-white text-6xl font-bold";
const titleClassName = "text-3xl font-bold text-blue-500";
const bodyClassName = "text-lg text-gray-700 whitespace-pre-line px-4";

export function OnboardingSummary() {
  const { getString } = useTranslation();
  return (
    <>
      <div className={iconContainerClassName}>
        <div className={iconClassName}>
          🎙️
        </div>
      </div>

      <h1 className={titleClassName}>{getString("OnboardingTitle")}</h1>
      <p className={bodyClassName}>{getString("OnboardingBody1")}</p>

    <div>
      <h1>{getString("OnboardingTitle")}</h1>
      <p>{getString("OnboardingBody1")}</p>

      <div>
        <div>
          <div>
            <svg width="22" height="22" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          </div>
          <div>
            <div>{getString("OnboardingFeature1Title")}</div>
            <div>{getString("OnboardingFeature1Body")}</div>
          </div>
        </div>
        <div>
          <div>
            <svg width="22" height="22" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div>{getString("OnboardingFeature2Title")}</div>
            <div>{getString("OnboardingFeature2Body")}</div>
          </div>
        </div>
        <div>
          <div>
            <svg width="22" height="22" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          </div>
          <div>
            <div>{getString("OnboardingFeature3Title")}</div>
            <div>{getString("OnboardingFeature3Body")}</div>
          </div>
        </div>
      </div>
    </div>      
    </>
  );
}
