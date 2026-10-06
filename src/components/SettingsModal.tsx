import React, { useState } from 'react';
import { Settings, Save, RotateCcw, X, Store } from 'lucide-react';

interface SettingsModalProps {
  currentStoreName: string;
  onSave: (newName: string) => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentStoreName,
  onSave,
  onClose,
  onToast,
}) => {
  const [storeName, setStoreName] = useState(currentStoreName);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('jamhur_custom_gemini_key') || '';
    } catch {
      return '';
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = storeName.trim();
    if (!trimmed) {
      onToast('Nama toko tidak boleh kosong.');
      return;
    }
    onSave(trimmed);
    try {
      if (apiKey.trim()) {
        localStorage.setItem('jamhur_custom_gemini_key', apiKey.trim());
      } else {
        localStorage.removeItem('jamhur_custom_gemini_key');
      }
    } catch (e) {
      console.warn(e);
    }
    onToast(`Pengaturan berhasil disimpan!`);
    onClose();
  };

  const handleReset = () => {
    setStoreName('JAMHUR MOTOR');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Store className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pengaturan Usaha</h3>
              <p className="text-[11px] text-slate-400">Nama showroom & konfigurasi AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Nama Toko / Showroom Motor:
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: JAMHUR MOTOR"
              className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-3 text-sm text-white font-bold outline-none uppercase tracking-wide transition"
              maxLength={40}
              autoFocus
            />
            <p className="text-[11px] text-slate-400">
              Nama ini akan tampil di header aplikasi dan dipakai oleh AI saat merapikan iklan motor.
            </p>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 block">
              Kunci API Gemini (Opsional):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (Opsional jika GitHub Pages)"
              className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none transition"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Isi jika Anda meng-host di <strong>GitHub Pages</strong> statis agar AI tetap bisa merapikan iklan langsung tanpa server backend.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Kembalikan ke JAMHUR MOTOR"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
