import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { LocalIdentity } from "../utils/clientId";
import { formatTotalRecorded } from "../utils/preferences";
interface DetailsPrivacyTabProps {
  clientId: string;
  copiedClientId: boolean;
  onCopyClientId: () => void;
  identities: LocalIdentity[];
  activeClientId: string;
  identityMessage: string;
  onSwitchIdentity: (clientId: string) => void;
  onCreateIdentityByEmail: (email: string) => void;
  onCreateAnonymousIdentity: () => void;
}

export function DetailsPrivacyTab({
  clientId,
  copiedClientId,
  onCopyClientId,
  identities,
  activeClientId,
  identityMessage,
  onSwitchIdentity,
  onCreateIdentityByEmail,
  onCreateAnonymousIdentity,
}: DetailsPrivacyTabProps) {
  const { getString } = useTranslation();
  const [newEmail, setNewEmail] = useState("");
  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const createEmailIdentity = () => {
    onCreateIdentityByEmail(newEmail);
    setNewEmail("");
  };

  return (
    <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
      {/* General Info */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsGeneralTitle")}
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsGeneralBody")}
        </p>
        <button
          onClick={() => openLink("https://example.com")}
          className="text-primary hover:underline text-sm text-left"
        >
          {getString("DetailsGeneralLinkTitle")}
        </button>
      </div>

      {/* Privacy */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsPrivacyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsPrivacyBody")}
        </p>
        <button
          onClick={() => openLink("https://example.com/tietosuoja")}
          className="text-primary hover:underline text-sm text-left"
        >
          {getString("DetailsPrivacyLinkTitle")}
        </button>
      </div>

      {/* Remove Recordings */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsRemoveTitle")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getString("DetailsRemoveBody1")}
          <a
            href={`mailto:${getString("DetailsRemoveEmail")}`}
            className="text-primary hover:underline"
          >
            {getString("DetailsRemoveEmailLink")}
          </a>
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsRemoveBody2")}
        </p>

        {/* Client ID */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Your Client ID:</p>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all text-foreground">
            {clientId}
          </div>
        </div>

        <Button onClick={onCopyClientId} className="w-full rounded-full">
          {copiedClientId ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {getString("DetailsRemoveButtonClickedTitle")}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              {getString("DetailsRemoveButtonTitle")}
            </>
          )}
        </Button>
      </div>

      {/* Local Identity Manager */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">
          Local identities
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Email to client ID mapping is stored on this device only.
        </p>

        <label className="text-xs text-muted-foreground">
          Current identity
        </label>
        <select
          value={activeClientId}
          onChange={(event) => onSwitchIdentity(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          {identities.map((identity) => {
            const recordedText = formatTotalRecorded(
              identity.recordedSeconds ?? 0,
            );
            const label = identity.email
              ? `${identity.email} (${recordedText}) ${identity.clientId.slice(0, 8)}`
              : `Anonymous (${recordedText}) ${identity.clientId.slice(0, 8)}`;

            return (
              <option key={identity.clientId} value={identity.clientId}>
                {label}
              </option>
            );
          })}
        </select>

        <label className="text-xs text-muted-foreground">New user email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="name@example.com"
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          />
          <Button onClick={createEmailIdentity} className="rounded-lg">
            Use email
          </Button>
        </div>

        <Button
          onClick={onCreateAnonymousIdentity}
          variant="outline"
          className="rounded-lg"
        >
          Create new anonymous identity
        </Button>

        {identityMessage ? (
          <p className="text-xs text-muted-foreground">{identityMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
