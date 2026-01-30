using System;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Xaml;
using Microsoft.Maui.Devices;

namespace Recorder
{
    [ContentProperty("Query")]
    public class ResponsiveStyleProp<T> : IMarkupExtension
    {
        public T Normal { get; set; }
        public T Medium { get; set; }
        public T Large { get; set; }

        public object ProvideValue(IServiceProvider serviceProvider)
        {
            var value = GetDeviceValue();

            if (value is NamedSize ns)
            {
                return Device.GetNamedSize(ns, typeof(Label));
            }

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