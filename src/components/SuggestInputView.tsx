import { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import type { ChoicePromptItem } from "../types/Schedule";

interface SuggestInputViewProps {
  item: ChoicePromptItem;
  answer?: string;
  onAnswerChange: (answer: string) => void;
}

function filterSuggestions(options: string[], text: string): string[] {
  return options.filter((option) =>
    option.toLowerCase().startsWith(text.toLowerCase()),
  );
}

function getInitialAnswerState(
  answer: string | undefined,
  localizedOptions: string[],
): { suggestText: string; otherText: string } {
  if (!answer) {
    return { suggestText: "", otherText: "" };
  }

  if (localizedOptions.includes(answer)) {
    return { suggestText: answer, otherText: "" };
  }

  return { suggestText: "", otherText: answer };
}

export function SuggestInputView({
  item,
  answer,
  onAnswerChange,
}: SuggestInputViewProps) {
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  // Get localized options
  const localizedOptions = item.options.map((opt: Record<string, string>) =>
    getLocalizedText(opt, currentLanguage),
  );

  const [suggestText, setSuggestText] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Initialize from existing answer
  useEffect(() => {
    const initialState = getInitialAnswerState(answer, localizedOptions);
    setSuggestText(initialState.suggestText);
    setOtherText(initialState.otherText);
  }, [answer, localizedOptions]);

  // Update answer when text changes
  useEffect(() => {
    const newAnswer = suggestText || otherText;
    onAnswerChange(newAnswer);
  }, [suggestText, otherText, onAnswerChange]);

  const handleSuggestTextChange = (text: string) => {
    setSuggestText(text);
    setOtherText(""); // Clear other entry when suggest box changes

    // Filter suggestions
    if (text.trim()) {
      const filtered = filterSuggestions(localizedOptions, text);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    setSuggestText(""); // Clear suggest box when other entry changes
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestText(suggestion);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  return (
    <div className="space-y-4 mx-8 my-2">
      <label className="block text-sm text-gray-700 ml-1">
        {getString("StartTypingLabelText")}
      </label>

      <div className="relative">
        <input
          type="text"
          value={suggestText}
          onChange={(e) => handleSuggestTextChange(e.target.value)}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-200 last:border-b-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

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
