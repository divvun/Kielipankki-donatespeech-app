using System;
using System.Diagnostics;

using Microsoft.Maui.Controls;

using Recorder.Models;
using Recorder.ViewModels;
using System.ComponentModel;
using Microsoft.Maui.Devices;
using Recorder.ResX;

namespace Recorder
{
    public partial class SchedulePage : ContentPage
    {
        private SchedulePageViewModel viewModel;
        private Schedule schedule;

        public SchedulePage(Schedule schedule)
        {
            try
            {
                if (schedule == null)
                {
                    throw new ArgumentNullException(nameof(schedule), "Schedule cannot be null");
                }

                this.schedule = schedule;

                Debug.WriteLine($"SchedulePage: schedule ID = '{this.schedule.ScheduleId ?? "null"}', description = '{this.schedule.Description ?? "null"}', has {this.schedule.Items?.Count ?? 0} items");

                if (this.schedule.Items == null || this.schedule.Items.Count == 0)
                {
                    throw new InvalidOperationException($"Schedule '{this.schedule.ScheduleId}' has no items");
                }

                var app = Application.Current as App;

                this.viewModel = new SchedulePageViewModel(this.schedule,
                    app!.RecMan, app.AnalyticsEventTracker, app.Resources, app.AppRepository, app.Config);

                this.viewModel.ScheduleFinished += ScheduleFinished;
                this.viewModel.MaxRecordingTimeReached += OnMaxRecordingTimeReached;
                this.viewModel.PropertyChanged += OnViewModelPropertyChanged;

                BindingContext = this.viewModel;
                Debug.WriteLine("View model for schedule page created and set as the binding context");

                InitializeComponent();

                var recordButtonSize = 14.0 * 6.5; // Using default font size
                RecordButton.WidthRequest = recordButtonSize;
                RecordButton.HeightRequest = recordButtonSize;

                // On iOS page OnDisappearing is not called when app backgrounds, so we need to hook into
                // app sleep event directly.
                // On Android page OnDisappearing is called, so this is not needed but it doesnt cause problem
                app.AppSleep += OnAppSleep;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"FATAL ERROR in SchedulePage constructor: {ex}");
                throw;
            }
        }

        private void OnMaxRecordingTimeReached(object? sender, EventArgs e)
        {
            Dispatcher.Dispatch(() =>
                DisplayAlertAsync(AppResources.RecordingStoppedLimitTitle, AppResources.RecordingStoppedLimitMessage, AppResources.AlertDismissOk));
        }

        private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(SchedulePageViewModel.DisplayState))
            {
                Dispatcher.Dispatch(() =>
                {
                    // refresh recorded minutes
                    navigationBarView.Update();

                    // keep screen on while recording
                    DeviceDisplay.KeepScreenOn = viewModel.DisplayState == ScheduleItemStateType.Recording;
                });
            }
            else if (e.PropertyName == nameof(SchedulePageViewModel.ItemViewModel))
            {
                // scroll to top when schedule item changes
                Dispatcher.Dispatch(() =>
                    scrollView.ScrollToAsync(0, 0, false));
            }
        }

        private void OnAppSleep(object? sender, EventArgs e)
        {
            Debug.WriteLine("SchedulePage:AppPause");
            viewModel.PauseSchedule();
        }

        protected override void OnDisappearing()
        {
            Debug.WriteLine("SchedulePage:OnDisappearing");

            var app = Application.Current as App;
            app!.AppSleep -= OnAppSleep;

            viewModel.PauseSchedule();
        }

        private async void ScheduleFinished(object? sender, EventArgs e)
        {
            // one way navigation to finish page
            await Navigation.PushAsyncThenRemove(new ScheduleFinishPage(this.schedule), this);
        }
    }
}
