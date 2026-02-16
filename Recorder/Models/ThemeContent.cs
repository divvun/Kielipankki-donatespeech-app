using System;
using System.Collections.Generic;

namespace Recorder.Models
{
    public class ThemeContent
    {
        public string? Description { get; set; }
        public string? Image { get; set; }  // image URL
        public List<string>? ScheduleIds { get; set; }
    }
}
