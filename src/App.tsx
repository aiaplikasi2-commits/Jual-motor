import React, { useState, useEffect, useCallback } from 'react';
import { MotorAd, ViewMode } from './types';
import { getAllAds, saveAd, deleteAd } from './db/indexedDB';
import { Header } from './components/Header';
import { AdCard } from './components/AdCard';
import { AdForm } from './components/AdForm';
import { AdDetail } from './components/AdDetail';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { SettingsModal } from './components/SettingsModal';
import { BagiKopiModal } from './components/BagiKopiModal';
import { ShareModal } from './components/ShareModal';
import { InstallModal } from './components/InstallModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Plus, Home, Sparkles, WifiOff } from 'lucide-react';

export default function App() {
  const [ads, setAds] = useState<MotorAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAd, setSelectedAd] = useState<MotorAd | null>(null);
  const [editingAd, setEditingAd] = useState<MotorAd | null>(null);
  const [sharingAd, setSharingAd] = useState<MotorAd | null>(null);

  // Store name customization
  const [storeName, setStoreName] = useState<string>(() => {
    try {
      return localStorage.getItem('jamhur_store_name') || 'JAMHUR MOTOR';
    } catch {
      return 'JAMHUR MOTOR';
    }
  });

  // Modal states
  const [modalType, setModalType] = useState<'backup' | 'restore' | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBagiKopiModal, setShowBagiKopiModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Auto-prompt to install application if not installed yet
  useEffect(() => {
    if (!isInstalled) {
      const alreadyDismissed = sessionStorage.getItem('jamhur_install_prompt_dismissed');
      if (!alreadyDismissed) {
        const timer = setTimeout(() => {
          setShowInstallModal(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstalled]);

  const handleCloseInstallModal = () => {
    sessionStorage.setItem('jamhur_install_prompt_dismissed', 'true');
    setShowInstallModal(false);
  };

  const handleSaveStoreName = (newName: string) => {
    setStoreName(newName);
    try {
      localStorage.setItem('jamhur_store_name', newName);
    } catch (e) {
      console.warn('Failed saving store name to localStorage:', e);
    }
  };

  // Load Ads from IndexedDB
  const refreshAds = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllAds();
      setAds(data);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data dari IndexedDB.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshAds();
  }, [refreshAds]);

  // Navigation handlers
  const handleNavigate = (mode: ViewMode) => {
    if (mode === 'create') {
      setEditingAd(null);
    }
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAd = (ad: MotorAd) => {
    setSelectedAd(ad);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditAd = (ad: MotorAd) => {
    setEditingAd(ad);
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save handler
  const handleSaveAd = async (ad: MotorAd) => {
    await saveAd(ad);
    await refreshAds();
    setSelectedAd(ad);
    setViewMode('detail');
    showToast('💾 Iklan motor berhasil disimpan!');
  };

  // Update in Detail handler
  const handleUpdateAd = async (ad: MotorAd) => {
    await saveAd(ad);
    setSelectedAd(ad);
    await refreshAds();
  };

  // Delete handler
  const handleDeleteAd = async (id: string) => {
    await deleteAd(id);
    await refreshAds();
    setSelectedAd(null);
    setViewMode('list');
  };

  // Quick Seed Sample
  const handleSeedSample = async () => {
    const sampleAd: MotorAd = {
      id: 'ad_sample_vario',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: [],
      description: `🏍️ Honda Vario 125 CBS ISS Tahun 2021

Kondisi mesin sangat halus & kering, tarikan enteng, body mulus terawat, kelistrikan normal semua.
Surat-surat lengkap (BPKB, STNK, Faktur) dan pajak hidup panjang.

💰 Harga: Rp17.500.000 (Nego Santai)
📍 Lokasi: ${storeName} (Bisa cek unit langsung)

Siap pakai untuk mobilitas harian tanpa kendala!`,
    };
    await saveAd(sampleAd);
    await refreshAds();
    showToast('Contoh iklan motor berhasil dimuat!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline — Semua data tersimpan aman di HP Anda.</span>
        </div>
      )}

      {/* Main Header with Bagi Kopi logo neatly beside the store name */}
      <Header
        viewMode={viewMode}
        storeName={storeName}
        isInstalled={isInstalled}
        onNavigate={handleNavigate}
        onOpenBackup={() => setModalType('backup')}
        onOpenRestore={() => setModalType('restore')}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenBagiKopi={() => setShowBagiKopiModal(true)}
        onOpenInstall={() => setShowInstallModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {/* ================= HALAMAN UTAMA (LIST) ================= */}
        {viewMode === 'list' && (
          <div className="p-4 pb-28 space-y-4">
            {/* Top Action: [ + Tambah Iklan ] */}
            <div className="pt-1">
              <button
                onClick={() => handleNavigate('create')}
                className="w-full py-4 px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 active:scale-[0.99] text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-950/50 transition cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                <span>+ Tambah Iklan</span>
              </button>
            </div>

            {/* Install PWA Prompt Banner if not installed */}
            {!isInstalled && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/60 to-slate-800/80 border border-orange-500/30 flex items-center justify-between gap-3 shadow">
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📲 Pasang {storeName} di HP</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Akses cepat langsung dari layar utama Android
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shrink-0 shadow transition cursor-pointer"
                >
                  Pasang
                </button>
              </div>
            )}

            {/* Ads List Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Iklan ({ads.length})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Tersimpan di IndexedDB
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Memuat iklan motor...</p>
                </div>
              ) : ads.length > 0 ? (
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onSelect={handleSelectAd}
                      onEdit={handleEditAd}
                      onShare={(targetAd) => setSharingAd(targetAd)}
                      onToast={showToast}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 px-4 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-4">
                  <div className="text-5xl">🏍️</div>
                  <div>
                    <h3 className="text-base font-bold text-white">Belum Ada Iklan Motor</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Sentuh tombol <strong>+ Tambah Iklan</strong> di atas untuk membuat iklan baru dengan foto dan AI.
                    </p>
                  </div>
                  <button
                    onClick={handleSeedSample}
                    className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 hover:bg-orange-500/20 px-3 py-2 rounded-xl transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Muat Contoh Iklan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAMBAH / EDIT IKLAN ================= */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <AdForm
            initialAd={editingAd}
            storeName={storeName}
            onSave={handleSaveAd}
            onCancel={() => {
              if (editingAd) {
                setSelectedAd(editingAd);
                setViewMode('detail');
              } else {
                setViewMode('list');
              }
            }}
            onToast={showToast}
          />
        )}

        {/* ================= DETAIL IKLAN ================= */}
        {viewMode === 'detail' && selectedAd && (
          <AdDetail
            ad={selectedAd}
            storeName={storeName}
            onEdit={handleEditAd}
            onDelete={handleDeleteAd}
            onUpdate={handleUpdateAd}
            onBack={() => setViewMode('list')}
            onToast={showToast}
          />
        )}
      </main>

      {/* ================= BOTTOM SINGLE-HAND ANDROID NAV (Presisi 2 Tombol) ================= */}
      {viewMode === 'list' && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2.5 px-6 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-around">
            <button
              onClick={() => handleNavigate('list')}
              className="flex flex-col items-center gap-1 text-orange-500 font-bold text-xs"
            >
              <Home className="w-5 h-5" />
              <span>🏠 Iklan</span>
            </button>

            <button
              onClick={() => handleNavigate('create')}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-400 active:scale-95 text-xs font-semibold transition"
            >
              <Plus className="w-5 h-5 text-orange-400" />
              <span>➕ Tambah</span>
            </button>
          </div>
        </nav>
      )}

      {/* Pop Up Perintah Install Aplikasi (jika belum install) */}
      {showInstallModal && (
        <InstallModal
          storeName={storeName}
          isInstallable={isInstallable}
          isIOS={isIOS}
          onInstall={install}
          onClose={handleCloseInstallModal}
        />
      )}

      {/* Share Modal (WhatsApp with photos & FB Marketplace with gallery) */}
      {sharingAd && (
        <ShareModal
          ad={sharingAd}
          onClose={() => setSharingAd(null)}
          onToast={showToast}
        />
      )}

      {/* Backup / Restore Modal */}
      {modalType && (
        <BackupRestoreModal
          type={modalType}
          onClose={() => setModalType(null)}
          onRefreshAds={refreshAds}
          onToast={showToast}
        />
      )}

      {/* Settings Modal (Ganti Nama Usaha) */}
      {showSettingsModal && (
        <SettingsModal
          currentStoreName={storeName}
          onSave={handleSaveStoreName}
          onClose={() => setShowSettingsModal(false)}
          onToast={showToast}
        />
      )}

      {/* Bagi Kopi Modal (DANA / GoPay) */}
      {showBagiKopiModal && (
        <BagiKopiModal
          onClose={() => setShowBagiKopiModal(false)}
          onToast={showToast}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="max-w-xs bg-slate-800/95 text-white border border-slate-600/80 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold text-center backdrop-blur-md">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
