import type { ScheduleItem } from "@/types/Schedule";
import { SuggestInputView } from "./SuggestInputView";
import { MultiChoiceView } from "./MultiChoiceView";
import { useCallback } from "react";

interface SchedulePromptSectionProps {
  currentItem: ScheduleItem;
  answers: Record<string, string>;
  onAnswerChange: (itemId: string, answer: string) => void;
}

export function SchedulePromptSection({
  currentItem,
  answers,
  onAnswerChange,
}: SchedulePromptSectionProps) {
  const currentAnswer = answers[currentItem.itemId] || "";
  const handleCurrentAnswerChange = useCallback(
    (answer: string) => {
      onAnswerChange(currentItem.itemId, answer);
    },
    [onAnswerChange, currentItem.itemId],
  );

  return (
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
      {currentItem.kind === "prompt" && currentItem.itemType === "text" && (
        <textarea
          value={currentAnswer}
          onChange={(e) => handleCurrentAnswerChange(e.target.value)}
          placeholder="Enter your answer..."
          rows={4}
          className="w-full p-4 border border-input rounded-2xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        ></textarea>
      )}
    </div>
  );
}
