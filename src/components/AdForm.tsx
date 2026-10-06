import React, { useState, useRef } from 'react';
import { MotorAd } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  Camera,
  Image as GalleryIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface AdFormProps {
  initialAd?: MotorAd | null;
  storeName?: string;
  onSave: (ad: MotorAd) => Promise<void>;
  onCancel: () => void;
  onToast: (msg: string) => void;
}

const MAX_PHOTOS = 10;

export const AdForm: React.FC<AdFormProps> = ({
  initialAd,
  storeName = 'Jamhur Motor',
  onSave,
  onCancel,
  onToast,
}) => {
  const isOnline = useOnlineStatus();
  const [photos, setPhotos] = useState<string[]>(initialAd?.photos || []);
  const [description, setDescription] = useState<string>(initialAd?.description || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Photo File Selection
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const availableSlots = MAX_PHOTOS - photos.length;
    if (availableSlots <= 0) {
      onToast(`Maksimal ${MAX_PHOTOS} foto untuk satu iklan.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      onToast(`Hanya ${availableSlots} foto yang ditambahkan (maksimal 10 foto).`);
    }

    setIsCompressing(true);
    try {
      const compressedList: string[] = [];
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;
        const compressedDataUrl = await compressImage(file);
        compressedList.push(compressedDataUrl);
      }
      setPhotos((prev) => [...prev, ...compressedList]);
      if (compressedList.length > 0) {
        onToast(`+${compressedList.length} foto berhasil ditambahkan`);
      }
    } catch (err: any) {
      console.error(err);
      onToast('Gagal memproses foto.');
    } finally {
      setIsCompressing(false);
      // Reset inputs so the same file can be selected again if needed
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Reorder / move photo
  const movePhoto = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    setPhotos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return copy;
    });
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    onToast('Foto utama diperbarui ⭐');
  };

  // Delete photo
  const deletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Polish Text
  const handleAIPolish = async () => {
    if (!description.trim()) {
      onToast('Tulis keterangan motor terlebih dahulu.');
      textareaRef.current?.focus();
      return;
    }

    if (!isOnline) {
      onToast('Fitur AI butuh koneksi internet. Simpan tetap bisa offline.');
      return;
    }

    setIsPolishing(true);
    setAiError(null);

    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description, storeName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal merapikan dengan AI.');
      }

      if (data.result) {
        setDescription(data.result);
        onToast('✨ Keterangan berhasil dirapikan dengan AI!');
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      setAiError(err.message || 'Gagal merapikan dengan AI. Silakan coba lagi.');
      onToast('Gagal merapikan dengan AI.');
    } finally {
      setIsPolishing(false);
    }
  };

  // Save Ad
  const handleSave = async () => {
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      onToast('Keterangan motor tidak boleh kosong.');
      textareaRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const adToSave: MotorAd = {
        id: initialAd?.id || 'ad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: initialAd?.createdAt || now,
        updatedAt: now,
        photos,
        description: trimmedDesc,
      };

      await onSave(adToSave);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      onToast('Gagal menyimpan iklan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Title & Cancel */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          {initialAd ? '✏️ Edit Iklan Motor' : '➕ Tambah Iklan Motor'}
        </h2>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg active:bg-slate-700 transition"
        >
          Batal
        </button>
      </div>

      {/* ---------------- 1. FOTO ---------------- */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              1. Foto Motor
            </span>
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              {photos.length}/{MAX_PHOTOS}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Foto pertama = Foto utama
          </span>
        </div>

        {/* Action Buttons to Add Photos */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={photos.length >= MAX_PHOTOS || isCompressing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-650 active:bg-slate-600 border border-slate-600 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Foto Kamera</span>
          </button>

          <button
            type="button"
            disabled={photos.length >= MAX_PHOTOS || isCompressing}
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-650 active:bg-slate-600 border border-slate-600 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
          >
            <GalleryIcon className="w-4 h-4 text-sky-400" />
            <span>Pilih Galeri</span>
          </button>
        </div>

        {/* Loader during compression */}
        {isCompressing && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-orange-400 bg-orange-950/30 rounded-xl border border-orange-800/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengompres & memuat foto...</span>
          </div>
        )}

        {/* Photos Grid / Horizontal Thumbnails: [📷] [📷] [📷] [ + ] */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {photos.map((photo, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={index}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-slate-900 ${
                    isFirst ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-700'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Motor ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {isFirst && (
                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Utama
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => deletePhoto(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-red-600 active:scale-95 transition shadow"
                    aria-label="Hapus Foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Reorder / Set Primary Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-xs p-1 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, 'left')}
                      className="p-0.5 text-slate-300 hover:text-white disabled:opacity-20 active:scale-90"
                      title="Geser Kiri"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {!isFirst ? (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(index)}
                        className="text-[9px] font-bold text-orange-400 hover:underline px-1"
                        title="Jadikan Foto Utama"
                      >
                        Set Utama
                      </button>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400">#1</span>
                    )}

                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => movePhoto(index, 'right')}
                      className="p-0.5 text-slate-300 hover:text-white disabled:opacity-20 active:scale-90"
                      title="Geser Kanan"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick [ + ] button if under 10 */}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500 bg-slate-900/60 hover:bg-slate-800/80 flex flex-col items-center justify-center text-slate-400 hover:text-orange-400 transition"
              >
                <span className="text-2xl font-light leading-none">+</span>
                <span className="text-[10px] font-medium mt-1">Foto</span>
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition"
          >
            <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">
              Belum ada foto motor dipilih
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Sentuh Kamera atau Galeri di atas untuk menambah hingga 10 foto.
            </p>
          </div>
        )}
      </div>

      {/* ---------------- 2. KETERANGAN ---------------- */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="description-textarea"
            className="text-sm font-bold text-slate-200 uppercase tracking-wide block"
          >
            2. Keterangan Motor
          </label>
          <span className="text-[11px] text-slate-400">
            Satu kolom untuk semua info
          </span>
        </div>

        {/* SATU KOLOM TEKS BESAR */}
        <textarea
          id="description-textarea"
          ref={textareaRef}
          rows={7}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Tulis keterangan motor di sini...\n\nContoh:\nvario 125 2021 pajak panjang mesin halus surat lengkap body bagus harga 17jt nego`}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed outline-none transition resize-y font-normal"
        />

        {/* AI Error notification with Retry Button */}
        {aiError && (
          <div className="flex flex-col gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
            <button
              type="button"
              onClick={handleAIPolish}
              className="self-end px-3 py-1 bg-red-900/60 hover:bg-red-850 active:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* ✨ Rapikan dengan AI Button */}
        <button
          type="button"
          disabled={isPolishing || !description.trim()}
          onClick={handleAIPolish}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-orange-950/40 transition disabled:opacity-45 cursor-pointer"
        >
          {isPolishing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>✨ Sedang merapikan teks dengan AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              <span>✨ Rapikan dengan AI</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center leading-normal">
          AI langsung memodifikasi kolom di atas menjadi iklan rapi siap jual. Hasil AI tetap bisa Anda edit manual.
        </p>
      </div>

      {/* ---------------- 3. TOMBOL SIMPAN ---------------- */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isSaving || !description.trim()}
          onClick={handleSave}
          className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-45 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan ke IndexedDB...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>💾 Simpan Iklan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
