interface EmailTypeSelectorProps {
  emailType: 'invitation' | 'certificate';
  onChange: (type: 'invitation' | 'certificate') => void;
}

export function EmailTypeSelector({ emailType, onChange }: EmailTypeSelectorProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onChange('invitation')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
          emailType === 'invitation'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        Invitations
      </button>
      <button
        onClick={() => onChange('certificate')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
          emailType === 'certificate'
            ? 'bg-pink-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        Certificates
      </button>
    </div>
  );
}
