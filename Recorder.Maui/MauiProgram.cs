using Microsoft.Extensions.Logging;
using Microsoft.Maui.Controls;
using Recorder.Services;
using Recorder.Core.Services;
using Recorder.Core.Models;
using CommunityToolkit.Maui;

#if MACCATALYST
using Recorder.Maui.Platforms.MacCatalyst;
#elif IOS
using Recorder.Maui.Platforms.iOS;
#elif ANDROID
using Recorder.Maui.Platforms.Android;
#endif

namespace Recorder;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.UseMauiCommunityToolkit()
			.UseMauiCommunityToolkitMediaElement()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			})
			.ConfigureMauiHandlers(handlers =>
			{
#if MACCATALYST || IOS || ANDROID
				// Register custom handlers for media playback
				handlers.AddHandler<AudioPlayer, AudioPlayerHandler>();
#endif
			})
			.ConfigureEffects(effects =>
			{
				// Empty effects configuration to satisfy legacy code
				// This prevents EffectsFactory errors without actually registering any effects
			});

		// Register platform-specific services
#if MACCATALYST
		builder.Services.AddSingleton<IAudioRecorder, AudioRecorder>();
		System.Diagnostics.Debug.WriteLine("Registered Mac Catalyst AudioRecorder");
#else
		builder.Services.AddSingleton<IAudioRecorder, NullAudioRecorder>();
		System.Diagnostics.Debug.WriteLine("Registered NullAudioRecorder");
#endif

		// Register file system provider
		builder.Services.AddSingleton<IFileSystemProvider, MauiFileSystemProvider>();

		// Register RecordingManager as a service
		builder.Services.AddSingleton<IRecordingManager>(sp =>
		{
			var config = AppConfiguration.Load() ?? new AppConfiguration();
			var audioRecorder = sp.GetRequiredService<IAudioRecorder>();
			return new RecordingManager(config, audioRecorder);
		});

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
