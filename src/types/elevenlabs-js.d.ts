declare module 'elevenlabs-js' {
  export class ElevenLabs {
    constructor(config: { apiKey: string });
    textToSpeech: {
      speech(params: {
        voice_id: string;
        input: string;
        speech_marks?: string[];
      }): Promise<{
        audio: ArrayBuffer;
        timepoints?: { start: number; end: number }[];
      }>;
    };
  }
} 