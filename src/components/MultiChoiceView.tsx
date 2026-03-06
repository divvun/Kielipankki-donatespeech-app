import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import type {
  MultiChoicePromptItem,
  SuperChoicePromptItem,
} from "../types/Schedule";

interface MultiChoiceViewProps {
  item: MultiChoicePromptItem | SuperChoicePromptItem;
  answer?: string;
  onAnswerChange: (answer: string) => void;
}

function parseSelections(answer?: string): string[] {
  if (!answer) {
    return [];
  }

  try {
    return JSON.parse(answer) as string[];
  } catch (e) {
    console.error("Failed to parse multi-choice answer:", e);
    return [];
  }
}

function buildAnswer(
  selectedOption: string,
  otherText: string,
  otherOptionLabel: string,
): string {
  const selections: string[] = [];

  if (selectedOption && selectedOption !== otherOptionLabel) {
    selections.push(selectedOption);
  }

  if (otherText.trim()) {
    selections.push(otherText.trim());
  }

  return selections.length === 0 ? "" : JSON.stringify(selections);
}

export function MultiChoiceView({
  item,
  answer,
  onAnswerChange,
}: MultiChoiceViewProps) {
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  // Get localized options
  const localizedOptions = useMemo(
    () => item.options.map((opt) => getLocalizedText(opt, currentLanguage)),
    [item.options, currentLanguage],
  );

  // Get localized otherEntryLabel if present
  const otherEntryLabel = item.otherEntryLabel
    ? getLocalizedText(item.otherEntryLabel, currentLanguage)
    : null;

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");

  // Initialize from existing answer
  useEffect(() => {
    const selections = parseSelections(answer);

    if (selections.length > 0) {
      // Check if first selection matches a localized option.
      if (localizedOptions.includes(selections[0])) {
        setSelectedOption(selections[0]);
        if (selections.length > 1) {
          setOtherText(selections[1]);
        }
      } else {
        // This was manually typed, select "Other" (last option).
        setSelectedOption(localizedOptions[localizedOptions.length - 1]);
        setOtherText(selections[0]);
      }
    }
  }, [answer, localizedOptions]);

  // Update answer when selections change
  useEffect(() => {
    const otherOptionLabel =
      localizedOptions[localizedOptions.length - 1] || "";
    const newAnswer = buildAnswer(selectedOption, otherText, otherOptionLabel);
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
