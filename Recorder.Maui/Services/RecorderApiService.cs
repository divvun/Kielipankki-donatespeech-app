using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Maui.Devices;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Recorder.Models;
using KiotaApi = Recorder.Api;

namespace Recorder.Services
{
    public class RecorderApiService : IRecorderApi
    {
        private readonly IAppConfiguration appConfiguration;
        private readonly HttpClient uploadHttpClient;
        private readonly KiotaApi.RecorderApiClient apiClient;
        private readonly string baseUrl;

        public RecorderApiService(IAppConfiguration appConfiguration)
        {
            this.appConfiguration = appConfiguration;
            baseUrl = NormalizeBaseUrl(ResolveBaseUrl());

            var httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(30)
            };

            if (!string.IsNullOrWhiteSpace(appConfiguration.RecorderApiKey))
            {
                httpClient.DefaultRequestHeaders.Add("x-api-key", appConfiguration.RecorderApiKey);
            }

            // Kiota requires an IAuthenticationProvider - use Anonymous auth
            var authProvider = new AnonymousAuthenticationProvider();
            var requestAdapter = new HttpClientRequestAdapter(authProvider, httpClient: httpClient)
            {
                BaseUrl = baseUrl
            };

            apiClient = new KiotaApi.RecorderApiClient(requestAdapter);
            uploadHttpClient = new HttpClient();
        }

        public async Task<UploadDescription> InitUploadAsync(Recording recording, RecordingMetadata metadata)
        {
            var fileName = Path.GetFileName(recording.FileName) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new InvalidOperationException("Recording filename is missing.");
            }

            // Create Kiota request models with wrapper types
            var uploadMetadata = new KiotaApi.Models.UploadMetadata
            {
                ClientId = metadata.ClientId,
                RecordingId = new KiotaApi.Models.UploadMetadata.UploadMetadata_recordingId { String = metadata.RecordingId },
                ContentType = new KiotaApi.Models.UploadMetadata.UploadMetadata_contentType { String = metadata.ContentType },
                Timestamp = new KiotaApi.Models.UploadMetadata.UploadMetadata_timestamp { String = metadata.RecordingTimestamp.ToString("o") },
                Duration = new KiotaApi.Models.UploadMetadata.UploadMetadata_duration { Double = metadata.RecordingDuration }
            };

            var request = new KiotaApi.Models.InitUploadRequest
            {
                Filename = fileName,
                Metadata = uploadMetadata
            };

