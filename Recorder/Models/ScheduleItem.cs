using System;
using System.Collections.Generic;

namespace Recorder.Models
{
    public class ItemTypeValue
    {
        public static readonly string Audio = "audio";
        public static readonly string Video = "video";
        public static readonly string Image = "image";
        public static readonly string TextContent = "text-content";
        public static readonly string Choice = "choice";
        public static readonly string MultiChoice = "multi-choice";
        public static readonly string SuperChoice = "super-choice";
        public static readonly string TextInput = "text-input";
        public static readonly string YleAudio = "yle-audio";
        public static readonly string YleVideo = "yle-video";

        private ItemTypeValue() { }
    }

    [Newtonsoft.Json.JsonConverter(typeof(ScheduleItemJsonConverter))]
    public class ScheduleItem : ICloneable
    {
        public string? ItemType;
        public string? ItemId;
        public string? Description;
        public string? Url;
        public string? TypeId;
        public List<string>? Options;
        public bool IsRecording;
        public string? OtherEntryLabel;
        public int StartTime;
        public int EndTime;

        public bool IsPrompt => IsPromptType(ItemType);
        public bool IsMedia => !IsPrompt;
        public bool IsChoice => ItemType == ItemTypeValue.Choice || ItemType == ItemTypeValue.MultiChoice;

        public object Clone() => MemberwiseClone();

        private static bool IsPromptType(string? itemType)
        {
            return itemType == ItemTypeValue.Choice
                || itemType == ItemTypeValue.MultiChoice
                || itemType == ItemTypeValue.SuperChoice
                || itemType == ItemTypeValue.TextInput;
        }
    }
}
