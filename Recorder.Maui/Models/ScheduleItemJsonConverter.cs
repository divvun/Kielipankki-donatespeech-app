using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Recorder.Models
{
    public class ScheduleItemJsonConverter : JsonConverter<ScheduleItem>
    {
        public override bool CanWrite => false;

        public override void WriteJson(JsonWriter writer, ScheduleItem? value, JsonSerializer serializer)
        {
            throw new NotImplementedException("ScheduleItemJsonConverter is read-only.");
        }

        public override ScheduleItem? ReadJson(JsonReader reader, Type objectType, ScheduleItem? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null)
            {
                return null;
            }

            var obj = JObject.Load(reader);
            var itemType = obj["itemType"]?.Value<string>();
            var itemId = obj["itemId"]?.Value<string>() ?? throw new JsonException("itemId is required");
            var description = obj["description"]?.Value<string>() ?? throw new JsonException("description is required");
            var isRecording = obj["isRecording"]?.Value<bool>() ?? false;

            ScheduleItem item = itemType switch
            {
                ItemTypeValue.Audio => new AudioMediaItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for audio"),
                    TypeId = obj["typeId"]?.Value<string>() ?? throw new JsonException("typeId is required for audio")
                },
                ItemTypeValue.Video => new VideoMediaItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for video"),
                    TypeId = obj["typeId"]?.Value<string>() ?? throw new JsonException("typeId is required for video")
                },
                ItemTypeValue.YleAudio => new YleAudioMediaItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for yle-audio")
                },
                ItemTypeValue.YleVideo => new YleVideoMediaItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for yle-video")
                },
                ItemTypeValue.TextContent => new TextContentItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for text-content"),
                    TypeId = obj["typeId"]?.Value<string>()
                },
                ItemTypeValue.Image => new ImageMediaItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Url = obj["url"]?.Value<string>() ?? throw new JsonException("url is required for image"),
                    TypeId = obj["typeId"]?.Value<string>() ?? throw new JsonException("typeId is required for image")
                },
                ItemTypeValue.Choice => new ChoicePromptItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Options = obj["options"]?.ToObject<List<string>>() ?? throw new JsonException("options is required for choice")
                },
                ItemTypeValue.MultiChoice => new MultiChoicePromptItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Options = obj["options"]?.ToObject<List<string>>() ?? throw new JsonException("options is required for multi-choice"),
                    OtherEntryLabel = obj["otherEntryLabel"]?.Value<string>()
                },
                ItemTypeValue.SuperChoice => new SuperChoicePromptItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording,
                    Options = obj["options"]?.ToObject<List<string>>() ?? throw new JsonException("options is required for super-choice"),
                    OtherEntryLabel = obj["otherEntryLabel"]?.Value<string>()
                },
                ItemTypeValue.TextInput => new TextInputItem
                {
                    ItemId = itemId,
                    Description = description,
                    IsRecording = isRecording
                },
                _ => throw new JsonException($"Unknown itemType: {itemType}")
            };

            return item;
        }
    }
}
