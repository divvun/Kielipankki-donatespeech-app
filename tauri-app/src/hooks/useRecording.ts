import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Recording } from "../types/Recording";

export interface SaveRecordingResponse {
  recording: Recording;
  durationSeconds: number;
}

export interface UseRecordingResult {
  isRecording: boolean;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: (
    itemId: string,
    clientId: string,
  ) => Promise<SaveRecordingResponse | null>;
  resetError: () => void;
}

export function useRecording(): UseRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(44100);

  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for capturing audio data
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 2, 2);
      processorRef.current = processor;

      audioChunksRef.current = [];

      processor.onaudioprocess = (event) => {
        const leftChannel = event.inputBuffer.getChannelData(0);
        const rightChannel = event.inputBuffer.getChannelData(1);

        // Interleave channels
        const interleaved = new Float32Array(leftChannel.length * 2);
        for (let i = 0; i < leftChannel.length; i++) {
          interleaved[i * 2] = leftChannel[i];
          interleaved[i * 2 + 1] = rightChannel[i];
        }

        audioChunksRef.current.push(interleaved);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Start duration timer
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start recording",
      );
    }
  };

  const stopRecording = async (
    itemId: string,
    clientId: string,
  ): Promise<SaveRecordingResponse | null> => {
    try {
      stopTimer();
      setIsRecording(false);

      // Disconnect audio nodes
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Combine all audio chunks
      const totalLength = audioChunksRef.current.reduce(
        (acc, chunk) => acc + chunk.length,
        0,
      );
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to WAV
      const wavBlob = encodeWAV(combinedAudio, sampleRateRef.current, 2);

      // Convert to base64
      const audioBase64 = await blobToBase64(wavBlob);

      // Call backend to save recording
      console.log("Saving recording...", {
        itemId,
        clientId,
        dataLength: audioBase64.length,
        sampleRate: sampleRateRef.current,
      });

      const response = await invoke<SaveRecordingResponse>("save_recording", {
        itemId,
        clientId,
        audioDataBase64: audioBase64,
      });

      console.log("Recording saved:", response);
      audioChunksRef.current = [];
      return response;
    } catch (err) {
      console.error("Error saving recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording");
      throw err;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    isRecording,
    duration,
    error,
    startRecording,
    stopRecording,
    resetError,
  };
}

function encodeWAV(
  samples: Float32Array,
  sampleRate: number,
  numChannels: number,
): Blob {
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Audio data (convert float32 to int16)
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
