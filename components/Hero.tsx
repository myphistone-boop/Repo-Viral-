import React, { useState, useRef } from 'react';
import { VIDEO_MIME_TYPES } from '../types';

interface HeroProps {
  onAnalyze: (file: File) => void;
}

const Hero: React.FC<HeroProps> = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEMO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setErrorMsg(null);
    setIsLoadingUrl(true);

    try {
        let response;
        
        // 1. Try Direct Fetch first
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for direct
            
            response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Direct fetch failed');
        } catch (directError) {
            console.log("Direct access blocked (CORS) or timed out. Switching to proxy...");
            
            // 2. Fallback to CORS Proxy
            // We use encodeURIComponent to ensure special characters in the URL don't break the proxy path
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch video even via proxy.');
            }
        }

        // 3. Validate Content Type
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
             throw new Error('This URL points to a webpage (HTML), not a raw video file. Please use a direct link ending in .mp4, .mov, etc.');
        }

        if (contentType && !contentType.startsWith('video/') && !contentType.includes('octet-stream')) {
             console.warn("Unusual content type:", contentType, "Attempting to process anyway...");
        }

        const blob = await response.blob();
        
        // Check if blob is actually a text error disguised as a blob
        if (blob.size < 1000 && blob.type.includes('text')) {
             throw new Error('The downloaded file seems too small or is invalid.');
        }

        // Create file object
        const finalType = contentType || 'video/mp4';
        const file = new File([blob], "video_from_url.mp4", { type: finalType });
        
        onAnalyze(file);

    } catch (error: any) {
        console.error("URL Fetch Error:", error);
        let msg = "Unable to fetch video.";
        
        if (error.message.includes('webpage')) {
            msg = "This link is a webpage, not a video file. (YouTube 'watch' links are web pages). Please use a direct .mp4 link.";
        } else if (error.message.includes('Failed to fetch')) {
            msg = "Connection failed. The video server might be blocking access.";
        } else {
            msg = error.message;
        }
        
        setErrorMsg(msg);
    } finally {
        setIsLoadingUrl(false);
    }
  };

  const loadDemo = () => {
      setUrl(DEMO_URL);
      setTimeout(() => {
          setIsLoadingUrl(true);
          setErrorMsg(null);
          fetch(DEMO_URL)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "demo_joyrides.mp4", { type: "video/mp4" });
                onAnalyze(file);
            })
            .catch(err => setErrorMsg("Could not load demo video."))
            .finally(() => setIsLoadingUrl(false));
      }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (VIDEO_MIME_TYPES.includes(file.type)) {
        onAnalyze(file);
      } else {
        setErrorMsg("Please upload a valid video file (MP4, MOV, etc).");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
       if (VIDEO_MIME_TYPES.includes(file.type)) {
        onAnalyze(file);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative z-10 py-12">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
        Make Your Content <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-gradient">
          Viral Instantly
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-400 mb-8 text-center max-w-2xl">
        Paste a direct video URL or upload raw footage. Our AI analyzes engagement patterns to extract the perfect 5 clips for TikTok & Reels.
      </p>

      <div className="w-full max-w-3xl glass-panel p-2 rounded-2xl shadow-2xl animate-fade-in-up transition-all duration-300 hover:shadow-purple-500/20">
        <form onSubmit={handleUrlSubmit} className="flex flex-col md:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Paste direct video link (http://.../video.mp4)..." 
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErrorMsg(null); }}
            disabled={isLoadingUrl}
            className="flex-1 bg-transparent text-white px-6 py-4 outline-none placeholder-gray-500 text-lg disabled:opacity-50 font-mono text-sm md:text-lg"
          />
          <button 
            type="submit"
            disabled={isLoadingUrl || !url}
            className="bg-white text-black font-bold text-lg px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[160px]"
          >
            {isLoadingUrl ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Fetching...</span>
                </>
            ) : (
                <>
                  <span>Analyze</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </>
            )}
          </button>
        </form>
      </div>

      {errorMsg && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl max-w-2xl text-red-200 text-sm flex items-start gap-3 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <div className="flex flex-col gap-1">
                  <span className="font-bold">Error</span>
                  <span>{errorMsg}</span>
              </div>
          </div>
      )}

      <div className="mt-4">
          <button onClick={loadDemo} className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 cursor-pointer">
              Don't have a direct link? Try a Demo Video
          </button>
      </div>

      <div className="mt-8 flex items-center gap-4 w-full max-w-3xl">
        <div className="h-[1px] bg-gray-800 flex-1"></div>
        <span className="text-gray-600 uppercase text-xs tracking-widest font-bold">Or Upload File</span>
        <div className="h-[1px] bg-gray-800 flex-1"></div>
      </div>

      <div 
        className={`mt-8 w-full max-w-3xl border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group ${
            isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-800 hover:border-gray-600 hover:bg-white/5'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
            <p className="text-lg font-medium text-gray-300">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-2">MP4, MOV, WebM (Max 50MB for demo)</p>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="video/*"
            onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default Hero;