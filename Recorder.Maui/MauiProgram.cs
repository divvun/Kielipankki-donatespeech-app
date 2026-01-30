using Microsoft.Extensions.Logging;
using Microsoft.Maui.Controls;
using Recorder.Services;

#if MACCATALYST
using Recorder.Maui.Platforms.MacCatalyst;
#endif

namespace Recorder;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
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

		// Register RecordingManager as a service
		builder.Services.AddSingleton<IRecordingManager>(sp =>
		{
			var config = AppConfiguration.Load();
			var audioRecorder = sp.GetRequiredService<IAudioRecorder>();
			return new RecordingManager(config, audioRecorder);
		});

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
