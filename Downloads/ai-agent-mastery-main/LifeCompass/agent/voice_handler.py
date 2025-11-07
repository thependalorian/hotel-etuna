"""
Voice processing handler for LifeCompass agent integration.

This module provides voice input/output capabilities using FastRTC and Groq,
adapted for the LifeCompass agent architecture.
"""

import os
import tempfile
import logging
from typing import Generator, Tuple, Optional, Any

import numpy as np
from fastrtc import (
    AlgoOptions,
    ReplyOnPause,
    Stream,
    audio_to_bytes,
)
from groq import Groq
from loguru import logger

from .api import execute_agent
from .db_utils import create_session

# Configure logger
logger.remove()
logger.add(
    lambda msg: print(msg),
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | <level>{message}</level>",
)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class LifeCompassVoiceAgent:
    """Voice interface for the LifeCompass agent."""

    def __init__(self):
        """Initialize the voice agent."""
        self.logger = logging.getLogger(__name__)

    async def process_voice_input(
        self,
        audio: tuple[int, np.ndarray],
        session_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Generator[Tuple[int, np.ndarray], None, None]:
        """
        Process audio input, transcribe it, generate response using LifeCompass agent, and deliver TTS audio.

        Args:
            audio: Tuple containing sample rate and audio data
            session_id: Optional existing session ID
            user_id: Optional user ID

        Yields:
            Tuples of (sample_rate, audio_array) for audio playback
        """
        try:
            logger.info("🎙️ Received audio input")

            # Create session if not provided
            if not session_id:
                session_id = await create_session(user_id=user_id or "voice_user")
                logger.info(f"📝 Created new session: {session_id}")

            logger.debug("🔄 Transcribing audio...")
            transcript = groq_client.audio.transcriptions.create(
                file=("audio-file.mp3", audio_to_bytes(audio)),
                model=os.getenv("STT_MODEL", "whisper-large-v3-turbo"),
                response_format="text",
            )
            logger.info(f'👂 Transcribed: "{transcript}"')

            # Process with LifeCompass agent
            logger.debug("🧠 Running LifeCompass agent...")
            response_text, tools_used = await execute_agent(
                message=transcript,
                session_id=session_id,
                user_id=user_id,
                save_conversation=True,
                voice_mode=True
            )

            # Log tool usage
            if tools_used:
                tool_names = [tool.tool_name for tool in tools_used]
                logger.info(f"🛠️ Used tools: {', '.join(tool_names)}")

            logger.info(f'💬 Response: "{response_text[:100]}..."')

            logger.debug("🔊 Generating speech...")
            tts_response = groq_client.audio.speech.create(
                model=os.getenv("VOICE_MODEL", "playai-tts"),
                voice=os.getenv("VOICE_NAME", "Celeste-PlayAI"),
                response_format=os.getenv("AUDIO_FORMAT", "wav"),
                input=response_text,
            )

            # Process TTS and yield audio chunks
            async for audio_chunk in process_groq_tts(tts_response):
                yield audio_chunk

        except Exception as e:
            logger.error(f"Voice processing failed: {e}")
            # Generate error message audio
            error_text = "I'm sorry, I encountered an error processing your request. Please try again."
            try:
                tts_response = groq_client.audio.speech.create(
                    model="playai-tts",
                    voice="Celeste-PlayAI",
                    response_format="wav",
                    input=error_text,
                )
                async for audio_chunk in process_groq_tts(tts_response):
                    yield audio_chunk
            except Exception as tts_error:
                logger.error(f"TTS error failed: {tts_error}")
                # Return empty audio if everything fails
                yield (16000, np.array([], dtype=np.int16).reshape(1, -1))


async def process_groq_tts(
    tts_response: Any,
) -> Generator[Tuple[int, np.ndarray], None, None]:
    """
    Process Groq TTS response into audio chunks.

    Args:
        tts_response: Groq TTS API response object

    Yields:
        Tuples of (sample_rate, audio_array) for audio playback
    """
    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_file_path = temp_file.name
    temp_file.close()

    try:
        tts_response.write_to_file(temp_file_path)

        import wave
        with wave.open(temp_file_path, "rb") as wf:
            sample_rate = wf.getframerate()
            n_frames = wf.getnframes()
            audio_data = wf.readframes(n_frames)

        # Return int16 audio data as expected by FastRTC (same as working examples)
        audio_array = np.frombuffer(audio_data, dtype=np.int16).reshape(1, -1)
        yield (sample_rate, audio_array)
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def create_voice_stream(
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Stream:
    """
    Create and configure a Stream instance with voice capabilities for LifeCompass.

    Args:
        session_id: Optional session ID to maintain conversation context
        user_id: Optional user ID

    Returns:
        Stream: Configured FastRTC Stream instance
    """
    voice_agent = LifeCompassVoiceAgent()

    async def response_handler(audio: tuple[int, np.ndarray]) -> Generator[Tuple[int, np.ndarray], None, None]:
        """Handle audio response generation."""
        async for chunk in voice_agent.process_voice_input(audio, session_id, user_id):
            yield chunk

    return Stream(
        modality="audio",
        mode="send-receive",
        handler=ReplyOnPause(
            response_handler,
            algo_options=AlgoOptions(
                speech_threshold=float(os.getenv("VAD_SPEECH_THRESHOLD", "0.5")),
            ),
        ),
    )
