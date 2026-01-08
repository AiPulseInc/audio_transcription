export interface TranscriptResult {
  raw_transcript: string;
  polished_version: string;
  summary: string;
  key_points: string[];
}

export enum FileSource {
  LOCAL = 'LOCAL',
  URL = 'URL'
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'transcribing' | 'polishing' | 'completed' | 'error';
  message?: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}
