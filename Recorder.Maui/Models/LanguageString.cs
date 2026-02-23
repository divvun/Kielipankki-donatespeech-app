using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.Maui.Storage;
using Recorder.Core;

namespace Recorder.Models
{
    public class LanguageString
    {
        // key is ISO 639 2-letter code, value is the text in that language
        public Dictionary<string, string> Strings = new Dictionary<string, string>();

        public LanguageString()
        {
        }

        public LanguageString(Dictionary<string, string> strings)
        {
            Strings = strings;
        }

        public string? Localized
        {
            get
            {
                if (Strings == null)
                {
                    return null;
                }

                if (Preferences.ContainsKey(Constants.UserLanguageKey))
                {
                    string lang = Preferences.Get(Constants.UserLanguageKey, "unknown");
                    if (this.Strings.ContainsKey(lang))
                    {
                        return this.Strings[lang];
                    }
                }
                else
                {
                    Debug.WriteLine($"No preferences key '{Constants.UserLanguageKey}' found!");
                }

                return "*** not found ***";  // if you ever see this in the UI, fix it ASAP!
            }
        }

        public override string ToString()
        {
            return Localized ?? string.Empty;
        }
    }
}
