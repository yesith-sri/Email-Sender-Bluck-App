'use client';

import { ChangeEvent } from 'react';
import { PaperclipIcon, FileIcon, XIcon } from './icons';
import { MAX_SUBJECT_LENGTH, MAX_MESSAGE_LENGTH, MAX_ATTACHMENT_SIZE, MAX_TOTAL_ATTACHMENTS, formatFileSize } from '../lib/constants';

interface Attachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

interface EmailContentProps {
  emailType: 'invitation' | 'certificate';
  subject: string;
  customMessage: string;
  attachments: Attachment[];
  errors: Record<string, string>;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onAttachmentUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
}

export function EmailContent({
  emailType,
  subject,
  customMessage,
  attachments,
  errors,
  onSubjectChange,
  onMessageChange,
  onAttachmentUpload,
  onRemoveAttachment,
}: EmailContentProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-4">
      <h2 className="text-white font-medium mb-4">Email Content</h2>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Subject <span className="text-red-400">*</span>
            <span className="text-slate-600 float-right">{subject.length}/{MAX_SUBJECT_LENGTH}</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={emailType === 'invitation' ? 'You are invited!' : 'Congratulations on your certificate!'}
            className={`w-full p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none ${
              errors.subject 
                ? 'bg-slate-700 border-2 border-red-500' 
                : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
            }`}
          />
          {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            Message
            <span className="text-slate-600 float-right">{customMessage.length}/{MAX_MESSAGE_LENGTH}</span>
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={emailType === 'invitation' ? 'Enter your message...' : 'Enter your certificate message...'}
            className={`w-full h-20 p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none resize-none ${
              errors.message 
                ? 'bg-slate-700 border-2 border-red-500' 
                : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
            }`}
          />
          {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
        </div>

        {emailType === 'invitation' && (
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Attachments
              <span className="text-slate-600 ml-2">(max {MAX_TOTAL_ATTACHMENTS} files, {MAX_ATTACHMENT_SIZE / 1024 / 1024}MB each)</span>
            </label>
            <label className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
              errors.attachments 
                ? 'bg-slate-700 border-2 border-red-500' 
                : 'bg-slate-700 border border-slate-600 hover:border-slate-500'
            }`}>
              <PaperclipIcon />
              <span className="text-slate-400 text-sm">
                {attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached` : 'Add files'}
              </span>
              <input
                type="file"
                multiple
                onChange={onAttachmentUpload}
                className="hidden"
              />
            </label>
            {errors.attachments && <p className="text-red-400 text-xs mt-1">{errors.attachments}</p>}
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-md text-sm">
                    <span className="text-slate-300 truncate max-w-[120px]">{file.name}</span>
                    <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                    <button onClick={() => onRemoveAttachment(index)} className="text-slate-500 hover:text-red-400 ml-1">
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
