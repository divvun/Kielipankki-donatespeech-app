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
            // Use schedule defaults if nothing else specified
            var titleDict = schedule.Finish?.Title ?? schedule.Title;
            var body1Dict = schedule.Finish?.Body1 ?? schedule.Body1;
            var body2Dict = schedule.Finish?.Body2 ?? schedule.Body2;

            Title = titleDict!.ToLocalString() ?? string.Empty;
            Body1 = body1Dict!.ToLocalString() ?? string.Empty;
            Body2 = body2Dict!.ToLocalString() ?? string.Empty;
            RewardImageUrl = schedule.Finish?.ImageUrl ?? string.Empty;
        }
    }
}
