using System;
using System.Diagnostics;
using System.Globalization;
using System.Threading.Tasks;

using Microsoft.Maui.Controls;
using Microsoft.Maui.Networking;
using Microsoft.Maui.Storage;

using Recorder.Models;
using Recorder.Core.Models;
using Recorder.Services;
using Recorder.Core.Services;
using Recorder.Core.Models;

namespace Recorder
{
    public partial class App : Application
    {
        public IRecorderApi RecorderApi { get; private set; } = null!;
        public IAppRepository AppRepository { get; private set; } = null!;
        public IAppPreferences AppPreferences { get; private set; } = null!;
        public IRecordingManager RecMan { get; private set; } = null!;

        private static IAppDatabase _database = null!;
        public static IAppDatabase Database => GetDatabase();

        public IFirebaseAnalyticsEventTracker AnalyticsEventTracker = null!;
        public IAppConfiguration Config { get; private set; } = null!;

        private long schedulerLockCounter = 0;

        public event EventHandler AppSleep = null!;
        public event EventHandler AppResume = null!;

        public int TotalRecordedSeconds;  // total recorded time from preferences

        public App()
        {
            Console.WriteLine("============================================");
            Console.WriteLine("[APP STARTUP] App constructor called");
            Console.WriteLine("============================================");
            
            try
            {
                InitializeComponent();
                InitializeServices();

                // Generate and save an instance ID if one does not already exist
                if (!Preferences.ContainsKey(Constants.ClientIdKey))
                {
                    string guidString = Guid.NewGuid().ToString();
                    Preferences.Set(Constants.ClientIdKey, guidString);
                    Debug.WriteLine($"Created new client ID: {guidString}");
                }
                Debug.WriteLine(string.Format("From preferences, clientID = {0}", Preferences.Get(Constants.ClientIdKey, "unknown")));

                // Initialize user language preference if not set
                if (!Preferences.ContainsKey(Constants.UserLanguageKey))
                {
                    // Default to Norwegian Bokmål, or use "fi" for Finnish
                    Preferences.Set(Constants.UserLanguageKey, "nb");
                }

                // Set the culture for resource files based on user language preference
                string userLang = Preferences.Get(Constants.UserLanguageKey, "nb");
                
                // Create culture - for minority languages, we create a neutral culture
                // that matches our .resx file naming even if it's not in .NET's culture database
                var culture = CreateCultureSafe(userLang);
                
                System.Globalization.CultureInfo.CurrentCulture = culture;
                System.Globalization.CultureInfo.CurrentUICulture = culture;
                Recorder.ResX.AppResources.Culture = culture;
                Console.WriteLine($"[CULTURE] Set UI culture to: {userLang} (Culture.Name: {culture.Name})");
                
                // Test ResourceManager - try to get a string directly
                try
                {
                    var testString = Recorder.ResX.AppResources.ResourceManager.GetString("ThemesPageTitleText", culture);
                    Console.WriteLine($"[CULTURE] ResourceManager.GetString('ThemesPageTitleText', {culture.Name}) = '{testString}'");
                    
                    var testString2 = Recorder.ResX.AppResources.ThemesPageTitleText;
                    Console.WriteLine($"[CULTURE] AppResources.ThemesPageTitleText = '{testString2}'");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CULTURE] ResourceManager test failed: {ex.Message}");
                }

                // Initialize the total number of seconds recorded from preferences.
                // If this preference is not found, it is initialized to zero.
                // The number should be updated after each completed recording.
                // Use the UpdateTotalRecorded function in this class for that.
                TotalRecordedSeconds = Preferences.Get(Constants.TotalRecordedSecondsKey, 0);
                Debug.WriteLine($"Total time recorded: {TotalRecordedSeconds} seconds");
                // Use NavigationBarViewModel to get a formatted representation.

                //App.Database.DeleteAllRecordings();  // or maybe not
                //this.AppRepository.ListRecordingsInDatabase();

                this.AppRepository!.ListUploadedRecordings();

                StartUploadScheduler(schedulerLockCounter);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        protected override Window CreateWindow(IActivationState? activationState)
        {
            Page mainPage;
            try
            {
                // Set the main page to the initial page based on onboarding status
                mainPage = new NavigationPage(GetInitialPage());
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
                mainPage = new ContentPage
                {
                    Content = new ScrollView
                    {
                        Content = new Editor
                        {
                            Text = ex.ToString(),
                            Margin = new Thickness(20),
                            IsReadOnly = true,
                            AutoSize = EditorAutoSizeOption.TextChanges,
                            FontSize = 12
                        }
                    }
                };
            }

            return new Window(mainPage);
        }

        private Page GetInitialPage()
        {
            bool onboardingCompleted = Preferences.Get(Constants.OnboardingCompletedKey, false);

            if (Config.AlwaysShowOnboarding || !onboardingCompleted)
            {               
                return new OnboardingPage();
            }
            else
            {
                return new ThemesPage();
            }
        }

        private void InitializeServices()
        {
            Config = AppConfiguration.Load() ?? new AppConfiguration();

            RecorderApi = new RecorderApiService(Config);
            AppPreferences = new AppPreferences();
            AppRepository = new AppRepository(RecorderApi, AppPreferences);

            // Try to get RecordingManager from DI first
            try
            {
                var recManFromDI = Application.Current?.Handler?.MauiContext?.Services?.GetService(typeof(IRecordingManager)) as IRecordingManager;
                if (recManFromDI != null)
                {
                    RecMan = recManFromDI;
                    Debug.WriteLine("Got RecordingManager from DI");
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to get RecordingManager from DI: {ex.Message}");
            }

            // Fallback to manual creation
            if (RecMan == null)
            {
                Debug.WriteLine("Creating RecordingManager manually");
                IAudioRecorder? audioRecorder = null;
                try
                {
                    audioRecorder = Application.Current?.Handler?.MauiContext?.Services?.GetService(typeof(IAudioRecorder)) as IAudioRecorder;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Failed to get IAudioRecorder from DI: {ex.Message}");
                }

                // If DI didn't work, directly instantiate platform-specific recorder
                if (audioRecorder == null)
                {
#if MACCATALYST
                    audioRecorder = new Recorder.Maui.Platforms.MacCatalyst.AudioRecorder();
                    Debug.WriteLine("Created Mac Catalyst AudioRecorder directly");
#elif IOS
                    audioRecorder = new Recorder.Maui.Platforms.iOS.AudioRecorder();
                    Debug.WriteLine("Created iOS AudioRecorder directly");
#elif ANDROID
                    audioRecorder = new Recorder.Maui.Platforms.Android.AudioRecorder();
                    Debug.WriteLine("Created Android AudioRecorder directly");
#else
                    Debug.WriteLine("No platform-specific AudioRecorder available, using NullAudioRecorder");
#endif
                }

                RecMan = new RecordingManager(Config, audioRecorder);
            }

            AnalyticsEventTracker = DependencyService.Get<IFirebaseAnalyticsEventTracker>() ?? new NoOpFirebaseAnalyticsEventTracker();

        }

        protected override void OnStart()
        {
        }

        protected override void OnSleep()
        {
            AppSleep?.Invoke(this, new EventArgs());
            schedulerLockCounter = DateTimeOffset.Now.ToUnixTimeMilliseconds();
        }

        protected override void OnResume()
        {
            AppResume?.Invoke(this, new EventArgs());
            StartUploadScheduler(schedulerLockCounter);
        }

        private void StartUploadScheduler(long timerLock)
        {
            Debug.WriteLine("Starting timer for lock value {0}", timerLock);
            Console.WriteLine($"=== StartUploadScheduler: timerLock={timerLock} ===");
            Dispatcher.StartTimer(TimeSpan.FromSeconds(Constants.PendingUploadsTimerIntervalSeconds), () =>
            {
                Debug.WriteLine("Running upload task");
                Console.WriteLine($"=== Upload timer tick, lock={timerLock}, current={schedulerLockCounter} ===");
                if (timerLock != schedulerLockCounter)
                {
                    Debug.WriteLine("Initialized lock {0} doesn't match the current {1}", timerLock, schedulerLockCounter);
                    Console.WriteLine($"Timer cancelled: lock mismatch");
                    return false;
                }

                if (Connectivity.NetworkAccess == NetworkAccess.Internet)
                {
                    Console.WriteLine("Network available, starting upload task");
                    Task.Run(async () =>
                    {
                        try
                        {
                            await this.AppRepository.UploadPendingRecordings();
                        }
                        catch (Exception e)
                        {
                            Debug.WriteLine("Failed to upload pending recordings");
                            Debug.WriteLine(e);
                        }
                    });
                }
                else
                {
                    Debug.WriteLine("Skipping upload because no network");
                }

                return true;
            });
        }

        public static CultureInfo CreateCultureSafe(string cultureCode)
        {
            // Map unsupported Sami cultures to recognized "carrier" cultures
            // .NET doesn't recognize smj/sma/sms as valid cultures, so we use recognized cultures
            // to carry the translations via their satellite assemblies:
            string effectiveCulture = cultureCode switch
            {
                "smj" => "is",  // Lule Sami → Icelandic (carrier culture)
                "sma" => "fo",  // Southern Sami → Faroese (carrier culture)
                "sms" => "kl",  // Skolt Sami → Kalaallisut/Greenlandic (carrier culture)
                _ => cultureCode
            };

            if (effectiveCulture != cultureCode)
            {
                Console.WriteLine($"[CULTURE] Mapping unsupported culture {cultureCode} → {effectiveCulture}");
            }

            try
            {
                // Try to get the culture directly first
                var culture = CultureInfo.GetCultureInfo(effectiveCulture);
                Console.WriteLine($"[CULTURE] Using recognized culture: {effectiveCulture}");
                return culture;
            }
            catch (CultureNotFoundException)
            {
                // Culture not recognized, try region-specific variants
                var regionalVariants = new[] { $"{effectiveCulture}-NO", $"{effectiveCulture}-SE", $"{effectiveCulture}-FI" };
                
                foreach (var variant in regionalVariants)
                {
                    try
                    {
                        var culture = CultureInfo.GetCultureInfo(variant);
                        Console.WriteLine($"[CULTURE] Using regional variant: {variant} for {effectiveCulture}");
                        return culture;
                    }
                    catch (CultureNotFoundException)
                    {
                        continue;
                    }
                }
                
                // If no regional variant works, create a custom CultureInfo
                // by using the invariant culture as a base and setting the name
                Console.WriteLine($"[CULTURE] Creating custom culture for: {effectiveCulture}");
                
                try
                {
                    // Use CultureInfo constructor with useUserOverride: false
                    // This creates a read-only culture but allows for custom culture codes
                    var invariant = CultureInfo.InvariantCulture;
                    var cultureCopy = new CultureInfo(invariant.Name);
                    
                    // Try to override the name through reflection
                    var nameField = typeof(CultureInfo).GetField("_name", 
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    
                    if (nameField == null)
                    {
                        nameField = typeof(CultureInfo).GetField("m_name",
                            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    }
                    
                    if (nameField != null)
                    {
                        nameField.SetValue(cultureCopy, effectiveCulture);
                        Console.WriteLine($"[CULTURE] Created custom culture with name: {effectiveCulture}");
                        return cultureCopy;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CULTURE] Failed to create custom culture: {ex.Message}");
                }

                Console.WriteLine($"[CULTURE] Falling back to invariant culture for: {effectiveCulture}");
                return CultureInfo.InvariantCulture;
            }
        }

        private static IAppDatabase GetDatabase()
        {
            if (_database == null)
            {
                _database = new AppDatabase();
            }

            return _database;
        }

        public void UpdateTotalRecorded(int secondsToAdd)
        {
            TotalRecordedSeconds += Math.Abs(secondsToAdd);  // should never be negative, but hey...
            Preferences.Set(Constants.TotalRecordedSecondsKey, TotalRecordedSeconds);
            Debug.WriteLine($"Total recorded seconds updated to {TotalRecordedSeconds}");
        }
    }
}
