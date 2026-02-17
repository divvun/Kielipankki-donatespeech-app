using System;
using System.Diagnostics;
using Android.Content;
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
            
            // Set volume to maximum (left and right channels, 0.0 to 1.0)
            mediaPlayer.SetVolume(1.0f, 1.0f);
            
            Console.WriteLine("[Android AudioPlayer] Created MediaPlayer with volume=1.0");
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
            {
                Console.WriteLine($"[Android AudioPlayer] UpdateSource: VirtualView.Source={VirtualView?.Source}, mediaPlayer={mediaPlayer}, isDisposed={isDisposed}");
                return;
            }

            try
            {
                Console.WriteLine($"[Android AudioPlayer] UpdateSource: Resetting and loading {VirtualView.Source.Uri}");
                mediaPlayer.Reset();
                mediaPlayer.SetDataSource(VirtualView.Source.Uri);
                mediaPlayer.PrepareAsync();
                Console.WriteLine($"[Android AudioPlayer] PrepareAsync called for {VirtualView.Source.Uri}");
                
                Debug.WriteLine($"AudioPlayer: Loading source {VirtualView.Source.Uri}", "AudioPlayerHandler");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Android AudioPlayer] ERROR setting data source: {ex.Message}");
                Console.WriteLine($"[Android AudioPlayer] Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"AudioPlayer: Error setting data source: {ex.Message}", "AudioPlayerHandler");
            }
        }

        private void OnMediaPlayerPrepared(object? sender, EventArgs e)
        {
            Console.WriteLine("[Android AudioPlayer] OnMediaPlayerPrepared: Media is ready");
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
            {
                Console.WriteLine($"[Android AudioPlayer] UpdatePlayback: Cannot play - mediaPlayer={mediaPlayer}, isDisposed={isDisposed}, VirtualView={VirtualView}");
                return;
            }

            try
            {
                Console.WriteLine($"[Android AudioPlayer] UpdatePlayback: VirtualView.Play={VirtualView.Play}");
                if (VirtualView.Play)
                {
                    if (!mediaPlayer.IsPlaying)
                    {
                        Console.WriteLine("[Android AudioPlayer] Starting playback...");
                        
                        // Check system volume
                        try
                        {
                            var audioManager = Context?.GetSystemService(Context.AudioService) as AudioManager;
                            if (audioManager != null)
                            {
                                var currentVolume = audioManager.GetStreamVolume(global::Android.Media.Stream.Music);
                                var maxVolume = audioManager.GetStreamMaxVolume(global::Android.Media.Stream.Music);
                                Console.WriteLine($"[Android AudioPlayer] System volume - Music stream: {currentVolume}/{maxVolume}");
                                
                                if (currentVolume == 0)
                                {
                                    Console.WriteLine("[Android AudioPlayer] WARNING: System music volume is 0! User needs to turn up device volume.");
                                }
                            }
                        }
                        catch (Exception volEx)
                        {
                            Console.WriteLine($"[Android AudioPlayer] Could not check system volume: {volEx.Message}");
                        }
                        
                        // Log media info
                        try
                        {
                            var duration = mediaPlayer.Duration;
                            var position = mediaPlayer.CurrentPosition;
                            Console.WriteLine($"[Android AudioPlayer] Media info - Duration: {duration}ms, Current position: {position}ms");
                            
                            // If playback is at or near the end, seek back to start
                            if (position >= duration - 100)
                            {
                                Console.WriteLine("[Android AudioPlayer] Position is at end, seeking to start...");
                                mediaPlayer.SeekTo(VirtualView.StartTime * 1000);
                                Console.WriteLine($"[Android AudioPlayer] Seeked to {VirtualView.StartTime}s");
                            }
                        }
                        catch (Exception infoEx)
                        {
                            Console.WriteLine($"[Android AudioPlayer] Could not get media info: {infoEx.Message}");
                        }
                        
                        // Ensure volume is set
                        mediaPlayer.SetVolume(1.0f, 1.0f);
                        Console.WriteLine("[Android AudioPlayer] Volume set to 1.0f");
                        
                        mediaPlayer.Start();
                        Console.WriteLine($"[Android AudioPlayer] Playback STARTED - IsPlaying: {mediaPlayer.IsPlaying}");
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
