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
        private bool isInitialized = false;

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
            isInitialized = true;
            
            Console.WriteLine("AudioPlayer: Created platform view and AVPlayer");
            
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
            if (player != null)
            {
                player.Pause();
                player.ReplaceCurrentItemWithPlayerItem(null);
                timeObserver?.Dispose();
                timeObserver = null;
                player = null;
            }
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

        private void UpdateSource()
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
                // Log the URI we're about to use
                Console.WriteLine($"AudioPlayer: Creating NSUrl from URI: '{uri}'");
                Debug.WriteLine($"AudioPlayer: Creating NSUrl from URI: '{uri}'");
                
                NSUrl url = new NSUrl(uri);
                Console.WriteLine($"AudioPlayer: NSUrl created successfully from '{uri}'");
                Debug.WriteLine($"AudioPlayer: NSUrl created successfully from '{uri}'");
                
                playerItem = AVPlayerItem.FromUrl(url);
                Console.WriteLine($"AudioPlayer: AVPlayerItem created from URL, status={playerItem.Status}");
                Debug.WriteLine($"AudioPlayer: AVPlayerItem created from URL, status={playerItem.Status}");
                
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
                    Console.WriteLine($"AudioPlayer: About to call Play() on AVPlayer. Current item status: {playerItem?.Status ?? AVPlayerItemStatus.Unknown}");
                    player.Play();
                    Console.WriteLine($"AudioPlayer: play() completed. Rate: {player.Rate}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"AudioPlayer: Exception calling Play(): {ex}");
                }
            }
            else
            {
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
