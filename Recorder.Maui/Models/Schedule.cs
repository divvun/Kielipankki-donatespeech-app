using System;
using System.Collections.Generic;

namespace Recorder.Models
{
    public class Schedule
    {
        public string? Id { get; set; }
        public string? ScheduleId { get; set; }
        public string? Description { get; set; }
        
        private List<ScheduleItem>? _items;
        public List<ScheduleItem> Items
        {
            get => _items ?? (_items = new List<ScheduleItem>());
            set => _items = value ?? new List<ScheduleItem>();
        }

        public Schedule()
        {
        }
    }
}
