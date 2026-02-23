using System;
using Microsoft.Maui.Controls;
using Recorder.Core.Models;
using Recorder.Core.ViewModels;

namespace Recorder.ViewModels
{
    public class ThemeViewModel : BaseViewmodel
    {
        private Theme theme;

        public string? Title => theme.Content?.Description;
        public string? Body1 => string.Empty;
        public string? Body2 => string.Empty;

        public string? ImageUrl => theme.Content?.Image;
        public string TestId => theme.Id!;

        public string ThemeId => theme.Id!;

        public string? FirstScheduleId
        {
            get 
            {
                if (theme.Content?.ScheduleIds?.Count > 0)
                {
                    return theme.Content.ScheduleIds[0];
                }
                else
                {
                    return null;
                }
            }
        }

        public Color ButtonBackgroundColor
        {
            get
            {
                return this.IsCompleted ?
                    (Color)Application.Current!.Resources["ThirdColor"] :
                    (Color)Application.Current!.Resources["FirstColor"];
            }
        }

        private bool _isCompleted = false;
        public bool IsCompleted
        {
            get => _isCompleted;
            set => Set(ref _isCompleted, value, nameof(IsCompleted), nameof(ButtonBackgroundColor));
        }

        public ThemeViewModel(Theme theme)
        {
            this.theme = theme;

            if (theme.Content == null)
            {
                theme.Content = new ThemeContent();
            }
        }
    }
}

