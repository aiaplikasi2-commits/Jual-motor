import React, { useState, useRef, useEffect } from 'react';
import { ViewMode } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  ArrowLeft,
  MoreVertical,
  Download,
  Upload,
  Smartphone,
  WifiOff,
  Settings,
  Coffee,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  storeName: string;
  isInstalled: boolean;
  onNavigate: (mode: ViewMode) => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
  onOpenSettings: () => void;
  onOpenBagiKopi: () => void;
  onOpenInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  storeName,
  isInstalled,
  onNavigate,
  onOpenBackup,
  onOpenRestore,
  onOpenSettings,
  onOpenBagiKopi,
  onOpenInstall,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-2">
          {viewMode !== 'list' && (
            <button
              onClick={() => onNavigate('list')}
              className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </button>
          )}

          <div
            onClick={() => onNavigate('list')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="text-2xl" role="img" aria-label="motor">
              🏍️
            </span>

            <div className="leading-tight flex flex-col justify-center">
              <h1 className="text-base font-black tracking-wider text-white uppercase truncate max-w-[200px]">
                {storeName || 'JAMHUR MOTOR'}
              </h1>
              <p className="text-[10px] font-medium text-orange-400 tracking-wide mt-0.5">
                IKLAN MOTOR ANDROID CEPAT
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Offline Indicator, Logo Kopi (Dipindahkan ke sini), dan Menu ⋮ */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-medium">
              <WifiOff className="w-3 h-3 text-amber-400" />
              Offline
            </span>
          )}

          {/* Logo Kopi menggantikan tombol iklan di atas */}
          <button
            type="button"
            onClick={onOpenBagiKopi}
            className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/40 border border-amber-500/30 text-amber-400 transition cursor-pointer flex items-center justify-center shadow-xs"
            title="Bagi Kopi (DANA / GoPay: 08179015181)"
            aria-label="Bagi Kopi"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
          </button>

          {/* Menu ⋮ */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition cursor-pointer"
              aria-label="Menu Opsi"
            >
              <MoreVertical className="w-5 h-5 text-slate-200" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-100">
                {/* Ganti Nama Usaha */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-700/70 active:bg-slate-700 flex items-center gap-3 text-sm font-medium transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-orange-400" />
                  <div>
                    <div>Ganti Nama Usaha</div>
                    <div className="text-[11px] text-slate-400">Ubah nama showroom</div>
                  </div>
                </button>

                <div className="border-t border-slate-700/60 my-1" />

                {/* Cadangkan Data */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-700/70 active:bg-slate-700 flex items-center gap-3 text-sm font-medium transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>Cadangkan Data (JSON)</div>
                    <div className="text-[11px] text-slate-400">Unduh data semua iklan</div>
                  </div>
                </button>

                {/* Pulihkan Data */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenRestore();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-700/70 active:bg-slate-700 flex items-center gap-3 text-sm font-medium transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <div>
                    <div>Pulihkan Data (JSON)</div>
                    <div className="text-[11px] text-slate-400">Impor iklan dari cadangan</div>
                  </div>
                </button>

                {/* Pasang Aplikasi */}
                {!isInstalled && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenInstall();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-orange-600/20 active:bg-orange-600/30 flex items-center gap-3 text-sm font-semibold text-orange-400 transition border-t border-slate-700/60 mt-1 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <div>
                      <div>Pasang Aplikasi</div>
                      <div className="text-[11px] text-orange-300/80">Install ke Layar Utama</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
