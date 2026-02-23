using System;
using System.Collections.Generic;
using System.Diagnostics;
using Recorder.Models;
using Recorder.Core.Models;
using Recorder.Services;
using Recorder.Core.Services;
using Recorder.Core.Models;

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
            Console.WriteLine("[MAUI ThemesPageViewModel] ReloadIfNeeded() called");
            
            // Read completed schedules from preferences
            List<string> completedScheduleIds = appRepository.GetCompletedScheduleIds();

            // TEST BEGIN 
            Console.WriteLine("Completed schedule IDs from user preferences:");
            if (completedScheduleIds?.Count > 0)
            {
                foreach (string scheduleId in completedScheduleIds)
                {
                    Console.WriteLine(scheduleId);
                }
            }
            else
            {
                Console.WriteLine("None.");
            }
            // TEST END

            if (!IsLoading)
            {
                if (ThemeModels == null || ThemeModels.Count == 0)
                {
                    Console.WriteLine("[MAUI ThemesPageViewModel] Loading themes from repository...");
                    IsLoading = true;

                    Result<List<Theme>> result = await appRepository.GetAllThemesAsync();
                    Console.WriteLine($"[MAUI ThemesPageViewModel] GetAllThemesAsync result: Succeeded={result.Succeeded}, Count={result.Data?.Count ?? 0}");
                    if (result.Succeeded)
                    {
                        ThemeModels = result.Data
                            .FindAll(t => t?.Content?.ScheduleIds?.Count > 0)
                            .ConvertAll(t => new ThemeViewModel(t));
                        Console.WriteLine($"[MAUI ThemesPageViewModel] Loaded {ThemeModels.Count} theme models");
                    }
                    else
                    {
                        Console.WriteLine("[MAUI ThemesPageViewModel] Failed to load themes");
                        ThemeLoadFailed?.Invoke(this, EventArgs.Empty);
                    }
                    
                    IsLoading = false;
                }
                else
                {
                    Console.WriteLine($"[MAUI ThemesPageViewModel] ThemeModels already loaded with {ThemeModels.Count} items");
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
