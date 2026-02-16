using Recorder.Models;

namespace Recorder.ViewModels
{
    public class ScheduleFinishPageViewModel
    {
        public string Title { get; private set; } = null!;
        public string RewardImageUrl { get; private set; } = null!;
        public string Body1 { get; private set; } = null!;
        public string Body2 { get; private set; } = null!;

        public ScheduleFinishPageViewModel(Schedule schedule)
        {
            Title = schedule.Description ?? string.Empty;
            Body1 = string.Empty;
            Body2 = string.Empty;
            RewardImageUrl = string.Empty;
        }
    }
}
