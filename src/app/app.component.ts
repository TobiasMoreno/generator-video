import { Component } from '@angular/core';
import { VideoGeneratorComponent } from './components/video-generator/video-generator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoGeneratorComponent],
  template: '<app-video-generator></app-video-generator>'
})
export class AppComponent {}
