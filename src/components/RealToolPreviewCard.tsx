import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplicingStep } from '../types/fiber';
import { REAL_TOOLS_DATA, RealToolInfo } from '../utils/realToolsData';
import { soundEffects } from '../utils/audio';
import { RealToolImageWithTooltip } from './RealToolImageWithTooltip';
import { 
  Maximize2, 
  X, 
  Wrench, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';

interface RealToolPreviewCardProps {
  currentStep: SplicingStep;
  layoutMode?: 'sidebar' | 'inline' | 'compact';
  className?: string;
  onOpenModalExternal?: () => void;
}

export const RealToolPreviewCard: React.FC<RealToolPreviewCardProps> = ({
  currentStep,
  layoutMode = 'sidebar',
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const toolInfo: RealToolInfo = REAL_TOOLS_DATA[currentStep] || REAL_TOOLS_DATA.stripping;

  // Reset img error on step change
  React.useEffect(() => {
    setImgError(false);
  }, [currentStep]);

  const handleOpenModal = () => {
    soundEffects.playClick();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    soundEffects.playClick();
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Container Card */}
      <div
        id={`real-tool-card-${currentStep}`}
        className={`rounded-xl border border-slate-700/80 bg-slate-900/90 overflow-hidden shadow-md transition-all duration-200 group ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Header Ribbon */}
            <div className="px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200 truncate">
                  Alat Riil Praktikum
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                Langkah {toolInfo.stepNumber}
              </span>
            </div>

            {/* Real Tool Photo with Hover-Tooltip & Zoom Overlay */}
            <RealToolImageWithTooltip
              toolInfo={toolInfo}
              aspectRatio="aspect-[4/3]"
              onOpenModal={handleOpenModal}
              showZoomButton={true}
              className="border-b border-slate-800"
            />

            {/* Tool Info Content */}
            <div className="p-3 space-y-2">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-black text-white tracking-tight leading-snug">
                    {toolInfo.toolName}
                  </h4>
                </div>
                <p className="text-[10px] font-medium text-blue-400/90 font-mono leading-tight">
                  {toolInfo.brandModel}
                </p>
              </div>

              {/* Concise Functional Description */}
              <p className="text-[11px] text-slate-300/90 leading-relaxed font-sans line-clamp-3">
                {toolInfo.description}
              </p>

              {/* Key Indicators List (e.g. Notches, Blade, Electrodes) */}
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5 text-blue-400" />
                  <span>Bagian Kunci & Indikator:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {toolInfo.keyIndicators.map((ind, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={handleOpenModal}
                      title={`${ind.label}: ${ind.description}`}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9px] font-semibold text-slate-300 hover:text-blue-300 transition-colors text-left truncate max-w-full"
                    >
                      <span className="text-blue-400 font-mono font-bold mr-1">#{idx + 1}</span>
                      {ind.badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* High-Resolution Modal View */}
      {isModalOpen && (
        <div 
          id="real-tool-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono font-bold border border-blue-400/30">
                      STEP {toolInfo.stepNumber}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white truncate">
                      {toolInfo.toolName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {toolInfo.brandModel} • {toolInfo.category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-tool-modal"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Tutup Preview Alat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Main Photo View with Hover-Tooltip */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <RealToolImageWithTooltip
                  toolInfo={toolInfo}
                  aspectRatio="aspect-video"
                  showZoomButton={false}
                  variant="modal"
                  className="w-full"
                />
              </div>

              {/* Functional Description */}
              <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Fungsi & Prinsip Kerja Alat</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {toolInfo.description}
                </p>
              </div>

              {/* Key Indicators / Notches / Parts */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Bagian Kunci & Indikator Teknis</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {toolInfo.keyIndicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white leading-tight">
                          {ind.label}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {ind.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {ind.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spesifikasi Standar Industri</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {toolInfo.technicalSpecs.map((spec, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-medium">{spec.label}</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOP Handling Tip */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-amber-200 block font-bold mb-0.5">
                    Tips SOP Telkom Akses / K3 Industri:
                  </strong>
                  {toolInfo.sopTip}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                OptiSim Fiber Pro • Standar SOP Telkom Akses
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface RealToolButtonProps {
  currentStep: SplicingStep;
  className?: string;
  variant?: 'badge' | 'compact' | 'button';
}

export const RealToolButton: React.FC<RealToolButtonProps> = ({
  currentStep,
  className = '',
  variant = 'badge',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toolInfo = REAL_TOOLS_DATA[currentStep] || REAL_TOOLS_DATA.stripping;

  return (
    <>
      <button
        type="button"
        id={`btn-view-real-tool-${currentStep}`}
        onClick={() => {
          soundEffects.playClick();
          setIsOpen(true);
        }}
        title={`Buka Foto & Spesifikasi Alat Riil: ${toolInfo.toolName}`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer group shrink-0 ${
          variant === 'compact'
            ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white'
            : 'bg-blue-950/40 hover:bg-blue-900/50 border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-white shadow-sm'
        } ${className}`}
      >
        <Wrench className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-slate-400 font-normal">Alat Riil:</span>
        <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
          {toolInfo.toolName}
        </span>
        <Maximize2 className="w-3 h-3 text-blue-400/80 group-hover:text-blue-300 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <RealToolPreviewModalDirect
          currentStep={currentStep}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export const RealToolPreviewModalDirect: React.FC<{
  currentStep: SplicingStep;
  onClose: () => void;
}> = ({ currentStep, onClose }) => {
  const [imgError, setImgError] = useState(false);
  const toolInfo = REAL_TOOLS_DATA[currentStep] || REAL_TOOLS_DATA.stripping;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono font-bold border border-blue-400/30">
                  STEP {toolInfo.stepNumber}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {toolInfo.toolName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {toolInfo.brandModel} • {toolInfo.category}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Tutup Preview Alat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Main Photo View with Hover-Tooltip */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <RealToolImageWithTooltip
              toolInfo={toolInfo}
              aspectRatio="aspect-[16/10]"
              showZoomButton={false}
              className="w-full"
            />
          </div>

          {/* Functional Description */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Fungsi & Prinsip Kerja Alat</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {toolInfo.description}
            </p>
          </div>

          {/* Key Indicators / Notches / Parts */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Bagian Kunci & Indikator Teknis</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {toolInfo.keyIndicators.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white leading-tight">
                      {ind.label}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {ind.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {ind.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Spesifikasi Standar Industri</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {toolInfo.technicalSpecs.map((spec, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-medium">{spec.label}</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SOP Handling Tip */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-amber-200 block font-bold mb-0.5">
                Tips SOP Telkom Akses:
              </strong>
              {toolInfo.sopTip}
            </div>
          </div>

          {/* Dedicated K3 Occupational Health & Safety Alert Box */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs leading-relaxed">
              <strong className="text-rose-300 block font-bold">
                Peringatan Keselamatan K3 Khusus:
              </strong>
              <p className="text-rose-200/90">{toolInfo.safetyTip}</p>
              {toolInfo.safetyGuidelines && toolInfo.safetyGuidelines.length > 0 && (
                <ul className="pt-1.5 border-t border-rose-500/20 space-y-1">
                  {toolInfo.safetyGuidelines.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-rose-300/90">
                      <span className="text-rose-400 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            OptiSim Fiber Pro • Standar SOP Telkom Akses
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};
