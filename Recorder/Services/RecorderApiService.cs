using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Maui.Devices;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Api = Recorder.Api;
using Recorder.Models;

namespace Recorder.Services
{
    public class RecorderApiService : IRecorderApi
    {
        private readonly IAppConfiguration appConfiguration;
        private readonly HttpClient apiHttpClient;
        private readonly HttpClient uploadHttpClient;
        private readonly Api.RecorderApiClient apiClient;
        private readonly string baseUrl;

        private static readonly JsonSerializerSettings JsonSettings = new JsonSerializerSettings
        {
            ContractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy()
            },
            MissingMemberHandling = MissingMemberHandling.Ignore
        };

        public RecorderApiService(IAppConfiguration appConfiguration)
        {
            this.appConfiguration = appConfiguration;
            baseUrl = NormalizeBaseUrl(ResolveBaseUrl());

            apiHttpClient = new HttpClient
            {
                BaseAddress = new Uri(baseUrl),
                Timeout = TimeSpan.FromSeconds(30)
            };

            if (!string.IsNullOrWhiteSpace(appConfiguration.RecorderApiKey))
            {
                apiHttpClient.DefaultRequestHeaders.Add("x-api-key", appConfiguration.RecorderApiKey);
            }

            apiClient = new Api.RecorderApiClient(baseUrl, apiHttpClient);
            uploadHttpClient = new HttpClient();
        }

        public async Task<UploadDescription> InitUploadAsync(Recording recording, RecordingMetadata metadata)
        {
            var fileName = Path.GetFileName(recording.FileName) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new InvalidOperationException("Recording filename is missing.");
            }

            var request = new Api.InitUploadRequest
            {
                Filename = fileName,
                Metadata = new Api.UploadMetadata
                {
                    ClientId = metadata.ClientId,
                    RecordingId = metadata.RecordingId,
                    ContentType = metadata.ContentType,
                    Timestamp = metadata.RecordingTimestamp.ToString("o"),
                    Duration = metadata.RecordingDuration
                }
            };

            var response = await apiClient.Init_upload_v1_upload_postAsync(request);
            return new UploadDescription { PreSignedUrl = response.PresignedUrl };
        }

        public async Task<List<Theme>> GetAllThemesAsync()
        {
            var uri = new Uri($"{baseUrl}/v1/theme");
            var content = await GetAsync(uri);
            var themes = JsonConvert.DeserializeObject<List<Theme>>(content, JsonSettings);
            return themes ?? new List<Theme>();
        }

        public async Task<Schedule> GetScheduleAsync(string scheduleId)
        {
            var uri = new Uri($"{baseUrl}/v1/schedule/{scheduleId}");
            var content = await GetAsync(uri);
            var schedule = JsonConvert.DeserializeObject<Schedule>(content, JsonSettings);
            return schedule ?? new Schedule();
        }

        public async Task<List<ScheduleListItem>> GetAllSchedulesAsync()
        {
            var uri = new Uri($"{baseUrl}/v1/schedule");
            var content = await GetAsync(uri);
            var schedules = JsonConvert.DeserializeObject<List<ScheduleListItem>>(content, JsonSettings);
            return schedules ?? new List<ScheduleListItem>();
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
                await apiClient.Delete_by_client_id_v1_recordings__client_id__deleteAsync(clientId);
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
                await apiClient.Delete_by_session_id_v1_recordings__client_id___session_id__deleteAsync(clientId, sessionId);
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
                await apiClient.Delete_by_recording_id_v1_recordings__client_id___session_id___recording_id__deleteAsync(clientId, sessionId, recordingId);
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Delete by recording id failed: {ex.Message}");
                return false;
            }
        }

        private async Task<string> GetAsync(Uri uri)
        {
            var response = await apiHttpClient.GetAsync(uri);
            if (!response.IsSuccessStatusCode)
            {
                Debug.WriteLine($"GET {uri} failed: {response.StatusCode} {response.ReasonPhrase}");
                throw new Exception("Network request failed");
            }

            return await response.Content.ReadAsStringAsync();
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
