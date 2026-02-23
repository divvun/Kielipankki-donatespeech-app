using Recorder.Core.Services;
using Recorder.Core.Models;

﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using Recorder.Services;
using Recorder.Core.Services;
using Recorder.Core.Models;

namespace Recorder.Services
{
    public class AppRepository : IAppRepository
    {
        private readonly IRecorderApi RecorderApi;
        private readonly IAppPreferences appPreferences;
        private Dictionary<string, Schedule> schedulesById;

        public AppRepository(IRecorderApi recorderApi, IAppPreferences appPreferences)
        {
            RecorderApi = recorderApi;
            this.appPreferences = appPreferences;
            schedulesById = new Dictionary<string, Schedule>();
        }

        public async Task<Result<List<Theme>>> GetAllThemesAsync()
        {
            try
            {
                return Result<List<Theme>>.Success(await RecorderApi.GetAllThemesAsync());
            }
            catch (Exception e) 
            {
                Debug.WriteLine(e.ToString(), nameof(AppRepository));
                return Result<List<Theme>>.Failure();
            }
        }

        public List<string> GetCompletedScheduleIds()
        {
            string completed = appPreferences.Get(Constants.CompletedSchedulesKey, string.Empty);

            string[] ids = completed.Trim()
                .Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

            return new List<string>(ids);
        }

        public bool AddCompletedScheduleId(string id)
        {
            List<string> completedIds = GetCompletedScheduleIds();

            if (!completedIds.Contains(id))
            {
                Debug.WriteLine($"Adding schedule ID {id} to the list of completed ones");

                completedIds.Add(id);
                string prefValue = string.Join(" ", completedIds.ToArray());
                appPreferences.Set(Constants.CompletedSchedulesKey, prefValue);

                Debug.WriteLine($"Wrote new list of completed schedule IDs to preferences: '{prefValue}'");
                return true;
            }
            return false;
        }

        public async Task<Result<Schedule>> GetScheduleAsync(string scheduleId)
        {
            try
            {
                // simple in-memory cache
                // todo needs an expiration trigger
                if (schedulesById.ContainsKey(scheduleId))
                {
                    return Result<Schedule>.Success(schedulesById[scheduleId]);
                }
                else
                {
                    Schedule schedule = await RecorderApi.GetScheduleAsync(scheduleId);
                    schedulesById.Add(scheduleId, schedule);
                    return Result<Schedule>.Success(schedule);
                }
            }
            catch (Exception e)
            {
                Debug.WriteLine(e);
                return Result<Schedule>.Failure();
            }
        }

        public async Task ListRecordingsInDatabase()
        {
            var recordings = await App.Database.GetRecordingsAsync();
            Debug.WriteLine($"Recordings in database ({recordings.Count}):");
            Debug.WriteLine("UploadStatus | RecordingId | ItemId | FileName | ClientId | Timestamp | Metadata");
            foreach (Recording rec in recordings)
            {
                string md = rec.Metadata ?? string.Empty;
                string metadataString = md.Length > 40 ? md.Substring(0, 20) + "..." + md.Substring(Math.Max(0, md.Length - 20)) : md;
                Debug.WriteLine($"{rec.UploadStatus:8} | {rec.RecordingId} | {rec.ItemId} | {rec.FileName} | {rec.ClientId} | {rec.Timestamp} | {metadataString}");
            }
        }

        public async Task ListUploadedRecordings()
        {
            List<Recording> recordings = await App.Database.GetRecordingsByUploadStatusAsync(UploadStatus.Uploaded);
            Debug.WriteLine($"Uploaded recordings: {recordings.Count}");
        }

