using System;
using System.Diagnostics;
using System.Globalization;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Shapes;

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
                if (model.IsAudio)
                {
                    return CreateAudio(model);
                }
                else if (model.IsVideo)
                {
                    return CreateVideo(model);
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
        }

        private View CreateVideo(ScheduleItemViewModel model)
        {
            var url = model.Item switch
            {
                VideoMediaItem v => v.Url,
                YleVideoMediaItem yv => yv.Url,
                _ => null
            };

            if (string.IsNullOrWhiteSpace(url))
            {
                Debug.WriteLine($"CreateVideo: Missing or invalid URL for video item {model.Item.GetType().Name}");
                return CreatePlaceholderView("No video URL");
            }

            // Display video information
            var videoLabel = new Label
            {
                Text = "📹 Video Available\n(Playback coming soon)",
                FontSize = 18,
                HorizontalOptions = LayoutOptions.Center,
                VerticalOptions = LayoutOptions.Center,
                Padding = 20
            };

            if (model.IsRecordingEnabled)
            {
                var image = CreateImage(model, nameof(model.VideoItemImageUrl));

                // overlay image on top of video, so if image is defined it will cover
                // video and we dont need to show/hide either
                Grid grid = new Grid();
                grid.Children.Add(videoLabel);
                grid.Children.Add(image);
                return grid;
            }
            else
            {
                return videoLabel;
            }
        }

        private View CreateAudio(ScheduleItemViewModel model)
        {
            var url = model.Item switch
            {
                AudioMediaItem a => a.Url,
                YleAudioMediaItem ya => ya.Url,
                _ => null
            };

            Console.WriteLine($"CreateAudio: Creating audio view for item, url={url}, audioPlay={model.AudioPlay}");

            if (string.IsNullOrWhiteSpace(url))
            {
                Debug.WriteLine($"CreateAudio: Missing or invalid URL for audio item {model.Item.GetType().Name}");
                return CreatePlaceholderView("No audio URL");
            }

            // Display audio information
            var audioLabel = new Label
            {
                Text = "🎵 Audio Available\n(Playback coming soon)",
                FontSize = 18,
                HorizontalOptions = LayoutOptions.Center,
                VerticalOptions = LayoutOptions.Center,
                Padding = 20
            };

            return new Border()
            {
                Content = audioLabel,
                HeightRequest = 100,
                Padding = 10,
                Margin = new Thickness(20, 20),
                StrokeShape = new RoundRectangle { CornerRadius = 20 },
            };
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

        private View CreatePlaceholderView(string message)
        {
            return new Label
            {
                Text = message,
                HorizontalOptions = LayoutOptions.Center,
                VerticalOptions = LayoutOptions.Center,
                FontSize = 18,
                TextColor = Colors.Gray,
                HeightRequest = MediaHeight
            };
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }        
    }
}
