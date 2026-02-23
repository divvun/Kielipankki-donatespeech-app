using System.Collections.Generic;
using System.Threading.Tasks;
using Recorder.Core.Models;

namespace Recorder.Core.Services
{
    public interface IAppDatabase
    {
        Task<int> GetRecordingCountAsync();
        Task<List<Recording>> GetRecordingsAsync();
        Task<List<Recording>> GetRecordingsByUploadStatusAsync(string uploadStatus);
        Task<Recording> GetRecordingAsync(string recordingId);
        Task<int> SaveRecordingAsync(Recording item);
        Task<int> DeleteRecordingAsync(Recording item);
        Task<int> UpdateRecordingUploadStatusAsync(Recording item);
        void DeleteAllRecordings();
    }
}
