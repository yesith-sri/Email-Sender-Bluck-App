interface TabSelectorProps {
  activeTab: 'upload' | 'paste';
  onChange: (tab: 'upload' | 'paste') => void;
}

export function TabSelector({ activeTab, onChange }: TabSelectorProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange('upload')}
        className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
          activeTab === 'upload'
            ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Upload
      </button>
      <button
        onClick={() => onChange('paste')}
        className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 transform ${
          activeTab === 'paste'
            ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/30'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Paste
      </button>
    </div>
  );
}
