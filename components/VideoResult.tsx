import React, { useRef, useState, useEffect } from 'react';
import { ViralClip } from '../types';

interface VideoResultProps {
  videoFile: File;
  clip: ViralClip;
  isActive: boolean;
}

// FFmpeg global type definition since we loaded it via script tag
declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (options: any) => any;
      fetchFile: (file: File | Blob | string) => Promise<Uint8Array>;
    };
    crossOriginIsolated: boolean;
  }
}

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
};

const VideoResult: React.FC<VideoResultProps> = ({ videoFile, clip, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');

  const startSeconds = parseTime(clip.startTime);
  const endSeconds = parseTime(clip.endTime);
  const duration = endSeconds - startSeconds;

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  // Handle active state changes
  useEffect(() => {
    if (isActive && videoRef.current) {
        videoRef.current.currentTime = startSeconds;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
    }
  }, [isActive, startSeconds]);

  // Loop logic
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const currentProgress = ((current - startSeconds) / duration) * 100;
      setProgress(Math.max(0, Math.min(100, currentProgress)));

      if (current >= endSeconds) {
        videoRef.current.currentTime = startSeconds;
        videoRef.current.play();
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFull = () => {
      downloadBlob(videoFile, `FULL_SOURCE_${clip.title.replace(/[^a-z0-9]/gi, '_')}.mp4`);
  };

  const handleDownloadCut = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      
      if (!window.FFmpeg) {
          throw new Error("FFmpeg library not loaded. Check internet connection.");
      }

      const { createFFmpeg, fetchFile } = window.FFmpeg;
      
      // CONFIGURATION INTELLIGENTE
      // Sur Vercel standard, ceci sera false, déclenchant le mode compatible
      const isSecure = window.crossOriginIsolated;
      
      let ffmpegConfig: any = { log: true };
      
      if (!isSecure) {
          console.warn("⚠️ Mode sécurisé non détecté. Bascule vers le mode compatible (plus lent).");
          setProcessStatus('Loading Compatibility Engine...');
          // On force la version 0.11.6 pour correspondre au script dans index.html
          ffmpegConfig.corePath = "https://unpkg.com/@ffmpeg/core@0.11.6/dist/ffmpeg-core.js";
      } else {
          setProcessStatus('Loading High-Speed Engine...');
      }

      const ffmpeg = createFFmpeg(ffmpegConfig);
      
      await ffmpeg.load();
      
      setProcessStatus('Importing Footage...');
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      
      ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));

      setProcessStatus(isSecure ? 'Cutting (Fast)...' : 'Cutting (Compatibility Mode)...');
      
      await ffmpeg.run(
        '-i', inputName,
        '-ss', String(startSeconds),
        '-to', String(endSeconds),
        '-c', 'copy', // Copy codec is extremely fast
        outputName
      );

      setProcessStatus('Saving...');
      
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      downloadBlob(blob, `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`);
      
      try {
          ffmpeg.exit();
      } catch(e) { /* ignore exit errors */ }
      
    } catch (error: any) {
      console.error("FFmpeg error:", error);
      alert("Error processing video: " + error.message + "\n\nTry using the 'Download Full' button instead.");
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  return (
    <div className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl group border border-gray-800">
      <video
        ref={videoRef}
        src={objectUrl}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        muted={false}
        loop={false}
        playsInline
        onClick={togglePlay}
      />
      
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold mb-2">{processStatus}</p>
            {!window.crossOriginIsolated && (
                <p className="text-xs text-yellow-500 max-w-[200px]">Running in compatibility mode. This may take a few seconds.</p>
            )}
        </div>
      )}
      
      {/* TikTok UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/60">
        
        {/* Top: Virality Score */}
        <div className="flex justify-between items-start">
             <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${clip.viralityScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs font-bold text-white">Score: {clip.viralityScore}</span>
             </div>
        </div>

        {/* Center/Bottom: Subtitles */}
        <div className="mt-auto mb-16 px-4 text-center">
            <p className="text-white font-bold text-lg leading-tight tiktok-text-shadow font-['Proxima_Nova',_'Inter',_sans-serif] bg-black/20 inline-block px-2 py-1 rounded">
                {clip.subtitles}
            </p>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-2 bottom-16 flex flex-col gap-3 pointer-events-auto items-end">
             
             {/* Fallback Download */}
             <button 
                onClick={handleDownloadFull}
                className="bg-black/60 text-white text-[10px] px-2 py-1 rounded hover:bg-black/80 backdrop-blur-md mb-2"
                title="Download original video if cut fails"
             >
                Download Full
             </button>

             <div className="w-10 h-10 bg-gray-800/80 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
             </div>
             <div className="w-10 h-10 bg-gray-800/80 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
             </div>
             
             {/* Main Cut Action */}
             <button 
                onClick={handleDownloadCut} 
                disabled={isProcessing}
                className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-wait"
                title="Cut & Download .mp4"
             >
                {isProcessing ? (
                   <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                )}
             </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-4 right-4">
             <h4 className="text-white font-semibold text-sm truncate pr-12">{clip.title}</h4>
             <div className="h-1 bg-gray-700 w-full mt-2 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default VideoResult;