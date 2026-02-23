namespace Recorder.Core
{
    public static class Constants
    {
        // Metadata keys
        public const string ClientIdKey = "clientId";
        public const string RecordingIdKey = "recordingId";
        public const string TimestampKey = "recordingTimestamp"; // ISO 8601 in UTC
        public const string DurationKey = "recordingDuration";  // in seconds
        public const string ClientPlatformNameKey = "clientPlatformName";
        public const string ClientPlatformVersionKey = "clientPlatformVersion";
        public const string ItemIdKey = "itemId";
        public const string RecordingDurationKey = "recordingDuration";
        public const string RecordingBitDepthKey = "recordingBitDepth";
        public const string RecordingSampleRateKey = "recordingSampleRate";
        public const string RecordingNumberOfChannelsKey = "recordingNumberOfChannels";
        public const string ContentTypeKey = "contentType";
        public const string UserKey = "user";

        // Preference keys (for client implementations to use)
        public const string UserLanguageKey = "userLanguage";
        public const string OnboardingCompletedKey = "onboardingCompleted";
        public const string TotalRecordedSecondsKey = "totalRecordedSeconds";
        public const string CompletedSchedulesKey = "completedSchedules";

        // Other constants
        public const int PendingUploadsTimerIntervalSeconds = 20;
        public const string MetadataWithoutRecording = "MetadataWithoutRecording.wav";
        public const int ScheduleVersion = 2;
    }
}
