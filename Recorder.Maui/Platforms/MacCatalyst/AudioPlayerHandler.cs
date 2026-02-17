using System;
using System.Diagnostics;
using AVFoundation;
using Foundation;
using Microsoft.Maui;
using Microsoft.Maui.Handlers;
using UIKit;

namespace Recorder.Maui.Platforms.MacCatalyst
{
    public class AudioPlayerHandler : ViewHandler<AudioPlayer, UIView>
    {
        private AVPlayer? player;
        private AVPlayerItem? playerItem;
        private IDisposable? timeObserver;
        private IDisposable? statusObserver;
        private bool isInitialized = false;
        private bool shouldPlayWhenReady = false;

        public static PropertyMapper<AudioPlayer, AudioPlayerHandler> AudioPlayerMapper = new PropertyMapper<AudioPlayer, AudioPlayerHandler>(ViewMapper)
        {
            [nameof(AudioPlayer.Source)] = MapSource,
            [nameof(AudioPlayer.Play)] = MapPlay,
        };

        public AudioPlayerHandler() : base(AudioPlayerMapper)
        {
            Console.WriteLine("AudioPlayer: AudioPlayerHandler constructor called");
        }

        protected override UIView CreatePlatformView()
        {
            // Audio doesn't need a visual component, but we need to return a view
            var view = new UIView();
            view.BackgroundColor = UIColor.Clear;
            
            player = new AVPlayer();
            player.Volume = 1.0f; // Ensure volume is at maximum
            player.AllowsExternalPlayback = false; // Keep audio local
            
            isInitialized = true;
            
            Console.WriteLine($"AudioPlayer: Created platform view and AVPlayer (Volume={player.Volume})");
            
            // Immediately apply Source and Play if they're already set on the VirtualView
            if (VirtualView != null)
            {
                if (VirtualView.Source != null)
                {
                    MapSource(this, VirtualView);
                }
                if (VirtualView.Play)
                {
                    MapPlay(this, VirtualView);
                }
            }
            
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
            shouldPlayWhenReady = false;
            statusObserver?.Dispose();
            statusObserver = null;
            
            if (player != null)
            {
                player.Pause();
                player.ReplaceCurrentItemWithPlayerItem(null);
                timeObserver?.Dispose();
                timeObserver = null;
                player = null;
            }
            
            playerItem = null;
        }

        private static void MapSource(AudioPlayerHandler handler, AudioPlayer audioPlayer)
        {
            Console.WriteLine($"AudioPlayer: MapSource called, uri={audioPlayer.Source?.Uri ?? "null"}");
            handler.UpdateSource();
        }

        private static void MapPlay(AudioPlayerHandler handler, AudioPlayer audioPlayer)
        {
            Console.WriteLine($"AudioPlayer: MapPlay called, play={audioPlayer.Play}");
            handler.UpdatePlayback();
        }

