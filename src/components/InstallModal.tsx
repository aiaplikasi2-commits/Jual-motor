import React from 'react';
import { Smartphone, Download, X, CheckCircle2, MoreVertical, Share } from 'lucide-react';

interface InstallModalProps {
  storeName: string;
  isInstallable: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean | void>;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  storeName,
  isInstallable,
  isIOS,
  onInstall,
  onClose,
}) => {
  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await onInstall();
      if (res) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-md shadow-orange-950/40">
              🏍️
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-snug">
                Pasang Aplikasi
              </h3>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                {storeName || 'JAMHUR MOTOR'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Proposition */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Pasang aplikasi ke layar utama Android Anda agar lebih mudah digunakan seperti aplikasi bawaan:
        </p>

        {/* Benefits list */}
        <div className="space-y-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Buka cepat 1-sentuhan dari layar utama HP</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bisa dipakai <strong>offline</strong> tanpa kuota internet</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Data iklan & foto tersimpan aman di HP</span>
          </div>
        </div>

        {/* Primary Action / Guidance */}
        {isInstallable ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Pasang Sekarang ke HP</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Nanti Saja
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Instructions */
          <div className="space-y-3 pt-1">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Share className="w-4 h-4 text-sky-400" />
                <span>Cara Pasang di iPhone / iPad:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari.</li>
                <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong>.</li>
              </ol>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition"
            >
              Mengerti & Tutup
            </button>
          </div>
        ) : (
          /* Android Chrome 2-Step Manual Guide */
          <div className="space-y-3 pt-1">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <MoreVertical className="w-4 h-4 text-orange-400" />
                <span>Cara Pasang di Browser Chrome:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                <li>Ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.</li>
                <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Pasang Aplikasi"</strong>.</li>
              </ol>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
