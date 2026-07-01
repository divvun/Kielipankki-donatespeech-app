import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import {
  createAnonymousIdentity,
  getClientId,
  getLocalIdentities,
  getOrCreateIdentityByEmail,
  setActiveClientId,
} from "../utils/clientId";
import { DetailsHeader } from "../components/DetailsHeader";
import { DetailsTabs, type DetailsTabType } from "../components/DetailsTabs";
import {
  DetailsRecordingsTab,
  type RecordingWithDuration,
} from "../components/DetailsRecordingsTab";
import { DetailsPrivacyTab } from "../components/DetailsPrivacyTab";
import {
  getThemeLanguageFromSearch,
  getThemesPathFromSearch,
} from "../utils/themeLanguage";
import { useTranslation } from "../hooks/useTranslation";
import { platformApi } from "@/platform";
import { subtractRecordedSeconds } from "@/utils/preferences";

// interface RecordingWithDuration extends Recording {
//   duration?: number;
// }

export default function DetailsPage() {
  const [activeTab, setActiveTab] = useState<DetailsTabType>("recordings");
  const [recordings, setRecordings] = useState<RecordingWithDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState(getClientId());
  const [identities, setIdentities] = useState(getLocalIdentities());
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const totalRecorded = useTotalRecorded();
  const { getString } = useTranslation();

  const refreshIdentityState = () => {
    setClientId(getClientId());
    setIdentities(getLocalIdentities());
  };

  const fetchRecordings = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await platformApi.getRecordings();

      // Parse metadata to extract duration
      const recordingsWithDuration = result.map((rec) => {
        let duration: number | undefined;
        if (rec.metadata) {
          try {
            const metadata = JSON.parse(rec.metadata);
            duration =
              metadata.recordingDuration || metadata.recording_duration;
          } catch (e) {
            console.error("Failed to parse metadata for", rec.recordingId, e);
          }
        }
        return { ...rec, duration };
      });
      setRecordings(recordingsWithDuration);
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (recording: RecordingWithDuration) => {
    if (!confirm(`Delete recording "${recording.fileName}"?`)) return;

    setDeletingId(recording.recordingId);
    try {
      await platformApi.deleteRecording(recording.recordingId);

      // Subtract duration from total recorded time
      if (recording.duration) {
        subtractRecordedSeconds(Math.floor(recording.duration));
      }
      setRecordings((prev) =>
        prev.filter((r) => r.recordingId !== recording.recordingId),
      );
      totalRecorded.refresh();
    } catch (err) {
      console.error("Failed to delete recording:", err);
      alert(`Failed to delete recording: ${err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    navigate(getThemesPathFromSearch(location.search));
  };

  const copyClientId = async () => {
    try {
      await navigator.clipboard.writeText(clientId);
      setCopiedClientId(true);
      setTimeout(() => setCopiedClientId(false), 3000);
    } catch (err) {
      console.error("Failed to copy client ID:", err);
    }
  };

  const handleSwitchIdentity = (nextClientId: string) => {
    try {
      setActiveClientId(nextClientId);
      refreshIdentityState();
      setIdentityMessage(getString("DetailsIdentitySwitchedMessage"));
    } catch (err) {
      console.error("Failed to switch identity:", err);
      setIdentityMessage(getString("DetailsIdentitySwitchFailedMessage"));
    }
  };

  const handleCreateIdentityByEmail = (email: string) => {
    try {
      getOrCreateIdentityByEmail(email);
      refreshIdentityState();
      setIdentityMessage(getString("DetailsIdentityEmailLinkedMessage"));
    } catch (err) {
      console.error("Failed to create email identity:", err);
      setIdentityMessage(getString("DetailsIdentityEmailInvalidMessage"));
    }
  };

  const handleCreateAnonymousIdentity = () => {
    createAnonymousIdentity();
    refreshIdentityState();
    setIdentityMessage(getString("DetailsIdentityCreatedMessage"));
  };

  return (
    <div className="h-dvh bg-gray-100 flex flex-col">
      <DetailsHeader
        totalRecorded={totalRecorded.totalFormatted}
        onClose={handleClose}
        backLabel={
          getThemeLanguageFromSearch(location.search)
            ? getString("ThemesPageTitleText")
            : getString("ChooseLanguageTitle")
        }
      />

      <DetailsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 px-6 pt-6 pb-6 overflow-y-auto">
        {activeTab === "recordings" ? (
          <DetailsRecordingsTab
            loading={loading}
            error={error}
            recordings={recordings}
            deletingId={deletingId}
            onDelete={handleDelete}
          />
        ) : (
          <DetailsPrivacyTab
            clientId={clientId}
            copiedClientId={copiedClientId}
            onCopyClientId={copyClientId}
            identities={identities}
            activeClientId={clientId}
            identityMessage={identityMessage}
            onSwitchIdentity={handleSwitchIdentity}
            onCreateIdentityByEmail={handleCreateIdentityByEmail}
            onCreateAnonymousIdentity={handleCreateAnonymousIdentity}
          />
        )}
        <div className="pb-safe" />
      </div>
    </div>
  );
}
