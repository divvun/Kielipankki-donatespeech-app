using System.Collections.Generic;

namespace Recorder.Services
{
    public class NoOpFirebaseAnalyticsEventTracker : IFirebaseAnalyticsEventTracker
    {
        public void SendEvent(string eventId)
        {
        }

        public void SendEvent(string eventId, string paramName, string value)
        {
        }

        public void SendEvent(string eventId, IDictionary<string, string> parameters)
        {
        }

        public void SendEvent(AnalyticsEvent analyticsEvent)
        {
        }
    }
}
