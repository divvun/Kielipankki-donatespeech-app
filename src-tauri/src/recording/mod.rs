use std::fs::File;
use std::io::{Write, Cursor};

/// Log only in debug builds (cfg!(debug_assertions) is optimized away in release)
macro_rules! debug_log {
    ($($arg:tt)*) => {
        if cfg!(debug_assertions) {
            eprintln!($($arg)*);
        }
    };
}

use std::path::PathBuf;
use flacenc::{component::BitRepr, config, source::MemSource, error::Verify, bitsink::MemSink};
use hound::{WavReader, SampleFormat};
use uuid::Uuid;

#[derive(Debug)]
pub struct AudioMetadata {
    pub filename: String,
    pub duration_seconds: f64,
    pub sample_rate: u32,
    pub bit_depth: u16,
    pub channels: u16,
    pub content_type: String,
}

enum AudioFormat {
    Wav,
    M4a,
    Adts, // AAC with ADTS framing (raw AAC)
}

/// Detect audio format from file data
fn detect_format(data: &[u8]) -> Result<AudioFormat, String> {
    if data.len() < 12 {
        return Err("Audio data too short to determine format".to_string());
    }
    
    // Debug: Print first 16 bytes as hex and ASCII
    let preview_len = std::cmp::min(16, data.len());
    let hex_str: String = data[0..preview_len]
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ");
    let ascii_str: String = data[0..preview_len]
        .iter()
        .map(|&b| if b.is_ascii_graphic() || b == b' ' { b as char } else { '.' })
        .collect();
    debug_log!("[Audio] First {} bytes (hex): {}", preview_len, hex_str);
    debug_log!("[Audio] First {} bytes (ascii): '{}'", preview_len, ascii_str);
    
    // Check for WAV (RIFF header)
    if &data[0..4] == b"RIFF" && &data[8..12] == b"WAVE" {
        debug_log!("[Audio] Detected WAV format, size: {} bytes", data.len());
        return Ok(AudioFormat::Wav);
    }
    
    // Check for ADTS AAC (sync word: 0xFFF at start of frame)
    // ADTS frames start with 12 bits of 1s: 0xFFF (appears as 0xFF 0xFx)
    if data[0] == 0xFF && (data[1] & 0xF0) == 0xF0 {
        debug_log!("[Audio] Detected ADTS AAC format, size: {} bytes", data.len());
        return Ok(AudioFormat::Adts);
    }
    
    // Check for M4A/MP4 (ftyp box)
    if data.len() >= 8 && &data[4..8] == b"ftyp" {
        // Log the ftyp brand (next 4 bytes after 'ftyp')
        let brand = if data.len() >= 12 {
            String::from_utf8_lossy(&data[8..12]).to_string()
        } else {
            "unknown".to_string()
        };
        debug_log!("[Audio] Detected M4A format, size: {} bytes, ftyp brand: '{}'", data.len(), brand);
        return Ok(AudioFormat::M4a);
    }
    
    Err(format!(
        "Unknown audio format. File size: {} bytes. First 4 bytes: {:02X} {:02X} {:02X} {:02X}",
        data.len(),
        data[0], data[1], data[2], data[3]
    ))
}

/// Decode WAV audio data to PCM samples
fn decode_wav(data: &[u8]) -> Result<(Vec<i32>, u32, u16, u16), String> {
    debug_log!("[WAV] Starting decode, input size: {} bytes", data.len());
    
    let cursor = Cursor::new(data);
    let mut wav_reader = WavReader::new(cursor)
        .map_err(|e| {
            debug_log!("[WAV] Failed to create WAV reader: {}", e);
            format!("Failed to read WAV data: {}", e)
        })?;
    
    let spec = wav_reader.spec();
    let sample_rate = spec.sample_rate;
    let channels = spec.channels;
    let bits_per_sample = spec.bits_per_sample;
    
    debug_log!("[WAV] Spec: {}Hz, {} channels, {} bits, format: {:?}", 
        sample_rate, channels, bits_per_sample, spec.sample_format);
    
    let samples: Vec<i32> = match spec.sample_format {
        SampleFormat::Int => {
            debug_log!("[WAV] Reading integer samples...");
            wav_reader
                .samples::<i32>()
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| {
                    debug_log!("[WAV] Failed to read int samples: {}", e);
                    format!("Failed to read WAV samples: {}", e)
                })?
        }
        SampleFormat::Float => {
            debug_log!("[WAV] Reading float samples...");
            wav_reader
                .samples::<f32>()
                .map(|s: Result<f32, _>| s.map(|f| (f * i32::MAX as f32) as i32))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| {
                    debug_log!("[WAV] Failed to read float samples: {}", e);
                    format!("Failed to read WAV samples: {}", e)
                })?
        }
    };
    
    debug_log!("[WAV] Successfully decoded {} samples", samples.len());
    
    Ok((samples, sample_rate, bits_per_sample, channels))
}

