import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { Sentence } from '../models/sentence.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoBuilderService {
  private ffmpeg: FFmpeg = new FFmpeg();
  public progressSubject = new Subject<{ ratio: number, message: string }>();

  async init() {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    this.ffmpeg = new FFmpeg();
    
    // Configurar el callback de progreso
    this.ffmpeg.on('progress', (event: any) => {
      const ratio = event.ratio || 0;
      this.progressSubject.next({ 
        ratio: ratio * 100,
        message: `Procesando video: ${(ratio * 100).toFixed(1)}% completado`
      });
    });

    // Configurar el callback de logs
    this.ffmpeg.on('log', (event: any) => {
      console.log('FFmpeg Log:', event.message);
    });

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  
  /**
   * Monta un vídeo a partir de:
   * - sentences: texto + audio + opcional timepoints
   * - backgroundVideoUrl: ruta del video de fondo
   */
  async buildVideo(sentences: Sentence[], backgroundVideoUrl: string): Promise<Blob> {
    try {
      this.progressSubject.next({ ratio: 0, message: 'Descargando video de fondo...' });
      
      // 1. Descargar y preparar el video de fondo
      const videoResponse = await fetch(backgroundVideoUrl);
      const videoArrayBuffer = await videoResponse.arrayBuffer();
      await this.ffmpeg.writeFile('background.mp4', new Uint8Array(videoArrayBuffer));

      // 2. Escribir los archivos de audio
      for (let i = 0; i < sentences.length; i++) {
        await this.ffmpeg.writeFile(`aud${i}.mp3`, new Uint8Array(sentences[i].audio));
        this.progressSubject.next({ 
          ratio: (i / sentences.length) * 20,
          message: `Preparando audio ${i + 1}/${sentences.length}...` 
        });
      }

      // 3. Generar archivo SRT para subtítulos
      let srt = '';
      let currentTime = 0;
      sentences.forEach((s, i) => {
        const duration = s.timepoints ? 
          s.timepoints[0].end - s.timepoints[0].start : 
          s.audio.byteLength * 0.0001; // Estimación aproximada
        
        const start = this.formatTime(currentTime);
        currentTime += duration;
        const end = this.formatTime(currentTime);
        
        srt += `${i+1}\n${start} --> ${end}\n${s.text}\n\n`;
      });
      await this.ffmpeg.writeFile('sub.srt', new TextEncoder().encode(srt));

      // 4. Concatenar audios
      const audioList = sentences.map((_, i) => `file 'aud${i}.mp3'`).join('\n');
      await this.ffmpeg.writeFile('audiolist.txt', new TextEncoder().encode(audioList));
      
      this.progressSubject.next({ ratio: 30, message: 'Combinando audios...' });
      
      // Concatenar todos los audios
      await this.ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'audiolist.txt',
        '-c', 'copy',
        'combined.mp3'
      ]);

      this.progressSubject.next({ ratio: 50, message: 'Procesando video final...' });

      // 5. Combinar video de fondo con audio y subtítulos
      await this.ffmpeg.exec([
        '-i', 'background.mp4',
        '-i', 'combined.mp3',
        '-map', '0:v',
        '-map', '1:a',
        '-shortest',
        '-vf', 'subtitles=sub.srt:force_style=\'FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Bold=1\'',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        'out.mp4'
      ]);

      // 6. Leer el resultado y retornar como Blob
      const data = await this.ffmpeg.readFile('out.mp4');
      this.progressSubject.next({ ratio: 100, message: 'Video completado!' });
      
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Error en buildVideo:', error);
      throw error;
    }
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)},${ms}`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
