import React, { useState, useRef } from 'react';
import { MotorAd } from '../types';
import {
  Share2,
  Copy,
  Edit3,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Download,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  copyToClipboard,
  downloadPhoto,
} from '../utils/shareHelper';
import { ShareModal } from './ShareModal';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface AdDetailProps {
  ad: MotorAd;
  storeName?: string;
  onEdit: (ad: MotorAd) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (ad: MotorAd) => Promise<void>;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const AdDetail: React.FC<AdDetailProps> = ({
  ad,
  storeName = 'Jamhur Motor',
  onEdit,
  onDelete,
  onUpdate,
  onBack,
  onToast,
}) => {
  const isOnline = useOnlineStatus();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Touch swipe support for gallery
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const photos = ad.photos || [];
  const totalPhotos = photos.length;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && currentPhotoIndex < totalPhotos - 1) {
      // Swiped left -> next
      setCurrentPhotoIndex((prev) => prev + 1);
    } else if (distance < -50 && currentPhotoIndex > 0) {
      // Swiped right -> prev
      setCurrentPhotoIndex((prev) => prev - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const success = await copyToClipboard(ad.description);
    if (success) {
      setCopied(true);
      onToast('📋 Teks iklan berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast('Gagal menyalin teks.');
    }
  };

  // Share
  const handleShare = () => {
    setShowShareModal(true);
  };

  // AI Polish inside Detail View
  const handleAIPolishInDetail = async () => {
    if (!isOnline) {
      onToast('Fitur AI butuh koneksi internet.');
      return;
    }

    setIsPolishing(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ad.description, storeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.result) {
        const updated = {
          ...ad,
          description: data.result,
          updatedAt: Date.now(),
        };
        await onUpdate(updated);
        onToast('✨ Deskripsi diperbarui dengan AI!');
      }
    } catch (err: any) {
      onToast(err.message || 'Gagal merapikan dengan AI.');
    } finally {
      setIsPolishing(false);
    }
  };

  // Delete Ad
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(ad.id);
      onToast('Iklan berhasil dihapus.');
      onBack();
    } catch (e) {
      onToast('Gagal menghapus iklan.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-5">
      {/* ---------------- GALLERY WITH SWIPE & ZOOM ---------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {totalPhotos > 0 ? (
          <div>
            {/* Main Active Photo */}
            <div
              className="relative aspect-4/3 w-full bg-slate-950 flex items-center justify-center overflow-hidden touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={photos[currentPhotoIndex]}
                alt={`Motor Foto ${currentPhotoIndex + 1}`}
                onClick={() => setIsFullscreen(true)}
                className="w-full h-full object-contain cursor-zoom-in select-none"
              />

              {/* Prev / Next overlay buttons */}
              {totalPhotos > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={() => setCurrentPhotoIndex((prev) => prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-95 transition"
                      aria-label="Foto Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentPhotoIndex < totalPhotos - 1 && (
                    <button
                      onClick={() => setCurrentPhotoIndex((prev) => prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-95 transition"
                      aria-label="Foto Berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}

              {/* Zoom trigger icon */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition shadow"
                aria-label="Perbesar Foto"
              >
                <Maximize2 className="w-4 h-4 text-orange-400" />
              </button>

              {/* Photo Indicator Badge */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                {currentPhotoIndex + 1} / {totalPhotos}
              </div>
            </div>

            {/* Thumbnail Navigation Bar */}
            {totalPhotos > 1 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      idx === currentPhotoIndex
                        ? 'border-orange-500 scale-105 shadow'
                        : 'border-slate-700 opacity-60'
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center p-8 text-slate-500 gap-2">
            <span className="text-3xl">📷</span>
            <span className="text-sm font-semibold">Tidak ada foto pada iklan ini</span>
          </div>
        )}
      </div>

      {/* ---------------- 5 ACTION BUTTONS ---------------- */}
      {/* ✨ AI | 📋 Salin | 📤 Bagikan | ✏️ Edit | 🗑️ Hapus */}
      <div className="grid grid-cols-5 gap-2">
        {/* ✨ AI */}
        <button
          onClick={handleAIPolishInDetail}
          disabled={isPolishing}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-white shadow-md transition disabled:opacity-50"
          title="Rapikan Ulang dengan AI"
        >
          {isPolishing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-yellow-100" />
          )}
          <span className="text-[11px] font-black mt-1">✨ AI</span>
        </button>

        {/* 📋 Salin */}
        <button
          onClick={handleCopy}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-650 active:scale-95 border border-slate-700 text-slate-200 shadow transition"
          title="Salin Teks Iklan"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Copy className="w-5 h-5 text-sky-400" />
          )}
          <span className="text-[11px] font-bold mt-1">📋 Salin</span>
        </button>

        {/* 📤 Bagikan */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 active:scale-95 text-white shadow-md shadow-orange-950/40 transition"
          title="Bagikan Iklan"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[11px] font-black mt-1">📤 Bagikan</span>
        </button>

        {/* ✏️ Edit */}
        <button
          onClick={() => onEdit(ad)}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-650 active:scale-95 border border-slate-700 text-slate-200 shadow transition"
          title="Edit Iklan"
        >
          <Edit3 className="w-5 h-5 text-emerald-400" />
          <span className="text-[11px] font-bold mt-1">✏️ Edit</span>
        </button>

        {/* 🗑️ Hapus */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-800 hover:bg-red-950/50 active:bg-red-900/60 active:scale-95 border border-slate-700 text-slate-300 hover:text-red-400 shadow transition"
          title="Hapus Iklan"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
          <span className="text-[11px] font-bold mt-1">🗑️ Hapus</span>
        </button>
      </div>

      {/* ---------------- MOTOR DESCRIPTION ---------------- */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Keterangan Iklan Motor
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(ad.updatedAt || ad.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="text-sm text-slate-100 whitespace-pre-line leading-relaxed font-sans select-text">
          {ad.description}
        </div>
      </div>

      {/* ---------------- FULLSCREEN ZOOM MODAL ---------------- */}
      {isFullscreen && totalPhotos > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-sm font-semibold">
              Foto {currentPhotoIndex + 1} dari {totalPhotos}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(photos[currentPhotoIndex], `motor_${currentPhotoIndex + 1}.jpg`)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white"
                title="Unduh Foto Ini"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-white"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-2 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={photos[currentPhotoIndex]}
              alt=""
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>

          {/* Bottom Prev / Next */}
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              disabled={currentPhotoIndex === 0}
              onClick={() => setCurrentPhotoIndex((prev) => prev - 1)}
              className="py-2 px-5 rounded-full bg-slate-800 text-white text-xs font-bold disabled:opacity-30"
            >
              ◀ Foto Sebelumnya
            </button>
            <button
              disabled={currentPhotoIndex === totalPhotos - 1}
              onClick={() => setCurrentPhotoIndex((prev) => prev + 1)}
              className="py-2 px-5 rounded-full bg-slate-800 text-white text-xs font-bold disabled:opacity-30"
            >
              Foto Berikutnya ▶
            </button>
          </div>
        </div>
      )}

      {/* ---------------- DELETE CONFIRMATION MODAL ---------------- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">Hapus Iklan Ini?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Iklan motor dan foto-fotonya akan dihapus dari penyimpanan lokal HP. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold transition"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SHARE MODAL ---------------- */}
      {showShareModal && (
        <ShareModal
          ad={ad}
          onClose={() => setShowShareModal(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
};
