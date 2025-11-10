
import React, { useState, useEffect } from 'react';
import type { AppState } from '../App';
import { DownloadIcon, RefreshIcon, SparklesIcon } from './icons/Icons';

interface VirtualStudioProps {
  appState: AppState;
  capturedPose: string | null;
  generatedImage: string | null;
  onTryAnother: () => void;
  onDownload: () => void;
}

export const VirtualStudio: React.FC<VirtualStudioProps> = ({ 
    appState,
    capturedPose,
    generatedImage, 
    onTryAnother,
    onDownload
}) => {
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        if (appState === 'loading' && capturedPose) {
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 200);
        }
    }, [appState, capturedPose]);

    return (
        <>
            <h2 className="absolute top-3 left-4 text-lg font-semibold text-white/90 z-10 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">Virtual Studio</h2>
            
            {appState === 'loading' && capturedPose && (
                 <img 
                    src={capturedPose} 
                    alt="Captured Pose for processing" 
                    className="absolute inset-0 w-full h-full object-contain"
                 />
            )}
            
            {appState === 'result' && generatedImage && (
                <img 
                    src={generatedImage} 
                    alt="Try-On Result" 
                    className="absolute inset-0 w-full h-full object-contain animate-kenburns"
                />
            )}

            {showFlash && <div className="absolute inset-0 bg-white z-30 opacity-80 animate-ping"></div>}
            
            {appState === 'loading' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                    <SparklesIcon className="w-16 h-16 text-indigo-400 animate-pulse" />
                    <p className="mt-4 text-lg font-semibold">Creating your look...</p>
                </div>
            )}

            {appState === 'result' && (
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                     <button 
                        onClick={onTryAnother} 
                        className="flex items-center justify-center font-semibold px-6 py-3 bg-gray-500/80 hover:bg-gray-500 text-white rounded-full shadow-lg transition-transform transform hover:scale-105 backdrop-blur-sm"
                     >
                        <RefreshIcon className="w-6 h-6 mr-2" />
                        Try Another
                     </button>
                     <button onClick={onDownload} className="flex items-center justify-center font-semibold px-6 py-3 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform transform hover:scale-105 backdrop-blur-sm" title="Download Look">
                        <DownloadIcon className="w-6 h-6 mr-2"/>
                        Download
                    </button>
                 </div>
            )}
        </>
    );
};
