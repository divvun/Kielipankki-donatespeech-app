using System;
using System.Collections.Generic;

namespace Recorder.Models
{
    public class Schedule
    {
        public string? Id;
        public string? ScheduleId;
        public string? Description;
        public List<ScheduleItem> Items = new List<ScheduleItem>();

        public Schedule()
        {
        }
    }
}
