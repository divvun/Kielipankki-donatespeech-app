using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Input;
using Recorder.ViewModels;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using Recorder.ResX;

namespace Recorder
{
    public partial class NavigationBarView : ContentView
    {
        private readonly NavigationBarViewModel viewModel;

        public enum NavigationButtonType
        {
            Text, Back, Close
        };

        public string? ButtonText
        {
            get { return GetValue(ButtonTextProperty) as string; }
            set { SetValue(ButtonTextProperty, value); }
        }

        public static readonly BindableProperty ButtonTextProperty =
            BindableProperty.Create(
                nameof(ButtonText),
                typeof(string),
                typeof(NavigationBarView),
                ResX.AppResources.ExitButtonText
            );

        public ICommand ButtonCommand
        {
            get
            {
                return GetValue(ButtonCommandProperty) as Command ?? new Command(NavigationButtonDefaultAction);
            }

            set { SetValue(ButtonCommandProperty, value); }
        }

        public static readonly BindableProperty ButtonCommandProperty =
            BindableProperty.Create(
                nameof(ButtonCommand),
                typeof(Command),
                typeof(NavigationBarView),
                null
            );

        public NavigationButtonType ButtonType
        {
            get { return (NavigationButtonType) GetValue(ButtonTypeProperty); }
            set { SetValue(ButtonTypeProperty, value); }
        }

        public static readonly BindableProperty ButtonTypeProperty =
            BindableProperty.Create(
                nameof(ButtonType),
                typeof(NavigationButtonType),
                typeof(NavigationBarView),
                NavigationButtonType.Back
            );

        public NavigationBarView()
        {
            InitializeComponent();

            viewModel = new NavigationBarViewModel();
            recordedMinutesLabel.BindingContext = viewModel;
        }

        public void Update()
        {
            viewModel.Update();
        }

        private void NavigationButtonDefaultAction()
        {
            switch (ButtonType)
            {
                case NavigationButtonType.Back:
                    Navigation.PopAsync();
                    break;

                case NavigationButtonType.Close:
                    Navigation.PopModalAsync();
                    break;
            }
        }

        private async void OnLanguageButtonClicked(object sender, EventArgs e)
        {
            try
            {
                // Language options with their codes
                var languages = new Dictionary<string, string>
                {
                    { AppResources.LanguageFinnish, "fi" },
                    { AppResources.LanguageNorwegian, "nb" },
                    { AppResources.LanguageNynorsk, "nn" },
                    { AppResources.LanguageSwedish, "sv" },
                    { AppResources.LanguageNorthSami, "se" },
                    { AppResources.LanguageLuleSami, "smj" },
                    { AppResources.LanguageSouthSami, "sma" },
                    { AppResources.LanguageInariSami, "smn" },
                    { AppResources.LanguageSkoltSami, "sms" }
                };

                var languageNames = new List<string>(languages.Keys);
                
                // Get the current page from the current window
                var currentPage = Application.Current?.Windows?[0]?.Page;
                if (currentPage == null) return;
                
                var action = await currentPage.DisplayActionSheetAsync(
                    AppResources.ChooseLanguageTitle,
                    null, // Cancel button - null means no cancel
                    null, // Destruction button
                    languageNames.ToArray()
                );

                if (action != null && languages.ContainsKey(action))
                {
                    var selectedLanguageCode = languages[action];
                    var currentLanguage = Preferences.Get(Constants.UserLanguageKey, "nb");

                    // Only change if different language selected
                    if (selectedLanguageCode != currentLanguage)
                    {
                        // Save the new language preference
                        Preferences.Set(Constants.UserLanguageKey, selectedLanguageCode);

                        // Update the culture
                        var culture = new System.Globalization.CultureInfo(selectedLanguageCode);
                        System.Globalization.CultureInfo.CurrentCulture = culture;
                        System.Globalization.CultureInfo.CurrentUICulture = culture;
                        AppResources.Culture = culture;

                        // Recreate the main page to reflect language changes
                        // This is necessary because MAUI doesn't automatically refresh 
                        // static resource bindings when culture changes
                        if (Application.Current?.Windows?.Count > 0)
                        {
                            var currentWindow = Application.Current.Windows[0];
                            var app = Application.Current as App;
                            
                            // Determine which page to show (preserve onboarding state)
                            bool onboardingCompleted = Preferences.Get(Constants.OnboardingCompletedKey, false);
                            Page newInitialPage;
                            
                            if (app?.Config?.AlwaysShowOnboarding == true || !onboardingCompleted)
                            {
                                newInitialPage = new OnboardingPage();
                            }
                            else
                            {
                                newInitialPage = new ThemesPage();
                            }
                            
                            currentWindow.Page = new NavigationPage(newInitialPage);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in language selection: {ex}");
            }
        }
    }
}
