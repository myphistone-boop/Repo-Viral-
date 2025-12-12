import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import VideoResult from './VideoResult';

interface DashboardProps {
  result: AnalysisResult;
  videoFile: File;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ result, videoFile, onReset }) => {
  const [activeClipId, setActiveClipId] = useState<string>(result.clips[0]?.id || '');

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
            <h2 className="text-4xl font-bold text-white mb-2">Viral Analysis Complete</h2>
            <p className="text-gray-400">Found {result.clips.length} moments with high engagement potential.</p>
        </div>
        <button 
            onClick={onReset}
            className="mt-4 md:mt-0 px-6 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-sm transition-colors"
        >
            Upload New Video
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Preview Area */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4 font-bold">Preview</h3>
            {result.clips.map(clip => (
                <div key={`preview-${clip.id}`} className={activeClipId === clip.id ? 'block' : 'hidden'}>
                     <VideoResult 
                        videoFile={videoFile}
                        clip={clip}
                        isActive={activeClipId === clip.id}
                     />
                </div>
            ))}
            
            <div className="mt-6 p-4 glass-panel rounded-xl">
                 <h4 className="text-white font-bold mb-2">Why this clip?</h4>
                 <p className="text-gray-400 text-sm leading-relaxed">
                    {result.clips.find(c => c.id === activeClipId)?.reason}
                 </p>
            </div>
        </div>

        {/* Clip List */}
        <div className="lg:col-span-2">
             <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4 font-bold">Generated Clips</h3>
             <div className="space-y-4">
                {result.clips.map((clip, index) => (
                    <div 
                        key={clip.id}
                        onClick={() => setActiveClipId(clip.id)}
                        className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center ${
                            activeClipId === clip.id 
                            ? 'bg-white/5 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
                            : 'bg-black/20 border-gray-800 hover:border-gray-600'
                        }`}
                    >
                        {/* Number Badge */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center font-mono text-xl text-gray-400">
                            {index + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white">{clip.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    clip.viralityScore > 85 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    Score: {clip.viralityScore}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 font-mono mb-3">
                                <span className="flex items-center gap-1">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    {clip.startTime} - {clip.endTime}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2 italic">"{clip.subtitles}"</p>
                        </div>

                        {/* Action */}
                        <div className="hidden md:block">
                            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                activeClipId === clip.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;