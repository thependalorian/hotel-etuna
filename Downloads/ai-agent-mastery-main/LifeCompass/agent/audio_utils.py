"""
Audio processing utilities for voice integration.

This module provides utilities for audio processing, format conversion,
and voice activity detection to support the voice interface.
"""

import io
import wave
import logging
from typing import Tuple, Optional

import numpy as np
from fastrtc import audio_to_bytes, bytes_to_audio

logger = logging.getLogger(__name__)


def convert_audio_format(
    audio_data: np.ndarray,
    from_sample_rate: int,
    to_sample_rate: int
) -> Tuple[int, np.ndarray]:
    """
    Convert audio data to a different sample rate.

    Args:
        audio_data: Input audio data
        from_sample_rate: Original sample rate
        to_sample_rate: Target sample rate

    Returns:
        Tuple of (new_sample_rate, converted_audio_data)
    """
    if from_sample_rate == to_sample_rate:
        return from_sample_rate, audio_data

    # Simple resampling (in production, use librosa or similar)
    ratio = to_sample_rate / from_sample_rate
    new_length = int(len(audio_data) * ratio)
    converted = np.interp(
        np.linspace(0, len(audio_data) - 1, new_length),
        np.arange(len(audio_data)),
        audio_data
    )

    return to_sample_rate, converted.astype(np.int16)


def audio_to_wav_bytes(audio: Tuple[int, np.ndarray]) -> bytes:
    """
    Convert audio tuple to WAV format bytes.

    Args:
        audio: Tuple of (sample_rate, audio_data)

    Returns:
        WAV formatted bytes
    """
    sample_rate, audio_data = audio

    # Ensure audio_data is 1D
    if audio_data.ndim > 1:
        audio_data = audio_data.flatten()

    # Create WAV file in memory
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())

    return buffer.getvalue()


def wav_bytes_to_audio(wav_bytes: bytes) -> Tuple[int, np.ndarray]:
    """
    Convert WAV bytes to audio tuple.

    Args:
        wav_bytes: WAV formatted bytes

    Returns:
        Tuple of (sample_rate, audio_data)
    """
    buffer = io.BytesIO(wav_bytes)
    with wave.open(buffer, 'rb') as wav_file:
        sample_rate = wav_file.getframerate()
        n_frames = wav_file.getnframes()
        audio_data = wav_file.readframes(n_frames)

    # Convert to numpy array
    audio_array = np.frombuffer(audio_data, dtype=np.int16)

    return sample_rate, audio_array


def normalize_audio_level(
    audio_data: np.ndarray,
    target_dBFS: float = -20.0
) -> np.ndarray:
    """
    Normalize audio to a target dBFS level.

    Args:
        audio_data: Input audio data
        target_dBFS: Target dBFS level

    Returns:
        Normalized audio data
    """
    # Calculate current RMS level
    rms = np.sqrt(np.mean(audio_data.astype(np.float32) ** 2))

    if rms == 0:
        return audio_data

    # Calculate current dBFS
    current_dBFS = 20 * np.log10(rms / 32767)  # 16-bit range

    # Calculate gain needed
    gain_dB = target_dBFS - current_dBFS
    gain_linear = 10 ** (gain_dB / 20)

    # Apply gain
    normalized = audio_data.astype(np.float32) * gain_linear

    # Clip to prevent distortion
    normalized = np.clip(normalized, -32768, 32767)

    return normalized.astype(np.int16)


def detect_silence(
    audio_data: np.ndarray,
    threshold_dBFS: float = -40.0,
    min_silence_duration: float = 0.5,
    sample_rate: int = 16000
) -> list:
    """
    Detect silent segments in audio data.

    Args:
        audio_data: Audio data to analyze
        threshold_dBFS: Silence threshold in dBFS
        min_silence_duration: Minimum silence duration in seconds
        sample_rate: Audio sample rate

    Returns:
        List of tuples (start_time, end_time) for silent segments
    """
    # Convert threshold to linear
    threshold_linear = 10 ** (threshold_dBFS / 20) * 32767

    # Calculate RMS in sliding windows
    window_size = int(sample_rate * 0.1)  # 100ms windows
    silent_segments = []

    for i in range(0, len(audio_data) - window_size, window_size // 2):
        window = audio_data[i:i + window_size]
        rms = np.sqrt(np.mean(window.astype(np.float32) ** 2))

        if rms < threshold_linear:
            start_time = i / sample_rate
            end_time = (i + window_size) / sample_rate

            # Merge with previous silent segment if close
            if silent_segments and start_time - silent_segments[-1][1] < 0.1:
                silent_segments[-1] = (silent_segments[-1][0], end_time)
            else:
                silent_segments.append((start_time, end_time))

    # Filter by minimum duration
    filtered_segments = [
        segment for segment in silent_segments
        if segment[1] - segment[0] >= min_silence_duration
    ]

    return filtered_segments


def trim_silence(
    audio_data: np.ndarray,
    sample_rate: int = 16000,
    threshold_dBFS: float = -40.0,
    padding: float = 0.1
) -> Tuple[int, np.ndarray]:
    """
    Trim silence from beginning and end of audio.

    Args:
        audio_data: Audio data to trim
        sample_rate: Audio sample rate
        threshold_dBFS: Silence threshold
        padding: Padding to keep around speech (seconds)

    Returns:
        Tuple of (sample_rate, trimmed_audio_data)
    """
    # Detect silence
    silent_segments = detect_silence(
        audio_data, threshold_dBFS, min_silence_duration=0.1, sample_rate=sample_rate
    )

    if not silent_segments:
        return sample_rate, audio_data

    # Find speech regions (gaps between silence)
    speech_regions = []
    prev_end = 0

    for start, end in silent_segments:
        if start > prev_end:
            speech_regions.append((prev_end, start))
        prev_end = end

    # Add final region if exists
    if prev_end < len(audio_data) / sample_rate:
        speech_regions.append((prev_end, len(audio_data) / sample_rate))

    if not speech_regions:
        return sample_rate, audio_data

    # Find main speech region (longest)
    main_region = max(speech_regions, key=lambda x: x[1] - x[0])

    # Add padding
    start_sample = max(0, int((main_region[0] - padding) * sample_rate))
    end_sample = min(len(audio_data), int((main_region[1] + padding) * sample_rate))

    trimmed_audio = audio_data[start_sample:end_sample]

    return sample_rate, trimmed_audio


def get_audio_info(audio: Tuple[int, np.ndarray]) -> dict:
    """
    Get information about audio data.

    Args:
        audio: Tuple of (sample_rate, audio_data)

    Returns:
        Dictionary with audio information
    """
    sample_rate, audio_data = audio

    return {
        "sample_rate": sample_rate,
        "duration": len(audio_data) / sample_rate,
        "samples": len(audio_data),
        "channels": 1,  # Assuming mono
        "bit_depth": 16,  # Assuming 16-bit
        "max_amplitude": np.max(np.abs(audio_data)),
        "rms_amplitude": np.sqrt(np.mean(audio_data.astype(np.float32) ** 2)),
    }
