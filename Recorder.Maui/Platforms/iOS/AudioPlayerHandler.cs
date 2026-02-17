using System;
using System.Diagnostics;
using AVFoundation;
using Foundation;
using Microsoft.Maui;
using Microsoft.Maui.Handlers;
using UIKit;

namespace Recorder.Maui.Platforms.iOS
{
    public class AudioPlayerHandler : ViewHandler<AudioPlayer, UIView>
    {
        private AVPlayer? player;
        private AVPlayerItem? playerItem;
        private IDisposable? timeObserver;
        private IDisposable? statusObserver;
        private bool shouldPlayWhenReady = false;

        public static PropertyMapper<AudioPlayer, AudioPlayerHandler> AudioPlayerMapper = new PropertyMapper<AudioPlayer, AudioPlayerHandler>(ViewMapper)
        {
            [nameof(AudioPlayer.Source)] = MapSource,
            [nameof(AudioPlayer.Play)] = MapPlay,
        };

        public AudioPlayerHandler() : base(AudioPlayerMapper)
        {
        }

        protected override UIView CreatePlatformView()
        {
            Console.WriteLine("[iOS AudioPlayerHandler] CreatePlatformView called");
            // Audio doesn't need a visual component, but we need to return a view
            var view = new UIView();
            view.BackgroundColor = UIColor.Clear;
            
            player = new AVPlayer();
            player.Volume = 1.0f;
            
            Console.WriteLine("[iOS AudioPlayerHandler] Created platform view and AVPlayer, volume=1.0");
            Debug.WriteLine("AudioPlayer: Created platform view and AVPlayer", "AudioPlayerHandler");
            
            return view;
        }

        protected override void ConnectHandler(UIView platformView)
        {
            base.ConnectHandler(platformView);
            
            if (VirtualView != null)
            {
                VirtualView.PlayRequested += OnPlayRequested;
                VirtualView.ResetToStartRequested += OnResetRequested;
            }
        }

        protected override void DisconnectHandler(UIView platformView)
        {
            if (VirtualView != null)
            {
                VirtualView.PlayRequested -= OnPlayRequested;
                VirtualView.ResetToStartRequested -= OnResetRequested;
            }
            
            CleanupPlayer();
            
            base.DisconnectHandler(platformView);
        }

