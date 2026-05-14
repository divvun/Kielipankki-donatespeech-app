import { useState, useEffect } from "react";
import type { ScheduleItem, MediaState } from "../types/Schedule";
import { getDefaultItemState, isMediaItem } from "../types/Schedule";

export type ItemStateType = "default" | "start" | "recording" | "finish";

const EMPTY_MEDIA_STATE: MediaState = {
  title: "",
  body1: "",
  body2: "",
  url: null,
  imageUrl: null,
};

interface UseItemStateReturn {
  currentState: ItemStateType;
  stateContent: MediaState;
  transitionTo: (newState: ItemStateType) => void;
  reset: () => void;
}

/**
 * Hook to manage item state transitions (default -> start -> recording -> finish)
 * and retrieve the appropriate MediaState content for the current state.
 *
 * @param item - The schedule item to manage state for
 * @param isRecording - Whether recording is currently in progress
 * @returns State management utilities and current state content
 */
export function useItemState(
  item: ScheduleItem | null,
  isRecording: boolean = false,
): UseItemStateReturn {
  const [currentState, setCurrentState] = useState<ItemStateType>("default");

  // Reset state when item changes
  useEffect(() => {
    setCurrentState("default");
  }, [item?.itemId]);

  // Auto-transition to recording state when recording starts
  useEffect(() => {
    if (isRecording && currentState !== "recording") {
      setCurrentState("recording");
    }
  }, [isRecording]);

  /**
   * Get the MediaState content for the current state, falling back to default if unavailable
   */
  const getStateContent = (): MediaState => {
    if (!item || !isMediaItem(item)) {
      // For non-media items or null items, return empty/default state
      return EMPTY_MEDIA_STATE;
    }

    // Try to get the content for the current state
    let content: MediaState | null | undefined = null;

    switch (currentState) {
      case "start":
        content = item.start;
        break;
      case "recording":
        content = item.recording;
        break;
      case "finish":
        content = item.finish;
        break;
      case "default":
      default:
        content = item.default;
        break;
    }

    // Fall back to the best available state for this item.
    if (!content) {
      content = getDefaultItemState(item);
    }

    // Ensure we always return a valid MediaState
    return content || EMPTY_MEDIA_STATE;
  };

  /**
   * Handle prompt items which have a default state
   */
  const getPromptStateContent = (): MediaState => {
    if (!item || isMediaItem(item)) {
      return EMPTY_MEDIA_STATE;
    }

    return getDefaultItemState(item) || EMPTY_MEDIA_STATE;
  };

  const stateContent =
    item && isMediaItem(item) ? getStateContent() : getPromptStateContent();

  /**
   * Manually transition to a new state
   */
  const transitionTo = (newState: ItemStateType) => {
    setCurrentState(newState);
  };

  /**
   * Reset to default state
   */
  const reset = () => {
    setCurrentState("default");
  };

  return {
    currentState,
    stateContent,
    transitionTo,
    reset,
  };
}
