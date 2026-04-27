'use client';

import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

type EmailType = 'invitation' | 'certificate';
type Result = {
  email: string;
  success: boolean;
  error?: string;
};

interface Recipient {
  email: string;
  name: string;
}

interface Attachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CertificateIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DemoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const PaperclipIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENTS = 10;
const MAX_RECIPIENTS = 1000;
const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
];

function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>'"&]/g, '')
    .slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export default function BulkEmailSender() {
  const [emailType, setEmailType] = useState<EmailType>('invitation');
  const [emails, setEmails] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [certTemplate, setCertTemplate] = useState<string | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [certPreviewName, setCertPreviewName] = useState<string>('John Doe');
  const [namePosition, setNamePosition] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectingPosition, setSelectingPosition] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [certTextColor, setCertTextColor] = useState('#1a365d');
  const [certFontSize, setCertFontSize] = useState(60);
  const [certFontFamily, setCertFontFamily] = useState('Times New Roman');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const certImageRef = useRef<HTMLImageElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [sendMode, setSendMode] = useState<'bulk' | 'individual'>('bulk');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualName, setIndividualName] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEmails([]);
    setRecipients([]);
    setAttachments([]);
    setSubject('');
    setCustomMessage('');
    setCertTemplate(null);
    setCertPreview(null);
    setCertPreviewName('John Doe');
    setNamePosition(null);
    setIndividualEmail('');
    setIndividualName('');
    setShowResults(false);
  }, [sendMode, emailType]);

  const setError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('fileUpload', `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }
    clearError('fileUpload');

    if (emailType === 'certificate') {
      if (!file.type.startsWith('image/')) {
        setError('certTemplate', 'Only image files allowed for certificate template');
        return;
      }
      clearError('certTemplate');
      const reader = new FileReader();
      reader.onload = (event) => {
        setCertTemplate(event.target?.result as string);
        setCertPreview(event.target?.result as string);
        setNamePosition(null);
        setCertPreviewName('John Doe');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        const validEmails = lines
          .map(line => line.trim())
          .filter(line => validateEmail(line));
        
        if (validEmails.length === 0) {
          setError('fileUpload', 'No valid emails found in file');
          setEmails([]);
          return;
        }
        if (validEmails.length > MAX_RECIPIENTS) {
          setError('fileUpload', `Too many emails. Max ${MAX_RECIPIENTS} allowed`);
          setEmails(validEmails.slice(0, MAX_RECIPIENTS));
          return;
        }
        clearError('fileUpload');
        setEmails(validEmails);
      };
      reader.readAsText(file);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length + files.length > MAX_TOTAL_ATTACHMENTS) {
      setError('attachments', `Max ${MAX_TOTAL_ATTACHMENTS} files allowed`);
      return;
    }

    const newAttachments: Attachment[] = [];
    let hasError = false;

    Array.from(files).forEach((file) => {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        setError('attachments', `File type not allowed: ${file.name}`);
        hasError = true;
        return;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setError('attachments', `File too large: ${file.name} (max ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB)`);
        hasError = true;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        newAttachments.push({
          name: sanitizeFilename(file.name),
          type: file.type,
          data: base64,
          size: file.size,
        });
        if (newAttachments.length === Array.from(files).filter(f => 
          ALLOWED_ATTACHMENT_TYPES.includes(f.type) && f.size <= MAX_ATTACHMENT_SIZE
        ).length) {
          setAttachments(prev => [...prev, ...newAttachments]);
          clearError('attachments');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (attachments.length === 1) clearError('attachments');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('fileUpload', `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      
      const parsed: Recipient[] = [];
      const emailList: string[] = [];

      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && validateEmail(parts[0])) {
          parsed.push({ email: parts[0].toLowerCase(), name: sanitizeInput(parts[1]) });
          emailList.push(parts[0].toLowerCase());
        } else if (validateEmail(line.trim())) {
          parsed.push({ email: line.trim().toLowerCase(), name: '' });
          emailList.push(line.trim().toLowerCase());
        }
      });

      if (parsed.length === 0) {
        setError('fileUpload', 'No valid emails found. Format: email,name');
        setRecipients([]);
        setEmails([]);
        return;
      }
      if (parsed.length > MAX_RECIPIENTS) {
        setError('fileUpload', `Too many recipients. Max ${MAX_RECIPIENTS} allowed`);
        setRecipients(parsed.slice(0, MAX_RECIPIENTS));
        setEmails(emailList.slice(0, MAX_RECIPIENTS));
        return;
      }
      clearError('fileUpload');
      setRecipients(parsed);
      setEmails(emailList);
    };
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const content = e.target.value;
      if (!content) return;
      
      const lines = content.split(/[\n]/).filter(line => line.trim());
      
      const parsed: Recipient[] = [];
      const emailList: string[] = [];

      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && validateEmail(parts[0])) {
          parsed.push({ email: parts[0].toLowerCase(), name: sanitizeInput(parts[1]) });
          emailList.push(parts[0].toLowerCase());
        } else if (validateEmail(line.trim())) {
          parsed.push({ email: line.trim().toLowerCase(), name: '' });
          emailList.push(line.trim().toLowerCase());
        }
      });

      if (parsed.length === 0) {
        setError('recipients', 'No valid emails found');
        setRecipients([]);
        setEmails([]);
        return;
      }
      if (parsed.length > MAX_RECIPIENTS) {
        setError('recipients', `Too many recipients. Max ${MAX_RECIPIENTS} allowed`);
        setRecipients(parsed.slice(0, MAX_RECIPIENTS));
        setEmails(emailList.slice(0, MAX_RECIPIENTS));
        return;
      }
      clearError('recipients');
      setRecipients(parsed);
      setEmails(emailList);
    } catch (err) {
      console.error('Paste error:', err);
    }
  };

  const handleSubjectChange = (value: string) => {
    const sanitized = value.replace(/[<>'"&]/g, '').slice(0, MAX_SUBJECT_LENGTH);
    setSubject(sanitized);
    if (sanitized.length >= MAX_SUBJECT_LENGTH) {
      setError('subject', `Max ${MAX_SUBJECT_LENGTH} characters allowed`);
    } else {
      clearError('subject');
    }
  };

  const handleMessageChange = (value: string) => {
    const sanitized = value.replace(/<script|javascript:|on\w+=/gi, '').slice(0, MAX_MESSAGE_LENGTH);
    setCustomMessage(sanitized);
    if (sanitized.length >= MAX_MESSAGE_LENGTH) {
      setError('message', `Max ${MAX_MESSAGE_LENGTH} characters allowed`);
    } else {
      clearError('message');
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (type === 'cert') {
      if (!file.type.startsWith('image/')) {
        setError('certTemplate', 'Only image files allowed');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('certTemplate', `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }
      clearError('certTemplate');
      const reader = new FileReader();
      reader.onload = (event) => {
        setCertTemplate(event.target?.result as string);
        setCertPreview(event.target?.result as string);
        setNamePosition(null);
        setCertPreviewName('John Doe');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCertificateWithName = (name: string, position?: {x: number, y: number}): Promise<string> => {
    return new Promise((resolve) => {
      if (!certTemplate) {
        resolve('');
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        resolve('');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const posX = position ? position.x : (namePosition ? namePosition.x : canvas.width / 2);
        const posY = position ? position.y : (namePosition ? namePosition.y : canvas.height / 2);

        ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
        ctx.fillStyle = certTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, posX, posY);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.src = certTemplate;
    });
  };

  const generateHtml = (): string => {
    const escapedMessage = customMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    
    if (emailType === 'invitation') {
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 15px; text-align: center;">
            <h2 style="color: #667eea; margin-bottom: 20px; font-size: 28px;">You are Invited!</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">Dear Participant,</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">${escapedMessage || 'We are pleased to invite you to our upcoming event. Your presence would be an honor.'}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
              <p style="color: #667eea; font-weight: 600;">Best regards,<br/>Event Team</p>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px;">
          <div style="background: white; padding: 40px; border-radius: 15px; text-align: center;">
            <h2 style="color: #f5576c; margin-bottom: 20px; font-size: 28px;">Congratulations!</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">Dear Student,</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.8;">${escapedMessage || 'We are proud to award you this certificate of completion. Your dedication and hard work have paid off!'}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
              <p style="color: #f5576c; font-weight: 600;">Congratulations once again!<br/>Certificate Team</p>
            </div>
          </div>
        </div>
      `;
    }
  };

  const sendEmails = async () => {
    const newErrors: Record<string, string> = {};

    if (sendMode === 'bulk') {
      if (emails.length === 0) {
        newErrors.recipients = 'Please add at least one valid recipient';
      }
    } else {
      if (!individualEmail.trim()) {
        newErrors.individualEmail = 'Email is required';
      } else if (!validateEmail(individualEmail)) {
        newErrors.individualEmail = 'Please enter a valid email';
      }
      
      if (emailType === 'certificate' && !individualName.trim()) {
        newErrors.individualName = 'Name is required';
      }
    }

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      newErrors.subject = `Subject must be under ${MAX_SUBJECT_LENGTH} characters`;
    }

    if (emailType === 'certificate' && !certTemplate) {
      newErrors.certTemplate = 'Certificate template is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSending(true);
    setShowResults(false);
    setErrors({});

    try {
      const emailResults: Result[] = [];

      const emailList = sendMode === 'individual' 
        ? [{ email: individualEmail.trim().toLowerCase(), name: individualName.trim() }]
        : (emailType === 'certificate' ? recipients : emails.map(e => ({ email: e, name: '' })));

      for (let i = 0; i < emailList.length; i++) {
        const recipient = emailList[i];
        
        try {
          let certDataUrl = null;
          if (emailType === 'certificate' && certTemplate && recipient.name) {
            certDataUrl = await generateCertificateWithName(recipient.name);
          }

          const response = await fetch('/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emails: [recipient.email],
              subject: subject,
              html: generateHtml(),
              type: emailType,
              certificate: certDataUrl,
              recipientName: recipient.name,
              attachments: emailType === 'invitation' ? attachments : []
            })
          });

          const data = await response.json();
          
          if (!response.ok || data.error) {
            console.error('API error:', data.error);
            emailResults.push({ email: recipient.email, success: false, error: data.error || 'Failed to send' });
          } else if (data.results && data.results[0]) {
            emailResults.push(data.results[0]);
          } else {
            emailResults.push({ email: recipient.email, success: true });
          }

          if (i < emailList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error) {
          emailResults.push({ email: recipient.email, success: false, error: 'Failed to send' });
        }
      }

      setResults(emailResults);
      setShowResults(true);
      
      const successCount = emailResults.filter(r => r.success).length;
      const failedCount = emailResults.filter(r => !r.success).length;
      
      if (failedCount === 0) {
        Swal.fire({
          icon: 'success',
          title: 'All Emails Sent!',
          text: `${successCount} email(s) sent successfully.`,
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#3b82f6',
        });
      } else if (successCount === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Sending Failed!',
          text: `${failedCount} email(s) failed to send.`,
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#ef4444',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Partial Success',
          text: `${successCount} sent, ${failedCount} failed.`,
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#f59e0b',
        });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to send emails. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const successfulEmails = results.filter(r => r.success);
  const failedEmails = results.filter(r => !r.success);

  const previewCertificate = async (name: string) => {
    if (!certTemplate) return;
    
    const certDataUrl = await generateCertificateWithName(name || certPreviewName || 'John Doe', namePosition || undefined);
    setCertPreview(certDataUrl);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Email Sender</h1>
            <p className="text-slate-400 text-sm mt-1">Send emails with attachments</p>
          </div>
          
          </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setEmailType('invitation')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              emailType === 'invitation'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Invitations
          </button>
          <button
            onClick={() => setEmailType('certificate')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              emailType === 'certificate'
                ? 'bg-pink-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Certificates
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium">
              Recipients 
              <span className="text-slate-400 text-sm ml-2">
                {sendMode === 'bulk' 
                  ? `(${emailType === 'certificate' ? recipients.length : emails.length})` 
                  : '(Individual)'}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSendMode('bulk')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
                  sendMode === 'bulk'
                    ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
              >
                Bulk
              </button>
              <button
                onClick={() => setSendMode('individual')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
                  sendMode === 'individual'
                    ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
              >
                Individual
              </button>
            </div>
          </div>

          {sendMode === 'bulk' ? (
            <div className="mb-4 animate-fade-in">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
                    activeTab === 'upload'
                      ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
                    activeTab === 'paste'
                      ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  Paste
                </button>
              </div>
            </div>
          ) : null}

          {sendMode === 'individual' ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Recipient Email</label>
                <input
                  type="email"
                  value={individualEmail}
                  onChange={(e) => {
                    setIndividualEmail(e.target.value);
                    if (errors.individualEmail) clearError('individualEmail');
                  }}
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
                    onChange={(e) => {
                      setIndividualName(e.target.value);
                      if (errors.individualName) clearError('individualName');
                    }}
                    placeholder="John Doe"
                    className={`w-full p-2.5 bg-slate-700 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.individualName ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
                    }`}
                  />
                  {errors.individualName && <p className="text-red-400 text-xs mt-1">{errors.individualName}</p>}
                </div>
              )}
            </div>
          ) : activeTab === 'upload' ? (
            <label className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 animate-fade-in hover:bg-slate-700/30 ${
              errors.fileUpload 
                ? 'border-red-500 bg-red-500/5' 
                : 'border-slate-600 hover:border-blue-500'
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
                onChange={emailType === 'certificate' ? handleCSVUpload : handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="animate-fade-in">
              <textarea
                onChange={handlePaste}
                placeholder={emailType === 'certificate' 
                  ? 'email@example.com,John Doe\nemail@example.com,Jane Doe\n...' 
                  : 'email@example.com\njohn@example.com\njane@example.com\n...'}
                className={`w-full h-32 p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                  errors.recipients 
                    ? 'bg-slate-700 border-2 border-red-500' 
                    : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
                }`}
              />
              {errors.recipients && (
                <p className="text-red-400 text-xs mt-1">{errors.recipients}</p>
              )}
              {!errors.recipients && (
                <p className="text-slate-500 text-xs mt-2">
                  {emailType === 'certificate' 
                    ? 'Tip: One email per line in format: email,name' 
                    : 'Tip: One email address per line'}
                </p>
              )}
            </div>
          )}

          {sendMode === 'bulk' && (recipients.length > 0 || emails.length > 0) && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 animate-slide-up">
              <div className="flex items-center gap-2">
                <CheckIcon />
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

        {emailType === 'certificate' && (
          <div className="bg-slate-800 rounded-xl p-5 mb-4">
            <h2 className="text-white font-medium mb-4">Certificate Template</h2>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, 'cert')}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragging 
                  ? 'border-pink-500 bg-pink-500/10' 
                  : errors.certTemplate 
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
                    ref={certImageRef}
                    src={certTemplate} 
                    alt="Template" 
                    className="max-h-40 mx-auto rounded-lg mb-3"
                  />
                  <label className="inline-block px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-md cursor-pointer hover:bg-slate-600 transition-colors mr-2">
                    Change Template
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
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
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {certTemplate && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter name to preview..."
                    className="flex-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                    value={certPreviewName}
                    onChange={(e) => {
                      setCertPreviewName(sanitizeInput(e.target.value).slice(0, 100));
                    }}
                  />
                  <button
                    onClick={async () => {
                      const data = await generateCertificateWithName(certPreviewName || 'Preview');
                      setCertPreview(data);
                    }}
                    className="px-3 py-2.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Update Preview
                  </button>
                </div>
                
                {certPreview && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-xs">Click on image to set name position</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectingPosition(!selectingPosition)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            selectingPosition 
                              ? 'bg-pink-600 text-white' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {selectingPosition ? 'Click on image...' : 'Set Name Position'}
                        </button>
                        <button
                          onClick={async () => {
                            setNamePosition(null);
                            const canvas = canvasRef.current;
                            if (!canvas || !certTemplate) return;
                            
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;
                            
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx.drawImage(img, 0, 0);
                              
                              const centerX = canvas.width / 2;
                              const centerY = canvas.height / 2;
                              
                              ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
                              ctx.fillStyle = certTextColor;
                              ctx.textAlign = 'center';
                              ctx.textBaseline = 'middle';
                              ctx.fillText(certPreviewName || 'Preview', centerX, centerY + certFontSize / 4);
                              
                              setCertPreview(canvas.toDataURL('image/png'));
                            };
                            img.src = certTemplate;
                          }}
                          className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600 transition-colors"
                        >
                          Reset to Center
                        </button>
                        <button
                          onClick={() => setShowFullPreview(true)}
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
                        const img = e.currentTarget.querySelector('img');
                        if (!img) return;
                        
                        const rect = img.getBoundingClientRect();
                        const scaleX = img.naturalWidth / rect.width;
                        const scaleY = img.naturalHeight / rect.height;
                        
                        const x = (e.clientX - rect.left) * scaleX;
                        const y = (e.clientY - rect.top) * scaleY;
                        
                        setNamePosition({ x, y });
                        setSelectingPosition(false);
                        
                        const name = certPreviewName || 'Preview';
                        generateCertificateWithName(name, { x, y }).then(data => setCertPreview(data));
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
                      <p className="text-slate-500 text-xs mt-2">
                        Current position: X={Math.round(namePosition.x)}, Y={Math.round(namePosition.y)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {certTemplate && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-slate-300 text-sm font-medium mb-3">Text Styling</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={certTextColor}
                        onChange={(e) => {
                          setCertTextColor(e.target.value);
                          generateCertificateWithName(certPreviewName || 'Preview').then(data => setCertPreview(data));
                        }}
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
                      onChange={(e) => {
                        setCertFontSize(Number(e.target.value));
                        generateCertificateWithName(certPreviewName || 'Preview').then(data => setCertPreview(data));
                      }}
                      className="w-full accent-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Font Family</label>
                    <select
                      value={certFontFamily}
                      onChange={(e) => {
                        setCertFontFamily(e.target.value);
                        generateCertificateWithName(certPreviewName || 'Preview').then(data => setCertPreview(data));
                      }}
                      className="w-full p-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                    >
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder={emailType === 'invitation' ? 'You are invited!' : 'Congratulations on your certificate!'}
                className={`w-full p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none ${
                  errors.subject 
                    ? 'bg-slate-700 border-2 border-red-500' 
                    : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
                }`}
              />
              {errors.subject && (
                <p className="text-red-400 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">
                Message
                <span className="text-slate-600 float-right">{customMessage.length}/{MAX_MESSAGE_LENGTH}</span>
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder={emailType === 'invitation' 
                  ? 'Enter your message...' 
                  : 'Enter your certificate message...'}
                className={`w-full h-20 p-3 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none resize-none ${
                  errors.message 
                    ? 'bg-slate-700 border-2 border-red-500' 
                    : 'bg-slate-700 border border-slate-600 focus:border-blue-500'
                }`}
              />
              {errors.message && (
                <p className="text-red-400 text-xs mt-1">{errors.message}</p>
              )}
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
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </label>
                {errors.attachments && (
                  <p className="text-red-400 text-xs mt-1">{errors.attachments}</p>
                )}
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-md text-sm">
                        <span className="text-slate-300 truncate max-w-[120px]">{file.name}</span>
                        <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-slate-500 hover:text-red-400 ml-1"
                        >
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

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{errors.submit}</p>
          </div>
        )}
        <button
          onClick={sendEmails}
          disabled={sending || (sendMode === 'bulk' ? (emailType === 'certificate' ? recipients.length === 0 : emails.length === 0) : !individualEmail)}
          className={`w-full py-3.5 rounded-xl text-white font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            sending || (sendMode === 'bulk' ? (emailType === 'certificate' ? recipients.length === 0 : emails.length === 0) : !individualEmail)
              ? 'bg-slate-700 cursor-not-allowed'
              : emailType === 'certificate'
              ? 'bg-pink-600 hover:bg-pink-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {sending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending to {sendMode === 'individual' ? '1 recipient' : `${emailType === 'certificate' ? recipients.length : emails.length} recipients`}...
            </>
          ) : (
            <>
              <SendIcon />
              Send {emailType === 'certificate' ? 'Certificates' : 'Invitations'} {sendMode === 'individual' ? '' : `(${emailType === 'certificate' ? recipients.length : emails.length})`}
            </>
          )}
        </button>

        {showResults && (
          <div className="bg-slate-800 rounded-xl p-6 mt-4 animate-fade-in">
            <h2 className="text-white font-medium mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Results
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 hover:bg-emerald-500/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                <p className="text-3xl font-bold text-emerald-400">{successfulEmails.length}</p>
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <CheckIcon /> Sent
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 hover:bg-red-500/20 hover:scale-105 transition-all duration-300 cursor-pointer">
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
        )}

        {showFullPreview && certPreview && (
          <div className="bg-slate-800 rounded-xl p-6 mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">Certificate Preview</h3>
              <button
                onClick={() => setShowFullPreview(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                Minimize
              </button>
            </div>
            <div className="flex justify-center bg-slate-900/50 rounded-lg p-6">
              <img 
                src={certPreview} 
                alt="Full Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
            <p className="text-slate-400 text-sm text-center mt-4">
              Name: <span className="text-white">{certPreviewName || 'John Doe'}</span> | Position: X={namePosition ? Math.round(namePosition.x) : 'center'}, Y={namePosition ? Math.round(namePosition.y) : 'center'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
