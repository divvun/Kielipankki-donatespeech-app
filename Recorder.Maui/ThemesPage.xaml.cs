using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Input;

using Microsoft.Maui.Controls;

using Recorder.ViewModels;
using Recorder.ResX;

namespace Recorder
{
    public partial class ThemesPage : ContentPage
    {
        private ThemesPageViewModel viewModel = null!;
        private Task<bool> alertPopupTask = Task.FromResult(false);
        private bool scheduleOpening;
        private bool detailsOpening;

        public ThemesPage()
        {
            CreateCommands();
            InitializeComponent();

            var app = Application.Current as App;
            viewModel = new ThemesPageViewModel(app!.AppRepository);
            viewModel.ThemeLoadFailed += OnThemeLoadFailed;
            BindingContext = viewModel;
        }

        private void CreateCommands()
        {
            ShowDetailsCommand = new Command(
                async execute =>
                {
                    if (detailsOpening)
                    {
                        Debug.WriteLine("Ignore show details since already showing");
                        return;
                    }

                    detailsOpening = true;
                    await Navigation.PushModalAsync(new DetailsPage());
                    detailsOpening = false;
                }
            );
        }

        private async void OnThemeLoadFailed(object? sender, System.EventArgs e)
        {
            if (!IsAlertShowing)
            { 
                alertPopupTask = DisplayAlertAsync(AppResources.LoadFailedAlertTitle, AppResources.LoadFailedAlertMessage,
                    AppResources.LoadFailedAlertContinue, AppResources.LoadFailedAlertCancel);

                await alertPopupTask;

                if (alertPopupTask.Result)
                {
                    viewModel.ReloadIfNeeded();
                }
                else
                {
                    await Navigation.PopAsync();
                }
            }
        }

        private bool IsAlertShowing => alertPopupTask?.Status == TaskStatus.Running ||
                                       alertPopupTask?.Status == TaskStatus.WaitingForActivation;

        protected override void OnAppearing()
        {
            Console.WriteLine("[MAUI ThemesPage] OnAppearing called");
            base.OnAppearing();

            // trigger updates to elements or models that might have changed while
            // this page was not visible

            if (!IsAlertShowing)
            {
                viewModel.ReloadIfNeeded();
            }
            else
            {
                Console.WriteLine("[MAUI ThemesPage] Alert is showing, skipping ReloadIfNeeded");
            }
            navigationBarView.Update();
        }

        async void OnItemSelected(object sender, SelectionChangedEventArgs e)
        {
            Console.WriteLine($"[MAUI ThemesPage] OnItemSelected called: Count={e.CurrentSelection.Count}");
            
            if (e.CurrentSelection.Count == 0)
            {
                Console.WriteLine("[MAUI ThemesPage] No selection, returning");
                return;
            }

            CollectionView? list = sender as CollectionView;
            if (scheduleOpening)
            {
                Console.WriteLine("[MAUI ThemesPage] Ignoring theme selection since already opening");
                Debug.WriteLine("Ignoring theme selection since already opening");
                if (list != null) list.SelectedItem = null;
                return;
            }
            scheduleOpening = true; // prevent double-click

            ThemeViewModel? themeModel = e.CurrentSelection.FirstOrDefault() as ThemeViewModel;
            if (themeModel == null) 
            {
                Console.WriteLine("[MAUI ThemesPage] Could not cast to ThemeViewModel");
                return;
            }

            Console.WriteLine($"[MAUI ThemesPage] Selected theme: {themeModel.Title} (ScheduleId: {themeModel.FirstScheduleId})");

            // clear selection so it's not selected when navigating back
            if (list != null) list.SelectedItem = null;

            SendThemeSelectEvent(themeModel);

            Console.WriteLine($"[MAUI ThemesPage] Navigating to ScheduleStartPage for theme {themeModel.Title}");
            await Navigation.PushAsync(new ScheduleStartPage(themeModel.FirstScheduleId!));
            Console.WriteLine("[MAUI ThemesPage] Navigation completed");
            scheduleOpening = false;
        }

        public ICommand ShowDetailsCommand
        {
            get;
            private set;
        } = null!;

        private void SendThemeSelectEvent(ThemeViewModel themeModel)
        {
            var themeDict = new Dictionary<string, string>
            {
                { AnalyticsParameterNamesConstants.ItemId, themeModel.ThemeId },
                { AnalyticsParameterNamesConstants.ItemName, themeModel.Title ?? string.Empty },
                { AnalyticsParameterNamesConstants.ContentType, AnalyticsContentTypeConstants.Theme }
            };
            var app = Application.Current as App;
            app!.AnalyticsEventTracker.SendEvent(AnalyticsEventNamesConstants.SelectContent, themeDict);
        }
    }
}
