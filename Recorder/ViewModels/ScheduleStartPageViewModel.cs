using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Input;
using Recorder.Models;
using Recorder.Services;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace Recorder.ViewModels
{
    public class ScheduleStartPageViewModel : BaseViewmodel
    {
        private readonly IAppRepository appRepository;
        private readonly IFirebaseAnalyticsEventTracker eventTracker;
        private readonly IAppConfiguration appConfiguration;
        private readonly string scheduleId;

        public event EventHandler<EventArgs> ScheduleLoadFailed;

        private string _title;
        public string Title
        {
            get => _title;
            set => Set(ref _title, value, nameof(Title));
        }

        private string _body1;
        public string Body1
        {
            get => _body1;
            set => Set(ref _body1, value, nameof(Body1));
        }

        private string _body2;
        public string Body2
        {
            get => _body2;
            set => Set(ref _body2, value, nameof(Body2));
        }

        private string _imageUrl;
        public string ImageUrl
        {
            get => _imageUrl;
            set => Set(ref _imageUrl, value, nameof(ImageUrl));
        }

        public Schedule Schedule { get; private set; }

        private bool _loading;
        public bool IsLoading
        {
            get => _loading;
            set => Set(ref _loading, value, nameof(IsLoading));
        }

        public ScheduleStartPageViewModel(string scheduleId, IAppRepository appRepository,
            IFirebaseAnalyticsEventTracker eventTracker, IAppConfiguration appConfiguration)
        {
            this.appRepository = appRepository;
            this.eventTracker = eventTracker;
            this.scheduleId = scheduleId;
            this.appConfiguration = appConfiguration;
            LoadScheduleAsync();
        }

        public async void LoadScheduleAsync()
        {
            Debug.WriteLine($"LoadScheduleAsync called, Schedule is null: {Schedule == null}, IsLoading: {IsLoading}");
            
            if (Schedule == null && !IsLoading)
            {
                IsLoading = true;
                Debug.WriteLine("Starting to load schedule...");
                
                Result<Schedule> result = await appRepository.GetScheduleAsync(scheduleId);
                
                Debug.WriteLine($"GetScheduleAsync completed. Succeeded: {result.Succeeded}, Data is null: {result.Data == null}");
                
                if (result.Succeeded && result.Data != null)
                {
                    Schedule = result.Data;
                    Debug.WriteLine($"Schedule loaded: {Schedule.ScheduleId}");
                    UpdateProperties(result.Data);
                    SendSelectEvent();
                }
                else
                {
                    Debug.WriteLine("Failed to load schedule");
                    ScheduleLoadFailed?.Invoke(this, EventArgs.Empty);
                }
                IsLoading = false;
                Debug.WriteLine($"IsLoading set to false");
            }
        }

        private void SendSelectEvent()
        {
            var scheduleDict = new Dictionary<string, string>
            {
                { AnalyticsParameterNamesConstants.ItemId, Schedule.ScheduleId },
                { AnalyticsParameterNamesConstants.ItemName, Title ?? string.Empty },
                { AnalyticsParameterNamesConstants.ContentType, AnalyticsContentTypeConstants.Schedule },
                { AnalyticsParameterNamesConstants.BuildType, appConfiguration.BuildType }
            };
            eventTracker.SendEvent(AnalyticsEventNamesConstants.SelectContent, scheduleDict);
        }

        private void UpdateProperties(Schedule schedule)
        {
            Debug.WriteLine($"UpdateProperties called for schedule: {schedule?.ScheduleId}");
            
            // Use schedule defaults if start override not specified
            var titleDict = schedule.Start?.Title ?? schedule.Title;
            var body1Dict = schedule.Start?.Body1 ?? schedule.Body1;
            var body2Dict = schedule.Start?.Body2 ?? schedule.Body2;

            Debug.WriteLine($"titleDict: {titleDict?.Count ?? 0} items");
            Debug.WriteLine($"body1Dict: {body1Dict?.Count ?? 0} items");
            Debug.WriteLine($"body2Dict: {body2Dict?.Count ?? 0} items");

            Title = titleDict?.ToLocalString();
            Body1 = body1Dict?.ToLocalString();
            Body2 = body2Dict?.ToLocalString();
            ImageUrl = schedule.Start?.ImageUrl;
            
            Debug.WriteLine($"Set Title: {Title}");
            Debug.WriteLine($"Set Body1: {Body1}");
            Debug.WriteLine($"Set Body2: {Body2}");
            Debug.WriteLine($"Set ImageUrl: {ImageUrl}");
        }

        public ICommand ClickCommand => new Command<string>((url) =>
        {
            Launcher.OpenAsync(url);
        });
    }
}
