import React, { useState } from 'react';
import { MotorAd } from '../types';
import {
  Share2,
  Copy,
  Download,
  X,
  MessageCircle,
  Check,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import {
  shareAdContent,
  copyToClipboard,
  downloadPhoto,
  dataUrlToFile,
} from '../utils/shareHelper';

interface ShareModalProps {
  ad: MotorAd;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ ad, onClose, onToast }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const photos = ad.photos || [];
  const primaryPhoto = photos[0] || null;

  // Extract first line
  const firstLine = ad.description.split('\n')[0] || 'Iklan Motor';

  // 1. Android System Share (Bisa ke SEMUA: WA, Facebook, Grup FB, Telegram, dll.)
  const handleSystemShare = async () => {
    // Salin teks ke papan klip terlebih dahulu sebagai cadangan aman
    await copyToClipboard(ad.description);

    try {
      const res = await shareAdContent(ad.description, photos);
      if (res.success) {
        onToast(res.sharedFiles ? 'Iklan & foto berhasil dibagikan!' : 'Teks iklan berhasil dibagikan!');
        onClose();
      } else if (!res.userCancelled && res.error) {
        onToast(res.error);
      }
    } catch {
      onToast('Gagal membagikan iklan.');
    }
  };

  // 2. Share to WhatsApp with Photos & Caption
  const handleShareWhatsApp = async () => {
    await copyToClipboard(ad.description);

    if (photos.length > 0 && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const files: File[] = [];
        for (let i = 0; i < photos.length; i++) {
          files.push(await dataUrlToFile(photos[i], `motor_${i + 1}.jpg`));
        }

        if (navigator.canShare && navigator.canShare({ files })) {
          onToast('Pilih WhatsApp pada menu berbagi...');
          await navigator.share({
            files,
            text: ad.description,
          });
          onClose();
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Share with files failed:', err);
      }
    }

    if (primaryPhoto) {
      await downloadPhoto(primaryPhoto, 'foto_motor_wa.jpg');
      onToast('Foto disimpan & teks disalin! Buka WhatsApp...');
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(ad.description)}`;
    window.open(url, '_blank');
    onClose();
  };

  // 3. Share to Facebook (Beranda / Grup - BUKAN Marketplace)
  const handleShareFacebook = async () => {
    await copyToClipboard(ad.description);

    if (primaryPhoto) {
      await downloadPhoto(primaryPhoto, 'foto_motor_facebook.jpg');
    }

    onToast('Foto disimpan di Galeri & teks disalin! Buka Facebook...');

    setTimeout(() => {
      // Buka Beranda Facebook untuk posting feed atau pilih grup
      window.open('https://m.facebook.com/', '_blank');
      onClose();
    }, 500);
  };

  // 4. Copy Text
  const handleCopyText = async () => {
    const success = await copyToClipboard(ad.description);
    if (success) {
      setCopied(true);
      onToast('Teks iklan disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast('Gagal menyalin teks.');
    }
  };

  // 5. Download Photos
  const handleDownloadAllPhotos = async () => {
    if (photos.length === 0) {
      onToast('Iklan ini tidak memiliki foto.');
      return;
    }
    setDownloading(true);
    try {
      for (let i = 0; i < photos.length; i++) {
        await downloadPhoto(photos[i], `motor_${i + 1}.jpg`);
      }
      onToast(`${photos.length} foto berhasil disimpan ke galeri HP!`);
    } catch {
      onToast('Gagal menyimpan foto.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <Share2 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Bagikan Iklan</h3>
              <p className="text-[11px] text-slate-400">Bisa ke semua aplikasi, WA, FB & Grup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ad Preview Chip */}
        <div className="flex items-center gap-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt=""
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{firstLine}</div>
            <div className="text-[10px] text-orange-400 font-medium">
              {photos.length} Foto Tersedia
            </div>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="space-y-2.5">
          {/* 1. Android System Share (UTAMA - Ke Semua Aplikasi) */}
          <button
            type="button"
            onClick={handleSystemShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-black text-xs flex items-center justify-between shadow-lg shadow-orange-950/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="leading-tight">Bagikan ke Semua Aplikasi</div>
                <div className="text-[10px] font-normal text-orange-100">
                  WA, FB, Grup, Telegram, dll. (Bawa Foto & Teks)
                </div>
              </div>
            </div>
            <span className="text-sm font-bold">➔</span>
          </button>

          {/* 2. WhatsApp Direct Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-between shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 text-emerald-200" />
              <div className="text-left">
                <div className="leading-tight">Kirim ke WhatsApp</div>
                <div className="text-[10px] font-normal text-emerald-100">
                  Foto langsung + caption otomatis
                </div>
              </div>
            </div>
            <span className="text-sm">➔</span>
          </button>

          {/* 3. Facebook Feed & Grup Button (BUKAN Marketplace) */}
          <button
            type="button"
            onClick={handleShareFacebook}
            className="w-full py-3 px-4 rounded-2xl bg-sky-700 hover:bg-sky-600 active:bg-sky-800 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-between shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white text-sky-700 font-black text-xs flex items-center justify-center">
                f
              </div>
              <div className="text-left">
                <div className="leading-tight">Kirim ke Facebook (Beranda / Grup)</div>
                <div className="text-[10px] font-normal text-sky-200">
                  Simpan foto & posting ke Beranda / Grup FB
                </div>
              </div>
            </div>
            <Users className="w-4 h-4 text-sky-200" />
          </button>

          {/* Secondary Actions: Copy text & Download photos */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={downloading || photos.length === 0}
              onClick={handleDownloadAllPhotos}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Simpan Foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
