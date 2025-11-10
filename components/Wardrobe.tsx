
import React, { useRef, useMemo, useState } from 'react';
import type { Garment } from '../types';
import { UploadIcon, SearchIcon } from './icons/Icons';
import type { AppState } from '../App';


interface WardrobeProps {
  garments: Garment[];
  onSelectGarment: (garment: Garment) => void;
  onUploadGarment: (file: File) => void;
  appState: AppState;
}

export const Wardrobe: React.FC<WardrobeProps> = ({ garments, onSelectGarment, onUploadGarment, appState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadGarment(file);
      event.target.value = '';
    }
  };

  const filteredGarments = useMemo(() => {
      if (!searchTerm) return garments;
      return garments.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [garments, searchTerm]);

  const groupedGarments = useMemo(() => {
    return filteredGarments.reduce((acc, garment) => {
      const category = garment.category || 'Uncategorized';
      (acc[category] = acc[category] || []).push(garment);
      return acc;
    }, {} as Record<string, Garment[]>);
  }, [filteredGarments]);

  const sortedCategories = useMemo(() => Object.keys(groupedGarments).sort(), [groupedGarments]);

  const isDisabled = appState !== 'live';

  const getHelperText = () => {
    switch(appState) {
        case 'countdown':
            return 'Match the pose in the mirror!';
        case 'loading':
            return 'Generating your new look...';
        case 'result':
            return 'Looking good! Select another item.';
        default:
            return null;
    }
  }

  const helperText = getHelperText();

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">Virtual Wardrobe</h2>
      
      <div className="relative mb-4">
        <input
            type="text"
            placeholder="Buscar por prenda o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {helperText && (
        <div className="mb-4 p-3 bg-indigo-900/50 border border-indigo-700 rounded-lg text-center text-indigo-200">
            {helperText}
        </div>
      )}

      <div className="flex-grow overflow-y-auto pr-2">
        {filteredGarments.length === 0 && !helperText && (
          <div className="text-center text-gray-400 py-10">
            <p>{searchTerm ? 'No se encontraron prendas.' : 'Your wardrobe is empty.'}</p>
            <p>{searchTerm ? 'Intenta con otra búsqueda.' : 'Upload a garment to get started!'}</p>
          </div>
        )}
        {sortedCategories.map((category) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-3 capitalize sticky top-0 bg-gray-800/80 py-1 backdrop-blur-sm">{category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4">
              {groupedGarments[category].map((garment) => (
                <button
                  key={garment.id}
                  onClick={() => onSelectGarment(garment)}
                  disabled={isDisabled}
                  className="aspect-square bg-gray-700 rounded-lg overflow-hidden transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={isDisabled ? "A try-on is already in progress" : garment.name}
                >
                  <img src={garment.src} alt={garment.name} className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg"
        />
        <button
          onClick={handleUploadClick}
          disabled={isDisabled}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
          title={isDisabled ? "A try-on is already in progress" : "Upload a new garment"}
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Upload Garment
        </button>
      </div>
    </div>
  );
};
