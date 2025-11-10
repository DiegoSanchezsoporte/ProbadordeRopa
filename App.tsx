import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VirtualMirror } from './components/VirtualMirror';
import { Wardrobe } from './components/Wardrobe';
import { tryOnGarment } from './services/geminiService';
import type { Garment } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { VirtualStudio } from './components/VirtualStudio';

export type AppState = 'live' | 'countdown' | 'loading' | 'result';

const USER_GARMENTS_STORAGE_KEY = 'virtualWardrobeUserGarments';

const App: React.FC = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [capturedPoseBase64, setCapturedPoseBase64] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('live');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const loadGarments = async () => {
      try {
        // 1. Fetch the default garments
        const response = await fetch('/database/garments.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const initialGarments: Garment[] = await response.json();

        // 2. Get user-uploaded garments from localStorage
        const savedUserGarments = localStorage.getItem(USER_GARMENTS_STORAGE_KEY);
        const userGarments: Garment[] = savedUserGarments ? JSON.parse(savedUserGarments) : [];
        
        // 3. Combine them, with user garments appearing first
        setGarments([...userGarments, ...initialGarments]);

      } catch (error) {
        console.error("Could not load garments", error);
        setError("Failed to load virtual wardrobe.");
      }
    };
    loadGarments();
  }, []);

  useEffect(() => {
    // This effect saves only user-uploaded garments to localStorage.
    // We identify user garments because their `src` is a base64 data URL.
    const userGarments = garments.filter(g => g.src.startsWith('data:image/'));
    if (userGarments.length > 0) {
      try {
        localStorage.setItem(USER_GARMENTS_STORAGE_KEY, JSON.stringify(userGarments));
      } catch (error) {
        console.error("Could not save user garments to localStorage", error);
      }
    }
  }, [garments]);
  
  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if(countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, []);

  const performTryOn = useCallback(async (personImgB64: string, garmentSrc: string) => {
    setError(null);
    setGeneratedImage(null);
    setAppState('loading');
    
    try {
      const personImageForApi = personImgB64.split(',')[1];
      let garmentImageBase64: string;
      let garmentMimeType: string;

      if (garmentSrc.startsWith('data:')) {
          const parts = garmentSrc.split(',');
          const mimeTypePart = parts[0].match(/:(.*?);/);
          if (!mimeTypePart) {
            throw new Error("Invalid base64 string: MIME type not found.");
          }
          garmentMimeType = mimeTypePart[1];
          garmentImageBase64 = parts[1];
      } else {
          const garmentImageResponse = await fetch(garmentSrc);
          const garmentBlob = await garmentImageResponse.blob();
          garmentMimeType = garmentBlob.type;
          const base64DataUrl = await fileToBase64(garmentBlob);
          garmentImageBase64 = base64DataUrl.split(',')[1];
      }
      
      const resultImage = await tryOnGarment(personImageForApi, garmentImageBase64, garmentMimeType);
      setGeneratedImage(`data:image/png;base64,${resultImage}`);
      setAppState('result');
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please try again.");
      setAppState('live');
      setCapturedPoseBase64(null);
    }
  }, []);

  const startTryOnProcess = useCallback((garmentSrc: string) => {
    if (appState !== 'live') return;

    setAppState('countdown');
    setCountdown(3);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          
          if (!videoRef.current || !canvasRef.current) {
            setError("Camera components are not ready.");
            setAppState('live');
            return null;
          }
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (!context) {
             setError("Could not capture image from video.");
             setAppState('live');
             return null;
          }
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageDataUrl = canvas.toDataURL('image/jpeg');
          setCapturedPoseBase64(imageDataUrl);
          
          performTryOn(imageDataUrl, garmentSrc);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [appState, performTryOn]);


  const handleSelectGarment = useCallback((garment: Garment) => {
    startTryOnProcess(garment.src);
  }, [startTryOnProcess]);

  const handleUploadGarment = async (file: File) => {
     if (appState !== 'live') return;

    const category = prompt("To save this garment to your wardrobe, please enter a category (e.g., Tops, Outerwear). \n\n(Leave blank or cancel to try on without saving)");
    
    try {
      const base64Src = await fileToBase64(file);
      startTryOnProcess(base64Src);
      
      if (category && category.trim() !== '') {
          const newGarment: Garment = {
            id: Date.now(),
            name: file.name,
            src: base64Src,
            category: category.trim(),
          };
          setGarments(prev => [newGarment, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process uploaded garment.");
    }
  };

  const handleTryAnother = () => {
    setAppState('live');
    setCapturedPoseBase64(null);
    setGeneratedImage(null);
    setCountdown(null);
    setError(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };
  
  const handleDownload = () => {
    if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'virtual-try-on-look.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row font-sans">
      <main className="flex-grow md:w-[70%] p-4 md:p-8 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-center md:text-left mb-2 text-indigo-400">Virtual Try-On Studio</h1>
            <p className="text-gray-400 text-center md:text-left">Select a garment, see yourself in the mirror, and watch your new look come to life.</p>
          </div>
          <div className="flex-grow relative bg-black rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
            { (appState === 'live' || appState === 'countdown') ? (
                <VirtualMirror
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    appState={appState}
                    countdown={countdown}
                />
            ) : (
                <VirtualStudio
                    appState={appState}
                    capturedPose={capturedPoseBase64}
                    generatedImage={generatedImage}
                    onTryAnother={handleTryAnother}
                    onDownload={handleDownload}
                />
            )}
        </div>
      </main>
      <aside className="w-full md:w-[30%] bg-gray-800/50 p-4 md:p-6 border-l border-gray-700 flex flex-col">
        <Wardrobe 
          garments={garments} 
          onSelectGarment={handleSelectGarment}
          onUploadGarment={handleUploadGarment}
          appState={appState}
        />
      </aside>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse"
             onClick={() => setError(null)}
             style={{cursor: 'pointer'}}>
          {error}
        </div>
      )}
    </div>
  );
};

export default App;