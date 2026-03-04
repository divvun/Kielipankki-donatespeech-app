import { useState, useEffect } from "react";
import type { ScheduleItem, MediaState } from "../types/Schedule";
import { isMediaItem } from "../types/Schedule";

export type ItemStateType = "default" | "start" | "recording" | "finish";

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
      return {
        title: {},
        body1: {},
        body2: {},
        imageUrl: null,
      };
    }

    // Check if item has state fields (not all media items do, e.g., fake-yle items)
    const hasStateFields = "default" in item;

    if (!hasStateFields) {
      // Return empty state for items without state fields
      return {
        title: {},
        body1: {},
        body2: {},
        imageUrl: null,
      };
    }

    // Try to get the content for the current state
    let content: MediaState | null | undefined = null;

    switch (currentState) {
      case "start":
        content = "start" in item ? item.start : null;
        break;
      case "recording":
        content = "recording" in item ? item.recording : null;
        break;
      case "finish":
        content = "finish" in item ? item.finish : null;
        break;
      case "default":
      default:
        content = "default" in item ? item.default : null;
        break;
    }

    // If the specific state doesn't exist, fall back to default
    if (!content && "default" in item) {
      content = item.default;
    }

    // Ensure we always return a valid MediaState
    return (
      content || {
        title: {},
        body1: {},
        body2: {},
        imageUrl: null,
      }
    );
  };

  /**
   * Handle prompt items which have a default state
   */
  const getPromptStateContent = (): MediaState => {
    if (!item || isMediaItem(item)) {
      return {
        title: {},
        body1: {},
        body2: {},
        imageUrl: null,
      };
    }

    // Prompt items have a 'default' MediaState field
    if ("default" in item && item.default) {
      return item.default;
    }

    return {
      title: {},
      body1: {},
      body2: {},
      imageUrl: null,
    };
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
