using System;
using Recorder.Views;
using Recorder.ResX;
using Microsoft.Maui.Controls;

namespace Recorder
{
    public partial class OnboardingPage : ContentPage
    {
        public OnboardingPage()
        {
            InitializeComponent();
            
            // Set text content
            TitleLabel.Text = AppResources.OnboardingTitle ?? "Welcome";
            Body1Label.Text = AppResources.OnboardingBody ?? "Thank you for using this app";
            
            // Debug: Set background to confirm page is loading
            this.BackgroundColor = Colors.White;
        }

        async void ContinueButton_Clicked(object sender, EventArgs e)
        {
            try
            {
                // onboarding is complete only when terms accepted
                await Navigation.PushAsync(new TermsConditionsPage());
            }
            catch (Exception ex)
            {
                await DisplayAlert("Navigation Error", $"Failed to navigate:\n{ex.Message}\n\nStack:\n{ex.StackTrace}", "OK");
            }
        }
    }
}