        private void CleanupPlayer()
        {
            if (player != null)
            {
                player.Pause();
                player.ReplaceCurrentItemWithPlayerItem(null);
                timeObserver?.Dispose();
                timeObserver = null;
                statusObserver?.Dispose();
                statusObserver = null;
                shouldPlayWhenReady = false;
                player = null;
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

        private async void UpdateSource()
        {
            Console.WriteLine("[iOS AudioPlayerHandler] UpdateSource called");
            
            if (VirtualView?.Source == null || player == null)
            {
                Console.WriteLine("[iOS AudioPlayerHandler] VirtualView.Source is null or player is null, skipping");
                return;
            }

            if (string.IsNullOrWhiteSpace(VirtualView.Source.Uri))
            {
                Console.WriteLine("[iOS AudioPlayerHandler] Source URI is null or empty, skipping");
                Debug.WriteLine("AudioPlayer: Source URI is null or empty, skipping", "AudioPlayerHandler");
                return;
            }

            try
            {
                // Clean up previous status observer
                statusObserver?.Dispose();
                statusObserver = null;
                
                var urlString = VirtualView.Source.Uri;
                NSUrl url;
                
                // Check if URL is HTTP - if so, download it first to work around iOS requiring
                // Content-Length and Accept-Ranges headers for HTTP audio streaming
                if (urlString.StartsWith("http://") || urlString.StartsWith("https://"))
                {
                    Console.WriteLine($"[iOS AudioPlayerHandler] HTTP URL detected, downloading file first...");
                    
                    try
                    {
                        using var httpClient = new System.Net.Http.HttpClient();
                        var audioData = await httpClient.GetByteArrayAsync(urlString);
                        
                        // Save to temp file
                        var tempPath = Path.Combine(Path.GetTempPath(), $"audio_{Guid.NewGuid()}.m4a");
                        await File.WriteAllBytesAsync(tempPath, audioData);
                        
                        Console.WriteLine($"[iOS AudioPlayerHandler] Downloaded {audioData.Length} bytes to {tempPath}");
                        url = NSUrl.FromFilename(tempPath);
                    }
                    catch (Exception downloadEx)
                    {
                        Console.WriteLine($"[iOS AudioPlayerHandler] Download failed: {downloadEx.Message}");
                        // Fall back to direct URL
                        url = new NSUrl(urlString);
                    }
                }
                else
                {
                    url = new NSUrl(urlString);
                }
                
                Console.WriteLine($"[iOS AudioPlayerHandler] Creating AVPlayerItem for URL: {url}");
                
                playerItem = AVPlayerItem.FromUrl(url);
                player.ReplaceCurrentItemWithPlayerItem(playerItem);
                
                // Add status observer
                statusObserver = playerItem.AddObserver("status", NSKeyValueObservingOptions.New, change =>
                {
                    var status = playerItem.Status;
                    Console.WriteLine($"[iOS AudioPlayerHandler] AVPlayerItem status changed to: {status}");
                    
                    if (status == AVPlayerItemStatus.ReadyToPlay)
                    {
                        Console.WriteLine($"[iOS AudioPlayerHandler] AVPlayerItem is ReadyToPlay. shouldPlayWhenReady={shouldPlayWhenReady}");
                        if (shouldPlayWhenReady && player != null)
                        {
                            Console.WriteLine("[iOS AudioPlayerHandler] Playing audio because shouldPlayWhenReady=true");
                            player.Play();
                            shouldPlayWhenReady = false;
                        }
                    }
                    else if (status == AVPlayerItemStatus.Failed)
                    {
                        var error = playerItem.Error;
                        if (error != null)
                        {
                            Console.WriteLine($"[iOS AudioPlayerHandler] AVPlayerItem failed to load:");
                            Console.WriteLine($"  Description: {error.LocalizedDescription}");
                            Console.WriteLine($"  Domain: {error.Domain}");
                            Console.WriteLine($"  Code: {error.Code}");
                            Console.WriteLine($"  UserInfo: {error.UserInfo}");
                        }
                        else
                        {
                            Console.WriteLine($"[iOS AudioPlayerHandler] AVPlayerItem failed to load: Unknown error");
                        }
                    }
                });
                
                Console.WriteLine($"[iOS AudioPlayerHandler] Loaded source {VirtualView.Source.Uri}, status={playerItem.Status}");
                Debug.WriteLine($"AudioPlayer: Loaded source {VirtualView.Source.Uri}", "AudioPlayerHandler");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[iOS AudioPlayerHandler] Failed to load source '{VirtualView.Source.Uri}': {ex.Message}");
                Debug.WriteLine($"AudioPlayer: Failed to load source '{VirtualView.Source.Uri}': {ex.Message}", "AudioPlayerHandler");
                playerItem = null;
                player.ReplaceCurrentItemWithPlayerItem(null);
                return;
            }
            
            // Seek to start time if specified
            if (VirtualView.StartTime > 0)
            {
                var startCMTime = new CoreMedia.CMTime(VirtualView.StartTime, 1);
                player.Seek(startCMTime);
                Console.WriteLine($"[iOS AudioPlayerHandler] Seeked to start time {VirtualView.StartTime}s");
                Debug.WriteLine($"AudioPlayer: Seeked to start time {VirtualView.StartTime}s", "AudioPlayerHandler");
            }
        }

        private void UpdatePlayback()
        {
            Console.WriteLine("[iOS AudioPlayerHandler] UpdatePlayback called");
            
            if (player == null || VirtualView == null)
            {
                Console.WriteLine("[iOS AudioPlayerHandler] player or VirtualView is null, skipping");
                return;
            }

            Console.WriteLine($"[iOS AudioPlayerHandler] VirtualView.Play={VirtualView.Play}, player.Volume={player.Volume}, player.Muted={player.Muted}");
            Console.WriteLine($"[iOS AudioPlayerHandler] playerItem.Status={playerItem?.Status}");
            
            if (VirtualView.Play)
            {
                // Check if playerItem is ready to play
                if (playerItem?.Status == AVPlayerItemStatus.ReadyToPlay)
                {
                    Console.WriteLine("[iOS AudioPlayerHandler] PlayerItem is ReadyToPlay, playing immediately");
                    player.Play();
                }
                else
                {
                    Console.WriteLine("[iOS AudioPlayerHandler] PlayerItem not ready yet, will play when ready");
                    shouldPlayWhenReady = true;
                }
                Console.WriteLine("[iOS AudioPlayerHandler] Started playback (or scheduled for when ready)");
                Debug.WriteLine("AudioPlayer: Started playback", "AudioPlayerHandler");
            }
            else
            {
                shouldPlayWhenReady = false;
                player.Pause();
                Console.WriteLine("[iOS AudioPlayerHandler] Paused playback");
                Debug.WriteLine("AudioPlayer: Paused playback", "AudioPlayerHandler");
            }
        }

        private void OnPlayRequested(object? sender, PlayRequestedEventArgs e)
        {
            Console.WriteLine($"[iOS AudioPlayerHandler] OnPlayRequested: Play={e.Play}");
            
            if (player == null)
            {
                Console.WriteLine("[iOS AudioPlayerHandler] player is null in OnPlayRequested, skipping");
                return;
            }

            if (e.Play)
            {
                player.Play();
                Console.WriteLine("[iOS AudioPlayerHandler] Play requested");
                Debug.WriteLine("AudioPlayer: Play requested", "AudioPlayerHandler");
            }
            else
            {
                player.Pause();
                Console.WriteLine("[iOS AudioPlayerHandler] Pause requested");
                Debug.WriteLine("AudioPlayer: Pause requested", "AudioPlayerHandler");
            }
        }

        private void OnResetRequested(object? sender, EventArgs e)
        {
            if (player == null || VirtualView == null)
                return;

            var startTime = VirtualView.StartTime;
            var startCMTime = new CoreMedia.CMTime(startTime, 1);
            player.Seek(startCMTime);
            
            Debug.WriteLine($"AudioPlayer: Reset to start time {startTime}s", "AudioPlayerHandler");
        }
    }
}
