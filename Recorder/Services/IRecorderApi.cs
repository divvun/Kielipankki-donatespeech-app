using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using Recorder.Models;

namespace Recorder.Services
{
    public struct UploadDescription
    {
        public string PreSignedUrl;
    }

    public interface IRecorderApi
    {
        Task<UploadDescription> InitUploadAsync(Recording recording, RecordingMetadata metadata);
        Task<List<Theme>> GetAllThemesAsync();
        Task<Schedule> GetScheduleAsync(string scheduleId);
        Task<List<ScheduleListItem>> GetAllSchedulesAsync();
        Task<bool> UploadRecordingAsync(string filePath, string url, string contentType);
        Task<bool> DeleteClientRecordingsAsync(string clientId);
        Task<bool> DeleteSessionRecordingsAsync(string clientId, string sessionId);
        Task<bool> DeleteRecordingAsync(string clientId, string sessionId, string recordingId);
    }
}
