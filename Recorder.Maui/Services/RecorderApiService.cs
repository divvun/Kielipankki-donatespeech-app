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
            if (kiotaItems == null) return new List<ScheduleItem>();

            var result = new List<ScheduleItem>();
            int index = 0;
            foreach (var wrapperItem in kiotaItems)
            {
                ScheduleItem? item = null;

                try
                {
                    Console.WriteLine($"=== Processing schedule item #{index} ===");
                    if (wrapperItem.AudioMediaItem != null)
                    {
                        var k = wrapperItem.AudioMediaItem;
                        Console.WriteLine($"Mapping AudioMediaItem: itemId={k.ItemId}, url={k.Url}, typeId={k.TypeId}");
                        Console.WriteLine($"  isRecording from backend: {k.IsRecording} (null: {k.IsRecording == null})");
                        Console.WriteLine($"  AdditionalData keys: {string.Join(", ", k.AdditionalData?.Keys ?? new string[0])}");
                        if (k.AdditionalData != null)
                        {
                            foreach (var kvp in k.AdditionalData)
                            {
                                Debug.WriteLine($"  AdditionalData[{kvp.Key}] = {kvp.Value}");
                            }
                        }
                        var isRecording = k.IsRecording ?? false;
                        Console.WriteLine($"  Final IsRecording value: {isRecording}");
                        item = new Models.AudioMediaItem
                        {
                            ItemId = k.ItemId ?? $"audio-{index}",
                            Description = k.Description ?? "Audio item",
                            IsRecording = isRecording,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty,
                            TypeId = k.TypeId ?? "audio/unknown"
                        };
                    }
                    else if (wrapperItem.VideoMediaItem != null)
                    {
                        var k = wrapperItem.VideoMediaItem;
                        Console.WriteLine($"Mapping VideoMediaItem: itemId={k.ItemId}, url={k.Url}, typeId={k.TypeId}");
                        Console.WriteLine($"  isRecording from backend: {k.IsRecording} (null: {k.IsRecording == null})");
                        Console.WriteLine($"  AdditionalData keys: {string.Join(", ", k.AdditionalData?.Keys ?? new string[0])}");
                        if (k.AdditionalData != null)
                        {
                            foreach (var kvp in k.AdditionalData)
                            {
                                Debug.WriteLine($"  AdditionalData[{kvp.Key}] = {kvp.Value}");
                            }
                        }
                        var isRecording = k.IsRecording ?? false;
                        Console.WriteLine($"  Final IsRecording value: {isRecording}");
                        item = new Models.VideoMediaItem
                        {
                            ItemId = k.ItemId ?? $"video-{index}",
                            Description = k.Description ?? "Video item",
                            IsRecording = isRecording,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty,
                            TypeId = k.TypeId ?? "video/unknown"
                        };
                    }
                    else if (wrapperItem.YleAudioMediaItem != null)
                    {
                        var k = wrapperItem.YleAudioMediaItem;
                        Console.WriteLine($"Mapping YleAudioMediaItem: itemId={k.ItemId}, url={k.Url}");
                        item = new Models.YleAudioMediaItem
                        {
                            ItemId = k.ItemId ?? $"yle-audio-{index}",
                            Description = k.Description ?? "Yle audio item",
                            IsRecording = k.IsRecording ?? false,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty
                        };
                    }
                    else if (wrapperItem.YleVideoMediaItem != null)
                    {
                        var k = wrapperItem.YleVideoMediaItem;
                        Console.WriteLine($"Mapping YleVideoMediaItem: itemId={k.ItemId}, url={k.Url}");
                        item = new Models.YleVideoMediaItem
                        {
                            ItemId = k.ItemId ?? $"yle-video-{index}",
                            Description = k.Description ?? "Yle video item",
                            IsRecording = k.IsRecording ?? false,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty
                        };
                    }
                    else if (wrapperItem.TextContentItem != null)
                    {
                        var k = wrapperItem.TextContentItem;
                        Console.WriteLine($"Mapping TextContentItem: itemId={k.ItemId}, url={k.Url}");
                        item = new Models.TextContentItem
                        {
                            ItemId = k.ItemId ?? $"text-{index}",
                            Description = k.Description ?? "Text item",
                            IsRecording = k.IsRecording ?? false,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty,
                            TypeId = k.TypeId?.String
                        };
                    }
                    else if (wrapperItem.ImageMediaItem != null)
                    {
                        var k = wrapperItem.ImageMediaItem;
                        Console.WriteLine($"Mapping ImageMediaItem: itemId={k.ItemId}, url={k.Url}");
                        item = new Models.ImageMediaItem
                        {
                            ItemId = k.ItemId ?? $"image-{index}",
                            Description = k.Description ?? "Image item",
                            IsRecording = k.IsRecording ?? false,
                            Url = ResolveMediaUrl(k.Url) ?? string.Empty,
                            TypeId = k.TypeId ?? "image/unknown"
                        };
                    }  
                    else if (wrapperItem.ChoicePromptItem != null)
                    {
                        var k = wrapperItem.ChoicePromptItem;
                        Console.WriteLine($"Mapping ChoicePromptItem: itemId={k.ItemId}");
                        item = new Models.ChoicePromptItem
                        {
                            ItemId = k.ItemId ?? $"choice-{index}",
                            Description = k.Description ?? "Choice prompt",
                            IsRecording = k.IsRecording ?? false,
                            Options = k.Options?.ToList() ?? new List<string>()
                        };
                    }
                    else if (wrapperItem.MultiChoicePromptItem != null)
                    {
                        var k = wrapperItem.MultiChoicePromptItem;
                        Console.WriteLine($"Mapping MultiChoicePromptItem: itemId={k.ItemId}");
                        item = new Models.MultiChoicePromptItem
                        {
                            ItemId = k.ItemId ?? $"multichoice-{index}",
                            Description = k.Description ?? "Multi-choice prompt",
                            IsRecording = k.IsRecording ?? false,
                            Options = k.Options?.ToList() ?? new List<string>(),
                            OtherEntryLabel = k.OtherEntryLabel?.String
                        };
                    }
                    else if (wrapperItem.SuperChoicePromptItem != null)
                    {
                        var k = wrapperItem.SuperChoicePromptItem;
                        Console.WriteLine($"Mapping SuperChoicePromptItem: itemId={k.ItemId}");
                        item = new Models.SuperChoicePromptItem
                        {
                            ItemId = k.ItemId ?? $"superchoice-{index}",
                            Description = k.Description ?? "Super choice prompt",
                            IsRecording = k.IsRecording ?? false,
                            Options = k.Options?.ToList() ?? new List<string>(),
                            OtherEntryLabel = k.OtherEntryLabel?.String
                        };
                    }
                    else if (wrapperItem.TextInputItem != null)
                    {
                        var k = wrapperItem.TextInputItem;
                        Console.WriteLine($"Mapping TextInputItem: itemId={k.ItemId}");
                        item = new Models.TextInputItem
                        {
                            ItemId = k.ItemId ?? $"textinput-{index}",
                            Description = k.Description ?? "Text input prompt",
                            IsRecording = k.IsRecording ?? false
                        };
                    }

                    if (item != null)
                    {
                        result.Add(item);
                    }
                    index++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERROR mapping schedule item #{index}: {ex.Message}");
                    // Skip malformed items but continue processing
                    index++;
                }
            }

            Debug.WriteLine($"Mapped {result.Count} schedule items from {kiotaItems.Count} source items");
            return result;
        }

        private string ResolveMediaUrl(string? relativeOrAbsoluteUrl)
        {
            if (string.IsNullOrWhiteSpace(relativeOrAbsoluteUrl))
            {
                Console.WriteLine($"ResolveMediaUrl: Input is null or whitespace, returning empty string");
                return relativeOrAbsoluteUrl ?? string.Empty;
            }

            // If already absolute URL, return as-is
            if (relativeOrAbsoluteUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                relativeOrAbsoluteUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"ResolveMediaUrl: URL is already absolute: '{relativeOrAbsoluteUrl}'");
                return relativeOrAbsoluteUrl;
            }

            // Relative URL - combine with baseUrl
            var fullUrl = baseUrl.TrimEnd('/') + "/" + relativeOrAbsoluteUrl.TrimStart('/');
            Console.WriteLine($"ResolveMediaUrl: Resolved '{relativeOrAbsoluteUrl}' to '{fullUrl}'");
            return fullUrl;
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
