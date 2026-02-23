using System;
using System.Diagnostics;
using System.Globalization;
using Microsoft.Maui.Controls;

using Recorder.Models;
using Recorder.Core.Models;
using Recorder.ViewModels;
using Recorder.ResX;
using Recorder.Views;

namespace Recorder.Converters
{
    public class ItemToUserEntryViewConverter : IValueConverter
    {
        public ItemToUserEntryViewConverter()
        {
        }

        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is not ScheduleItemViewModel model)
                return null;

            return model.Item switch
            {
                ChoicePromptItem => CreatePicker(model),
                TextInputItem => CreateEntry(model),
                SuperChoicePromptItem => new SuggestUserEntryView(model),
                MultiChoicePromptItem => new MultiChoiceUserEntryView(model),
                _ => null
            };
        }

        private View CreateEntry(ScheduleItemViewModel model)
        {
            var entry = new Entry()
            {
                Margin = 20,
                BindingContext = model
            };
            entry.SetBinding(Entry.TextProperty, nameof(model.Answer));
            entry.TextChanged += (sender, e) =>
            {
                Debug.WriteLine("Marking text entry modified");
                model.AnswerModified = true;
            };
            return entry;
        }

        private View CreatePicker(ScheduleItemViewModel model)
        {
            var picker = new Picker()
            {
                Title = AppResources.ChooseOptionText,
                ItemsSource = model.ChoiceOptions,
                Margin = 20,
                BindingContext = model
            };
            picker.SetBinding(Picker.SelectedItemProperty, nameof(model.Answer));
            picker.SelectedIndexChanged += (sender, e) =>
            {
                Debug.WriteLine("Marking picker modified");
                model.AnswerModified = true;
            };
            return picker;
        }

        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }        
    }
}
