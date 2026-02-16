using System;
using System.Collections.Generic;
using System.Diagnostics;
using Recorder.Models;
using Recorder.ResX;
using Recorder.Services;

namespace Recorder.ViewModels
{
    public class ScheduleItemViewModel : BaseViewmodel
    {
        public ScheduleItem Item { get; set; }
        public string ItemType { get; private set; } = string.Empty;
        public int CounterIndex { get; set; }
        public int CounterTotal { get; set; }

        private string _answer = string.Empty;
        public string Answer
        {
            get => _answer;
            set => Set(ref _answer, value, nameof(Answer), nameof(HasAnswer));
        }

        public bool HasAnswer => !string.IsNullOrWhiteSpace(Answer);

        public bool NoChoiceSelected => Item.IsChoice && Answer == AppResources.NoChoiceOption;

        private bool _answerModified;
        public bool AnswerModified
        {
            get => _answerModified;
            set => Set(ref _answerModified, value, nameof(AnswerModified));
        }

        private ScheduleItemStateType _state;
        public ScheduleItemStateType ItemDisplayState
        {
            get => _state;
            set
            {
                if (!_state.Equals(value))
                {
                    _state = value;
                    RaisePropertyChanged(nameof(ItemDisplayState));

                    // update dependent properties through setters so their
                    // property changed events fire only if value actually changed
                    VideoPlay = VideoPlayFor(_state);
                    ItemMediaUrl = MediaUrlFor(_state) ?? string.Empty;
                    ItemTitle = TitleFor(_state);
                    ItemBody1 = Body1For(_state) ?? string.Empty;
                    ItemBody2 = Body2For(_state) ?? string.Empty;

                    if (IsVideo)
                    {
                        VideoItemImageUrl = VideoItemImageUrlFor(_state) ?? string.Empty;
                        if (_state == ScheduleItemStateType.Start)
                        {
                            VideoReset?.Invoke(this, EventArgs.Empty);
                        }
                    }
                }
            }
        }

        public event EventHandler<EventArgs>? VideoReset;

        // this is called when app goes to background
        public void PauseSchedule()
        {
            // platform video players stop automatically when backgrounded but
            // stop manually anyway, this also allows for other player cleanup if needed
            VideoPlay = false;
        }

        private string _mediaUrl = string.Empty;
        public string ItemMediaUrl 
        {
            get => _mediaUrl;
            set => Set(ref _mediaUrl, value, nameof(ItemMediaUrl));
        }

        private bool _videoPlay;
        public bool VideoPlay
        {
            get => _videoPlay;
            set => Set(ref _videoPlay, value, nameof(VideoPlay));
        }

        private string _videoItemImageUrl = string.Empty;
        public string VideoItemImageUrl
        {
            get => _videoItemImageUrl;
            set => Set(ref _videoItemImageUrl, value, nameof(VideoItemImageUrl));
        }

        private string _title = string.Empty;
        public string ItemTitle
        {
            get => _title;
            set => Set(ref _title, value, nameof(ItemTitle));
        }

        private string _body1 = string.Empty;
        public string ItemBody1
        {
            get => _body1;
            set => Set(ref _body1, value, nameof(ItemBody1));
        }

        private string _body2 = string.Empty;
        public string ItemBody2
        {
            get => _body2;
            set => Set(ref _body2, value, nameof(ItemBody2));
        }

        public string? CounterLabel
        {
            get
            {
                Debug.WriteLine("Reverting to default metatitle for item type");

                if (IsPrompt)
                {
                    return AppResources.PromptMetaTitle;
                }
                else if (!IsRecordingEnabled)
                {
                    return AppResources.NonRecordingMediaMetaTitle;
                }
                else
                {
                    return string.Format(AppResources.MediaMetaTitle, CounterIndex, CounterTotal);
                }
            }
        }

        public string NoChoiceOption => AppResources.NoChoiceOption;

        public List<string> _options;
        public List<string> ChoiceOptions
        {
            get
            {
            List<string> ss = new List<string>();

                // picker options always include an option to clear current selection
                ss.Add(NoChoiceOption);

                ss.AddRange(_options);
                return ss;
            }
        }

        public string? OtherEntryLabel => Item.OtherEntryLabel;

        public bool IsPrompt => Item.IsPrompt;
        public bool IsPromptWithImage => Item.IsPrompt && !string.IsNullOrEmpty(Item.Url);
        public bool IsVideo => ItemType.Equals(ItemTypeValue.Video) || ItemType.Equals(ItemTypeValue.YleVideo);
        public bool IsImage => ItemType.Equals(ItemTypeValue.Image);
        public bool IsText => ItemType.Equals(ItemTypeValue.TextContent);
        public bool IsRecordingEnabled => Item.IsRecording;

        public ScheduleItemViewModel(ScheduleItem item, IAppRepository appRepository)
        {
            Item = item;
            ItemType = item.ItemType ?? string.Empty;

            // user prompt for a specific question, like age, always uses the same item id, also on different schedules
            // so we can initialize with a previously stored answer
            if (item.IsPrompt && item.ItemId != null)
            {
                string? previousAnswer = appRepository.GetAnswer(item.ItemId);
                if (previousAnswer != null)
                {
                    Answer = previousAnswer;
                }
            }

            _options = item.Options ?? new List<string>();
        }

        public void ClearAfterDisplay()
        {
            VideoReset = null;
        }

        public void PrepareForDisplay()
        {
            ItemDisplayState = ScheduleItemStateType.Start;
            AnswerModified = false;
        }

        private bool VideoPlayFor(ScheduleItemStateType state)
        {
            if (IsVideo && !IsRecordingEnabled)
            {
                // auto play non-recording video
                Debug.WriteLine($"VideoPlayFor state={state}: auto-play non-recording video");
                return true; 
            }
            else
            {
                return state == ScheduleItemStateType.Recording;
            }
        }

        private string? MediaUrlFor(ScheduleItemStateType state) => Item.Url;

        // special case for displaying image on top of video 
        private string? VideoItemImageUrlFor(ScheduleItemStateType state) => null;

        private string TitleFor(ScheduleItemStateType state) => Item.Description ?? string.Empty;

        private string? Body1For(ScheduleItemStateType state) => string.Empty;

        private string? Body2For(ScheduleItemStateType state) => string.Empty;
    }
}
