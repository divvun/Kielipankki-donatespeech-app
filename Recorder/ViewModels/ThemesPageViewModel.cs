using System;
using System.Collections.Generic;
using System.Diagnostics;
using Recorder.Models;
using Recorder.Services;

namespace Recorder.ViewModels
{
    public class ThemesPageViewModel : BaseViewmodel
    {
        private readonly IAppRepository appRepository;

#pragma warning disable CS0067 // Event is never used - preserved for future use
        public event EventHandler<EventArgs>? ThemeLoadFailed;
#pragma warning restore CS0067

        private List<ThemeViewModel> _themeModels = new List<ThemeViewModel>();
        
        public List<ThemeViewModel> ThemeModels
        {
            get => _themeModels;
            set => Set(ref _themeModels, value, nameof(ThemeModels));
        }

        public ThemesPageViewModel(IAppRepository appRepository)
        {
            this.appRepository = appRepository;
        }

        public async void ReloadIfNeeded()
        {
            // Read completed schedules from preferences
            List<string> completedScheduleIds = appRepository.GetCompletedScheduleIds();

            // TEST BEGIN 
            Debug.WriteLine("Completed schedule IDs from user preferences:");
            if (completedScheduleIds?.Count > 0)
            {
                foreach (string scheduleId in completedScheduleIds)
                {
                    Debug.WriteLine(scheduleId);
                }
            }
            else
            {
                Debug.WriteLine("None.");
            }
            // TEST END

            if (!IsLoading)
            {
                if (ThemeModels == null || ThemeModels.Count == 0)
                {
                    IsLoading = true;

                    Result<List<Theme>> result = await appRepository.GetAllThemesAsync();
                    if (result.Succeeded)
                    {
                        ThemeModels = result.Data
                            .FindAll(t => t?.Content?.ScheduleIds?.Count > 0)
                            .ConvertAll(t => new ThemeViewModel(t));
                    }
                    else
                    {
                        Debug.WriteLine("Failed to load themes");
                        ThemeLoadFailed?.Invoke(this, EventArgs.Empty);
                    }
                    
                    IsLoading = false;
                }
                else
                {
                    Debug.WriteLine($"ThemeModels already loaded with {ThemeModels.Count} items");
                }

                // update completed flags on every call.. data binding will update list data template
                ThemeModels?.ForEach(t =>
                    t.IsCompleted = completedScheduleIds?.Contains(t.FirstScheduleId ?? string.Empty) == true);
            }
        }

        private bool _loading;
        public bool IsLoading
        {
            get => _loading;
            set => Set(ref _loading, value, nameof(IsLoading));
        }
    }
}
