export type LocalizedText = string;

export interface ScheduleAvailability {
  id: string;
  availableLanguages: string[];
}

// New API uses state.url. Tauri-normalized payloads may still expose imageUrl.
export interface MediaState {
  title: LocalizedText;
  body1: LocalizedText;
  body2: LocalizedText;
  url?: string | null;
  imageUrl?: string | null;
}

export interface ScheduleState {
  title: LocalizedText;
  body1: LocalizedText;
  body2?: LocalizedText | null;
  url?: string | null;
  imageUrl?: string | null;
}

export interface Schedule {
  id?: string | null;
  scheduleId?: string | null;
  start?: MediaState | null;
  finish?: MediaState | null;
  items: ScheduleItem[];
}

interface BaseItem {
  itemId: string;
  typeId?: string | null;
  isRecording: boolean;
  start?: MediaState | null;
  startTime?: number;
  endTime?: number;
}

// Legacy item-level url/default fields may be missing in the new API.
export interface BaseMediaItem extends BaseItem {
  kind: "media";
  url?: string | null;
  default?: MediaState | null;
  options?: never[];
  recording?: MediaState | null;
  finish?: MediaState | null;
  metaTitle?: LocalizedText | null;
}

export interface BasePromptItem extends BaseItem {
  kind: "prompt";
  url?: string | null;
  default?: MediaState | null;
  options?: Array<LocalizedText>;
}

interface PromptWithOptions extends BasePromptItem {
  options: Array<LocalizedText>;
}

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

export interface FakeYleAudioMediaItem extends BaseMediaItem {
  itemType: "fake-yle-audio";
}

export interface FakeYleVideoMediaItem extends BaseMediaItem {
  itemType: "fake-yle-video";
}

export interface TextContentItem extends BaseMediaItem {
  itemType: "text-content";
}

export interface ChoicePromptItem extends PromptWithOptions {
  itemType: "choice";
}

export interface MultiChoicePromptItem extends PromptWithOptions {
  itemType: "multi-choice";
  otherAnswer?: LocalizedText | null;
  otherEntryLabel?: LocalizedText | null;
}

export interface SuperChoicePromptItem extends PromptWithOptions {
  itemType: "super-choice";
  otherEntryLabel?: LocalizedText | null;
}

export interface TextInputItem extends BasePromptItem {
  itemType: "text";
}

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

export interface ScheduleListItem {
  id: string;
  content: Schedule;
}

type StatefulMedia = { url?: string | null; imageUrl?: string | null };

export function getStateMediaUrl(
  state: StatefulMedia | null | undefined,
): string | null {
  if (!state) {
    return null;
  }

  return state.url ?? state.imageUrl ?? null;
}

export function getDefaultItemState(item: ScheduleItem): MediaState | null {
  if (item.kind === "media") {
    return item.default ?? item.start ?? item.recording ?? item.finish ?? null;
  }

  return item.default ?? item.start ?? null;
}

export function getItemMediaUrl(item: ScheduleItem): string | null {
  if (item.url) {
    return item.url;
  }

  if (item.kind === "media") {
    return (
      getStateMediaUrl(item.default) ??
      getStateMediaUrl(item.start) ??
      getStateMediaUrl(item.recording) ??
      getStateMediaUrl(item.finish)
    );
  }

  return getStateMediaUrl(item.default) ?? getStateMediaUrl(item.start);
}

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

export function isFakeYleItem(
  item: ScheduleItem,
): item is FakeYleAudioMediaItem | FakeYleVideoMediaItem {
  return (
    item.itemType === "fake-yle-audio" || item.itemType === "fake-yle-video"
  );
}
