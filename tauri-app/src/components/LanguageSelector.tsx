import {
  useLocalization,
  SUPPORTED_LANGUAGES,
} from "../contexts/LocalizationContext";
import type { LanguageCode } from "../contexts/LocalizationContext";

export default function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLocalization();

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
