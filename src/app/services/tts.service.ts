import { Injectable } from '@angular/core';
import { Sentence } from '../models/sentence.model';

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private apiKey = 'sk_58e1205e715afcf469e1a163ce445f1a835ee646921abe8a'; // Reemplaza esto con tu clave de API de ElevenLabs
  private voiceId = '21m00Tcm4TlvDq8ikWAM'; // Ejemplo de ID de voz
  private apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech';

  /** Devuelve el buffer de audio y (opcional) marcas de tiempo */
  async synthesize(sentence: string): Promise<{ audio: ArrayBuffer; timepoints?: { start: number, end: number }[] }> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: sentence,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de ElevenLabs: ${errorData.detail?.message || response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioArrayBuffer = await audioBlob.arrayBuffer();

      // ElevenLabs no proporciona timepoints en la API básica, así que simulamos algunos
      // basados en la longitud del texto (aproximadamente 0.1 segundos por carácter)
      const estimatedDuration = sentence.length * 0.1;
      const timepoints = [{
        start: 0,
        end: estimatedDuration
      }];

      return { 
        audio: audioArrayBuffer, 
        timepoints 
      };
    } catch (error) {
      console.error('Error en TTS:', error);
      throw error;
    }
  }
}
