import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getClientId } from "../utils/clientId";
import { DetailsHeader } from "../components/DetailsHeader";
import { DetailsPrivacyTab } from "../components/DetailsPrivacyTab";

export default function DetailsPage() {
  const [clientId] = useState(getClientId());
  const [copiedClientId, setCopiedClientId] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const totalRecorded = useTotalRecorded();

  const handleClose = () => {
    navigate(`/themes${location.search}`);
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DetailsHeader
        totalRecorded={totalRecorded.totalFormatted}
        onClose={handleClose}
      />

      <div className="flex px-5">
        <div className="flex-1 flex flex-col items-center gap-2 py-3">
          <span className="text-sm font-semibold text-primary">Info</span>
          <div className="w-full h-0.5 rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <DetailsPrivacyTab
          clientId={clientId}
          copiedClientId={copiedClientId}
          onCopyClientId={copyClientId}
        />
      </div>
    </div>
  );
}
