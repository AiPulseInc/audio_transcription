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

    let targetUrl = urlInput;
    let isDriveLink = false;

    // Smart Link Conversion: Google Drive
    // Matches /d/ID, id=ID, or open?id=ID
    const driveRegex = /(?:\/d\/|id=|open\?id=)([-\w]{25,})/;
    const driveMatch = urlInput.match(driveRegex);
    
    if (urlInput.includes('drive.google.com') && driveMatch && driveMatch[1]) {
      targetUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      isDriveLink = true;
      console.log("Converted Google Drive link to:", targetUrl);
    }

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
        
        // Check if we got HTML instead of a file (common with Drive view links or error pages)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            if (isDriveLink) {
                 throw new Error("Google Drive returned a web page instead of the audio file. This often happens if the file is restricted or too large (virus scan warning).");
            } else {
                 throw new Error("The URL returned a web page instead of a media file.");
            }
        }

        const blob = await response.blob();
        
        // Try to get filename from Content-Disposition header if available
        let filename = "downloaded_media";
        const disposition = response.headers.get('Content-Disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
             const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
             const matches = filenameRegex.exec(disposition);
             if (matches != null && matches[1]) { 
               filename = matches[1].replace(/['"]/g, '');
             }
        } else if (isDriveLink) {
            filename = "google_drive_file";
        }
        
        // Determine type, default to audio/mp3 if generic
        const type = blob.type || 'audio/mp3';

        // Create a File object from Blob
        const file = new File([blob], filename, { type });
        
        if (file.size === 0) throw new Error("Empty file received");
        
        onUrlSelect(file); 
    } catch (error: any) {
        console.error("Fetch failed", error);
        setShowManualGuide(true);
        
        let errorMsg = error.message || "Could not fetch automatically.";
        
        if (errorMsg.includes('Network response') || errorMsg.includes('Failed to fetch')) {
             if (urlInput.includes('drive.google.com')) {
                errorMsg = "Google Drive blocked the direct download (CORS). This is a browser security restriction. Please download the file to your computer, then use the 'Upload File' tab.";
            } else if (urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) {
                errorMsg = "YouTube does not allow direct raw video downloading via browser fetch. Please use a local file.";
            } else {
                errorMsg = "Could not download the file due to browser security restrictions (CORS). Please download it manually and upload it here.";
            }
        }

        setFetchError(errorMsg);
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
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 text-center rounded-lg animate-in fade-in duration-200">
                     <AlertTriangle className="w-12 h-12 text-brand-yellow mb-4" />
                     <h4 className="text-xl font-bold text-brand-navy mb-2">Connection Issue</h4>
                     <p className="text-slate-600 mb-6 max-w-md text-sm">
                        {fetchError}
                     </p>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => setShowManualGuide(false)}>
                          Try Another Link
                       </Button>
                       <Button variant="primary" size="sm" onClick={() => {setShowManualGuide(false); setActiveTab('upload');}}>
                          Switch to Upload
                       </Button>
                     </div>
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
                      placeholder="https://drive.google.com/file/d/..."
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