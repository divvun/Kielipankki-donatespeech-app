import { useTranslation } from "../hooks/useTranslation";
import { SamiBarAnimation } from "@/components/SamiBarAnimation";
import { MessageCircle, Clock, Shield } from "lucide-react";

export function OnboardingSummary() {
  const { getString } = useTranslation();
  return (
    <>
      {/* Animated Sami Flag Bars */}
      <div className="flex justify-center items-center h-50">
        <SamiBarAnimation />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 gap-6">
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight text-center text-foreground">
          {getString("OnboardingTitle")}
        </h1>
        <p className="text-base text-muted-foreground text-center leading-relaxed">
          {getString("OnboardingBody")}
        </p>

        {/* Feature Bullets — with icon boxes and title+description */}
        <div className="flex flex-col gap-5">
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <MessageCircle className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">
                {getString("OnboardingFeature1Title")}
              </span>
              <span className="text-[13px] text-muted-foreground leading-snug">
                {getString("OnboardingFeature1Body")}
              </span>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Clock className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">
                {getString("OnboardingFeature2Title")}
              </span>
              <span className="text-[13px] text-muted-foreground leading-snug">
                {getString("OnboardingFeature2Body")}
              </span>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Shield className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">
                {getString("OnboardingFeature3Title")}
              </span>
              <span className="text-[13px] text-muted-foreground leading-snug">
                {getString("OnboardingFeature3Body")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
