import React, { useState, useRef } from 'react';
import { backupAllAds, restoreAds } from '../db/indexedDB';
import { Download, Upload, X, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';

interface BackupRestoreModalProps {
  type: 'backup' | 'restore';
  onClose: () => void;
  onRefreshAds: () => Promise<void>;
  onToast: (msg: string) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  type,
  onClose,
  onRefreshAds,
  onToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const json = await backupAllAds();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `jamhur_motor_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('File backup JSON berhasil diunduh!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Gagal membuat backup data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToRestore(e.target.files[0]);
      setError(null);
    }
  };

  const handleExecuteRestore = async () => {
    if (!fileToRestore) {
      setError('Pilih file backup .json terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const text = await fileToRestore.text();
      const count = await restoreAds(text, restoreMode);
      await onRefreshAds();
      onToast(`Berhasil memulihkan ${count} iklan!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal membaca atau memulihkan file cadangan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'backup' ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-base font-black text-white">
              {type === 'backup' ? 'Backup Data Iklan' : 'Restore Data Iklan'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {type === 'backup' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Semua iklan, foto motor, dan teks keterangan akan disimpan dalam satu file JSON lokal di HP Anda.
            </p>

            <button
              disabled={loading}
              onClick={handleBackup}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh File Backup (.json)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih file cadangan JSON yang pernah Anda unduh untuk memulihkan semua iklan dan foto.
            </p>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-slate-600 hover:border-sky-500 rounded-xl text-center bg-slate-900/50 hover:bg-slate-900 transition flex flex-col items-center justify-center gap-1.5"
            >
              <FileText className="w-6 h-6 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">
                {fileToRestore ? fileToRestore.name : 'Pilih File Backup (.json)'}
              </span>
              <span className="text-[10px] text-slate-400">
                {fileToRestore ? `${(fileToRestore.size / 1024).toFixed(1)} KB` : 'Sentuh di sini untuk cari file'}
              </span>
            </button>

            {/* Mode selection */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">
                Metode Pemulihan:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                    restoreMode === 'merge'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Gabungkan (Merge)
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                    restoreMode === 'replace'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Ganti Semua
                </button>
              </div>
            </div>

            <button
              disabled={loading || !fileToRestore}
              onClick={handleExecuteRestore}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Pulihkan Sekarang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
