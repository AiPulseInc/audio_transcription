import React, { useCallback, useState } from 'react';
import { UploadCloud, Link as LinkIcon, FileAudio, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { formatBytes } from '../utils/fileHelpers';
import { ProcessingState } from '../types';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  onUrlSelect: (file: File) => void; // We pass a created File object up
  processingState: ProcessingState;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, onUrlSelect, processingState }) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    // Increased limit to 100MB as per requirement
    if (file.size > 100 * 1024 * 1024) {
      alert("File is too large for this demo (Max 100MB).");
      return;
    }
    onFileSelect(file);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchError(null);
    if (!urlInput) return;

    try {
        const response = await fetch(urlInput);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        // Create a File object from Blob
        const file = new File([blob], "downloaded_media", { type: blob.type || 'audio/mp3' });
        
        if (file.size === 0) throw new Error("Empty file");
        
        onUrlSelect(file); // Treat it as a file upload
    } catch (error) {
        console.error("Fetch failed", error);
        setShowManualGuide(true);
        setFetchError("Could not fetch automatically. This is likely due to CORS restrictions (e.g. YouTube, Drive).");
    }
  };

  const isProcessing = processingState.status !== 'idle' && processingState.status !== 'error' && processingState.status !== 'completed';

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex mb-0 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-8 py-3 rounded-t-xl text-sm font-bold uppercase tracking-wider transition-all border-t border-l border-r ${
            activeTab === 'upload' 
              ? 'bg-white text-brand-navy border-slate-200 translate-y-1 z-10 shadow-sm' 
              : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`px-8 py-3 rounded-t-xl text-sm font-bold uppercase tracking-wider transition-all border-t border-l border-r ${
            activeTab === 'link' 
              ? 'bg-white text-brand-navy border-slate-200 translate-y-1 z-10 shadow-sm' 
              : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
          }`}
        >
          Use Link
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-10 shadow-xl relative z-0">
        {activeTab === 'upload' ? (
          <div
            className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ${
              dragActive
                ? 'border-brand-yellow bg-yellow-50'
                : 'border-slate-300 hover:border-brand-navy hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <div className="p-4 bg-brand-navy rounded-full mb-4 shadow-lg">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <p className="mb-2 text-xl text-brand-navy font-bold">
                Drag & Drop or Click to Upload
              </p>
              <p className="text-sm text-slate-500 font-medium">
                MP3, WAV, M4A, MP4 (Max 100MB)
              </p>
            </div>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleChange}
              disabled={isProcessing}
              accept="audio/*,video/*"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-64">
             {/* Fetch Manual Guide Modal */}
             {showManualGuide && (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 text-center rounded-lg">
                     <AlertTriangle className="w-12 h-12 text-brand-yellow mb-4" />
                     <h4 className="text-xl font-bold text-brand-navy mb-2">Auto-Fetch Failed</h4>
                     <p className="text-slate-600 mb-6 max-w-md">
                        {fetchError} <br/>
                        Please download the file to your device, then use the <strong>Upload File</strong> tab.
                     </p>
                     <Button variant="outline" onClick={() => setShowManualGuide(false)}>
                        Okay, I understand
                     </Button>
                </div>
             )}

            <div className="w-full max-w-md space-y-6">
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="url-input" className="block text-sm font-bold text-brand-navy mb-2 uppercase">
                    Direct Media URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com/audio.mp3"
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:ring-brand-yellow focus:border-brand-navy text-brand-navy placeholder-slate-400 transition-colors"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isProcessing || !urlInput} className="w-full">
                  Fetch & Load
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};