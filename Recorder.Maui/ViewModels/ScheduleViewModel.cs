using System;

using Recorder.Models;


namespace Recorder
{
    public class ScheduleViewModel
    {
        private Schedule schedule;

        public string? Title => schedule.Description;
        public string? Body1 => string.Empty;
        public string? Body2 => string.Empty;

        public string TestId => schedule.ScheduleId!;

        public ScheduleViewModel(Schedule schedule)
        {
            this.schedule = schedule;

        }
    }
}