/// Save audio recording based on detected format
/// 
/// WAV files are decoded and converted to FLAC for compression.
/// M4A/AAC files are saved as-is without re-encoding.
/// Returns metadata about the saved file.
pub fn save_recording_as_flac(
    audio_data: &[u8],
    recordings_dir: &PathBuf,
) -> Result<AudioMetadata, String> {
    debug_log!("[AUDIO] save_recording_as_flac called with {} bytes", audio_data.len());
    
    // Generate unique recording ID
    let recording_id = Uuid::new_v4().to_string();

    // Ensure recordings directory exists
    std::fs::create_dir_all(recordings_dir)
        .map_err(|e| format!("Failed to create recordings directory: {}", e))?;

    // Detect audio format
    debug_log!("[AUDIO] Detecting audio format...");
    let format = match detect_format(audio_data) {
        Ok(fmt) => fmt,
        Err(e) => {
            debug_log!("[AUDIO] Format detection failed: {}", e);
            return Err(e);
        }
    };
    
    // Handle based on format
    match format {
        AudioFormat::Wav => {
            // Convert WAV to FLAC
            debug_log!("[AUDIO] Converting WAV to FLAC...");
            convert_wav_to_flac(audio_data, &recording_id, recordings_dir)
        },
        AudioFormat::M4a | AudioFormat::Adts => {
            // Save M4A/ADTS as-is
            debug_log!("[AUDIO] Saving M4A/AAC file as-is...");
            save_m4a_file(audio_data, &recording_id, recordings_dir)
        },
    }
}

/// Convert WAV audio to FLAC format
fn convert_wav_to_flac(
    audio_data: &[u8],
    recording_id: &str,
    recordings_dir: &PathBuf,
) -> Result<AudioMetadata, String> {
    let filename = format!("{}.flac", recording_id);
    let output_path = recordings_dir.join(&filename);
    
    debug_log!("[FLAC] Decoding WAV...");
    let (samples, sample_rate, bits_per_sample, channels) = match decode_wav(audio_data) {
        Ok(result) => result,
        Err(e) => {
            debug_log!("[FLAC] WAV decode failed: {}", e);
            return Err(e);
        }
    };

    let sample_count = samples.len();
    let duration_seconds = sample_count as f64 / (sample_rate as f64 * channels as f64);
    
    debug_log!("[FLAC] Decoded audio: {} samples, {:.2}s duration, {}Hz, {} channels, {} bit", 
        sample_count, duration_seconds, sample_rate, channels, bits_per_sample);

    // Validate decoded samples
    if sample_count == 0 {
        return Err("No audio samples decoded".to_string());
    }

    // Create FLAC encoder configuration
    debug_log!("[FLAC] Creating FLAC encoder...");
    let encoder_config = config::Encoder::default().into_verified()
        .map_err(|e| {
            debug_log!("[FLAC] Failed to verify encoder config: {:?}", e);
            format!("Failed to verify FLAC encoder config: {:?}", e)
        })?;
    
    // Create audio source
    debug_log!("[FLAC] Creating audio source from samples...");
    let source = MemSource::from_samples(
        &samples,
        channels as usize,
        bits_per_sample as usize,
        sample_rate as usize,
    );

    // Encode to FLAC stream
    debug_log!("[FLAC] Encoding to FLAC stream...");
    let stream = flacenc::encode_with_fixed_block_size(
        &encoder_config,
        source,
        encoder_config.block_size,
    )
    .map_err(|e| {
        debug_log!("[FLAC] Encoding failed: {:?}", e);
        format!("Failed to encode FLAC: {:?}", e)
    })?;

    // Write stream to MemSink to get bytes
    debug_log!("[FLAC] Writing stream to memory sink...");
    let mut sink = MemSink::<u8>::new();
    stream.write(&mut sink)
        .map_err(|e| {
            debug_log!("[FLAC] Stream write failed: {:?}", e);
            format!("Failed to serialize FLAC stream: {:?}", e)
        })?;
    
    let flac_data = sink.into_inner();
    debug_log!("[FLAC] FLAC encoding complete, output size: {} bytes", flac_data.len());

    // Write FLAC file
    debug_log!("[FLAC] Writing {} bytes to {:?}", flac_data.len(), output_path);
    let mut file = File::create(&output_path)
        .map_err(|e| format!("Failed to create FLAC file: {}", e))?;
    
    file.write_all(&flac_data)
        .map_err(|e| format!("Failed to write FLAC file: {}", e))?;

    debug_log!("[FLAC] Successfully saved recording: {}", filename);

    Ok(AudioMetadata {
        filename,
        duration_seconds,
        sample_rate,
        bit_depth: bits_per_sample,
        channels,
        content_type: "audio/flac".to_string(),
    })
}

/// Save M4A/AAC audio file as-is without conversion
fn save_m4a_file(
    audio_data: &[u8],
    recording_id: &str,
    recordings_dir: &PathBuf,
) -> Result<AudioMetadata, String> {
    let filename = format!("{}.m4a", recording_id);
    let output_path = recordings_dir.join(&filename);
    
    debug_log!("[M4A] Saving {} bytes to {:?}", audio_data.len(), output_path);
    
    // Write M4A file as-is
    let mut file = File::create(&output_path)
        .map_err(|e| format!("Failed to create M4A file: {}", e))?;
    
    file.write_all(audio_data)
        .map_err(|e| format!("Failed to write M4A file: {}", e))?;

    debug_log!("[M4A] Successfully saved recording: {}", filename);
    
    // Use default metadata for M4A files
    // Duration will be determined by the player when the file is accessed
    Ok(AudioMetadata {
        filename,
        duration_seconds: 0.0, // Unknown - will be determined on playback
        sample_rate: 48000,    // Typical mobile recording rate
        bit_depth: 16,          // Typical for AAC
        channels: 2,            // Stereo
        content_type: "audio/mp4".to_string(),
    })
}
