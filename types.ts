export interface ViralClip {
  id: string;
  title: string;
  viralityScore: number;
  startTime: string; // "MM:SS" format
  endTime: string;   // "MM:SS" format
  reason: string;
  subtitles: string; // The text content for the overlay
}

export interface AnalysisResult {
  clips: ViralClip[];
  videoTitle?: string;
}

export type AppState = 'IDLE' | 'ANALYZING' | 'RESULTS';

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/mov",
  "video/avi",
  "video/webm",
  "video/x-flv",
  "video/mpg",
  "video/quicktime",
  "video/wmv",
  "video/3gpp"
];