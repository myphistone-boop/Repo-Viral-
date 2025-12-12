import React, { useState } from 'react';
import Hero from './components/Hero';
import Processing from './components/Processing';
import Dashboard from './components/Dashboard';
import { AppState, AnalysisResult } from './types';
import { analyzeVideoForViralClips } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (file: File) => {
    setVideoFile(file);
    setState('ANALYZING');
    
    try {
      const result = await analyzeVideoForViralClips(file);
      setAnalysisResult(result);
      setState('RESULTS');
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the AI analysis. Please try a shorter video or check your API key.");
      setState('IDLE');
      setVideoFile(null);
    }
  };

  const handleReset = () => {
    setState('IDLE');
    setVideoFile(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f0f13] text-white selection:bg-purple-500/30">
      
      {/* Header */}
      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M14 8V6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-2"/><path d="M20 12h2"/><path d="m22 7-2-1"/><path d="m22 17-2 1"/></svg>
            </div>
            <span className="font-bold text-xl tracking-tight">ViralCut<span className="text-purple-400">.ai</span></span>
        </div>
        <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</a>
      </nav>

      {/* Main Content */}
      <main className="relative">
        {state === 'IDLE' && <Hero onAnalyze={handleAnalyze} />}
        {state === 'ANALYZING' && <Processing />}
        {state === 'RESULTS' && analysisResult && videoFile && (
            <Dashboard 
                result={analysisResult} 
                videoFile={videoFile}
                onReset={handleReset}
            />
        )}
      </main>
      
    </div>
  );
};

export default App;