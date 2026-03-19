import { useCallback } from "react";
import { MultiChoiceView } from "./MultiChoiceView";
import { SuggestInputView } from "./SuggestInputView";
import { isMediaItem, isPromptItem } from "../types/Schedule";
import type { ScheduleItem } from "../types/Schedule";
import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ScheduleItemContentProps {
  currentItem: ScheduleItem;
  title: string;
  body1: string;
  body2: string;
  answers: Record<string, string>;
  onAnswerChange: (itemId: string, answer: string) => void;
}

export function ScheduleItemContent({
  currentItem,
  title,
  body1,
  body2,
  answers,
  onAnswerChange,
}: ScheduleItemContentProps) {
  const { getString } = useTranslation();
  const isMedia = isMediaItem(currentItem);
  const isPrompt = isPromptItem(currentItem);
  const currentAnswer = answers[currentItem.itemId] || "";
  const handleCurrentAnswerChange = useCallback(
    (answer: string) => {
      onAnswerChange(currentItem.itemId, answer);
    },
    [onAnswerChange, currentItem.itemId],
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        {title && (
          <h2 className="text-lg font-extrabold tracking-tight leading-tight text-foreground">
            {title}
          </h2>
        )}
        {body1 && (
          <p className="text-lg tracking-tight leading-tight text-foreground">
            {body1}
          </p>
        )}
        {body2 && (
          <p className="text-lg tracking-tight leading-tight text-foreground">
            {body2}
          </p>
        )}

        {/* Language hint */}
        {isMedia && currentItem.isRecording && (
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              {getString("OnboardingFeature2Desc")}
            </span>
          </div>
        )}
      </div>

      {isPrompt && (
        <div>
          {currentItem.itemType === "choice" && "options" in currentItem && (
            <SuggestInputView
              item={currentItem}
              answer={currentAnswer}
              onAnswerChange={handleCurrentAnswerChange}
            />
          )}
          {(currentItem.itemType === "multi-choice" ||
            currentItem.itemType === "super-choice") &&
            "options" in currentItem && (
              <MultiChoiceView
                item={currentItem}
                answer={currentAnswer}
                onAnswerChange={handleCurrentAnswerChange}
              />
            )}
          {currentItem.itemType === "text-input" && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleCurrentAnswerChange(e.target.value)}
              placeholder="Enter your answer..."
              rows={4}
              className="w-full p-4 border border-input rounded-2xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            ></textarea>
          )}
        </div>
      )}
    </>
  );
}
