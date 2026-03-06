import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import type { ChoicePromptItem } from "../types/Schedule";

interface SuggestInputViewProps {
  item: ChoicePromptItem;
  answer?: string;
  onAnswerChange: (answer: string) => void;
}

function getInitialAnswerState(
  answer: string | undefined,
  localizedOptions: string[],
): { selectedOption: string; otherText: string } {
  if (!answer) {
    return { selectedOption: "", otherText: "" };
  }

  if (localizedOptions.includes(answer)) {
    return { selectedOption: answer, otherText: "" };
  }

  return { selectedOption: "", otherText: answer };
}

export function SuggestInputView({
  item,
  answer,
  onAnswerChange,
}: SuggestInputViewProps) {
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  const localizedOptions = useMemo(
    () =>
      item.options.map((opt: Record<string, string>) =>
        getLocalizedText(opt, currentLanguage),
      ),
    [item.options, currentLanguage],
  );

  const initialState = getInitialAnswerState(answer, localizedOptions);

  const [selectedOption, setSelectedOption] = useState<string>(
    initialState.selectedOption,
  );
  const [otherText, setOtherText] = useState<string>(initialState.otherText);
  const lastEmittedAnswerRef = useRef<string | undefined>(answer);
  const previousItemIdRef = useRef(item.itemId);

  // Sync from parent answer only when it changes externally
  // or when the prompt item changes.
  useEffect(() => {
    const itemChanged = previousItemIdRef.current !== item.itemId;
    if (itemChanged) {
      previousItemIdRef.current = item.itemId;
    }

    if (!itemChanged && answer === lastEmittedAnswerRef.current) {
      return;
    }

    const initialState = getInitialAnswerState(answer, localizedOptions);
    setSelectedOption(initialState.selectedOption);
    setOtherText(initialState.otherText);
  }, [answer, item.itemId, localizedOptions]);

  // Update answer when text changes
  useEffect(() => {
    const newAnswer = selectedOption || otherText;
    lastEmittedAnswerRef.current = newAnswer;
    onAnswerChange(newAnswer);
  }, [selectedOption, otherText, onAnswerChange]);

  const handleOptionChange = (selected: string) => {
    setSelectedOption(selected);
    setOtherText(""); // Clear custom input when choosing an option
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    setSelectedOption(""); // Clear selected option when entering custom text
  };

  return (
    <div className="space-y-4 mx-8 my-2">
      <select
        value={selectedOption}
        onChange={(e) => handleOptionChange(e.target.value)}
        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900"
      >
        <option value="">{getString("ChooseOptionText")}</option>
        {localizedOptions.map((option, idx) => (
          <option key={idx} value={option}>
            {option}
          </option>
        ))}
      </select>

      {item.options && item.options.length > 0 && (
        <>
          <label className="block text-sm text-gray-700 ml-1">
            {/* TODO: Get proper translation for "Other" label */}
            Other
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
