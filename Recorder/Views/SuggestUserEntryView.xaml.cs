using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Recorder.ViewModels;
using Microsoft.Maui.Controls;

namespace Recorder.Views
{
    public partial class SuggestUserEntryView : ContentView
    {
        private readonly ScheduleItemViewModel model;

        public SuggestUserEntryView(ScheduleItemViewModel model)
        {
            this.model = model;
            InitializeComponent();
            BindingContext = model;

            InitializeFromModel();

            suggestBox.TextChanged += SuggestBox_TextChanged;

            otherEntry.TextChanged += OtherEntry_TextChanged;
        }

        private void InitializeFromModel()
        {
            if (model.HasAnswer)
            {
                if (model.ChoiceOptions.Find(c => c == model.Answer) != null)
                {
                    // previous answer matches a suggested option exactly
                    suggestBox.Text = model.Answer;
                }
                else
                {
                    otherEntry.Text = model.Answer;
                }
            }
        }

        private void SuggestBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (e.NewTextValue == null)
            {
                return;
            }

            model.Answer = e.NewTextValue;
            model.AnswerModified = true;
            otherEntry.Text = null;
            Debug.WriteLine($"Entry text changed to '{e.NewTextValue}' --> answer = '{model.Answer}'");
        }

        private void OtherEntry_TextChanged(object sender, TextChangedEventArgs e)
        {
            // null occurs when text is cleared
            if (e.NewTextValue != null)
            {
                model.Answer = e.NewTextValue;
                model.AnswerModified = true;

                suggestBox.Text = null;

                Debug.WriteLine($"Entry text changed to '{e.NewTextValue}' --> answer = '{model.Answer}'");
            }
        }

        private List<string> GetSuggestions(string text)
        {
            return string.IsNullOrWhiteSpace(text) ? null :
                model.ChoiceOptions
                .Where(s => s.StartsWith(text, StringComparison.InvariantCultureIgnoreCase))
                .ToList();
        }
    }
}
