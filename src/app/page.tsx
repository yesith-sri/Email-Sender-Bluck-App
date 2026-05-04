'use client';

import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

import { EmailTypeSelector } from './components/EmailTypeSelector';
import { SendModeToggle } from './components/SendModeToggle';
import { RecipientInput } from './components/RecipientInput';
import { CertificateTemplate } from './components/CertificateTemplate';
import { EmailContent } from './components/EmailContent';
import { ResultsPanel } from './components/ResultsPanel';
import { CertificatePreview } from './components/CertificatePreview';
import { LoadingSpinner } from './components/icons';

import {
  validateEmail,
  sanitizeInput,
  sanitizeFilename,
  MAX_SUBJECT_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_FILE_SIZE,
  MAX_ATTACHMENT_SIZE,
  MAX_TOTAL_ATTACHMENTS,
  MAX_RECIPIENTS,
  ALLOWED_ATTACHMENT_TYPES,
} from './lib/constants';

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

function generateEmailHtml(params: {
  type: 'invitation' | 'certificate';
  message: string;
}): string {
  const escapedMessage = params.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  if (params.type === 'invitation') {
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
  }

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
  const [selectingPosition, setSelectingPosition] = useState(false);
  const [certTextColor, setCertTextColor] = useState('#1a365d');
  const [certFontSize, setCertFontSize] = useState(60);
  const [certFontFamily, setCertFontFamily] = useState('Times New Roman');
  const [customFontUrl, setCustomFontUrl] = useState<string | null>(null);
  const [customFontName, setCustomFontName] = useState<string>('');
  const [fontLoaded, setFontLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const certImageRef = useRef<HTMLImageElement | null>(null);
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
    setNamePosition(null);
    setIndividualEmail('');
    setIndividualName('');
    setShowResults(false);
    setCustomFontUrl(null);
    setCustomFontName('');
    setFontLoaded(false);
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
        const dataUrl = event.target?.result as string;
        setCertTemplate(dataUrl);
        setCertPreview(dataUrl);
        setNamePosition(null);
        setCertPreviewName('John Doe');
        // Cache the template image
        const img = new Image();
        img.onload = () => { certImageRef.current = img; };
        img.src = dataUrl;
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

    Array.from(files).forEach((file) => {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        setError('attachments', `File type not allowed: ${file.name}`);
        return;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setError('attachments', `File too large: ${file.name} (max ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB)`);
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

  const loadCustomFont = (fontFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const blobUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: fontFile.type }));
          const fontFace = new FontFace(customFontName || 'CustomFont', `url(${blobUrl})`);
          await fontFace.load();
          document.fonts.add(fontFace);
          setFontLoaded(true);
          setCustomFontUrl(blobUrl);
          resolve(customFontName || 'CustomFont');
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(fontFile);
    });
  };

  const generateCertificateWithName = (name: string, position?: {x: number, y: number}): Promise<string> => {
    return new Promise((resolve) => {
      if (!certImageRef.current || !canvasRef.current) {
        resolve('');
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const img = certImageRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const posX = position ? position.x : (namePosition ? namePosition.x : canvas.width / 2);
      const posY = position ? position.y : (namePosition ? namePosition.y : canvas.height / 2);

      const fontFamily = fontLoaded && customFontName ? customFontName : certFontFamily;
      ctx.font = `bold ${certFontSize}px "${fontFamily}", serif`;
      ctx.fillStyle = certTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, posX, posY);

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    });
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
              html: generateEmailHtml({ type: emailType, message: customMessage }),
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

      // Clear all fields after sending
      setEmails([]);
      setRecipients([]);
      setSubject('');
      setCustomMessage('');
      setAttachments([]);
      setIndividualEmail('');
      setIndividualName('');
      setCertPreview(null);
      setNamePosition(null);
    } catch (error) {
      setErrors({ submit: 'Failed to send emails. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (attachments.length === 1) clearError('attachments');
  };

  const previewCertificate = (name: string) => {
    if (!certTemplate || !canvasRef.current || !certImageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = certImageRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
    ctx.fillStyle = certTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || certPreviewName || 'John Doe', 
      namePosition?.x || img.width / 2, 
      namePosition?.y || img.height / 2);
    setCertPreview(canvas.toDataURL('image/png'));
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

        <EmailTypeSelector emailType={emailType} onChange={setEmailType} />

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
            <SendModeToggle sendMode={sendMode} onChange={setSendMode} />
          </div>

          <RecipientInput
            sendMode={sendMode}
            emailType={emailType}
            activeTab={activeTab}
            emails={emails}
            recipients={recipients}
            individualEmail={individualEmail}
            individualName={individualName}
            errors={errors}
            onTabChange={setActiveTab}
            onFileUpload={handleFileUpload}
            onCSVUpload={handleCSVUpload}
            onPaste={handlePaste}
            onIndividualEmailChange={(email) => {
              setIndividualEmail(email);
              if (errors.individualEmail) clearError('individualEmail');
            }}
            onIndividualNameChange={(name) => {
              setIndividualName(name);
              if (errors.individualName) clearError('individualName');
            }}
          />
        </div>

        {emailType === 'certificate' && (
          <CertificateTemplate
            certTemplate={certTemplate}
            certPreview={certPreview}
            certPreviewName={certPreviewName}
            namePosition={namePosition}
            selectingPosition={selectingPosition}
            certTextColor={certTextColor}
            certFontSize={certFontSize}
            certFontFamily={certFontFamily}
            fontLoaded={fontLoaded}
            customFontName={customFontName}
            customFontUrl={customFontUrl}
            errors={errors}
            onTemplateChange={(file: File) => {
              const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(fakeEvent);
            }}
            onPreviewNameChange={setCertPreviewName}
            onUpdatePreview={() => {
              if (!canvasRef.current || !certImageRef.current) return;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const img = certImageRef.current;
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
              ctx.fillStyle = certTextColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const x = namePosition?.x || img.width / 2;
              const y = namePosition?.y || img.height / 2;
              ctx.fillText(certPreviewName || 'Preview', x, y);
              setCertPreview(canvas.toDataURL('image/png'));
            }}
            onPositionSelect={(pos) => {
              setNamePosition(pos);
              setSelectingPosition(false);
              if (!canvasRef.current || !certImageRef.current) return;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const img = certImageRef.current;
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
              ctx.fillStyle = certTextColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(certPreviewName || 'Preview', pos.x, pos.y);
              setCertPreview(canvas.toDataURL('image/png'));
            }}
            onSelectingPositionToggle={() => setSelectingPosition(!selectingPosition)}
            onResetPosition={() => {
              setNamePosition(null);
              if (certTemplate) {
                const img = new Image();
                img.onload = () => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  ctx.font = `bold ${certFontSize}px "${certFontFamily}", serif`;
                  ctx.fillStyle = certTextColor;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(certPreviewName || 'Preview', img.width / 2, img.height / 2 + certFontSize / 4);
                  setCertPreview(canvas.toDataURL('image/png'));
                };
                img.src = certTemplate;
              }
            }}
            onShowFullPreview={() => {}}
            onTextColorChange={(color) => {
              setCertTextColor(color);
              previewCertificate(certPreviewName || 'Preview');
            }}
            onFontSizeChange={(size) => {
              setCertFontSize(size);
              if (!canvasRef.current || !certImageRef.current) return;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const img = certImageRef.current;
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const fontFamily = fontLoaded && customFontName ? customFontName : certFontFamily;
              ctx.font = `bold ${size}px "${fontFamily}", serif`;
              ctx.fillStyle = certTextColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const x = namePosition?.x || img.width / 2;
              const y = namePosition?.y || img.height / 2;
              ctx.fillText(certPreviewName || 'Preview', x, y);
              setCertPreview(canvas.toDataURL('image/png'));
            }}
            onFontFamilyChange={(font) => {
              setCertFontFamily(font);
              if (!canvasRef.current || !certImageRef.current) return;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const img = certImageRef.current;
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const fontFamily = fontLoaded && customFontName ? customFontName : font;
              ctx.font = `bold ${certFontSize}px "${fontFamily}", serif`;
              ctx.fillStyle = certTextColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const x = namePosition?.x || img.width / 2;
              const y = namePosition?.y || img.height / 2;
              ctx.fillText(certPreviewName || 'Preview', x, y);
              setCertPreview(canvas.toDataURL('image/png'));
            }}
            onCustomFontNameChange={setCustomFontName}
            onCustomFontUpload={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!customFontName.trim()) {
                setError('customFont', 'Please enter a font name first');
                return;
              }
              clearError('customFont');
              try {
                await loadCustomFont(file);
                // Update preview instantly with new font
                if (!canvasRef.current || !certImageRef.current) return;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const img = certImageRef.current;
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                ctx.font = `bold ${certFontSize}px "${customFontName}", serif`;
                ctx.fillStyle = certTextColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const x = namePosition?.x || img.width / 2;
                const y = namePosition?.y || img.height / 2;
                ctx.fillText(certPreviewName || 'Preview', x, y);
                setCertPreview(canvas.toDataURL('image/png'));
              } catch (err) {
                setError('customFont', 'Failed to load font');
              }
            }}
          />
        )}

        <EmailContent
          emailType={emailType}
          subject={subject}
          customMessage={customMessage}
          attachments={attachments}
          errors={errors}
          onSubjectChange={handleSubjectChange}
          onMessageChange={handleMessageChange}
          onAttachmentUpload={handleAttachmentUpload}
          onRemoveAttachment={removeAttachment}
        />

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
              <LoadingSpinner />
              Sending to {sendMode === 'individual' ? '1 recipient' : `${emailType === 'certificate' ? recipients.length : emails.length} recipients`}...
            </>
          ) : (
            <>
              Send {emailType === 'certificate' ? 'Certificates' : 'Invitations'} {sendMode === 'individual' ? '' : `(${emailType === 'certificate' ? recipients.length : emails.length})`}
            </>
          )}
        </button>

        <ResultsPanel results={results} showResults={showResults} onClose={() => setShowResults(false)} />

        {certPreview && (
          <div className="bg-slate-800 rounded-xl p-6 mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">Certificate Preview</h3>
              <button
                onClick={() => setCertPreview(null)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                Close Preview
              </button>
            </div>
            <div className="flex justify-center bg-slate-900/50 rounded-lg p-6">
              <img 
                src={certPreview} 
                alt="Certificate Preview" 
                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl"
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
