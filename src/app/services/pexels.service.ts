import { Injectable } from '@angular/core';

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class PexelsService {
  private apiKey = 'TU_API_KEY_PEXELS'; // Reemplaza con tu API key de Pexels
  private baseUrl = 'https://api.pexels.com/videos';

  async searchVideos(query: string, orientation: 'landscape' | 'portrait' = 'landscape'): Promise<PexelsVideo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=10`, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Error en Pexels API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.videos;
    } catch (error) {
      console.error('Error buscando videos:', error);
      throw error;
    }
  }

  async getRandomVideo(query: string = 'nature,landscape,inspiration'): Promise<PexelsVideo> {
    const videos = await this.searchVideos(query);
    if (!videos || videos.length === 0) {
      throw new Error('No se encontraron videos');
    }
    return videos[Math.floor(Math.random() * videos.length)];
  }

  getBestVideoFile(video: PexelsVideo) {
    // Preferimos HD (1280x720) o la mejor calidad disponible que no sea 4K
    const preferredQualities = ['hd', 'sd'];
    
    for (const quality of preferredQualities) {
      const file = video.video_files.find(f => f.quality === quality);
      if (file) return file;
    }

    // Si no encontramos las calidades preferidas, tomamos el primer archivo disponible
    return video.video_files[0];
  }
} 