        public async Task UploadPendingRecordings()
        {
            Console.WriteLine("=== UploadPendingRecordings called ===");
            Debug.WriteLine("Uploading pending recordings");

            List<Recording> pendingRecordings = await App.Database.GetRecordingsByUploadStatusAsync(UploadStatus.Pending);
            var count = pendingRecordings.Count;
            Console.WriteLine($"Found {count} pending recordings");
            if (count == 0)
            {
                Debug.WriteLine("No pending recordings in database");
                return;
            }

            Debug.WriteLine($"Found {count} pending recordings in database");
            Console.WriteLine("Starting upload loop...");
            int uploadIndex = 0;
            foreach (Recording rec in pendingRecordings)
            {
                try
                {
                    uploadIndex++;
                    Console.WriteLine($"=== Processing recording {uploadIndex}/{count}: RecID={rec.RecordingId}, File={rec.FileName} ===");
                    var metadataString = rec.Metadata!;
                Debug.WriteLine($"metadata = '{metadataString}'");

                int lastSlashPosition = rec.FileName!.LastIndexOf('/');
                string fileNamePart = rec.FileName.Substring(lastSlashPosition + 1);
                Debug.WriteLine($"Initiating upload: file name = '{fileNamePart}' recording ID = '{rec.RecordingId}', metadata length = {metadataString.Length} characters");

                JsonSerializerSettings metadataJsonSerializerSettings = new JsonSerializerSettings
                {
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new CamelCaseNamingStrategy()
                    },
                    MissingMemberHandling = MissingMemberHandling.Ignore
                };

                    Console.WriteLine("Deserializing metadata...");
                    var metadataObject = JsonConvert.DeserializeObject<RecordingMetadata>(metadataString, metadataJsonSerializerSettings);
                    Console.WriteLine("Calling InitUploadAsync...");
                    var uploadDescription = await RecorderApi.InitUploadAsync(rec, metadataObject!);
                    string url = uploadDescription.PreSignedUrl;
                    Console.WriteLine($"Got pre-signed URL, length={url.Length}");
                Debug.WriteLine($"Got pre-signed URL for recID '{rec.RecordingId}' from server, length = {url.Length} characters");

#if DEBUG
                // Replace Docker hostname with localhost for local development
                // Docker containers use 'azurite' as hostname, but simulator needs 'localhost'
                    if (url.Contains("azurite:10000"))
                    {
                        url = url.Replace("azurite:10000", "localhost:10000");
                        uploadDescription.PreSignedUrl = url;
                        Console.WriteLine("Fixed SAS URL: azurite -> localhost");
                        Debug.WriteLine($"Fixed SAS URL for simulator: replaced azurite with localhost");
                    }
#endif

                    // If this is a metadata-only entry, just don't use the pre-signed URL and let it expire.
                    // Mark the metadata item as uploaded.
                    if (rec.FileName.Contains(Constants.MetadataWithoutRecording))
                    {
                        Console.WriteLine("Metadata-only entry, marking as uploaded");
                        Debug.WriteLine($"Recording with ID '{rec.RecordingId} is metadata without recording; no media will be sent to the server.");
                        rec.UploadStatus = UploadStatus.Uploaded;
                        int result = await App.Database.UpdateRecordingUploadStatusAsync(rec);
                        Debug.WriteLine($"Status of recording '{rec.RecordingId}' updated to '{UploadStatus.Uploaded}'");
                        continue;
                    }

                    // The recordings are stored in the Documents folder. We only save the filename in the database
                    // (because deleting and reinstalling the app may cause the full path to change), so we need to
                    // construct the full pathname again:
                    var documentsFolder = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                    string recordingFileName = Path.Combine(documentsFolder, rec.FileName!);
                    Console.WriteLine($"Uploading: {recordingFileName}");

                        bool success = await RecorderApi.UploadRecordingAsync(recordingFileName, uploadDescription.PreSignedUrl, metadataObject!.ContentType!);
                    if (success)
                    {
                        Console.WriteLine($"Upload SUCCESS for '{rec.RecordingId}'");
                        rec.UploadStatus = UploadStatus.Uploaded;
                        int result = await App.Database.UpdateRecordingUploadStatusAsync(rec);
                        Debug.WriteLine($"Status of recording '{rec.RecordingId}' updated to '{UploadStatus.Uploaded}'");
                    }
                    else
                    {
                        Console.WriteLine($"Upload FAILED for '{rec.RecordingId}'");
                        Debug.WriteLine($"Upload of recording '{rec.RecordingId}' failed, status not updated");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"EXCEPTION uploading recording {uploadIndex}: {ex.GetType().Name}: {ex.Message}");
                    Debug.WriteLine($"Upload exception: {ex}");
                }
            }
            Console.WriteLine("=== Upload loop completed ===");
        }

        public void SaveAnswer(string id, string value)
            => appPreferences.Set(id, value);

        public string? GetAnswer(string id)
            => appPreferences.Get(id, defaultValue: string.Empty);
    }
}
