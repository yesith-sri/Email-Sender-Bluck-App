'use client';

import { CheckIcon, XIcon } from './icons';

interface Result {
  email: string;
  success: boolean;
  error?: string;
}

interface ResultsPanelProps {
  results: Result[];
  showResults: boolean;
  onClose: () => void;
}

export function ResultsPanel({ results, showResults, onClose }: ResultsPanelProps) {
  if (!showResults || results.length === 0) return null;

  const successfulEmails = results.filter(r => r.success);
  const failedEmails = results.filter(r => !r.success);

  return (
    <div className="bg-slate-800 rounded-xl p-6 mt-4 animate-fade-in">
      <h2 className="text-white font-medium mb-4 flex items-center gap-2">
        Results
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 hover:bg-emerald-500/20 transition-all duration-300">
          <p className="text-3xl font-bold text-emerald-400">{successfulEmails.length}</p>
          <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
            <CheckIcon /> Sent
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 hover:bg-red-500/20 transition-all duration-300">
          <p className="text-3xl font-bold text-red-400">{failedEmails.length}</p>
          <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
            <XIcon /> Failed
          </p>
        </div>
      </div>

      {failedEmails.length > 0 && (
        <div className="mt-4 animate-slide-up">
          <h3 className="text-red-400 text-sm font-medium mb-2 flex items-center gap-1">
            <XIcon /> Failed Emails:
          </h3>
          <div className="max-h-40 overflow-y-auto bg-slate-700/50 rounded-lg p-3">
            <ul className="space-y-1 text-sm text-slate-400">
              {failedEmails.map((r, i) => (
                <li key={i} className="flex items-center gap-2 hover:text-white transition-colors">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {r.email}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
