'use client';

import { ChangeEvent, useRef } from 'react';
import { CertificateIcon } from './icons';
import { sanitizeInput } from '../lib/constants';

interface CertificateTemplateProps {
  certTemplate: string | null;
  certPreview: string | null;
  certPreviewName: string;
  namePosition: { x: number; y: number } | null;
  selectingPosition: boolean;
  certTextColor: string;
  certFontSize: number;
  certFontFamily: string;
  fontLoaded: boolean;
  customFontName: string;
  customFontUrl: string | null;
  errors: Record<string, string>;
  onTemplateChange: (file: File) => void;
  onPreviewNameChange: (name: string) => void;
  onUpdatePreview: () => void;
  onPositionSelect: (position: { x: number; y: number }) => void;
  onSelectingPositionToggle: () => void;
  onResetPosition: () => void;
  onShowFullPreview: () => void;
  onTextColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (font: string) => void;
  onCustomFontNameChange: (name: string) => void;
  onCustomFontUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CertificateTemplate({
  certTemplate,
  certPreview,
  certPreviewName,
  namePosition,
  selectingPosition,
  certTextColor,
  certFontSize,
  certFontFamily,
  fontLoaded,
  customFontName,
  errors,
  onTemplateChange,
  onPreviewNameChange,
  onUpdatePreview,
  onPositionSelect,
  onSelectingPositionToggle,
  onResetPosition,
  onShowFullPreview,
  onTextColorChange,
  onFontSizeChange,
  onFontFamilyChange,
  onCustomFontNameChange,
  onCustomFontUpload,
}: CertificateTemplateProps) {
  const certImageRef = useRef<HTMLImageElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onTemplateChange(file);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-5 mb-4">
      <h2 className="text-white font-medium mb-4">Certificate Template</h2>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          certTemplate ? 'border-pink-500/50' : errors.certTemplate 
          ? 'border-red-500 bg-red-500/5'
          : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        {errors.certTemplate && (
          <p className="text-red-400 text-xs mb-3">{errors.certTemplate}</p>
        )}
        {certTemplate ? (
          <div>
            <img 
              src={certTemplate} 
              alt="Template" 
              className="max-h-40 mx-auto rounded-lg mb-3"
            />
            <label className="inline-block px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-md cursor-pointer hover:bg-slate-600 transition-colors mr-2">
              Change Template
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onTemplateChange(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-3">Upload certificate image (PNG, JPG)</p>
            <label className="inline-block px-4 py-2 bg-pink-600 text-white text-sm rounded-md cursor-pointer hover:bg-pink-700 transition-colors">
              Upload Template
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onTemplateChange(e.target.files[0])}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {certTemplate && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter name to preview..."
              className="flex-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              value={certPreviewName}
              onChange={(e) => onPreviewNameChange(sanitizeInput(e.target.value).slice(0, 100))}
            />
            <button
              onClick={onUpdatePreview}
              className="px-3 py-2.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors"
            >
              Update Preview
            </button>
          </div>

          {certPreview && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs">Click on image to set name position</p>
                <div className="flex gap-2">
                  <button
                    onClick={onSelectingPositionToggle}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectingPosition 
                        ? 'bg-pink-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {selectingPosition ? 'Click on image...' : 'Set Name Position'}
                  </button>
                  <button
                    onClick={onResetPosition}
                    className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600 transition-colors"
                  >
                    Reset to Center
                  </button>
                  <button
                    onClick={onShowFullPreview}
                    className="px-2 py-1 bg-pink-600 text-white text-xs rounded hover:bg-pink-700 transition-colors"
                  >
                    Expand Preview
                  </button>
                </div>
              </div>

              <div 
                className={`relative inline-block cursor-crosshair ${selectingPosition ? 'ring-2 ring-pink-500 rounded-lg' : ''}`}
                onClick={(e) => {
                  if (!selectingPosition) return;
                  const img = certImageRef.current;
                  if (!img) return;
                  
                  const rect = img.getBoundingClientRect();
                  const scaleX = img.naturalWidth / rect.width;
                  const scaleY = img.naturalHeight / rect.height;
                  
                  const x = (e.clientX - rect.left) * scaleX;
                  const y = (e.clientY - rect.top) * scaleY;
                  
                  onPositionSelect({ x, y });
                }}
              >
                <img 
                  ref={certImageRef}
                  src={certPreview} 
                  alt="Preview" 
                  className="w-full max-h-[500px] rounded-lg border border-slate-600 shadow-xl"
                />
                {namePosition && (
                  <div 
                    className="absolute w-4 h-4 bg-pink-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                    style={{ 
                      left: namePosition ? `${(namePosition.x / (certImageRef.current?.naturalWidth || 1)) * 100}%` : '50%',
                      top: namePosition ? `${(namePosition.y / (certImageRef.current?.naturalHeight || 1)) * 100}%` : '50%'
                    }}
                  />
                )}
              </div>

              {namePosition && (
                <div className="mt-2">
                  <p className="text-slate-500 text-xs mb-2">
                    Current position: X={Math.round(namePosition.x)}, Y={Math.round(namePosition.y)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-xs">X Coordinate</label>
                      <input
                        type="number"
                        value={Math.round(namePosition.x)}
                        onChange={(e) => onPositionSelect({ x: Number(e.target.value), y: namePosition.y })}
                        className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs">Y Coordinate</label>
                      <input
                        type="number"
                        value={Math.round(namePosition.y)}
                        onChange={(e) => onPositionSelect({ x: namePosition.x, y: Number(e.target.value) })}
                        className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-slate-300 text-sm font-medium mb-3">Text Styling</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={certTextColor}
                    onChange={(e) => onTextColorChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                  />
                  <span className="text-slate-400 text-xs">{certTextColor}</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Font Size: {certFontSize}px</label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={certFontSize}
                  onChange={(e) => onFontSizeChange(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Font Family</label>
                <select
                  value={fontLoaded ? 'custom' : certFontFamily}
                  onChange={(e) => {
                    if (e.target.value === 'custom') return;
                    onFontFamilyChange(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Impact">Impact</option>
                  {fontLoaded && <option value="custom">{customFontName || 'Custom Font'}</option>}
                </select>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-600">
              <label className="text-slate-400 text-xs mb-1.5 block">Custom Font (.ttf, .otf, .woff)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFontName}
                  onChange={(e) => onCustomFontNameChange(e.target.value)}
                  placeholder="Font name (e.g. SignatureFont)"
                  className="flex-1 p-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-xs placeholder-slate-400 focus:border-pink-500 focus:outline-none"
                />
                <label className="px-4 py-2 bg-pink-600 text-white text-xs rounded-lg cursor-pointer hover:bg-pink-700 transition-colors">
                  Upload Font
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={onCustomFontUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {errors.customFont && <p className="text-red-400 text-xs mt-1">{errors.customFont}</p>}
              {fontLoaded && <p className="text-emerald-400 text-xs mt-1">Custom font loaded: {customFontName}</p>}
              <p className="text-slate-500 text-xs mt-2">Note: Custom fonts will appear in certificates when sent</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
