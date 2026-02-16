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

            var item = new ScheduleItem
            {
                ItemType = itemType,
                ItemId = obj["itemId"]?.Value<string>(),
                Description = obj["description"]?.Value<string>(),
                Url = obj["url"]?.Value<string>(),
                TypeId = obj["typeId"]?.Value<string>(),
                IsRecording = obj["isRecording"]?.Value<bool>() ?? false,
                OtherEntryLabel = obj["otherEntryLabel"]?.Value<string>()
            };

            var optionsToken = obj["options"];
            if (optionsToken != null && optionsToken.Type == JTokenType.Array)
            {
                item.Options = optionsToken.ToObject<List<string>>();
            }

            return item;
        }
    }
}
