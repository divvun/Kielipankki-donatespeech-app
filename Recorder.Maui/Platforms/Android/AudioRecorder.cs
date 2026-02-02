using System;
using System.Diagnostics;
using System.IO;
using Android.Media;
using Recorder.Models;
using Recorder.Services;
using Microsoft.Maui.Controls;
using Microsoft.Maui.ApplicationModel;

[assembly: Dependency(typeof(Recorder.Maui.Platforms.Android.AudioRecorder))]

namespace Recorder.Maui.Platforms.Android
{
    public class AudioRecorder : IAudioRecorder
    {
        const int BIT_DEPTH = 16;
        const int SAMPLE_RATE = 44100;
        const int CHANNEL_COUNT = 2;

        // Settings for FLAC
        const string FILE_EXTENSION = "flac";
        const string MIME_TYPE = "audio/flac";

        MediaRecorder recorder;
        string outputFilePath;
        AudioFile output;
        DateTime recordingStartTime;

        public AudioRecorder()
        {
        }

        bool IAudioRecorder.IsRecording
        {
            get => recorder != null;
        }

        public string Prepare()
        {
            var recId = Guid.NewGuid().ToString();
            string fileName = $"{recId}.{FILE_EXTENSION}";

            // Use Android's internal files directory which is guaranteed to exist
            var filesDir = FileSystem.AppDataDirectory;
            outputFilePath = Path.Combine(filesDir, fileName);
            Debug.WriteLine($"Recording will be saved to: {outputFilePath}");

            output = new AudioFile()
            {
                FileName = fileName,
                BitDepth = BIT_DEPTH,
                SampleRate = SAMPLE_RATE,
                NumberOfChannels = CHANNEL_COUNT,
                ContentType = MIME_TYPE,
            };

            recorder = new MediaRecorder();
            recorder.SetAudioSource(AudioSource.Mic);
            recorder.SetOutputFormat(OutputFormat.Default); // Will use default format
            recorder.SetAudioEncoder(AudioEncoder.Default); // Will use default encoder
            recorder.SetAudioChannels(CHANNEL_COUNT);
            recorder.SetAudioSamplingRate(SAMPLE_RATE);
            recorder.SetOutputFile(outputFilePath);

            try
            {
                recorder.Prepare();
                Debug.WriteLine($"MediaRecorder prepared successfully for: {outputFilePath}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to prepare MediaRecorder: {ex.Message}");
                recorder?.Dispose();
                recorder = null;
                throw new RecordingException($"Unable to prepare audio recorder: {ex.Message}");
            }

            return recId;
        }

        public void Start()
        {
            if (recorder != null && output != null)
            {
                try
                {
                    recorder.Start();
                    recordingStartTime = DateTime.UtcNow;
                    output.CreatedOn = recordingStartTime;
                    Debug.WriteLine($"Started recording: {output.FileName}");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Failed to start recording: {ex.Message}");
                    throw new RecordingException($"Unable to start recording: {ex.Message}");
                }
            }
            else
            {
                throw new RecordingException("Unable to start, recording has not been prepared");
            }
        }

        public AudioFile Stop()
        {
            if (recorder != null && output != null)
            {
                try
                {
                    recorder.Stop();
                    
                    var duration = (DateTime.UtcNow - recordingStartTime).TotalSeconds;
                    output.Duration = duration;

                    Debug.WriteLine($"Stopped recording: {output.FileName}, Duration: {output.Duration}s");
                    Debug.WriteLine($"File should be at: {outputFilePath}");
                    Debug.WriteLine($"File exists: {File.Exists(outputFilePath)}");

                    recorder.Release();
                    recorder.Dispose();
                    recorder = null;

                    return output;
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error stopping recording: {ex.Message}");
                    recorder?.Release();
                    recorder?.Dispose();
                    recorder = null;
                    throw new RecordingException($"Unable to stop recording: {ex.Message}");
                }
                finally
                {
                    recorder = null;
                    output = null;
                }
            }

            throw new RecordingException("Unable to stop, recording has not been started yet");
        }
    }
}
