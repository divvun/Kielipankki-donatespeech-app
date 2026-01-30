using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Input;
using Recorder.ResX;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.ApplicationModel.Communication;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;

namespace Recorder.Views
{
    public partial class TermsConditionsPage : ContentPage
    {
        public ICommand TapLinkCommand => new Command<string>(
            async (url) => await Launcher.OpenAsync(url));

        public ICommand TapEmailCommand => new Command<string>(
            async (recipient) =>
            {
                try
                {
                    await Email.ComposeAsync(string.Empty, string.Empty, new string[] { recipient });
                }
                catch (FeatureNotSupportedException e)
                {
                    // email is not supported on ios simulator and will throw
                    Debug.WriteLine(e);
                }
            });

        public TermsConditionsPage()
        {
            InitializeComponent();
            BindingContext = this;
            
            // Set text from resources
            titleLabel.Text = AppResources.TermsHelloTitle ?? "Terms and Conditions";
            bodyLabel.Text = AppResources.TermsHelloBody ?? "Please read and accept the terms...";
            
            acceptButton.Clicked += AcceptButton_Clicked;
        }

        private async void AcceptButton_Clicked(object sender, EventArgs e)
        {
            try
            {
                Preferences.Set(Constants.OnboardingCompletedKey, true);
                await Navigation.PushAsync(new ThemesPage());
            }
            catch (Exception ex)
            {
                await DisplayAlert("Navigation Error", $"Failed to navigate to ThemesPage:\n{ex.Message}", "OK");
            }
        }
    }
}
