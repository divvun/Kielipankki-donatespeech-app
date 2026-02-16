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

        public bool NoChoiceSelected => Item is ChoicePromptItem && Answer == AppResources.NoChoiceOption;

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
                    AudioPlay = AudioPlayFor(_state);
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
                    
                    if (IsAudio && _state == ScheduleItemStateType.Start)
                    {
                        AudioReset?.Invoke(this, EventArgs.Empty);
                    }
                }
            }
        }

        public event EventHandler<EventArgs>? VideoReset;
        public event EventHandler<EventArgs>? AudioReset;

        // this is called when app goes to background
        public void PauseSchedule()
        {
            // platform video players stop automatically when backgrounded but
            // stop manually anyway, this also allows for other player cleanup if needed
            VideoPlay = false;
            AudioPlay = false;
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

        private bool _audioPlay;
        public bool AudioPlay
        {
            get => _audioPlay;
            set => Set(ref _audioPlay, value, nameof(AudioPlay));
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

        public string? OtherEntryLabel => Item switch
        {
            MultiChoicePromptItem mc => mc.OtherEntryLabel,
            SuperChoicePromptItem sc => sc.OtherEntryLabel,
            _ => null
        };

        public bool IsPrompt => Item.IsPrompt;
        public bool IsPromptWithImage => Item.IsPrompt && Item switch
        {
            AudioMediaItem a => !string.IsNullOrEmpty(a.Url),
            VideoMediaItem v => !string.IsNullOrEmpty(v.Url),
            YleAudioMediaItem ya => !string.IsNullOrEmpty(ya.Url),
            YleVideoMediaItem yv => !string.IsNullOrEmpty(yv.Url),
            TextContentItem t => !string.IsNullOrEmpty(t.Url),
            ImageMediaItem i => !string.IsNullOrEmpty(i.Url),
            _ => false
        };
        public bool IsAudio => Item is AudioMediaItem or YleAudioMediaItem;
        public bool IsVideo => Item is VideoMediaItem or YleVideoMediaItem;
        public bool IsImage => Item is ImageMediaItem;
        public bool IsText => Item is TextContentItem;
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

            _options = item switch
            {
                ChoicePromptItem c => c.Options,
                MultiChoicePromptItem mc => mc.Options,
                SuperChoicePromptItem sc => sc.Options,
                _ => new List<string>()
            };
        }

        public void ClearAfterDisplay()
        {
            VideoReset = null;
            AudioReset = null;
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

        private bool AudioPlayFor(ScheduleItemStateType state)
        {
            if (IsAudio && !IsRecordingEnabled)
            {
                // auto play non-recording audio
                Debug.WriteLine($"AudioPlayFor state={state}: auto-play non-recording audio");
                return true;
            }
            else
            {
                return state == ScheduleItemStateType.Recording;
            }
        }

        private string? MediaUrlFor(ScheduleItemStateType state) => Item switch
        {
            AudioMediaItem a => a.Url,
            VideoMediaItem v => v.Url,
            YleAudioMediaItem ya => ya.Url,
            YleVideoMediaItem yv => yv.Url,
            TextContentItem t => t.Url,
            ImageMediaItem i => i.Url,
            _ => null
        };

        // special case for displaying image on top of video 
        private string? VideoItemImageUrlFor(ScheduleItemStateType state) => null;

        private string TitleFor(ScheduleItemStateType state) => Item.Description ?? string.Empty;

        private string? Body1For(ScheduleItemStateType state) => string.Empty;

        private string? Body2For(ScheduleItemStateType state) => string.Empty;
    }
}
