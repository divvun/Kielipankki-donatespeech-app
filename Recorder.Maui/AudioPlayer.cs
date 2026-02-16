using System;
using System.ComponentModel;
using Microsoft.Maui.Controls;
using System.Diagnostics;
using System.Timers;
using Timer = System.Timers.Timer;

namespace Recorder
{
    public class AudioPlayer : View
    {
        public AudioPlayer()
        {
        }

        public event EventHandler? ResetToStartRequested;

        public void Reset()
        {
            ResetToStartRequested?.Invoke(this, EventArgs.Empty);
        }

        public static readonly BindableProperty SourceProperty =
            BindableProperty.Create(nameof(Source), typeof(UriAudioSource), typeof(AudioPlayer), null,
            propertyChanged: OnSourcePropertyChanged);

        public UriAudioSource? Source
        {
            set => SetValue(SourceProperty, value);
            get => (UriAudioSource?)GetValue(SourceProperty);
        }

        private static void OnSourcePropertyChanged(BindableObject bindable, object oldValue, object newValue)
        {
            var audioPlayer = (AudioPlayer)bindable;
            var source = newValue as UriAudioSource;
            Console.WriteLine($"AudioPlayer: Source property changed to {source?.Uri ?? "null"}");
        }

        // play=true starts audio, false stops
        // this is implemented as a property to allow data binding directly from viewmodel
        public static readonly BindableProperty PlayProperty = BindableProperty.Create(
            nameof(Play), typeof(bool), typeof(AudioPlayer),
            propertyChanged: OnPlayPropertyChanged
            );

        public bool Play
        {
            set => SetValue(PlayProperty, value);
            get => (bool)GetValue(PlayProperty);
        }

        // audio start offset time in seconds
        public static readonly BindableProperty StartTimeProperty =
            BindableProperty.Create(nameof(StartTime), typeof(int), typeof(AudioPlayer));

        public int StartTime
        {
            set => SetValue(StartTimeProperty, value);
            get => (int)GetValue(StartTimeProperty);
        }

        // end offset time in seconds
        public static readonly BindableProperty EndTimeProperty =
            BindableProperty.Create(nameof(EndTime), typeof(int), typeof(AudioPlayer));

        public int EndTime
        {
            set => SetValue(EndTimeProperty, value);
            get => (int)GetValue(EndTimeProperty);
        }

        private Timer? endMonitor;

        private void StartMonitoringEnd()
        {
            StopMonitoringEnd();

            Debug.WriteLine(string.Format("start monitoring end {0}", EndTime), "AudioPlayer");

            if (EndTime > 0)
            {
                int duration = EndTime - StartTime;

                endMonitor = new Timer(1000 * duration)
                {
                    AutoReset = false  // fire only once
                };

                endMonitor.Elapsed += (o, e) => Play = false;
                endMonitor.Start();
            }
        }

        private void StopMonitoringEnd()
        {
            Debug.WriteLine("stop monitoring end", "AudioPlayer");
            if (endMonitor != null)
            {
                endMonitor.Stop();
                endMonitor = null;
            }
        }

        private static void OnPlayPropertyChanged(BindableObject bindable, object oldValue, object newValue)
        {
            ((AudioPlayer)bindable).OnPlayPropertyChanged();
        }

        private void OnPlayPropertyChanged()
        {
            Console.WriteLine($"AudioPlayer: Play property changed to {Play}");

            PlayRequested?.Invoke(this, new PlayRequestedEventArgs(Play));

            if (Play)
            {
                StartMonitoringEnd();
            }
            else
            {
                StopMonitoringEnd();
            }
        }

        public event EventHandler<PlayRequestedEventArgs>? PlayRequested;
    }

    public class PlayRequestedEventArgs : EventArgs
    {
        public bool Play { get; }

        public PlayRequestedEventArgs(bool play)
        {
            Play = play;
        }
    }

    public class UriAudioSource
    {
        public string Uri { get; set; }

        public UriAudioSource(string uri)
        {
            Uri = uri;
        }
    }
}
