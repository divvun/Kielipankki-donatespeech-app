/**
 * Local identity management.
 *
 * Identities are device-local only and store an optional email plus
 * an anonymous client ID used by backend calls.
 */
const CLIENT_ID_STORAGE_KEY = "clientId";
const ACTIVE_CLIENT_ID_STORAGE_KEY = "activeClientId";
const IDENTITIES_STORAGE_KEY = "localIdentitiesV1";

export interface LocalIdentity {
  clientId: string;
  email: string;
  createdAt: string;
  recordedSeconds?: number;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function saveIdentities(identities: LocalIdentity[]): void {
  localStorage.setItem(IDENTITIES_STORAGE_KEY, JSON.stringify(identities));
}

function loadIdentities(): LocalIdentity[] {
  const rawValue = localStorage.getItem(IDENTITIES_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is LocalIdentity =>
        Boolean(
          item &&
          typeof item === "object" &&
          typeof item.clientId === "string" &&
          typeof item.email === "string" &&
          typeof item.createdAt === "string",
        ),
      )
      .map((identity) => ({
        ...identity,
        email: normalizeEmail(identity.email),
        recordedSeconds:
          typeof identity.recordedSeconds === "number"
            ? identity.recordedSeconds
            : 0,
      }));
  } catch {
    return [];
  }
}

function migrateLegacyClientId(
  identities: LocalIdentity[],
  activeClientId: string | null,
): LocalIdentity[] {
  const legacyClientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!legacyClientId) {
    return identities;
  }

  if (!identities.some((identity) => identity.clientId === legacyClientId)) {
    identities.push({
      clientId: legacyClientId,
      email: "",
      createdAt: new Date().toISOString(),
      recordedSeconds: 0,
    });
  }

  if (!activeClientId) {
    localStorage.setItem(ACTIVE_CLIENT_ID_STORAGE_KEY, legacyClientId);
  }

  return identities;
}

function ensureDefaultIdentity(): LocalIdentity {
  const activeClientId = localStorage.getItem(ACTIVE_CLIENT_ID_STORAGE_KEY);
  let identities = loadIdentities();
  identities = migrateLegacyClientId(identities, activeClientId);

  if (identities.length === 0) {
    const identity: LocalIdentity = {
      clientId: crypto.randomUUID(),
      email: "",
      createdAt: new Date().toISOString(),
      recordedSeconds: 0,
    };
    identities = [identity];
    saveIdentities(identities);
    localStorage.setItem(ACTIVE_CLIENT_ID_STORAGE_KEY, identity.clientId);
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, identity.clientId);
    return identity;
  }

  const selectedId =
    activeClientId &&
    identities.some((identity) => identity.clientId === activeClientId)
      ? activeClientId
      : identities[0].clientId;
  const selectedIdentity =
    identities.find((identity) => identity.clientId === selectedId) ||
    identities[0];

  saveIdentities(identities);
  localStorage.setItem(ACTIVE_CLIENT_ID_STORAGE_KEY, selectedIdentity.clientId);
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, selectedIdentity.clientId);

  return selectedIdentity;
}

export function getLocalIdentities(): LocalIdentity[] {
  ensureDefaultIdentity();
  return loadIdentities().sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function getActiveIdentity(): LocalIdentity {
  return ensureDefaultIdentity();
}

export function setActiveClientId(clientId: string): LocalIdentity {
  const normalizedClientId = clientId.trim();
  const identities = getLocalIdentities();
  const identity = identities.find(
    (item) => item.clientId === normalizedClientId,
  );

  if (!identity) {
    throw new Error("Unknown local identity");
  }

  localStorage.setItem(ACTIVE_CLIENT_ID_STORAGE_KEY, identity.clientId);
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, identity.clientId);

  return identity;
}

export function getOrCreateIdentityByEmail(email: string): LocalIdentity {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const identities = getLocalIdentities();
  const existing = identities.find(
    (identity) => identity.email === normalizedEmail,
  );
  if (existing) {
    return setActiveClientId(existing.clientId);
  }

  const createdIdentity: LocalIdentity = {
    clientId: crypto.randomUUID(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  const updated = [...identities, createdIdentity];
  saveIdentities(updated);
  return setActiveClientId(createdIdentity.clientId);
}

export function createAnonymousIdentity(): LocalIdentity {
  const identities = getLocalIdentities();
  const createdIdentity: LocalIdentity = {
    clientId: crypto.randomUUID(),
    email: "",
    createdAt: new Date().toISOString(),
    recordedSeconds: 0,
  };

  saveIdentities([...identities, createdIdentity]);
  return setActiveClientId(createdIdentity.clientId);
}

export function getIdentityRecordedSeconds(clientId: string): number {
  const identities = getLocalIdentities();
  const identity = identities.find((item) => item.clientId === clientId);
  return identity?.recordedSeconds ?? 0;
}

export function addIdentityRecordedSeconds(
  clientId: string,
  seconds: number,
): void {
  const identities = getLocalIdentities();
  const identity = identities.find((item) => item.clientId === clientId);
  if (!identity) {
    return;
  }

  identity.recordedSeconds =
    (identity.recordedSeconds ?? 0) + Math.abs(seconds);
  saveIdentities(identities);
}

export function subtractIdentityRecordedSeconds(
  clientId: string,
  seconds: number,
): void {
  const identities = getLocalIdentities();
  const identity = identities.find((item) => item.clientId === clientId);
  if (!identity) {
    return;
  }

  identity.recordedSeconds = Math.max(
    0,
    (identity.recordedSeconds ?? 0) - Math.abs(seconds),
  );
  saveIdentities(identities);
}

export function getClientId(): string {
  return ensureDefaultIdentity().clientId;
}
