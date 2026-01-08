import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { ResultCard } from './components/ResultCard';
import { Button } from './components/Button';
import { transcribeMedia } from './services/geminiService';
import { fileToBase64, formatBytes, downloadText } from './utils/fileHelpers';
import { TranscriptResult, ProcessingState, UploadedFile } from './types';
import { Mic, FileAudio, Sparkles, AlertTriangle, RefreshCw, Layers, AlertCircle, Quote } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });

  const handleFileSelect = async (selectedFile: File) => {
    setProcessingState({ status: 'uploading' });
    try {
      const base64 = await fileToBase64(selectedFile);
      setFile({
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64
      });
      setProcessingState({ status: 'idle' });
    } catch (error) {
      console.error(error);
      setProcessingState({ status: 'error', message: 'Failed to read file.' });
    }
  };

  const startTranscription = async () => {
    if (!file) return;

    setProcessingState({ status: 'transcribing' });
    
    try {
      const resultData = await transcribeMedia(file.data, file.type);
      setResult(resultData);
      setProcessingState({ status: 'completed' });
    } catch (error: any) {
      console.error(error);
      let msg = "An error occurred during transcription.";
      if (error.message?.includes('API Key')) msg = "API Key missing.";
      if (error.message?.includes('400')) msg = "Bad Request. File format might not be supported.";
      setProcessingState({ status: 'error', message: msg });
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProcessingState({ status: 'idle' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy flex flex-col">
      {/* 321 GROW Header - Redesigned */}
      <header className="bg-brand-navy text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a 
            href="https://321grow.pl" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center group"
          >
            {/* Logo Text - White, Clean */}
            <div className="font-bold text-2xl tracking-tight flex items-baseline">
              <span>3</span>
              <span className="text-lg">2</span>
              <span>1</span>
              <span className="ml-2 font-black tracking-wider">GROW</span>
            </div>
          </a>
          
          <div>
            <a 
              href="https://321techlab.pl" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white font-bold tracking-widest uppercase hover:text-brand-yellow transition-colors text-lg"
            >
              321 TECH LAB
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Intro / Empty State */}
        {!file && (
          <div className="text-center py-10">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-navy mb-6 tracking-tight">
              Transcription <span className="text-brand-yellow bg-brand-navy px-2">Reimagined</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-16 font-medium">
              Professional AI transcription, polishing, and summarization. 
              Secure, fast, and accurate.
            </p>
            
            <UploadArea 
              onFileSelect={handleFileSelect} 
              onUrlSelect={handleFileSelect} // URL select now returns a File object
              processingState={processingState} 
            />

             {/* Features Grid - Softened Borders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto text-left">
              <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-yellow transition-colors">
                  <Sparkles className="w-6 h-6 text-brand-navy" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Smart Polish</h3>
                <p className="text-slate-500 leading-relaxed">AI removes filler words and fixes grammar while preserving the speaker's original voice and intent.</p>
              </div>
              <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-yellow transition-colors">
                  <Layers className="w-6 h-6 text-brand-navy" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Executive Summary</h3>
                <p className="text-slate-500 leading-relaxed">Instantly generate concise executive summaries and extract key action items from your meetings.</p>
              </div>
              <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-yellow transition-colors">
                  <Quote className="w-6 h-6 text-brand-navy" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Speaker ID</h3>
                <p className="text-slate-500 leading-relaxed">Automatic speaker diarization with precise timestamps to help you navigate long recordings.</p>
              </div>
            </div>
          </div>
        )}

        {/* File Loaded State - Softened Borders */}
        {file && !result && (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-2xl relative overflow-hidden">
               {/* Progress Bar Strip - Reduced Height */}
               {processingState.status === 'transcribing' && (
                <div className="absolute top-0 left-0 h-1.5 tricolor-strip animate-pulse w-full"></div>
              )}
              
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-lg">
                    <FileAudio className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-navy truncate max-w-[250px]">{file.name}</h3>
                    <p className="text-sm font-semibold text-slate-400 mt-1">{file.type.split('/')[1].toUpperCase()} • {formatBytes(file.size)}</p>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  disabled={processingState.status === 'transcribing'}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              {processingState.status === 'error' && (
                <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{processingState.message}</p>
                </div>
              )}

              {processingState.status === 'transcribing' ? (
                <div className="space-y-6 text-center py-10">
                  <div className="inline-block relative">
                    <div className="w-20 h-20 border-8 border-slate-100 border-t-brand-yellow rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-brand-navy mb-2">Analyzing Audio...</h3>
                    <p className="text-slate-500 font-medium">Identifying speakers and polishing text.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <Button 
                    onClick={startTranscription} 
                    className="w-full text-lg shadow-xl"
                  >
                    START TRANSCRIPTION
                  </Button>
                  <p className="text-center text-xs text-slate-400 mt-4 font-medium uppercase tracking-wide">
                    Powered by Google Gemini 2.5 Flash
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             {/* Toolbar */}
             <div className="sticky top-24 z-40 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h2 className="text-lg font-bold text-brand-navy">Ready for Export</h2>
                </div>
                <Button variant="outline" onClick={reset} className="!py-2 !px-4 !text-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Project
                </Button>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Summary (Span 4) */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                  <ResultCard 
                    title="Executive Summary" 
                    content={result.summary} 
                    type="text" 
                  />
                  <ResultCard 
                    title="Key Takeaways" 
                    content={JSON.stringify(result.key_points)} 
                    type="list" 
                  />
                </div>

                {/* Right Column: Transcripts (Span 8) */}
                <div className="xl:col-span-8 min-h-[600px]">
                   <TabbedResultView result={result} />
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer - Redesigned: Reduced height, new text */}
      <footer className="bg-brand-navy relative pt-6 pb-6">
         <div className="absolute top-0 left-0 w-full h-1.5 tricolor-strip"></div>
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
            <p className="text-slate-400 text-sm font-medium">@2026 Tech Lab v.96</p>
         </div>
      </footer>
    </div>
  );
};

// Tabbed View Component for the Results - Softened Borders
const TabbedResultView: React.FC<{result: TranscriptResult}> = ({result}) => {
  const [activeTab, setActiveTab] = useState<'polished' | 'raw'>('polished');

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
       {/* Tab Headers */}
       <div className="flex border-b border-slate-100">
          <button
             onClick={() => setActiveTab('polished')}
             className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${
               activeTab === 'polished' 
                 ? 'bg-brand-navy text-white' 
                 : 'bg-white text-slate-400 hover:text-brand-navy hover:bg-slate-50'
             }`}
          >
             Polished Version
          </button>
          <div className="w-[1px] bg-slate-200"></div>
          <button
             onClick={() => setActiveTab('raw')}
             className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${
               activeTab === 'raw' 
                 ? 'bg-brand-navy text-white' 
                 : 'bg-white text-slate-400 hover:text-brand-navy hover:bg-slate-50'
             }`}
          >
             Raw Transcript
          </button>
       </div>

       {/* Tab Content Area */}
       <div className="flex-1 p-0 relative">
          <EmbeddedContent 
            content={activeTab === 'polished' ? result.polished_version : result.raw_transcript} 
          />
       </div>
       <div className="h-1.5 w-full tricolor-strip"></div>
    </div>
  );
};

const EmbeddedContent: React.FC<{content: string}> = ({content}) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    const handleDownload = () => {
      downloadText('transcript.txt', content);
    };

    return (
      <div className="flex flex-col h-full max-h-[700px]">
         <div className="flex justify-end p-4 space-x-2 bg-slate-50 border-b border-slate-100">
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy" className="!p-2 text-slate-400 hover:text-brand-navy">
               {copied ? <span className="text-green-500 text-xs font-bold mr-2">COPIED!</span> : null}
               <Layers className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} title="Download" className="!p-2 text-slate-400 hover:text-brand-navy">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </Button>
         </div>
         <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-brand-navy scrollbar-track-slate-100">
             <div className="prose prose-slate max-w-none text-brand-navy leading-loose whitespace-pre-wrap font-medium">
                {content}
             </div>
         </div>
      </div>
    )
}

export default App;