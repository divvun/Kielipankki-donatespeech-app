import { useState } from "react";
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
import { DetailsPrivacyTab } from "../components/DetailsPrivacyTab";
import { getThemesPathFromSearch } from "../utils/themeLanguage";
import { useTranslation } from "../hooks/useTranslation";

export default function DetailsPage() {
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DetailsHeader
        totalRecorded={totalRecorded.totalFormatted}
        onClose={handleClose}
      />

      <div className="flex px-5">
        <div className="flex-1 flex flex-col items-center gap-2 py-3">
          <span className="text-sm font-semibold text-primary">
            {getString("DetailsInfoTabTitle")}
          </span>
          <div className="w-full h-0.5 rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
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
      </div>
    </div>
  );
}
