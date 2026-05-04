'use client';

import { useState } from 'react';

interface CertificatePreviewProps {
  certPreview: string | null;
  certPreviewName: string;
  namePosition: { x: number; y: number } | null;
}

export function CertificatePreview({ certPreview, certPreviewName, namePosition }: CertificatePreviewProps) {
  const [showFullPreview, setShowFullPreview] = useState(false);

  if (!certPreview) return null;

  return (
    <>
      <div className="bg-slate-800 rounded-xl p-6 mt-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-medium">Certificate Preview</h3>
          <button
            onClick={() => setShowFullPreview(!showFullPreview)}
            className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors"
          >
            {showFullPreview ? 'Minimize' : 'Expand'}
          </button>
        </div>
        <div className="flex justify-center bg-slate-900/50 rounded-lg p-6">
          <img 
            src={certPreview} 
            alt="Certificate Preview" 
            className={`rounded-lg shadow-2xl ${showFullPreview ? 'max-w-full max-h-[70vh]' : 'max-w-full max-h-[500px]'} object-contain`}
          />
        </div>
        <p className="text-slate-400 text-sm text-center mt-4">
          Name: <span className="text-white">{certPreviewName || 'John Doe'}</span> | Position: X={namePosition ? Math.round(namePosition.x) : 'center'}, Y={namePosition ? Math.round(namePosition.y) : 'center'}
        </p>
      </div>
    </>
  );
}
