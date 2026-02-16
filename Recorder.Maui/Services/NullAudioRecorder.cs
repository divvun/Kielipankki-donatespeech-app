using System;
using Recorder.Models;

namespace Recorder.Services
{
    public class NullAudioRecorder : IAudioRecorder
    {
        public bool IsRecording => false;

        public string Prepare()
        {
            return Guid.NewGuid().ToString();
        }

        public void Start()
        {
            throw new RecordingException("Audio recording is not supported on this platform.");
        }

        public AudioFile Stop()
        {
            throw new RecordingException("Audio recording is not supported on this platform.");
        }
    }
}
