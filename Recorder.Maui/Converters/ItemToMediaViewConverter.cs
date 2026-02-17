using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
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
            Console.WriteLine($"ItemToMediaViewConverter.Convert called with value type: {value?.GetType().Name ?? "null"}");
            
            if (value is ScheduleItemViewModel model)
            {
                Console.WriteLine($"ItemToMediaViewConverter: IsAudio={model.IsAudio}, IsVideo={model.IsVideo}, IsImage={model.IsImage}, IsText={model.IsText}");
                
                if (model.IsAudio)
                {
                    Console.WriteLine("ItemToMediaViewConverter: Creating audio view");
                    return CreateAudio(model);
                }
                else if (model.IsVideo)
                {
                    Console.WriteLine("ItemToMediaViewConverter: Creating video view");
                    return CreateVideo(model);
                }
                else if (model.IsImage || model.IsPromptWithImage)
                {
                    Console.WriteLine("ItemToMediaViewConverter: Creating image view");
                    return CreateImage(model, nameof(model.ItemMediaUrl));
                }
                else if (model.IsText)
                {
                    Console.WriteLine("ItemToMediaViewConverter: Creating text view");
                    return CreateText(model);
                }
            }

            Console.WriteLine("ItemToMediaViewConverter: Returning null (no matching type)");
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

            // For HTTP URLs on iOS/Mac, need to download first due to AVPlayer limitations
            if ((url.StartsWith("http://") || url.StartsWith("https://")) && 
                (DeviceInfo.Platform == DevicePlatform.iOS || DeviceInfo.Platform == DevicePlatform.MacCatalyst))
            {
                return CreateVideoWithHttpDownload(model, url);
            }

            return CreateVideoElement(model, url);
        }

        private View CreateVideoWithHttpDownload(ScheduleItemViewModel model, string httpUrl)
        {
            // Use a ContentView wrapper so we can update the content
            var wrapper = new ContentView
            {
                Content = CreatePlaceholderView("Loading video...")
            };
            
            // Start async download and replace content when ready
            Task.Run(async () =>
            {
                try
                {
                    using var httpClient = new System.Net.Http.HttpClient();
                    httpClient.Timeout = TimeSpan.FromMinutes(5); // Videos can be large
                    
                    var videoData = await httpClient.GetByteArrayAsync(httpUrl);
                    
                    // Save to temp file
                    var extension = System.IO.Path.GetExtension(httpUrl) ?? ".mp4";
                    var tempPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"video_{Guid.NewGuid()}{extension}");
                    await File.WriteAllBytesAsync(tempPath, videoData);
                    
                    // Update content on main thread
                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        wrapper.Content = CreateVideoElement(model, tempPath);
                    });
                }
                catch (Exception ex)
                {
                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        wrapper.Content = CreatePlaceholderView($"Failed to load video: {ex.Message}");
                    });
                }
            });

            return wrapper;
        }

        private View CreateVideoElement(ScheduleItemViewModel model, string videoPath)
        {
            try
            {
                var shouldAutoPlay = !model.IsRecordingEnabled;

                MediaSource source;
                if (videoPath.StartsWith("http://") || videoPath.StartsWith("https://"))
                {
                    source = MediaSource.FromUri(videoPath);
                }
                else
                {
                    // Local file path
                    source = MediaSource.FromFile(videoPath);
                }
                
                var mediaElement = new MediaElement
                {
                    BindingContext = model,
                    Source = source,
                    ShouldAutoPlay = false, // Control playback manually
                    ShouldShowPlaybackControls = true,
                    ShouldMute = false,
                    HeightRequest = MediaHeight,
                    Aspect = Aspect.AspectFit
                };

                // Start playback when media opens
                mediaElement.MediaOpened += (s, e) =>
                {
                    if (shouldAutoPlay)
                    {
                        mediaElement.Play();
                    }
                };

                // Handle VideoPlay property changes
                model.PropertyChanged += (s, e) =>
                {
                    if (e.PropertyName == nameof(model.VideoPlay) && model.VideoPlay)
                    {
                        mediaElement.Play();
                    }
                };

                // Handle video reset event
                model.VideoReset += (s, e) =>
                {
                    Debug.WriteLine("Video reset requested - seeking to start");
                    if (mediaElement.CurrentState != CommunityToolkit.Maui.Core.Primitives.MediaElementState.None)
                    {
                        mediaElement.SeekTo(TimeSpan.Zero);
                    }
                };

                // If recording is enabled, overlay the video with an image
                if (model.IsRecordingEnabled && !string.IsNullOrWhiteSpace(model.VideoItemImageUrl))
                {
                    var grid = new Grid();
                    grid.Children.Add(mediaElement);
                    grid.Children.Add(CreateImage(model, nameof(model.VideoItemImageUrl)));
                    return grid;
                }

                return mediaElement;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"CreateVideoElement: Failed to create MediaElement: {ex.Message}");
                return CreatePlaceholderView($"Video playback error: {ex.Message}");
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

            try
            {
                // Create a visible UI for the audio player
                var stackLayout = new StackLayout
                {
                    Orientation = StackOrientation.Vertical,
                    Padding = 20,
                    Spacing = 10,
                    BackgroundColor = Color.FromArgb("#F0F0F0")
                };

                // Add a label showing this is an audio player
                var titleLabel = new Label
                {
                    Text = "🔊 Audio Player",
                    FontSize = 20,
                    FontAttributes = FontAttributes.Bold,
                    HorizontalOptions = LayoutOptions.Center,
                    TextColor = Colors.Black
                };
                stackLayout.Children.Add(titleLabel);

                // Add description label
                var descLabel = new Label
                {
                    Text = model.Item.Description ?? "Audio",
                    FontSize = 16,
                    HorizontalOptions = LayoutOptions.Center,
                    TextColor = Colors.Black
                };
                stackLayout.Children.Add(descLabel);

                // Add URL display (for debugging)
                var urlLabel = new Label
                {
                    Text = $"URL: {url}",
                    FontSize = 12,
                    HorizontalOptions = LayoutOptions.Center,
                    TextColor = Colors.Gray
                };
                stackLayout.Children.Add(urlLabel);

                // Add play status indicator bound to model.AudioPlay
                var statusLabel = new Label
                {
                    FontSize = 14,
                    HorizontalOptions = LayoutOptions.Center,
                    BindingContext = model,
                    TextColor = Colors.Blue
                };
                // Bind to AudioPlay property to show true/false
                statusLabel.SetBinding(Label.TextProperty, new Binding(
                    nameof(model.AudioPlay),
                    BindingMode.OneWay,
                    source: model,
                    stringFormat: "AudioPlay = {0}"
                ));
                stackLayout.Children.Add(statusLabel);

                // Add a manual label to show what we expect
                var expectedLabel = new Label
                {
                    Text = $"Expected: IsAudio={model.IsAudio}, IsRecording={model.IsRecordingEnabled}, State={model.ItemDisplayState}",
                    FontSize = 10,
                    HorizontalOptions = LayoutOptions.Center,
                    TextColor = Colors.DarkGray
                };
                stackLayout.Children.Add(expectedLabel);

                // Add a manual play button for testing
                var playButton = new Button
                {
                    Text = "▶️ Force Play Audio",
                    BackgroundColor = Colors.Green,
                    TextColor = Colors.White,
                    HorizontalOptions = LayoutOptions.Center,
                    Padding = 10,
                    Margin = new Thickness(0, 10, 0, 0)
                };
                playButton.Clicked += (s, e) =>
                {
                    Console.WriteLine($"Manual play button clicked! Setting AudioPlay to true");
                    model.AudioPlay = true;
                };
                stackLayout.Children.Add(playButton);

                // Create the actual AudioPlayer control (invisible but handles playback)
                var audio = new AudioPlayer()
                {
                    BindingContext = model,
                    Source = new UriAudioSource(url),
                    Play = model.AudioPlay,
                    HeightRequest = 0  // Make it invisible - just for audio handling
                };

                // Bind play state changes
                audio.SetBinding(AudioPlayer.PlayProperty, new Binding(
                    nameof(model.AudioPlay),
                    BindingMode.TwoWay,
                    source: model
                ));
                
                // Add the invisible audio player to the stack
                stackLayout.Children.Add(audio);

                Console.WriteLine($"CreateAudio: Created visible audio UI with AudioPlayer control, play={model.AudioPlay}");

                return new Border()
                {
                    Content = stackLayout,
                    HeightRequest = 280,
                    Padding = 10,
                    Margin = new Thickness(20, 20),
                    StrokeShape = new RoundRectangle { CornerRadius = 20 },
                };
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"CreateAudio: Failed to create AudioPlayer: {ex.Message}");
                return CreatePlaceholderView($"Audio playback error: {ex.Message}");
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
