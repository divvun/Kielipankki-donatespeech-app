use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use flacenc::{component::BitRepr, config, source::MemSource, error::Verify, bitsink::MemSink};
use hound::{WavReader, SampleFormat};
use uuid::Uuid;

const SAMPLE_RATE: u32 = 44100;
const BIT_DEPTH: u16 = 16;
const CHANNELS: u16 = 2;

#[derive(Debug)]
pub struct AudioMetadata {
    pub filename: String,
    pub duration_seconds: f64,
    pub sample_rate: u32,
    pub bit_depth: u16,
    pub channels: u16,
    pub content_type: String,
}

/// Save WAV audio data as FLAC file
/// 
/// Takes WAV audio bytes, decodes them, re-encodes as FLAC, and saves to the recordings directory
/// Returns metadata about the saved file
pub fn save_recording_as_flac(
    wav_data: &[u8],
    recordings_dir: &PathBuf,
) -> Result<AudioMetadata, String> {
    // Generate unique recording ID and filename
    let recording_id = Uuid::new_v4().to_string();
    let filename = format!("{}.flac", recording_id);
    let output_path = recordings_dir.join(&filename);

    // Ensure recordings directory exists
    std::fs::create_dir_all(recordings_dir)
        .map_err(|e| format!("Failed to create recordings directory: {}", e))?;

    // Decode WAV data
    let cursor = std::io::Cursor::new(wav_data);
    let mut wav_reader = WavReader::new(cursor)
        .map_err(|e| format!("Failed to read WAV data: {}", e))?;
    
    let spec = wav_reader.spec();
    let sample_rate = spec.sample_rate;
    let channels = spec.channels;
    let bits_per_sample = spec.bits_per_sample;
    
    // Read all samples
    let samples: Vec<i32> = match spec.sample_format {
        SampleFormat::Int => {
            wav_reader
                .samples::<i32>()
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to read WAV samples: {}", e))?
        }
        SampleFormat::Float => {
            // Convert float samples to i32
            wav_reader
                .samples::<f32>()
                .map(|s| s.map(|f| (f * i32::MAX as f32) as i32))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to read WAV samples: {}", e))?
        }
    };

    let sample_count = samples.len();
    let duration_seconds = sample_count as f64 / (sample_rate as f64 * channels as f64);

    // Create FLAC encoder configuration
    let encoder_config = config::Encoder::default().into_verified()
        .map_err(|e| format!("Failed to verify FLAC encoder config: {:?}", e))?;
    
    // Create audio source
    let source = MemSource::from_samples(
        &samples,
        channels as usize,
        bits_per_sample as usize,
        sample_rate as usize,
    );

    // Encode to FLAC stream
    let stream = flacenc::encode_with_fixed_block_size(
        &encoder_config,
        source,
        encoder_config.block_size,
    )
    .map_err(|e| format!("Failed to encode FLAC: {:?}", e))?;

    // Write stream to MemSink to get bytes
    let mut sink = MemSink::<u8>::new();
    stream.write(&mut sink)
        .map_err(|e| format!("Failed to serialize FLAC stream: {:?}", e))?;
    
    let flac_data = sink.into_inner();

    // Write FLAC file
    let mut file = File::create(&output_path)
        .map_err(|e| format!("Failed to create FLAC file: {}", e))?;
    
    file.write_all(&flac_data)
        .map_err(|e| format!("Failed to write FLAC file: {}", e))?;

    Ok(AudioMetadata {
        filename,
        duration_seconds,
        sample_rate,
        bit_depth: bits_per_sample,
        channels,
        content_type: "audio/flac".to_string(),
    })
}