            var response = await apiClient.V1.Upload.PostAsync(request);
            return new UploadDescription { PreSignedUrl = response?.PresignedUrl ?? string.Empty };
        }

        public async Task<List<Theme>> GetAllThemesAsync()
        {
            var kiotaThemes = await apiClient.V1.Theme.GetAsync();
            if (kiotaThemes == null) return new List<Theme>();

            var themes = new List<Theme>();
            foreach (var kt in kiotaThemes)
            {
                var kiotaTheme = kt.Content;
                if (kiotaTheme == null) continue;

                themes.Add(new Theme
                {
                    Id = kt.Id ?? string.Empty,
                    Content = new ThemeContent
                    {
                        Description = kiotaTheme.Description ?? string.Empty,
                        Image = kiotaTheme.Image?.String ?? string.Empty,
                        ScheduleIds = kiotaTheme.ScheduleIds ?? new List<string>()
                    }
                });
            }
            return themes;
        }

        public async Task<Schedule> GetScheduleAsync(string scheduleId)
        {
            var kiotaSchedule = await apiClient.V1.Schedule[scheduleId].GetAsync();
            if (kiotaSchedule == null) return new Schedule();

            return MapSchedule(kiotaSchedule);
        }

        public async Task<List<ScheduleListItem>> GetAllSchedulesAsync()
        {
            var kiotaSchedules = await apiClient.V1.Schedule.GetAsync();
            if (kiotaSchedules == null) return new List<ScheduleListItem>();

            var schedules = new List<ScheduleListItem>();
            foreach (var ks in kiotaSchedules)
            {
                schedules.Add(new ScheduleListItem
                {
                    Id = ks.Id,
                    Content = ks.Content != null ? MapSchedule(ks.Content) : null
                });
            }
            return schedules;
        }

        private Schedule MapSchedule(KiotaApi.Models.Schedule kiotaSchedule)
        {
            return new Schedule
            {
                Id = kiotaSchedule.Id?.String ?? string.Empty,
                ScheduleId = kiotaSchedule.ScheduleId?.String ?? string.Empty,
                Description = kiotaSchedule.Description ?? string.Empty,
                Items = MapScheduleItems(kiotaSchedule.Items)
            };
        }

        private List<ScheduleItem> MapScheduleItems(List<KiotaApi.Models.Schedule.Schedule_items>? kiotaItems)
        {
            // TOTO: Map from Kiota's polymorphic schedule items to app's ScheduleItem models.
            // For now, return empty list until we understand the Kiota discriminated union structure.
            if (kiotaItems == null) return new List<ScheduleItem>();
            
            // TODO: This needs proper implementation based on Kiota's generated types
            Debug.WriteLine("WARNING: MapScheduleItems not fully implemented yet");
            return new List<ScheduleItem>();
        }

        public async Task<bool> UploadRecordingAsync(string filePath, string url, string contentType)
        {
            int lastSlashPosition = filePath.LastIndexOf('/');
            string fileNamePart = filePath.Substring(lastSlashPosition + 1);

            Debug.WriteLine($"UploadRecordingAsync: about to start uploading file '{fileNamePart}' with a PUT request");
            bool success = false;
            try
            {
                StreamContent strm = new StreamContent(new FileStream(filePath, FileMode.Open, FileAccess.Read));
                strm.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
                Debug.WriteLine($"Stream content headers --> Content-Type: '{strm.Headers.ContentType}'");
                HttpResponseMessage responseMessage = await uploadHttpClient.PutAsync(url, strm);
                Debug.WriteLine($"Upload response: status={responseMessage.StatusCode} description={responseMessage.ReasonPhrase}");
                success = responseMessage.StatusCode == HttpStatusCode.OK || responseMessage.StatusCode == HttpStatusCode.Created;
            }
            catch (Exception e)
            {
                Debug.WriteLine($"Exception uploading file, message = '{e.Message}'");
                success = false;
            }

            return success;
        }

        public async Task<bool> DeleteClientRecordingsAsync(string clientId)
        {
            try
            {
                await apiClient.V1.Recordings[clientId].DeleteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Delete by client id failed: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteSessionRecordingsAsync(string clientId, string sessionId)
        {
            try
            {
                await apiClient.V1.Recordings[clientId][sessionId].DeleteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Delete by session id failed: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteRecordingAsync(string clientId, string sessionId, string recordingId)
        {
            try
            {
                await apiClient.V1.Recordings[clientId][sessionId][recordingId].DeleteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Delete by recording id failed: {ex.Message}");
                return false;
            }
        }

        private string ResolveBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(appConfiguration.RecorderApiUrl))
            {
                var configuredUrl = appConfiguration.RecorderApiUrl;
#if ANDROID
                if (DeviceInfo.DeviceType == DeviceType.Virtual)
                {
                    configuredUrl = configuredUrl
                        .Replace("http://localhost", "http://10.0.2.2")
                        .Replace("http://127.0.0.1", "http://10.0.2.2");
                }
#endif
                return configuredUrl;
            }

#if ANDROID
            return DeviceInfo.DeviceType == DeviceType.Virtual
                ? "http://10.0.2.2:8000"
                : "http://localhost:8000";
#elif IOS || MACCATALYST
            return "http://localhost:8000";
#else
            return "http://localhost:8000";
#endif
        }

        private static string NormalizeBaseUrl(string url)
        {
            var trimmed = url.TrimEnd('/');
            if (trimmed.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = trimmed.Substring(0, trimmed.Length - 3);
            }

            return trimmed;
        }
    }
}
