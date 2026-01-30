using System;
using System.ComponentModel;
using System.Globalization;

namespace Recorder.Models
{
    // This adds support for directly setting a string to video source property in XAML, but
    // note that for data binding we need to use an IValueConverter
    public class VideoSourceConverter : TypeConverter
    {
        public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType)
        {
            return sourceType == typeof(string) || base.CanConvertFrom(context, sourceType);
        }

        public override object ConvertFrom(ITypeDescriptorContext context, CultureInfo culture, object value)
        {
            if (value is string text && !string.IsNullOrWhiteSpace(text))
            {
                Uri uri;
                return Uri.TryCreate(text, UriKind.Absolute, out uri) && uri.Scheme != "file" ?
                                VideoSource.FromUri(text) : VideoSource.FromResource(text);
            }

            return base.ConvertFrom(context, culture, value);
        }
    }
}
