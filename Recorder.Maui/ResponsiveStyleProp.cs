using System;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Xaml;
using Microsoft.Maui.Devices;

namespace Recorder
{
    [ContentProperty("Query")]
    public class ResponsiveStyleProp<T> : IMarkupExtension
    {
        public T Normal { get; set; } = default!;
        public T Medium { get; set; } = default!;
        public T Large { get; set; } = default!;

        public object? ProvideValue(IServiceProvider serviceProvider)
        {
            var value = GetDeviceValue();

#pragma warning disable CS0612, CS0618 // Type or member is obsolete
            if (value is NamedSize ns)
            {
                // Map NamedSize to font size values
                return ns switch
                {
                    NamedSize.Micro => 10.0,
                    NamedSize.Small => 12.0,
                    NamedSize.Medium => 14.0,
                    NamedSize.Large => 18.0,
                    _ => 14.0 // Default
                };
            }
#pragma warning restore CS0612, CS0618

            return value;
        }

        public T GetDeviceValue()
        {
            var mainDisplayInfo = DeviceDisplay.MainDisplayInfo;
            var width = mainDisplayInfo.Width / mainDisplayInfo.Density;
            var height = mainDisplayInfo.Height / mainDisplayInfo.Density;

            if (width >= 375)
            {
                return height >= 720 ? Large : Medium;
            }

            return Normal;
        }
    }
}