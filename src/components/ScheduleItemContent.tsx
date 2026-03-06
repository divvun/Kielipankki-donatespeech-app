import { useCallback } from "react";
import { MultiChoiceView } from "./MultiChoiceView";
import { SuggestInputView } from "./SuggestInputView";
import { isPromptItem } from "../types/Schedule";
import type { ScheduleItem } from "../types/Schedule";

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
  const isPrompt = isPromptItem(currentItem);
  const currentAnswer = answers[currentItem.itemId] || "";
  const handleCurrentAnswerChange = useCallback(
    (answer: string) => {
      onAnswerChange(currentItem.itemId, answer);
    },
    [onAnswerChange, currentItem.itemId],
  );

  return (
    <div className="px-4">
      {title && (
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
          {title}
        </h2>
      )}
      {body1 && (
        <p className="text-lg text-center mb-2 text-gray-700">{body1}</p>
      )}
      {body2 && (
        <p className="text-base text-center mb-4 text-gray-600">{body2}</p>
      )}

      {isPrompt && (
        <div className="mt-6">
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
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none mx-8"
            ></textarea>
          )}
        </div>
      )}
    </div>
  );
}
