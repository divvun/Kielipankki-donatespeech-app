using System;
using Microsoft.Maui.Storage;

namespace Recorder.Services
{
    // wraps Xamarin Essentials Preferences calls
    public class AppPreferences : IAppPreferences
    {
        public AppPreferences()
        {
        }

        public string Get(string key, string defaultValue) => Preferences.Get(key, defaultValue);

        public void Set(string key, string value) => Preferences.Set(key, value);
    }
}
