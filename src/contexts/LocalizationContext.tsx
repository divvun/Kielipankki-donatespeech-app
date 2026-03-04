import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";

// Supported language codes
export const SUPPORTED_LANGUAGES = {
  fi: true,
  se: true,
  sma: true,
  smj: true,
  sms: true,
  smn: true,
  nb: true,
  nn: true,
  sv: true,
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
  try {
    const response = await fetch(`/locales/${locale}.ftl`);
    if (!response.ok) {
      throw new Error(`Failed to load ${locale}.ftl: ${response.status}`);
    }
    const messages = await response.text();
    return new FluentResource(messages);
  } catch (error) {
    console.error(`Error loading messages for ${locale}:`, error);
    throw error;
  }
}

// Create bundles for the given locales
async function createBundles(locales: LanguageCode[]): Promise<FluentBundle[]> {
  const bundles: FluentBundle[] = [];

  for (const locale of locales) {
    try {
      const bundle = new FluentBundle(locale);
      const resource = await loadMessages(locale);
      bundle.addResource(resource);
      bundles.push(bundle);
      console.log(`Loaded translations for ${locale}`);
    } catch (error) {
      console.error(`Failed to load bundle for ${locale}:`, error);
      // Continue with other locales
    }
  }

  return bundles;
}

// Get stored language preference
function getStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem("language");
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as LanguageCode;
  }
  return "nb"; // Default to Norwegian Bokmål
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
      try {
        console.log("Loading localization for:", currentLanguage);

        // Load current language and fallback to Norwegian Bokmål
        const locales: LanguageCode[] =
          currentLanguage === "nb" ? ["nb"] : [currentLanguage, "nb"];

        const bundles = await createBundles(locales);

        if (bundles.length === 0) {
          console.error("No bundles loaded, creating empty localization");
          // Create a minimal working localization even if loading failed
          const emptyBundle = new FluentBundle("en");
          setL10n(new ReactLocalization([emptyBundle]));
        } else {
          const localization = new ReactLocalization(bundles);
          setL10n(localization);
          console.log("Localization ready");
        }
      } catch (error) {
        console.error("Error setting up localization:", error);
        // Create a fallback to prevent app from being stuck
        const fallbackBundle = new FluentBundle("en");
        setL10n(new ReactLocalization([fallbackBundle]));
      }
    }

    setupLocalization();
  }, [currentLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  if (!l10n) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Loading translations...</div>
      </div>
    );
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
