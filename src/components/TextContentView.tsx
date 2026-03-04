import { useState, useEffect } from "react";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import type { TextContentItem } from "../types/Schedule";

interface TextContentViewProps {
  item: TextContentItem;
}

export function TextContentView({ item }: TextContentViewProps) {
  const { currentLanguage } = useLocalization();
  
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Get localized state content
  const title = getLocalizedText(item.default.title, currentLanguage);
  const body1 = getLocalizedText(item.default.body1, currentLanguage);
  const body2 = getLocalizedText(item.default.body2, currentLanguage);

  // Fetch text content from URL
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(item.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Error fetching text content:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load text content",
        );
      } finally {
        setLoading(false);
      }
    };

    if (item.url) {
      fetchContent();
    }
  }, [item.url]);

  // Determine if content is HTML or plain text
  const isHtml =
    item.typeId?.toLowerCase().includes("html") ||
    item.typeId === "text/html";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Display localized title and body text */}
      {title && (
        <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      )}
      {body1 && <p className="text-base mb-2 text-gray-700">{body1}</p>}
      {body2 && <p className="text-sm mb-4 text-gray-600">{body2}</p>}

      {/* Display content */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 rounded p-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && content && (
        <>
          {isHtml ? (
            <div
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-gray-700 font-sans">
              {content}
            </pre>
          )}
        </>
      )}

      {!loading && !error && !content && (
        <p className="text-gray-500 italic">No content available</p>
      )}
    </div>
  );
}
