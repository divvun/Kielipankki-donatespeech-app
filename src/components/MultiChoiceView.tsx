import { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import type { MultiChoicePromptItem, SuperChoicePromptItem } from "../types/Schedule";

interface MultiChoiceViewProps {
  item: MultiChoicePromptItem | SuperChoicePromptItem;
  answer?: string;
  onAnswerChange: (answer: string) => void;
}

export function MultiChoiceView({ item, answer, onAnswerChange }: MultiChoiceViewProps) {
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();
  
  // Get localized options
  const localizedOptions = item.options.map((opt) =>
    getLocalizedText(opt, currentLanguage),
  );
  
  // Get localized otherEntryLabel if present
  const otherEntryLabel = item.otherEntryLabel
    ? getLocalizedText(item.otherEntryLabel, currentLanguage)
    : null;
  
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");

  // Initialize from existing answer
  useEffect(() => {
    if (answer) {
      try {
        const selections = JSON.parse(answer) as string[];
        if (selections && selections.length > 0) {
          // Check if first selection matches a localized option
          if (localizedOptions.includes(selections[0])) {
            setSelectedOption(selections[0]);
            if (selections.length > 1) {
              setOtherText(selections[1]);
            }
          } else {
            // This was manually typed, select "Other" (last option)
            setSelectedOption(localizedOptions[localizedOptions.length - 1]);
            setOtherText(selections[0]);
          }
        }
      } catch (e) {
        console.error("Failed to parse multi-choice answer:", e);
      }
    }
  }, [answer, localizedOptions]);

  // Update answer when selections change
  useEffect(() => {
    const selections: string[] = [];

    if (selectedOption) {
      // Don't include the last option ("Other") in the answer
      if (selectedOption !== localizedOptions[localizedOptions.length - 1]) {
        selections.push(selectedOption);
      }
    }

    if (otherText.trim()) {
      selections.push(otherText.trim());
    }

    const newAnswer = selections.length === 0 ? "" : JSON.stringify(selections);
    onAnswerChange(newAnswer);
  }, [selectedOption, otherText, localizedOptions, onAnswerChange]);

  const handleOtherTextChange = (text: string) => {
    // If text is entered but no option selected, clear selection
    if (text && !selectedOption) {
      setSelectedOption("");
    }
    setOtherText(text);
  };

  return (
    <div className="space-y-4 mx-8 my-2">
      <select
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900"
      >
        <option value="">{getString("ChooseOptionText")}</option>
        {localizedOptions.map((option, idx) => (
          <option key={idx} value={option}>
            {option}
          </option>
        ))}
      </select>

      {otherEntryLabel && (
        <>
          <label className="block text-sm text-gray-700 ml-1">
            {otherEntryLabel}
          </label>
          <input
            type="text"
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </>
      )}
    </div>
  );
}
