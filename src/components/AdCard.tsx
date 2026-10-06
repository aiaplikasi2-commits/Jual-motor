import React from 'react';
import { MotorAd } from '../types';
import { Edit3, Share2, Image as ImageIcon } from 'lucide-react';

interface AdCardProps {
  ad: MotorAd;
  onSelect: (ad: MotorAd) => void;
  onEdit: (ad: MotorAd) => void;
  onShare: (ad: MotorAd) => void;
  onToast: (msg: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  onSelect,
  onEdit,
  onShare,
}) => {
  const primaryPhoto = ad.photos?.[0] || null;
  const photoCount = ad.photos?.length || 0;

  // Extract snippet for display: title or first lines
  const cleanDesc = (ad.description || '').trim();
  const firstLine = cleanDesc.split('\n')[0] || 'Iklan Motor';
  const snippet = cleanDesc.length > 120 ? cleanDesc.slice(0, 117) + '...' : cleanDesc;

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(ad);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(ad);
  };

  return (
    <div
      onClick={() => onSelect(ad)}
      className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl overflow-hidden shadow-lg transition active:scale-[0.99] cursor-pointer flex flex-col"
    >
      {/* Primary Photo Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={firstLine}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-1 p-6">
            <ImageIcon className="w-10 h-10 text-slate-600" />
            <span className="text-xs font-medium">Belum ada foto</span>
          </div>
        )}

        {/* Photo count badge */}
        {photoCount > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
            <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>{photoCount} foto</span>
          </div>
        )}
      </div>

      {/* Snippet Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white line-clamp-1 leading-snug">
            {firstLine || 'Iklan Motor'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line">
            {snippet || 'Tidak ada keterangan motor.'}
          </p>
        </div>

        {/* Action Buttons: [ Edit ] [ Bagikan ] */}
        <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
          <button
            type="button"
            onClick={handleEditClick}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Edit3 className="w-4 h-4 text-orange-400" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
