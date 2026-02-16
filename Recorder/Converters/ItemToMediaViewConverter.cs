using System;
using System.Diagnostics;
using System.Globalization;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Shapes;
using CommunityToolkit.Maui.Views;

using Recorder.Models;
using Recorder.ViewModels;
using Microsoft.Maui.Devices;

namespace Recorder.Converters
{
    public class ItemToMediaViewConverter : IValueConverter
    {
        double MediaHeight => DeviceDisplay.MainDisplayInfo.GetHeightInSixteenNine();

        public ItemToMediaViewConverter()
        {
        }

        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is ScheduleItemViewModel model)
            {
                if (model.IsVideo)
                {
                    return CreateVideo(model);
                }
                else if (model.IsAudio)
                {
                    return CreateAudio(model);
                }
                else if (model.IsImage || model.IsPromptWithImage)
                {
                    return CreateImage(model, nameof(model.ItemMediaUrl));
                }
                else if (model.IsText)
                {
                    return CreateText(model);
                }
            }

            return null; 
        }

        private View? CreateText(ScheduleItemViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.ItemMediaUrl))
            {                
                return null; // hide if not defined
            }

            var label = new Label()
            {
                BindingContext = model,
                Padding = 20
            };

            var labelStyle = Application.Current!.Resources.GetOrNull("TextScheduleItemLabelStyle");
            if (labelStyle != null)
            {
                label.Style = (Style)labelStyle;
            }

            // text is in the url field
            label.SetBinding(Label.TextProperty, nameof(model.ItemMediaUrl));

            return new Border()
            {
                Content = label,
                HeightRequest = MediaHeight - 40,
                Padding = 0,
                Margin = new Thickness(40, 20),
                StrokeShape = new RoundRectangle { CornerRadius = 50 },
            };
        }if (string.IsNullOrWhiteSpace(model.Item?.Url))
            {
                return new Label { Text = "❌ No video URL" };
            }

            var mediaElement = new MediaElement()
            {
                BindingContext = model,
                Source = MediaSource.FromUri(model.Item!.Url!),
                HeightRequest = MediaHeight,
                ShowsPlaybackControls = true,
                AutoPlay = false,
            };

            var backgroundColor = Application.Current?.Resources.GetOrNull("AppBackgroundColor");
            if (backgroundColor != null)
            {
                mediaElement.BackgroundColor = (Color)backgroundColor;
            }

            // Bind play state
            mediaElement.SetBinding(MediaElement.IsPlayingProperty, new Binding(
                nameof(model.VideoPlay),
                BindingMode.TwoWay,
                source: model
            ));

            if (model.IsRecordingEnabled)
            {
                mediaElement.ShowsPlaybackControls = false;
                
                var image = CreateImage(model, nameof(model.VideoItemImageUrl));

                // overlay image on top of video, so if image is defined it will cover
                // video and we dont need to show/hide either
                Grid grid = new Grid();
                grid.Children.Add(mediaElement);
                grid.Children.Add(image);
                return grid;
            }
            else
            {
                return mediaElement;
            }
        }

        private View CreateAudio(ScheduleItemViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Item?.Url))
            {
                return new Label { Text = "❌ No audio URL" };
            }

            var mediaElement = new MediaElement()
            {
                BindingContext = model,
                Source = MediaSource.FromUri(model.Item!.Url!),
                HeightRequest = 60,
                ShowsPlaybackControls = true,
                AutoPlay = false,
            };

            var backgroundColor = Application.Current?.Resources.GetOrNull("AppBackgroundColor");
            if (backgroundColor != null)
            {
                mediaElement.BackgroundColor = (Color)backgroundColor;
            }

            // Bind play state
            mediaElement.SetBinding(MediaElement.IsPlayingProperty, new Binding(
                nameof(model.AudioPlay),
                BindingMode.TwoWay,
                source: model
            ));

            if (model.IsRecordingEnabled)
            {
                // Hide controls during recording
                mediaElement.ShowsPlaybackControls = false;
            }

            return new Border()
            {
                Content = mediaElement,
                HeightRequest = 100,
                Padding = 10,
                Margin = new Thickness(20, 20),
                StrokeShape = new RoundRectangle { CornerRadius = 20 },
            };lse
            {
                video.IsMuted = false;
                return video;
            }
        }

        private Image CreateImage(ScheduleItemViewModel model, string urlPropertyName)
        {
            var image = new Image()
            {
                BindingContext = model,
                HeightRequest = MediaHeight,
                Aspect = Aspect.AspectFill
            };

            image.SetBinding(Image.SourceProperty, urlPropertyName,
                BindingMode.Default, new StringToImageSourceConverter());

            return image;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }        
    }
}
