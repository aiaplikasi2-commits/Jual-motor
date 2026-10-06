import React, { useState } from 'react';
import { copyToClipboard } from '../utils/shareHelper';
import { Coffee, Copy, Check, X, Heart } from 'lucide-react';

interface BagiKopiModalProps {
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const BagiKopiModal: React.FC<BagiKopiModalProps> = ({ onClose, onToast }) => {
  const [copied, setCopied] = useState(false);
  const phoneNumber = '08179015181';
  const accountName = 'Jamhur';

  const handleCopyNumber = async () => {
    const success = await copyToClipboard(phoneNumber);
    if (success) {
      setCopied(true);
      onToast(`Nomor ${phoneNumber} (a.n ${accountName}) berhasil disalin!`);
      setTimeout(() => setCopied(false), 2500);
    } else {
      onToast('Gagal menyalin nomor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coffee className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                Bagi Kopi <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </h3>
              <p className="text-[11px] text-slate-400">Dukungan / Traktir Kopi Pengembang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed text-center">
          Suka dengan kemudahan aplikasi ini? Anda bisa traktir secangkir kopi untuk <strong>Bang Jamhur</strong> melalui DANA atau GoPay:
        </p>

        {/* E-Wallet Badges with Logos */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* DANA Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow">
            {/* DANA Official Style Logo */}
            <div className="flex items-center gap-1.5 bg-[#118EEA] px-2.5 py-1 rounded-lg text-white font-black text-xs tracking-wider shadow-sm">
              <span className="text-sm">✦</span>
              <span>DANA</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 mt-2">DANA Wallet</span>
          </div>

          {/* GoPay Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow">
            {/* GoPay Official Style Logo */}
            <div className="flex items-center gap-1.5 bg-[#00AED6] px-2.5 py-1 rounded-lg text-white font-black text-xs tracking-wide shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block"></span>
              <span>gopay</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 mt-2">GoPay Wallet</span>
          </div>
        </div>

        {/* Account Details Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-center">
          <div className="text-[11px] text-slate-400 font-medium">Nomor DANA / GoPay:</div>
          <div className="text-xl font-mono font-black text-amber-400 tracking-wider">
            {phoneNumber}
          </div>
          <div className="text-xs font-bold text-slate-200">
            a.n <span className="text-white uppercase tracking-wide">{accountName}</span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyNumber}
          className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
              <span>Nomor Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 text-slate-950" />
              <span>📋 Salin Nomor (08179015181)</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          Terima kasih banyak atas apresiasi dan dukungannya! ☕
        </p>
      </div>
    </div>
  );
};
