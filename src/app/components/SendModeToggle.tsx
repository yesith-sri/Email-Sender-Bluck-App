interface SendModeToggleProps {
  sendMode: 'bulk' | 'individual';
  onChange: (mode: 'bulk' | 'individual') => void;
}

export function SendModeToggle({ sendMode, onChange }: SendModeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('bulk')}
        className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
          sendMode === 'bulk'
            ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Bulk
      </button>
      <button
        onClick={() => onChange('individual')}
        className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
          sendMode === 'individual'
            ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Individual
      </button>
    </div>
  );
}
