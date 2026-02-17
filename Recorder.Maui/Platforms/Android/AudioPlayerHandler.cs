using System;
using System.Diagnostics;
using Android.Media;
using AndroidView = Android.Views.View;
using Microsoft.Maui;
using Microsoft.Maui.Handlers;

namespace Recorder.Maui.Platforms.Android
{
    public class AudioPlayerHandler : ViewHandler<AudioPlayer, AndroidView>
    {
        private MediaPlayer? mediaPlayer;
        private bool isDisposed = false;

        public static PropertyMapper<AudioPlayer, AudioPlayerHandler> AudioPlayerMapper = new PropertyMapper<AudioPlayer, AudioPlayerHandler>(ViewMapper)
        {
            [nameof(AudioPlayer.Source)] = MapSource,
            [nameof(AudioPlayer.Play)] = MapPlay,
        };

        public AudioPlayerHandler() : base(AudioPlayerMapper)
        {
        }

        protected override AndroidView CreatePlatformView()
        {
            // Audio doesn't need a visual component on Android
            var view = new AndroidView(Context);
            
            mediaPlayer = new MediaPlayer();
            mediaPlayer.SetAudioAttributes(
                new AudioAttributes.Builder()!
                    .SetUsage(AudioUsageKind.Media)!
                    .SetContentType(AudioContentType.Music)!
                    .Build()!
            );
            
            Debug.WriteLine("AudioPlayer: Created platform view and MediaPlayer", "AudioPlayerHandler");
            
            return view;
        }

        protected override void ConnectHandler(AndroidView platformView)
        {
            base.ConnectHandler(platformView);
            
            if (VirtualView != null)
            {
                VirtualView.PlayRequested += OnPlayRequested;
                VirtualView.ResetToStartRequested += OnResetRequested;
            }

            if (mediaPlayer != null)
            {
                mediaPlayer.Prepared += OnMediaPlayerPrepared;
                mediaPlayer.Completion += OnMediaPlayerCompletion;
            }
        }

        protected override void DisconnectHandler(AndroidView platformView)
        {
            if (VirtualView != null)
            {
                VirtualView.PlayRequested -= OnPlayRequested;
                VirtualView.ResetToStartRequested -= OnResetRequested;
            }

            if (mediaPlayer != null)
            {
                mediaPlayer.Prepared -= OnMediaPlayerPrepared;
                mediaPlayer.Completion -= OnMediaPlayerCompletion;
            }
            
            CleanupPlayer();
            
            base.DisconnectHandler(platformView);
        }

        private void CleanupPlayer()
        {
            if (mediaPlayer != null && !isDisposed)
            {
                try
                {
                    if (mediaPlayer.IsPlaying)
                    {
                        mediaPlayer.Stop();
                    }
                    mediaPlayer.Reset();
                    mediaPlayer.Release();
                    isDisposed = true;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"AudioPlayer: Error cleaning up MediaPlayer: {ex.Message}", "AudioPlayerHandler");
                }
                mediaPlayer = null;
            }
        }

        private static void MapSource(AudioPlayerHandler handler, AudioPlayer audioPlayer)
        {
            handler.UpdateSource();
        }

        private static void MapPlay(AudioPlayerHandler handler, AudioPlayer audioPlayer)
        {
            handler.UpdatePlayback();
        }

        private void UpdateSource()
        {
            if (VirtualView?.Source == null || mediaPlayer == null || isDisposed)
                return;

            try
            {
                mediaPlayer.Reset();
                mediaPlayer.SetDataSource(VirtualView.Source.Uri);
                mediaPlayer.PrepareAsync();
                
                Debug.WriteLine($"AudioPlayer: Loading source {VirtualView.Source.Uri}", "AudioPlayerHandler");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"AudioPlayer: Error setting data source: {ex.Message}", "AudioPlayerHandler");
            }
        }

        private void OnMediaPlayerPrepared(object? sender, EventArgs e)
        {
            Debug.WriteLine("AudioPlayer: Media prepared", "AudioPlayerHandler");
            
            // Seek to start time if specified
            if (VirtualView != null && VirtualView.StartTime > 0 && mediaPlayer != null)
            {
                mediaPlayer.SeekTo(VirtualView.StartTime * 1000); // Convert to milliseconds
                Debug.WriteLine($"AudioPlayer: Seeked to start time {VirtualView.StartTime}s", "AudioPlayerHandler");
            }

            // Auto-play if Play property is already true
            if (VirtualView != null && VirtualView.Play)
            {
                UpdatePlayback();
            }
        }

        private void OnMediaPlayerCompletion(object? sender, EventArgs e)
        {
            Debug.WriteLine("AudioPlayer: Playback completed", "AudioPlayerHandler");
            if (VirtualView != null)
            {
                VirtualView.Play = false;
            }
        }

        private void UpdatePlayback()
        {
            if (mediaPlayer == null || isDisposed || VirtualView == null)
                return;

            try
            {
                if (VirtualView.Play)
                {
                    if (!mediaPlayer.IsPlaying)
                    {
                        mediaPlayer.Start();
                        Debug.WriteLine("AudioPlayer: Started playback", "AudioPlayerHandler");
                    }
                }
                else
                {
                    if (mediaPlayer.IsPlaying)
                    {
                        mediaPlayer.Pause();
                        Debug.WriteLine("AudioPlayer: Paused playback", "AudioPlayerHandler");
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"AudioPlayer: Error updating playback: {ex.Message}", "AudioPlayerHandler");
            }
        }

        private void OnPlayRequested(object? sender, PlayRequestedEventArgs e)
        {
            UpdatePlayback();
        }

        private void OnResetRequested(object? sender, EventArgs e)
        {
            if (mediaPlayer == null || isDisposed || VirtualView == null)
                return;

            try
            {
                var startTime = VirtualView.StartTime;
                mediaPlayer.SeekTo(startTime * 1000); // Convert to milliseconds
                
                Debug.WriteLine($"AudioPlayer: Reset to start time {startTime}s", "AudioPlayerHandler");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"AudioPlayer: Error resetting: {ex.Message}", "AudioPlayerHandler");
            }
        }
    }
}
