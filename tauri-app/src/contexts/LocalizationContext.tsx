import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";

// Supported languages with their names
export const SUPPORTED_LANGUAGES = {
  fi: "Suomi",
  se: "Northern Sámi",
  sma: "Southern Sámi",
  smj: "Lule Sámi",
  sms: "Skolt Sámi",
  smn: "Inari Sámi",
  nb: "Norsk Bokmål",
  nn: "Norsk Nynorsk",
  sv: "Svenska",
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface LocalizationContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  l10n: ReactLocalization;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

// Load Fluent file content
async function loadMessages(locale: LanguageCode): Promise<FluentResource> {
  const response = await fetch(`/locales/${locale}.ftl`);
  const messages = await response.text();
  return new FluentResource(messages);
}

// Create bundles for the given locales
async function createBundles(locales: LanguageCode[]): Promise<FluentBundle[]> {
  const bundles: FluentBundle[] = [];

  for (const locale of locales) {
    const bundle = new FluentBundle(locale);
    const resource = await loadMessages(locale);
    bundle.addResource(resource);
    bundles.push(bundle);
  }

  return bundles;
}

// Get stored language preference
function getStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem("language");
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as LanguageCode;
  }
  return "fi"; // Default to Finnish
}

export function FluentLocalizationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentLanguage, setCurrentLanguageState] =
    useState<LanguageCode>(getStoredLanguage());
  const [l10n, setL10n] = useState<ReactLocalization | null>(null);

  // Load and set up localization
  useEffect(() => {
    async function setupLocalization() {
      // Load current language and fallback to Finnish
      const locales: LanguageCode[] =
        currentLanguage === "fi" ? ["fi"] : [currentLanguage, "fi"];

      const bundles = await createBundles(locales);
      const localization = new ReactLocalization(bundles);
      setL10n(localization);
    }

    setupLocalization();
  }, [currentLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  if (!l10n) {
    return <div>Loading translations...</div>;
  }

  const contextValue: LocalizationContextType = {
    currentLanguage,
    setLanguage,
    l10n,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      <LocalizationProvider l10n={l10n}>{children}</LocalizationProvider>
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error(
      "useLocalization must be used within a FluentLocalizationProvider",
    );
  }
  return context;
}
