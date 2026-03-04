// Localized content state for media items and prompts
export interface MediaState {
  title: Record<string, string>;
  body1: Record<string, string>;
  body2: Record<string, string>;
  imageUrl?: string | null;
}

// Schedule state for start/finish screens
export interface ScheduleState {
  title: Record<string, string>;
  body1: Record<string, string>;
  body2?: Record<string, string> | null;
  imageUrl?: string | null;
}

export interface Schedule {
  id?: string | null;
  scheduleId?: string | null;
  title?: Record<string, string> | null;
  body1?: Record<string, string> | null;
  body2?: Record<string, string> | null;
  start?: ScheduleState | null;
  finish?: ScheduleState | null;
  items: ScheduleItem[];
}

// Base fields common to all media items
export interface BaseMediaItem {
  kind: "media";
  itemId: string;
  url: string;
  typeId?: string | null;
  default: MediaState;
  options: never[]; // Empty array for media items
  isRecording: boolean;
  start?: MediaState | null;
  recording?: MediaState | null;
  finish?: MediaState | null;
  metaTitle?: Record<string, string> | null;
  startTime?: number;
  endTime?: number;
}

// Base fields common to all prompt items
export interface BasePromptItem {
  kind: "prompt";
  itemId: string;
  url: string; // Image URL for the prompt
  typeId?: string | null;
  default: MediaState;
  options: Array<Record<string, string>>;
  isRecording: boolean;
  startTime?: number;
  endTime?: number;
}

// Media Items
export interface AudioMediaItem extends BaseMediaItem {
  itemType: "audio";
}

export interface VideoMediaItem extends BaseMediaItem {
  itemType: "video";
}

export interface ImageMediaItem extends BaseMediaItem {
  itemType: "image";
}

export interface TextMediaItem extends BaseMediaItem {
  itemType: "text";
}

export interface YleAudioMediaItem extends BaseMediaItem {
  itemType: "yle-audio";
}

export interface YleVideoMediaItem extends BaseMediaItem {
  itemType: "yle-video";
}

// Fake YLE items (returned when YLE credentials not configured)
export interface FakeYleAudioMediaItem {
  kind: "media";
  itemType: "fake-yle-audio";
  itemId: string;
  url: string; // YLE program ID (not decrypted)
  startTime?: number;
  endTime?: number;
}

export interface FakeYleVideoMediaItem {
  kind: "media";
  itemType: "fake-yle-video";
  itemId: string;
  url: string; // YLE program ID (not decrypted)
  startTime?: number;
  endTime?: number;
}

// Text content item
export interface TextContentItem {
  kind: "media";
  itemType: "text-content";
  itemId: string;
  url: string;
  typeId?: string | null;
  default: MediaState;
  startTime?: number;
  endTime?: number;
}

// Prompt Items
export interface ChoicePromptItem extends BasePromptItem {
  itemType: "choice";
}

export interface MultiChoicePromptItem extends BasePromptItem {
  itemType: "multi-choice";
  otherAnswer?: Record<string, string> | null;
  otherEntryLabel?: Record<string, string> | null;
}

export interface SuperChoicePromptItem extends BasePromptItem {
  itemType: "super-choice";
  otherEntryLabel?: Record<string, string> | null;
}

export interface TextInputItem extends BasePromptItem {
  itemType: "text-input";
}

// Discriminated union of all schedule item types
export type ScheduleItem =
  | AudioMediaItem
  | VideoMediaItem
  | ImageMediaItem
  | TextMediaItem
  | TextContentItem
  | YleAudioMediaItem
  | YleVideoMediaItem
  | FakeYleAudioMediaItem
  | FakeYleVideoMediaItem
  | ChoicePromptItem
  | MultiChoicePromptItem
  | SuperChoicePromptItem
  | TextInputItem;

// Type guard helpers
export function isMediaItem(
  item: ScheduleItem,
): item is
  | AudioMediaItem
  | VideoMediaItem
  | ImageMediaItem
  | TextMediaItem
  | TextContentItem
  | YleAudioMediaItem
  | YleVideoMediaItem
  | FakeYleAudioMediaItem
  | FakeYleVideoMediaItem {
  return item.kind === "media";
}

export function isPromptItem(
  item: ScheduleItem,
): item is
  | ChoicePromptItem
  | MultiChoicePromptItem
  | SuperChoicePromptItem
  | TextInputItem {
  return item.kind === "prompt";
}

// Type guard for fake YLE items
export function isFakeYleItem(
  item: ScheduleItem,
): item is FakeYleAudioMediaItem | FakeYleVideoMediaItem {
  return (
    item.itemType === "fake-yle-audio" || item.itemType === "fake-yle-video"
  );
}
