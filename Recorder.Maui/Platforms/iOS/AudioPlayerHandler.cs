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
            // Audio doesn't need a visual component, but we need to return a view
            var view = new UIView();
            view.BackgroundColor = UIColor.Clear;
            
            player = new AVPlayer();
            
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

        private void UpdateSource()
        {
            if (VirtualView?.Source == null || player == null)
                return;

            if (string.IsNullOrWhiteSpace(VirtualView.Source.Uri))
            {
                Debug.WriteLine("AudioPlayer: Source URI is null or empty, skipping", "AudioPlayerHandler");
                return;
            }

            try
            {
                var url = new NSUrl(VirtualView.Source.Uri);
                playerItem = AVPlayerItem.FromUrl(url);
                player.ReplaceCurrentItemWithPlayerItem(playerItem);
                
                Debug.WriteLine($"AudioPlayer: Loaded source {VirtualView.Source.Uri}", "AudioPlayerHandler");
            }
            catch (Exception ex)
            {
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
                Debug.WriteLine($"AudioPlayer: Seeked to start time {VirtualView.StartTime}s", "AudioPlayerHandler");
            }
        }

        private void UpdatePlayback()
        {
            if (player == null || VirtualView == null)
                return;

            if (VirtualView.Play)
            {
                player.Play();
                Debug.WriteLine("AudioPlayer: Started playback", "AudioPlayerHandler");
            }
            else
            {
                player.Pause();
                Debug.WriteLine("AudioPlayer: Paused playback", "AudioPlayerHandler");
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
