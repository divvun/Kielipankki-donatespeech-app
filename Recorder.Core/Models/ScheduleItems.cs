using System;
using System.Collections.Generic;

namespace Recorder.Core.Models
{
    /// <summary>
    /// Item type discriminator values matching backend
    /// </summary>
    public static class ItemTypeValue
    {
        public const string Audio = "audio";
        public const string Video = "video";
        public const string Image = "image";
        public const string TextContent = "text-content";
        public const string Choice = "choice";
        public const string MultiChoice = "multi-choice";
        public const string SuperChoice = "super-choice";
        public const string TextInput = "text-input";
        public const string YleAudio = "yle-audio";
        public const string YleVideo = "yle-video";
    }

    /// <summary>
    /// Base class for all schedule items
    /// </summary>
    [Newtonsoft.Json.JsonConverter(typeof(ScheduleItemJsonConverter))]
    public abstract class ScheduleItem : ICloneable
    {
        public abstract string ItemType { get; }
        public required string ItemId { get; set; }
        public required string Description { get; set; }
        public required bool IsRecording { get; set; }
        
        // Runtime properties (not from backend)
        public int StartTime { get; set; }
        public int EndTime { get; set; }

        // Helper properties
        public abstract bool IsPrompt { get; }
        public bool IsMedia => !IsPrompt;

        public object Clone() => MemberwiseClone();
    }

    // ============================================================================
    // Media Items
    // ============================================================================

    /// <summary>
    /// Audio media item with direct URL
    /// </summary>
    public sealed class AudioMediaItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.Audio;
        public override bool IsPrompt => false;

        public required string Url { get; set; }
        public required string TypeId { get; set; }
    }

    /// <summary>
    /// Video media item with direct URL
    /// </summary>
    public sealed class VideoMediaItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.Video;
        public override bool IsPrompt => false;

        public required string Url { get; set; }
        public required string TypeId { get; set; }
    }

    /// <summary>
    /// YLE audio program item
    /// </summary>
    public sealed class YleAudioMediaItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.YleAudio;
        public override bool IsPrompt => false;

        public required string Url { get; set; } // YLE program ID
    }

    /// <summary>
    /// YLE video program item
    /// </summary>
    public sealed class YleVideoMediaItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.YleVideo;
        public override bool IsPrompt => false;

        public required string Url { get; set; } // YLE program ID
    }

    /// <summary>
    /// Text content item
    /// </summary>
    public sealed class TextContentItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.TextContent;
        public override bool IsPrompt => false;

        public required string Url { get; set; }
        public string? TypeId { get; set; }
    }

    /// <summary>
    /// Image media item
    /// </summary>
    public sealed class ImageMediaItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.Image;
        public override bool IsPrompt => false;

        public required string Url { get; set; }
        public required string TypeId { get; set; }
    }

    // ============================================================================
    // Prompt Items
    // ============================================================================

    /// <summary>
    /// Single choice prompt item
    /// </summary>
    public sealed class ChoicePromptItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.Choice;
        public override bool IsPrompt => true;

        public required List<string> Options { get; set; }
    }

    /// <summary>
    /// Multiple choice prompt item with optional text entry
    /// </summary>
    public sealed class MultiChoicePromptItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.MultiChoice;
        public override bool IsPrompt => true;

        public required List<string> Options { get; set; }
        public string? OtherEntryLabel { get; set; }
    }

    /// <summary>
    /// Super choice prompt item with optional text entry
    /// </summary>
    public sealed class SuperChoicePromptItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.SuperChoice;
        public override bool IsPrompt => true;

        public required List<string> Options { get; set; }
        public string? OtherEntryLabel { get; set; }
    }

    /// <summary>
    /// Text input prompt item
    /// </summary>
    public sealed class TextInputItem : ScheduleItem
    {
        public override string ItemType => ItemTypeValue.TextInput;
        public override bool IsPrompt => true;
    }
}
