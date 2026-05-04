'use client';

import { ChangeEvent } from 'react';
import { TabSelector } from './TabSelector';
import { UploadIcon } from './icons';
import { MAX_FILE_SIZE, MAX_RECIPIENTS, validateEmail, sanitizeInput } from '../lib/constants';

interface RecipientData {
  email: string;
  name: string;
}

interface RecipientInputProps {
  sendMode: 'bulk' | 'individual';
  emailType: 'invitation' | 'certificate';
  activeTab: 'upload' | 'paste';
  emails: string[];
  recipients: RecipientData[];
  individualEmail: string;
  individualName: string;
  errors: Record<string, string>;
  onTabChange: (tab: 'upload' | 'paste') => void;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onCSVUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onIndividualEmailChange: (email: string) => void;
  onIndividualNameChange: (name: string) => void;
}

export function RecipientInput({
  sendMode,
  emailType,
  activeTab,
  emails,
  recipients,
  individualEmail,
  individualName,
  errors,
  onTabChange,
  onFileUpload,
  onCSVUpload,
  onPaste,
  onIndividualEmailChange,
  onIndividualNameChange,
}: RecipientInputProps) {
  if (sendMode === 'individual') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Recipient Email</label>
          <input
            type="email"
            value={individualEmail}
            onChange={(e) => onIndividualEmailChange(e.target.value)}
            placeholder="test@example.com"
            className={`w-full p-2.5 bg-slate-700 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.individualEmail ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
            }`}
          />
          {errors.individualEmail && <p className="text-red-400 text-xs mt-1">{errors.individualEmail}</p>}
        </div>
        {emailType === 'certificate' && (
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Recipient Name</label>
            <input
              type="text"
              value={individualName}
              onChange={(e) => onIndividualNameChange(e.target.value)}
              placeholder="John Doe"
              className={`w-full p-2.5 bg-slate-700 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.individualName ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
              }`}
            />
            {errors.individualName && <p className="text-red-400 text-xs mt-1">{errors.individualName}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 animate-fade-in">
      <TabSelector activeTab={activeTab} onChange={onTabChange} />
      {activeTab === 'upload' ? (
        <label className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:bg-slate-700/30 ${
          errors.fileUpload ? 'border-red-500 bg-red-500/5' : 'border-slate-600 hover:border-blue-500'
        }`}>
          <UploadIcon />
          <p className={`text-sm mt-2 ${errors.fileUpload ? 'text-red-400' : 'text-slate-400'}`}>
            {emailType === 'certificate' ? 'Upload CSV (email, name)' : 'Upload email list'}
          </p>
          {errors.fileUpload ? (
            <p className="text-red-400 text-xs mt-2">{errors.fileUpload}</p>
          ) : (
            <>
              <p className="text-slate-500 text-xs mt-1">
                Supported: <span className="text-blue-400 font-medium">.csv</span> or .txt (max {MAX_FILE_SIZE / 1024 / 1024}MB)
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Format: email addresses (e.g., user@example.com)
              </p>
            </>
          )}
          <input
            type="file"
            accept=".csv,.txt"
            onChange={emailType === 'certificate' ? onCSVUpload : onFileUpload}
            className="hidden"
          />
        </label>
      ) : (
        <div className="animate-fade-in">
          <textarea
            onChange={onPaste}
            placeholder={emailType === 'certificate' 
              ? 'email@example.com,John Doe\nemail@example.com,Jane Doe\n...' 
              : 'email@example.com\njohn@example.com\njane@example.com\n...'}
            className={`w-full h-32 p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
              errors.recipients 
                ? 'bg-slate-700 border-2 border-red-500' 
                : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
            }`}
          />
          {errors.recipients && <p className="text-red-400 text-xs mt-1">{errors.recipients}</p>}
          {!errors.recipients && (
            <p className="text-slate-500 text-xs mt-2">
              {emailType === 'certificate' 
                ? 'Tip: One email per line in format: email,name' 
                : 'Tip: One email address per line'}
            </p>
          )}
        </div>
      )}

      {(recipients.length > 0 || emails.length > 0) && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm font-medium">
              {emailType === 'certificate' ? recipients.length : emails.length} recipients
            </span>
          </div>
          {emailType === 'certificate' && recipients.length > 0 && (
            <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
              {recipients.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300">{r.name || 'No name'}</span>
                  <span className="text-slate-500">{r.email}</span>
                </div>
              ))}
              {recipients.length > 5 && (
                <p className="text-slate-500 text-xs">+{recipients.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
