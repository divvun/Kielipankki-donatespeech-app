export interface Schedule {
  id?: string;
  scheduleId?: string;
  description?: string;
  items: ScheduleItem[];
}

// Base fields common to all schedule items
export interface BaseScheduleItem {
  itemId: string;
  description: string;
  isRecording: boolean;
  startTime?: number;
  endTime?: number;
}

// Media Items
export interface AudioMediaItem extends BaseScheduleItem {
  itemType: 'audio';
  url: string;
  typeId: string;
}

export interface VideoMediaItem extends BaseScheduleItem {
  itemType: 'video';
  url: string;
  typeId: string;
}

export interface ImageMediaItem extends BaseScheduleItem {
  itemType: 'image';
  url: string;
  typeId: string;
}

export interface TextContentItem extends BaseScheduleItem {
  itemType: 'text-content';
  url: string;
  typeId?: string;
}

export interface YleAudioMediaItem extends BaseScheduleItem {
  itemType: 'yle-audio';
  url: string; // YLE program ID
}

export interface YleVideoMediaItem extends BaseScheduleItem {
  itemType: 'yle-video';
  url: string; // YLE program ID
}

// Prompt Items
export interface ChoicePromptItem extends BaseScheduleItem {
  itemType: 'choice';
  options: string[];
}

export interface MultiChoicePromptItem extends BaseScheduleItem {
  itemType: 'multi-choice';
  options: string[];
  otherEntryLabel?: string;
}

export interface SuperChoicePromptItem extends BaseScheduleItem {
  itemType: 'super-choice';
  options: string[];
  otherEntryLabel?: string;
}

export interface TextInputItem extends BaseScheduleItem {
  itemType: 'text-input';
}

// Discriminated union of all schedule item types
export type ScheduleItem =
  | AudioMediaItem
  | VideoMediaItem
  | ImageMediaItem
  | TextContentItem
  | YleAudioMediaItem
  | YleVideoMediaItem
  | ChoicePromptItem
  | MultiChoicePromptItem
  | SuperChoicePromptItem
  | TextInputItem;

// Schedule Item State
export interface ScheduleItemState {
  title?: Record<string, string>;
  body1?: Record<string, string>;
  body2?: Record<string, string>;
  imageUrl?: string;
}

export enum ScheduleItemStateType {
  Start = 'start',
  Recording = 'recording',
  Finish = 'finish',
}

// Type guard helpers
export function isMediaItem(item: ScheduleItem): item is AudioMediaItem | VideoMediaItem | ImageMediaItem | TextContentItem | YleAudioMediaItem | YleVideoMediaItem {
  return ['audio', 'video', 'image', 'text-content', 'yle-audio', 'yle-video'].includes(item.itemType);
}

export function isPromptItem(item: ScheduleItem): item is ChoicePromptItem | MultiChoicePromptItem | SuperChoicePromptItem | TextInputItem {
  return ['choice', 'multi-choice', 'super-choice', 'text-input'].includes(item.itemType);
}
