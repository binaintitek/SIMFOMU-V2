import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RealToolInfo } from '../utils/realToolsData';
import { 
  Wrench, 
  ShieldAlert, 
  Sparkles, 
  Maximize2, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  X
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface RealToolImageWithTooltipProps {
  toolInfo: RealToolInfo;
  aspectRatio?: string;
  onOpenModal?: () => void;
  showZoomButton?: boolean;
  className?: string;
  variant?: 'card' | 'modal' | 'compact';
}

export const RealToolImageWithTooltip: React.FC<RealToolImageWithTooltipProps> = ({
  toolInfo,
  aspectRatio = 'aspect-[4/3]',
  onOpenModal,
  showZoomButton = true,
  className = '',
  variant = 'card',
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'specs' | 'safety'>('all');

  // Reset img error on tool change
  React.useEffect(() => {
    setImgError(false);
    setIsHovered(false);
    setIsPinned(false);
  }, [toolInfo.stepId]);

  const showTooltip = isHovered || isPinned;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    setIsPinned(!isPinned);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // If zoom handler exists, call it unless user clicked a specific button
    if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <div
      id={`real-tool-image-container-${toolInfo.stepId}`}
      className={`relative ${aspectRatio} bg-slate-950 overflow-hidden select-none group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleImageClick}
      title="Arahkan kursor untuk melihat Spesifikasi & Tips Keselamatan K3"
    >
      {/* 1. Base Tool Photograph */}
      {!imgError ? (
        <img
          src={toolInfo.imageUrl}
          alt={toolInfo.altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-950 text-slate-400">
          <Wrench className="w-8 h-8 text-blue-400 mb-2 animate-pulse" />
          <p className="text-xs font-bold text-slate-200">{toolInfo.toolName}</p>
          <p className="text-[10px] text-slate-500 mt-1">{toolInfo.subtitle}</p>
        </div>
      )}

      {/* 2. Top-Left Badge: Feature Pill */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs border border-white/10 text-[9px] font-bold text-amber-300 shadow-sm pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
        <span>{toolInfo.badge}</span>
      </div>

      {/* 3. Top-Right / Corner Hover Cue Badge */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={handleTogglePin}
          title={isPinned ? 'Lepas Pin Tooltip' : 'Kunci / Tampilkan Tooltip Spek & K3'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all shadow-md cursor-pointer backdrop-blur-xs border ${
            showTooltip
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
              : 'bg-slate-950/80 text-amber-300 border-amber-500/30 hover:bg-slate-900 hover:text-amber-200'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span className="hidden xs:inline">{showTooltip ? 'Spek & K3 Aktif' : 'Spek & K3'}</span>
        </button>
      </div>

      {/* 4. Bottom Quick Action Controls (When tooltip is not covering completely) */}
      {!showTooltip && (
        <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between gap-1 pointer-events-none">
          {/* Subtle Hover Cue */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs border border-slate-700/60 text-[9px] text-slate-300 font-medium">
            <Info className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span>Arahkan kursor untuk info</span>
          </div>

          {/* Zoom Trigger Button */}
          {showZoomButton && onOpenModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal();
              }}
              title="Perbesar Foto Alat Riil Resolusi Tinggi"
              className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-slate-200 hover:text-white text-[10px] font-bold shadow-md transition-all cursor-pointer backdrop-blur-xs"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Perbesar</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Rich Hover Tooltip Overlay (Technical Specs & K3 Safety Tips) */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            key="tool-hover-tooltip"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-2.5 sm:p-3 flex flex-col justify-between overflow-y-auto border-t border-slate-700/80 cursor-default text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tooltip Header */}
            <div className="space-y-1.5 pb-2 border-b border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Step {toolInfo.stepNumber}
                    </span>
                    <h5 className="text-[11px] sm:text-xs font-black text-white truncate">
                      {toolInfo.toolName}
                    </h5>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-blue-400/90 font-mono truncate">
                    {toolInfo.brandModel}
                  </p>
                </div>

                {/* Close/Unpin button */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  title="Tutup / Lepas pin tooltip"
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Sub-tabs for quick focus */}
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ringkasan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    activeTab === 'specs'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Spesifikasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('safety')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    activeTab === 'safety'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tips K3
                </button>
              </div>
            </div>

            {/* Tooltip Body: Scrollable content */}
            <div className="my-1.5 space-y-2 overflow-y-auto pr-0.5 max-h-[145px] sm:max-h-[170px] text-[10px]">
              {/* Section 1: Technical Specs */}
              {(activeTab === 'all' || activeTab === 'specs') && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-cyan-400">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Spesifikasi Teknis Alat:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {toolInfo.technicalSpecs.slice(0, 4).map((spec, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded-md bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                      >
                        <span className="text-[8px] text-slate-400 font-medium leading-tight">
                          {spec.label}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-200 font-mono leading-tight mt-0.5">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: K3 Safety & Work Protection Tips */}
              {(activeTab === 'all' || activeTab === 'safety') && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-400">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    <span>Tips Keselamatan K3 (Telkom Akses):</span>
                  </div>

                  {/* Primary Warning Box */}
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[9.5px] leading-snug font-medium text-amber-200">
                        {toolInfo.safetyTip}
                      </p>
                    </div>

                    {/* Secondary Guidelines Bullet points */}
                    {toolInfo.safetyGuidelines && toolInfo.safetyGuidelines.length > 0 && (
                      <ul className="pt-1 border-t border-amber-500/20 space-y-0.5">
                        {toolInfo.safetyGuidelines.slice(0, 2).map((guide, gIdx) => (
                          <li key={gIdx} className="flex items-start gap-1 text-[8.5px] text-amber-300/90">
                            <span className="text-amber-400 font-bold shrink-0">•</span>
                            <span className="leading-tight">{guide}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tooltip Footer Actions */}
            <div className="pt-1.5 border-t border-slate-800/90 flex items-center justify-between gap-1 text-[9px]">
              <span className="text-slate-500 truncate">
                {isPinned ? '📌 Tooltip dipin' : 'Kursor keluar untuk menutup'}
              </span>

              {onOpenModal && (
                <button
                  type="button"
                  onClick={onOpenModal}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span>Foto HD</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
