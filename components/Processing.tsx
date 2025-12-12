import React from 'react';

const Processing: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f13]">
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white animate-pulse"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12"/><path d="M21 3v9h-9"/></svg>
            </div>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">Analyzing Footage</h2>
        <div className="flex flex-col items-center gap-1 text-gray-500 text-sm font-mono">
            <p className="animate-pulse">Detecting peaks...</p>
            <p className="animate-pulse delay-100">Transcribing audio...</p>
            <p className="animate-pulse delay-200">Measuring virality...</p>
        </div>
    </div>
  );
};

export default Processing;