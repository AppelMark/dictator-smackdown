interface TTSRequest {
  text: string;
  voiceId?: string;
}

interface TTSResponse {
  audioUrl: string;
  duration: number;
}

export async function generateSpeech(
  request: TTSRequest
): Promise<TTSResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = request.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  // Placeholder for ElevenLabs API integration
  return { audioUrl: '', duration: 0 };

  // voiceId is used in the actual API call
  void voiceId;
}
