
import React, { useEffect, useState } from 'react';
import type { AppState } from '../App';

interface VirtualMirrorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  appState: AppState;
  countdown: number | null;
}

export const VirtualMirror: React.FC<VirtualMirrorProps> = ({ 
    videoRef, 
    canvasRef, 
    appState,
    countdown,
}) => {
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        const enableCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
            }
        };

        enableCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [videoRef]);

    return (
        <>
             <h2 className="absolute top-3 left-4 text-lg font-semibold text-white/90 z-10 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">Magic Mirror</h2>
            {cameraError ? (
                <div className="text-center text-red-400 p-4">
                    <p>{cameraError}</p>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </>
            )}

            {appState === 'countdown' && countdown !== null && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                    {/* Pose Guide Outline */}
                    <div className="absolute w-2/5 h-4/5 border-4 border-dashed border-white/40 rounded-t-full opacity-70 animate-pulse"></div>
                    <p style={{'--tw-text-opacity': 1, animationIterationCount: 'infinite'} as React.CSSProperties} className="text-9xl font-bold text-white drop-shadow-lg animate-ping">{countdown}</p>
                </div>
            )}
            
            {appState === 'live' && !cameraError && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <p className="text-white font-semibold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">Select an item to begin</p>
                 </div>
            )}
        </>
    );
};
