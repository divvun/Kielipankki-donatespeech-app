using System;
using System.Collections.Generic;

namespace Recorder.Models
{
    public class Schedule
    {
        public string? Id { get; set; }
        public string? ScheduleId { get; set; }
        public string? Description { get; set; }
        public List<ScheduleItem> Items { get; set; } = new List<ScheduleItem>();

        public Schedule()
        {
        }
    }
}
