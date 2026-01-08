import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from './Button';
import { downloadText } from '../utils/fileHelpers';

interface ResultCardProps {
  title: string;
  content: string;
  type: 'text' | 'list';
  actionHeader?: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, content, type, actionHeader }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadText(`${title.toLowerCase().replace(/\s+/g, '_')}.txt`, content);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow relative group">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-brand-navy border-b border-brand-navy">
        <h3 className="font-bold text-white text-lg tracking-wide">{title.toUpperCase()}</h3>
        <div className="flex space-x-2">
           {actionHeader}
           <button onClick={handleCopy} className="text-slate-300 hover:text-brand-yellow transition-colors" title="Copy">
             {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
           </button>
           <button onClick={handleDownload} className="text-slate-300 hover:text-brand-yellow transition-colors" title="Download">
             <Download className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-brand-navy scrollbar-track-slate-100">
        {type === 'list' ? (
          <ul className="list-none space-y-3">
             {JSON.parse(content).map((item: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-yellow mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-brand-navy font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="prose prose-slate max-w-none text-brand-navy leading-relaxed whitespace-pre-wrap font-medium">
            {content}
          </div>
        )}
      </div>

      {/* Tricolor Strip - Reduced height to h-1 */}
      <div className="h-1 w-full tricolor-strip"></div>
    </div>
  );
};