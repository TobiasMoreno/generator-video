import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TtsService } from '../../services/tts.service';
import { VideoBuilderService } from '../../services/video-builder.service';
import { PexelsService, PexelsVideo } from '../../services/pexels.service';
import { Sentence } from '../../models/sentence.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-generator.component.html',
  styleUrl: './video-generator.component.scss'
})
export class VideoGeneratorComponent implements OnInit, OnDestroy {
  text = 'Escribe aquí el texto que quieres convertir en video.';
  videoQuery = 'nature,inspiration';
  sentences: Sentence[] = [];
  backgroundVideo?: PexelsVideo;
  isLoading = false;
  progress = 0;
  statusMessage = '';
  videoUrl: string | null = null;
  errorMessage: string | null = null;
  debugInfo = '';
  private progressSubscription?: Subscription;

  constructor(
    private tts: TtsService,
    private builder: VideoBuilderService,
    private pexels: PexelsService
  ) {}

  ngOnInit() {
    try {
      this.statusMessage = 'Inicializando FFmpeg...';
      this.builder.init();
      this.statusMessage = 'FFmpeg inicializado correctamente';

      // Suscribirse al progreso de FFmpeg
      this.progressSubscription = this.builder.progressSubject.subscribe(
        ({ ratio, message }) => {
          if (ratio >= 70) {
            this.progress = 70 + (ratio * 0.3);
          }
          this.statusMessage = message;
          this.debugInfo += `\n${message}`;
        }
      );
    } catch (error) {
      this.errorMessage = `Error al inicializar: ${error}`;
      console.error('Error en inicialización:', error);
    }
  }

  ngOnDestroy() {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  async generate() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.progress = 0;
    this.statusMessage = 'Preparando...';
    this.errorMessage = null;
    this.videoUrl = null;
    this.debugInfo = '';
    
    try {
      // 1) Obtener video de fondo
      this.statusMessage = 'Buscando video de fondo...';
      this.progress = 10;
      this.backgroundVideo = await this.pexels.getRandomVideo(this.videoQuery);
      const videoFile = this.pexels.getBestVideoFile(this.backgroundVideo);
      this.debugInfo = `Video de fondo: ${this.backgroundVideo.url}\nCalidad: ${videoFile.quality}`;
      
      // 2) Split texto en frases
      this.statusMessage = 'Procesando texto...';
      this.progress = 20;
      const parts = this.text.match(/[^\.!\?]+[\.!\?]+/g) || [this.text];
      this.debugInfo += `\nFrases detectadas: ${parts.length}`;
      
      // 3) TTS
      this.statusMessage = 'Generando audio con ElevenLabs...';
      this.progress = 30;
      this.sentences = [];
      
      const progressPerSentence = 40 / parts.length;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        this.statusMessage = `Generando audio para frase ${i+1}/${parts.length}...`;
        const { audio, timepoints } = await this.tts.synthesize(p);
        this.sentences.push({ text: p.trim(), audio, timepoints });
        this.progress = 30 + (i + 1) * progressPerSentence;
        this.debugInfo += `\nAudio ${i+1} generado: ${audio.byteLength} bytes`;
      }
      
      // 4) Build video
      this.statusMessage = 'Construyendo video con FFmpeg...';
      this.progress = 70;
      this.debugInfo += '\nIniciando construcción del video...';
      
      const startTime = Date.now();
      const blob = await this.builder.buildVideo(this.sentences, videoFile.link);
      const endTime = Date.now();
      
      this.debugInfo += `\nTiempo de construcción: ${(endTime - startTime)/1000} segundos`;
      this.debugInfo += `\nTamaño del video: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`;
      
      // 5) Preview
      this.statusMessage = 'Video generado correctamente';
      this.progress = 100;
      this.videoUrl = URL.createObjectURL(blob);
      
      // 6) Descarga automática
      const a = document.createElement('a');
      a.href = this.videoUrl;
      a.download = 'video-generado.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error) {
      this.errorMessage = `Error: ${error}`;
      console.error('Error en generación:', error);
      this.debugInfo += `\nError: ${error}`;
    } finally {
      this.isLoading = false;
    }
  }
}
