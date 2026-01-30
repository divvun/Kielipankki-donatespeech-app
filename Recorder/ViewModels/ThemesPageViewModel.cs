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

        public event EventHandler<EventArgs> ThemeLoadFailed;

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

                    // Mock data for testing - no API configured
                    Debug.WriteLine("Loading mock theme data for testing");
                    var mockThemes = CreateMockThemes();
                    Debug.WriteLine($"Created {mockThemes.Count} mock themes");
                    ThemeModels = mockThemes.ConvertAll(t => new ThemeViewModel(t));
                    Debug.WriteLine($"ThemeModels now has {ThemeModels.Count} items");

                    // Original API call (disabled for testing):
                    // Result<List<Theme>> result = await appRepository.GetAllThemesAsync();
                    // if (result.Succeeded)
                    // {
                    //     ThemeModels = result.Data
                    //         .FindAll(t => t?.Content?.ScheduleIds?.Count > 0)
                    //         .ConvertAll(t => new ThemeViewModel(t));
                    // }
                    // else
                    // {
                    //     Debug.WriteLine("Failed to load themes");
                    //     ThemeLoadFailed?.Invoke(this, EventArgs.Empty);
                    // }
                    
                    IsLoading = false;
                }
                else
                {
                    Debug.WriteLine($"ThemeModels already loaded with {ThemeModels.Count} items");
                }

                // update completed flags on every call.. data binding will update list data template
                ThemeModels?.ForEach(t =>
                    t.IsCompleted = completedScheduleIds?.Contains(t.FirstScheduleId) == true);
            }
        }

        private List<Theme> CreateMockThemes()
        {
            return new List<Theme>
            {
                new Theme
                {
                    Id = "theme1",
                    Content = new ThemeContent
                    {
                        Title = new Dictionary<string, string> { { "fi", "Perhe ja ystävät" } },
                        Body1 = new Dictionary<string, string> { { "fi", "Puhu perheestäsi ja ystävistäsi" } },
                        Body2 = new Dictionary<string, string> { { "fi", "Nauhoita lauseita aiheesta" } },
                        Image = "logo256.png",
                        ScheduleIds = new List<string> { "schedule1" }
                    }
                },
                new Theme
                {
                    Id = "theme2",
                    Content = new ThemeContent
                    {
                        Title = new Dictionary<string, string> { { "fi", "Työ ja opiskelu" } },
                        Body1 = new Dictionary<string, string> { { "fi", "Kerro työstäsi ja opiskelustasi" } },
                        Body2 = new Dictionary<string, string> { { "fi", "Nauhoita lauseita aiheesta" } },
                        Image = "logo256.png",
                        ScheduleIds = new List<string> { "schedule2" }
                    }
                },
                new Theme
                {
                    Id = "theme3",
                    Content = new ThemeContent
                    {
                        Title = new Dictionary<string, string> { { "fi", "Harrastukset" } },
                        Body1 = new Dictionary<string, string> { { "fi", "Mitä teet vapaa-ajallasi?" } },
                        Body2 = new Dictionary<string, string> { { "fi", "Nauhoita lauseita harrastuksista" } },
                        Image = "logo256.png",
                        ScheduleIds = new List<string> { "schedule3" }
                    }
                }
            };
        }

        private bool _loading;
        public bool IsLoading
        {
            get => _loading;
            set => Set(ref _loading, value, nameof(IsLoading));
        }

        private List<ThemeViewModel> _themeModels;
        public List<ThemeViewModel> ThemeModels
        {
            get => _themeModels;
            set => Set(ref _themeModels, value, nameof(ThemeModels));
        }
    }
}