        private async void UpdateSource()
        {
            Console.WriteLine($"AudioPlayer: UpdateSource called, source={VirtualView?.Source?.Uri ?? "null"}, player={player != null}");
            Debug.WriteLine($"AudioPlayer: UpdateSource called, source={VirtualView?.Source?.Uri ?? "null"}, player={player != null}");
            
            if (VirtualView?.Source == null || player == null)
            {
                Console.WriteLine("AudioPlayer: Cannot update source - source or player is null");
                Debug.WriteLine("AudioPlayer: Cannot update source - source or player is null");
                return;
            }

            var uri = VirtualView.Source.Uri;
            if (string.IsNullOrWhiteSpace(uri))
            {
                Console.WriteLine("AudioPlayer: Source URI is null or empty, skipping");
                Debug.WriteLine("AudioPlayer: Source URI is null or empty, skipping");
                return;
            }

            try
            {
                NSUrl url;
                
                // Check if URL is HTTP - if so, download it first to work around iOS requiring
                // Content-Length and Accept-Ranges headers for HTTP audio streaming
                if (uri.StartsWith("http://") || uri.StartsWith("https://"))
                {
                    Console.WriteLine($"AudioPlayer: HTTP URL detected, downloading file first...");
                    Debug.WriteLine($"AudioPlayer: HTTP URL detected, downloading file first...");
                    
                    try
                    {
                        using var httpClient = new System.Net.Http.HttpClient();
                        var audioData = await httpClient.GetByteArrayAsync(uri);
                        
                        // Save to temp file
                        var tempPath = Path.Combine(Path.GetTempPath(), $"audio_{Guid.NewGuid()}.m4a");
                        await File.WriteAllBytesAsync(tempPath, audioData);
                        
                        Console.WriteLine($"AudioPlayer: Downloaded {audioData.Length} bytes to {tempPath}");
                        Debug.WriteLine($"AudioPlayer: Downloaded {audioData.Length} bytes to {tempPath}");
                        url = NSUrl.FromFilename(tempPath);
                    }
                    catch (Exception downloadEx)
                    {
                        Console.WriteLine($"AudioPlayer: Download failed: {downloadEx.Message}");
                        Debug.WriteLine($"AudioPlayer: Download failed: {downloadEx.Message}");
                        // Fall back to direct URL
                        url = new NSUrl(uri);
                    }
                }
                else
                {
                    Console.WriteLine($"AudioPlayer: Creating NSUrl from URI: '{uri}'");
                    Debug.WriteLine($"AudioPlayer: Creating NSUrl from URI: '{uri}'");
                    url = new NSUrl(uri);
                }
                
                Console.WriteLine($"AudioPlayer: NSUrl created successfully from '{uri}'");
                Debug.WriteLine($"AudioPlayer: NSUrl created successfully from '{uri}'");
                
                playerItem = AVPlayerItem.FromUrl(url);
                Console.WriteLine($"AudioPlayer: AVPlayerItem created from URL, status={playerItem.Status}");
                Debug.WriteLine($"AudioPlayer: AVPlayerItem created from URL, status={playerItem.Status}");
                
                // Observe status changes
                statusObserver?.Dispose();
                statusObserver = playerItem.AddObserver("status", NSKeyValueObservingOptions.New, change =>
                {
                    var status = playerItem.Status;
                    Console.WriteLine($"AudioPlayer: PlayerItem status changed to: {status}");
                    Debug.WriteLine($"AudioPlayer: PlayerItem status changed to: {status}");
                    
                    if (status == AVPlayerItemStatus.Failed)
                    {
                        var error = playerItem.Error;
                        if (error != null)
                        {
                            Console.WriteLine($"AudioPlayer: PlayerItem FAILED with error:");
                            Console.WriteLine($"  Description: {error.LocalizedDescription}");
                            Console.WriteLine($"  Domain: {error.Domain}");
                            Console.WriteLine($"  Code: {error.Code}");
                            Console.WriteLine($"  UserInfo: {error.UserInfo}");
                            Debug.WriteLine($"AudioPlayer: PlayerItem FAILED - Domain: {error.Domain}, Code: {error.Code}, Desc: {error.LocalizedDescription}");
                        }
                        else
                        {
                            Console.WriteLine($"AudioPlayer: PlayerItem FAILED with unknown error");
                            Debug.WriteLine($"AudioPlayer: PlayerItem FAILED with unknown error");
                        }
                    }
                    else if (status == AVPlayerItemStatus.ReadyToPlay)
                    {
                        Console.WriteLine("AudioPlayer: PlayerItem is READY TO PLAY!");
                        Debug.WriteLine("AudioPlayer: PlayerItem is READY TO PLAY!");
                        
                        // If we should be playing, start now that we're ready
                        if (shouldPlayWhenReady && player != null)
                        {
                            Console.WriteLine("AudioPlayer: Starting playback now that item is ready");
                            Debug.WriteLine("AudioPlayer: Starting playback now that item is ready");
                            player.Play();
                            Console.WriteLine($"AudioPlayer: Playback started. Rate={player.Rate}, Status={player.TimeControlStatus}");
                            Debug.WriteLine($"AudioPlayer: Playback started. Rate={player.Rate}, Status={player.TimeControlStatus}");
                        }
                    }
                });
                
                player.ReplaceCurrentItemWithPlayerItem(playerItem);
                Console.WriteLine($"AudioPlayer: PlayerItem replaced in AVPlayer");
                Debug.WriteLine($"AudioPlayer: PlayerItem replaced in AVPlayer");
                
                Console.WriteLine($"AudioPlayer: Loaded source {uri}");
                Debug.WriteLine($"AudioPlayer: Loaded source {uri}");
            }
            catch (Exception ex)
            {
                var errorMsg = $"AudioPlayer: Exception while loading source '{VirtualView.Source.Uri}': {ex.GetType().Name} - {ex.Message}";
                Console.WriteLine(errorMsg);
                Debug.WriteLine(errorMsg);
                Console.WriteLine($"AudioPlayer: Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"AudioPlayer: Stack trace: {ex.StackTrace}");
                playerItem = null;
                player.ReplaceCurrentItemWithPlayerItem(null);
                return;
            }
            
            // Seek to start time if specified
            if (VirtualView.StartTime > 0)
            {
                var startCMTime = new CoreMedia.CMTime(VirtualView.StartTime, 1);
                player.Seek(startCMTime);
                Console.WriteLine($"AudioPlayer: Seeked to start time {VirtualView.StartTime}s");
                Debug.WriteLine($"AudioPlayer: Seeked to start time {VirtualView.StartTime}s");
            }
        }

        private void UpdatePlayback()
        {
            Console.WriteLine($"AudioPlayer: UpdatePlayback called, isInitialized={isInitialized}, player={player != null}, play={VirtualView?.Play}, hasPlayerItem={playerItem != null}");
            
            if (player == null || VirtualView == null)
            {
                Console.WriteLine("AudioPlayer: Cannot update playback - player or VirtualView is null");
                return;
            }

            if (!isInitialized)
            {
                Console.WriteLine("AudioPlayer: Handler not fully initialized yet, deferring playback");
                return;
            }

            if (VirtualView.Play)
            {
                if (playerItem == null)
                {
                    Console.WriteLine("AudioPlayer: Cannot start playback - no playerItem loaded, attempting to update source first");
                    // Try to load the source if it hasn't been loaded yet
                    if (VirtualView.Source?.Uri != null)
                    {
                        UpdateSource();
                    }
                    
                    if (playerItem == null)
                    {
                        Console.WriteLine("AudioPlayer: Still no playerItem after trying to update source");
                        return;
                    }
                }
                
                try
                {
                    Console.WriteLine($"AudioPlayer: About to play. Current item status: {playerItem?.Status ?? AVPlayerItemStatus.Unknown}");
                    
                    // Check for errors on the player item
                    if (playerItem?.Error != null)
                    {
                        Console.WriteLine($"AudioPlayer: PlayerItem has error: {playerItem.Error.LocalizedDescription}");
                        Debug.WriteLine($"AudioPlayer: PlayerItem has error: {playerItem.Error.LocalizedDescription}");
                        return;
                    }
                    
                    // Check player volume
                    Console.WriteLine($"AudioPlayer: Player volume: {player.Volume}, Muted: {player.Muted}");
                    Debug.WriteLine($"AudioPlayer: Player volume: {player.Volume}, Muted: {player.Muted}");
                    
                    // Ensure volume is not zero and not muted
                    if (player.Volume < 0.1f)
                    {
                        player.Volume = 1.0f;
                        Console.WriteLine("AudioPlayer: Set player volume to 1.0");
                        Debug.WriteLine("AudioPlayer: Set player volume to 1.0");
                    }
                    
                    if (player.Muted)
                    {
                        player.Muted = false;
                        Console.WriteLine("AudioPlayer: Unmuted player");
                        Debug.WriteLine("AudioPlayer: Unmuted player");
                    }
                    
                    // Check if player item is ready
                    if (playerItem?.Status == AVPlayerItemStatus.ReadyToPlay)
                    {
                        // Player item is ready, start playback immediately
                        Console.WriteLine($"AudioPlayer: PlayerItem is ready, starting playback now");
                        Debug.WriteLine($"AudioPlayer: PlayerItem is ready, starting playback now");
                        shouldPlayWhenReady = false;
                        player.Play();
                        Console.WriteLine($"AudioPlayer: play() completed. Rate: {player.Rate}, Volume: {player.Volume}, Muted: {player.Muted}, TimeControlStatus: {player.TimeControlStatus}");
                        Debug.WriteLine($"AudioPlayer: play() completed. Rate: {player.Rate}, Volume: {player.Volume}, Muted: {player.Muted}, TimeControlStatus: {player.TimeControlStatus}");
                    }
                    else
                    {
                        // Player item not ready yet, set flag to play when it becomes ready
                        Console.WriteLine($"AudioPlayer: PlayerItem not ready (status={playerItem?.Status}), will play when ready");
                        Debug.WriteLine($"AudioPlayer: PlayerItem not ready (status={playerItem?.Status}), will play when ready");
                        shouldPlayWhenReady = true;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"AudioPlayer: Exception calling Play(): {ex}");
                }
            }
            else
            {
                shouldPlayWhenReady = false;
                player.Pause();
                Console.WriteLine("AudioPlayer: Paused playback");
            }
        }

        private void OnPlayRequested(object? sender, PlayRequestedEventArgs e)
        {
            if (player == null)
                return;

            if (e.Play)
            {
                player.Play();
                Debug.WriteLine("AudioPlayer: Play requested", "AudioPlayerHandler");
            }
            else
            {
                player.Pause();
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
