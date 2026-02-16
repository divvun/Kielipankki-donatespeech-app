
using System;
using System.Collections.Generic;
using Recorder.Models;

namespace RecorderTests
{
    public class ThemeBuilder
    {
        private string id;
        private List<string> scheduleIds;

        public ThemeBuilder()
        {
            id = Guid.NewGuid().ToString();
        }

        public ThemeBuilder WithId(string id)
        {
            this.id = id;
            return this;
        }

        public ThemeBuilder WithScheduleIds(params string[] ids)
        {
            this.scheduleIds = new List<string>(ids);
            return this;
        }

        public Theme Build() => new Theme()
        {
            Id = id,
            Content = new ThemeContent()
            {
                ScheduleIds = scheduleIds
            }
        };
    }

    public class ScheduleBuilder
    {
        private string scheduleId;
        private List<ScheduleItem> items;

        public ScheduleBuilder()
        {
            scheduleId = "";
            items = new List<ScheduleItem>();
        }

        public ScheduleBuilder WithId(string id)
        {
            this.scheduleId = id;
            return this;
        }

        public ScheduleBuilder WithItems(List<ScheduleItem> items)
        {
            this.items = items;
            return this;
        }

        public ScheduleBuilder WithItems(params ScheduleItem[] items)
        {
            this.items = new List<ScheduleItem>(items);
            return this;
        }

        public Schedule Build() => new Schedule()
        {
            ScheduleId = scheduleId,
            Items = items
        };
    }

    public class ScheduleItemBuilder
    {
        private string id;
        private string type;
        private string url;
        private bool recordingEnabled;
        private int startTime;
        private int endTime;

        public ScheduleItemBuilder()
        {
            id = Guid.NewGuid().ToString();
            type = ItemTypeValue.Image;
            url = "";
            recordingEnabled = true;
        }

        public ScheduleItemBuilder WithType(string type)
        {
            this.type = type;
            return this;
        }

        public ScheduleItemBuilder WithUrl(string url)
        {
            this.url = url;
            return this;
        }

        public ScheduleItemBuilder WithStartTime(int startTime)
        {
            this.startTime = startTime;
            return this;
        }

        public ScheduleItemBuilder WithEndTime(int endTime)
        {
            this.endTime = endTime;
            return this;
        }

        public ScheduleItemBuilder WithRecordingEnabled(bool enabled)
        {
            this.recordingEnabled = enabled;
            return this;
        }

        public ScheduleItemBuilder WithId(string id)
        {
            this.id = id;
            return this;
        }

        public ScheduleItem Build() => new ScheduleItem()
        {
            ItemId = id,
            ItemType = type,
            Url = url,
            IsRecording = recordingEnabled,
            StartTime = startTime,
            EndTime = endTime
        };
    }
}