export interface Timepoint {
  start: number; // en segundos
  end: number; // en segundos
}

export interface Sentence {
  text: string;
  audio: ArrayBuffer;
  timepoints?: Timepoint[];
}
