import React, { useState, useEffect, useRef } from 'react';
import { FiberType, TechnicianState } from '../types/fiber';
import { FIBER_SPECS } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import { 
  Zap, 
  Play, 
  RotateCcw, 
  Flame, 
  Eye, 
  Layers, 
  Thermometer, 
  Activity, 
  CheckCircle2, 
  Sparkles,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';

interface MacroFusionArcVisualizerProps {
  state: TechnicianState;
  isArcingActive?: boolean;
  onTriggerArc?: () => void;
  variant?: 'inline' | 'modal';
  onClose?: () => void;
}

export const MacroFusionArcVisualizer: React.FC<MacroFusionArcVisualizerProps> = ({
  state,
  isArcingActive = false,
  onTriggerArc,
  variant = 'inline',
  onClose,
}) => {
  const spec = FIBER_SPECS[state.fiberType];
  const [playProgress, setPlayProgress] = useState<number>(state.arcPerformed ? 100 : 0);
  const [isSimulating, setIsSimulating] = useState<boolean>(isArcingActive);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.5); // 0.5x slow motion for clear view
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'3d' | 'thermal' | 'physics'>('3d');

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sync with parent isArcingActive
  useEffect(() => {
    if (isArcingActive) {
      runArcAnimation();
    }
  }, [isArcingActive]);

  const runArcAnimation = () => {
    setIsSimulating(true);
    setPlayProgress(0);
    soundEffects.playArcDischarge(1.8);
    startTimeRef.current = performance.now();

    const duration = 2500 / speedMultiplier; // total animation time in ms

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPlayProgress(pct);

      if (pct < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSimulating(false);
        soundEffects.playSuccessBeep();
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleManualReplay = () => {
    soundEffects.playClick();
    runArcAnimation();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Compute physical parameters based on progress (0 to 100)
  // Stage 0-20%: Approach & pre-arc (temp: 25 -> 800°C)
  // Stage 20-70%: High-voltage main arc (temp: 800 -> 2050°C, plasma flash, glass softens)
  // Stage 70-85%: Fiber push & surface tension bridging (temp: 2050 -> 1600°C)
  // Stage 85-100%: Solidification & laser transmission (temp: 1600 -> 80°C)
  
  let temperature = 25;
  let arcIntensity = 0; // 0 to 1
  let glassSoftness = 0; // 0 (solid) to 1 (molten fluid)
  let fiberGap = 12; // microns
  let lightTransmission = 0; // 0 to 1

  if (playProgress < 20) {
    const t = playProgress / 20;
    temperature = Math.round(25 + t * 775);
    arcIntensity = t * 0.3;
    glassSoftness = t * 0.1;
    fiberGap = 12 - t * 2;
    lightTransmission = 0;
  } else if (playProgress < 70) {
    const t = (playProgress - 20) / 50;
    temperature = Math.round(800 + t * 1250); // up to 2050°C
    arcIntensity = 0.8 + Math.sin(t * Math.PI * 8) * 0.2; // flickering plasma
    glassSoftness = Math.min(1, 0.1 + t * 0.9);
    fiberGap = Math.max(0, 10 - t * 10);
    lightTransmission = t * 0.4;
  } else if (playProgress < 85) {
    const t = (playProgress - 70) / 15;
    temperature = Math.round(2050 - t * 450); // 1600°C
    arcIntensity = (1 - t) * 0.5;
    glassSoftness = 1 - t * 0.4;
    fiberGap = 0;
    lightTransmission = 0.4 + t * 0.4;
  } else {
    const t = (playProgress - 85) / 15;
    temperature = Math.round(1600 - t * 1520); // cools to 80°C
    arcIntensity = 0;
    glassSoftness = Math.max(0, (1 - t) * 0.6);
    fiberGap = 0;
    lightTransmission = 0.8 + t * 0.2; // 100% transmission
  }

  // Incandescent color gradient for melting glass
  const getMoltenGlassColor = (softness: number) => {
    if (softness < 0.1) return 'rgba(186, 230, 253, 0.4)'; // cool silica
    if (softness < 0.3) return 'rgba(239, 68, 68, 0.7)'; // dull cherry red
    if (softness < 0.6) return 'rgba(249, 115, 22, 0.9)'; // fiery orange
    if (softness < 0.9) return 'rgba(251, 191, 36, 0.95)'; // bright yellow
    return 'rgba(255, 255, 255, 0.98)'; // white-hot 2000°C plasma melt
  };

  return (
    <div className={`bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col ${variant === 'modal' ? 'shadow-2xl max-w-4xl w-full' : 'w-full'}`}>
      {/* Top Header / View Controller */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              Visualisasi Makro 3D: Pelelehan Kaca Silika &amp; Arc Plasma
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
                2000°C PAS FUSION
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Simulasi mikroskopis peleburan inti 9µm &amp; cladding 125µm akibat pelepasan muatan listrik elektroda tungsten.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setSpeedMultiplier(1)}
              className={`px-2 py-0.5 rounded ${speedMultiplier === 1 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1.0x (Real)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              className={`px-2 py-0.5 rounded ${speedMultiplier === 0.5 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              0.5x (Slow)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.25)}
              className={`px-2 py-0.5 rounded ${speedMultiplier === 0.25 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              0.25x (Macro)
            </button>
          </div>

          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 ${showAnnotations ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
          >
            <Info className="w-3 h-3" />
            Anotasi
          </button>

          <button
            onClick={handleManualReplay}
            disabled={isSimulating}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <Flame className="w-3.5 h-3.5 animate-bounce text-red-950" />
                Melelehkan...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                Picu Arc Pelelehan
              </>
            )}
          </button>

          {variant === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Macro Viewport Canvas / SVG Stage */}
      <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 h-72 sm:h-80 overflow-hidden flex items-center justify-center select-none">
        {/* Background Grid & Reticle */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Ambient Plasma Discharge Glow (Whole viewport flash) */}
        {arcIntensity > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-75"
            style={{
              background: `radial-gradient(circle at center, rgba(147, 197, 253, ${arcIntensity * 0.45}) 0%, rgba(59, 130, 246, ${arcIntensity * 0.2}) 40%, transparent 75%)`,
            }}
          />
        )}

        {/* SVG High-Definition 3D Optical Macro Render */}
        <svg 
          viewBox="0 0 800 320" 
          className="w-full h-full max-w-4xl"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* 3D Glass Cylindrical Gradient - Left Fiber */}
            <linearGradient id="glass3DLeft" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.9" />
              <stop offset="15%" stopColor="#64748b" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#94a3b8" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#64748b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
            </linearGradient>

            {/* 3D Glass Cylindrical Gradient - Right Fiber */}
            <linearGradient id="glass3DRight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.9" />
              <stop offset="15%" stopColor="#64748b" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#94a3b8" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#64748b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
            </linearGradient>

            {/* Tungsten Electrode Metallic Gradient */}
            <linearGradient id="electrodeTopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="40%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Molten Glow Filter */}
            <filter id="plasmaGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="15" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Laser Beam Core Glow */}
            <filter id="coreLaser" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. TOP TUNGSTEN ELECTRODE */}
          <g transform="translate(400, 10)">
            {/* Electrode Shaft */}
            <path
              d="M -14 0 L 14 0 L 7 50 L -7 50 Z"
              fill="url(#electrodeTopGrad)"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Tapered Tungsten Needle Tip */}
            <polygon
              points="-7,50 7,50 1.5,75 -1.5,75"
              fill={arcIntensity > 0.2 ? '#fef08a' : '#94a3b8'}
              stroke="#cbd5e1"
              strokeWidth="0.8"
              filter={arcIntensity > 0.2 ? 'url(#plasmaGlow)' : undefined}
            />
            {/* Tip incandescent glow */}
            {arcIntensity > 0.1 && (
              <circle cx="0" cy="75" r={6 + arcIntensity * 8} fill="#fef08a" opacity={arcIntensity} filter="url(#plasmaGlow)" />
            )}
            {showAnnotations && (
              <text x="25" y="40" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                Tungsten Electrode (Katoda 8kV)
              </text>
            )}
          </g>

          {/* 2. BOTTOM TUNGSTEN ELECTRODE */}
          <g transform="translate(400, 310)">
            {/* Tip */}
            <polygon
              points="-1.5,-75 1.5,-75 7,-50 -7,-50"
              fill={arcIntensity > 0.2 ? '#fef08a' : '#94a3b8'}
              stroke="#cbd5e1"
              strokeWidth="0.8"
              filter={arcIntensity > 0.2 ? 'url(#plasmaGlow)' : undefined}
            />
            {/* Shaft */}
            <path
              d="M -7 -50 L 7 -50 L 14 0 L -14 0 Z"
              fill="url(#electrodeTopGrad)"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {arcIntensity > 0.1 && (
              <circle cx="0" cy="-75" r={6 + arcIntensity * 8} fill="#fef08a" opacity={arcIntensity} filter="url(#plasmaGlow)" />
            )}
          </g>

          {/* 3. OPTICAL FIBERS (LEFT & RIGHT) */}
          {/* Fiber centerline is Y = 160 */}
          {/* Cladding is height 90px (representing 125µm) -> Y: 115 to 205 */}
          {/* Core is height 10px (representing 9µm) -> Y: 155 to 165 */}

          {/* Left Fiber Position */}
          {/* When melting and surface tension acts, gap closes from 12µm (approx 30px) to 0 */}
          {(() => {
            const currentGapPx = Math.max(0, fiberGap * 2.5); // gap in px
            const leftTipX = 400 - currentGapPx / 2;
            const rightTipX = 400 + currentGapPx / 2;
            const moltenColor = getMoltenGlassColor(glassSoftness);
            const isFused = playProgress >= 70;

            return (
              <g>
                {/* A. LEFT FIBER CLADDING (125µm Silica) */}
                <path
                  d={`M 60 115 L ${leftTipX - (glassSoftness > 0.4 ? 12 : 0)} 115 
                      Q ${leftTipX} 115, ${leftTipX} ${115 + (glassSoftness * 18)}
                      L ${leftTipX} ${205 - (glassSoftness * 18)}
                      Q ${leftTipX} 205, ${leftTipX - (glassSoftness > 0.4 ? 12 : 0)} 205
                      L 60 205 Z`}
                  fill="url(#glass3DLeft)"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                />

                {/* Left Fiber End Face Glass Curvature (Softening meniscus) */}
                {glassSoftness > 0.1 && !isFused && (
                  <path
                    d={`M ${leftTipX} 115 Q ${leftTipX + glassSoftness * 14} 160, ${leftTipX} 205`}
                    stroke={moltenColor}
                    strokeWidth="4"
                    fill="none"
                    filter="url(#plasmaGlow)"
                  />
                )}

                {/* B. RIGHT FIBER CLADDING (125µm Silica) */}
                <path
                  d={`M 740 115 L ${rightTipX + (glassSoftness > 0.4 ? 12 : 0)} 115 
                      Q ${rightTipX} 115, ${rightTipX} ${115 + (glassSoftness * 18)}
                      L ${rightTipX} ${205 - (glassSoftness * 18)}
                      Q ${rightTipX} 205, ${rightTipX + (glassSoftness > 0.4 ? 12 : 0)} 205
                      L 740 205 Z`}
                  fill="url(#glass3DRight)"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                />

                {/* Right Fiber End Face Glass Curvature */}
                {glassSoftness > 0.1 && !isFused && (
                  <path
                    d={`M ${rightTipX} 115 Q ${rightTipX - glassSoftness * 14} 160, ${rightTipX} 205`}
                    stroke={moltenColor}
                    strokeWidth="4"
                    fill="none"
                    filter="url(#plasmaGlow)"
                  />
                )}

                {/* C. FUSED JOINT BRIDGE (When melted silica unites via surface tension) */}
                {isFused && (
                  <g>
                    {/* Unified fused glass meniscus */}
                    <path
                      d={`M ${leftTipX - 8} 115 Q 400 ${115 + (1 - glassSoftness) * 2}, ${rightTipX + 8} 115
                          L ${rightTipX + 8} 205 Q 400 ${205 - (1 - glassSoftness) * 2}, ${leftTipX - 8} 205 Z`}
                      fill={glassSoftness > 0.4 ? moltenColor : 'url(#glass3DLeft)'}
                      opacity={glassSoftness > 0.4 ? 0.85 : 0.9}
                      filter={glassSoftness > 0.3 ? 'url(#plasmaGlow)' : undefined}
                    />

                    {/* Molecular lattice fusion glow line */}
                    {glassSoftness > 0.2 && (
                      <line
                        x1="400"
                        y1="117"
                        x2="400"
                        y2="203"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray={glassSoftness > 0.6 ? '4 2' : undefined}
                        filter="url(#plasmaGlow)"
                        opacity={glassSoftness}
                      />
                    )}
                  </g>
                )}

                {/* D. SINGLE-MODE CORES (9µm Germanium-doped Silica) */}
                {/* Left Core */}
                <rect
                  x="60"
                  y="156"
                  width={leftTipX - 60}
                  height="8"
                  fill="#ef4444"
                  opacity="0.85"
                  filter="url(#coreLaser)"
                />

                {/* Right Core */}
                <rect
                  x={rightTipX}
                  y="156"
                  width={740 - rightTipX}
                  height="8"
                  fill="#ef4444"
                  opacity={isFused ? 0.85 : 0.4}
                  filter="url(#coreLaser)"
                />

                {/* Continuous Light Signal Beam (Transmitting through fused core) */}
                {lightTransmission > 0 && (
                  <g filter="url(#coreLaser)">
                    {/* Golden laser core signal flowing */}
                    <line
                      x1="60"
                      y1="160"
                      x2={isFused ? '740' : leftTipX}
                      y2="160"
                      stroke="#fbbf24"
                      strokeWidth={3 + lightTransmission * 2}
                      strokeLinecap="round"
                    />
                    {/* High energy light pulses */}
                    <line
                      x1="60"
                      y1="160"
                      x2={isFused ? '740' : leftTipX}
                      y2="160"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* E. 3D CYLINDER SPECULAR HIGHLIGHT REFLECTION */}
                <line x1="60" y1="128" x2={leftTipX - 4} y2="128" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.45" />
                <line x1={rightTipX + 4} y1="128" x2="740" y2="128" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.45" />
                {isFused && (
                  <line x1="390" y1="128" x2="410" y2="128" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
                )}
              </g>
            );
          })()}

          {/* 4. HIGH-VOLTAGE ELECTRIC ARC (PLASMA DISCHARGE) */}
          {arcIntensity > 0 && (
            <g filter="url(#plasmaGlow)">
              {/* Central primary plasma lightning discharge */}
              <path
                d={`M 400 85 
                    Q ${395 + Math.sin(playProgress * 2.5) * 12} 120, ${400 + Math.cos(playProgress * 3) * 10} 160
                    Q ${402 - Math.sin(playProgress * 2.7) * 14} 200, 400 235`}
                stroke="#ffffff"
                strokeWidth={3.5 + arcIntensity * 3}
                fill="none"
              />

              {/* Cyan plasma aura */}
              <path
                d={`M 400 85 
                    Q ${404 - Math.cos(playProgress * 2) * 15} 120, ${398 + Math.sin(playProgress * 2) * 12} 160
                    Q ${396 + Math.cos(playProgress * 2.5) * 16} 200, 400 235`}
                stroke="#60a5fa"
                strokeWidth={7 + arcIntensity * 5}
                strokeOpacity={0.7}
                fill="none"
              />

              {/* Deep blue high-energy ionization cone */}
              <ellipse
                cx="400"
                cy="160"
                rx={18 + arcIntensity * 22}
                ry={55 + arcIntensity * 25}
                fill="#3b82f6"
                opacity={0.35 * arcIntensity}
              />

              {/* Molten thermal nucleus flash */}
              <circle
                cx="400"
                cy="160"
                r={10 + arcIntensity * 12}
                fill="#ffffff"
                opacity={0.9}
              />
            </g>
          )}

          {/* 5. ANNOTATIONS & PHYSICAL LABELS */}
          {showAnnotations && (
            <g className="text-[10px] font-mono select-none" fill="#94a3b8">
              {/* Core Label */}
              <line x1="210" y1="160" x2="210" y2="85" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
              <text x="215" y="82" fill="#ef4444" fontWeight="bold">
                Core SiO2:GeO2 (9µm)
              </text>

              {/* Cladding Label */}
              <line x1="140" y1="120" x2="140" y2="65" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
              <text x="145" y="62" fill="#38bdf8">
                Cladding Kaca Murni (125µm)
              </text>

              {/* Arc Center Plasma */}
              <circle cx="400" cy="160" r="3" fill="#f59e0b" />
              <text x="415" y="163" fill="#fbbf24" fontWeight="bold">
                {playProgress < 70 ? 'Zona Plasma 2000°C' : 'Sambungan Fusi Homogen'}
              </text>

              {/* Surface tension indicator */}
              {glassSoftness > 0.5 && (
                <text x="415" y="180" fill="#a7f3d0" fontSize="9">
                  Tegangan Permukaan (Self-Centering)
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Live Thermal Temperature Overlay Badge */}
        <div className="absolute top-3 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${temperature > 1500 ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">
              Suhu Zona Reaksi (Core)
            </span>
            <p className="text-lg font-mono font-black text-amber-300 leading-none mt-0.5">
              {temperature}°C
            </p>
          </div>
        </div>

        {/* Stage Status Badge */}
        <div className="absolute top-3 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold text-slate-200 uppercase">
            {playProgress < 20
              ? 'FASE 1: PRE-FUSE / EVAPORASI'
              : playProgress < 70
              ? 'FASE 2: PELEBURAN BUSUR PLASMA 2000°C'
              : playProgress < 85
              ? 'FASE 3: PENGGABUNGAN KAPILER & CORE SELF-ALIGN'
              : 'FASE 4: SOLIDIFIKASI & KONEKSI OPTIK OPTIMAL'}
          </span>
        </div>
      </div>

      {/* Interactive Physics Telemetry Dashboard & Progress Scrub */}
      <div className="bg-slate-900 p-4 border-t border-slate-800 space-y-3">
        {/* Progress Bar & Stage Indicator */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Progress Pelelehan: {Math.round(playProgress)}%</span>
            <span>Vikositas Kaca Silika: {glassSoftness > 0.7 ? 'Fluida Kental (Cair)' : glassSoftness > 0.2 ? 'Transisi Kaca Lunak' : 'Padat Kristal'}</span>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${playProgress}%` }}
            />
          </div>
        </div>

        {/* 4-Column Physics Metric Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* 1. Arc Current & Voltage */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase font-sans font-semibold block">Tegangan &amp; Arus Arc</span>
            <p className="text-sm font-bold text-amber-400 mt-0.5">
              {arcIntensity > 0 ? `${(14 + arcIntensity * 4.5).toFixed(1)} mA` : '0.0 mA'}
              <span className="text-[10px] text-slate-500 ml-1">/ 8.2 kV</span>
            </p>
            <span className="text-[9px] text-slate-500 font-sans">Elektroda Tungsten</span>
          </div>

          {/* 2. Gap Distance */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase font-sans font-semibold block">Celah Sambung (Z-Gap)</span>
            <p className="text-sm font-bold text-sky-400 mt-0.5">
              {fiberGap.toFixed(1)} µm
            </p>
            <span className="text-[9px] text-slate-500 font-sans">
              {fiberGap === 0 ? 'Kontak Fusi Penuh' : 'Jarak Celah Awal'}
            </span>
          </div>

          {/* 3. Surface Tension Self Alignment */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase font-sans font-semibold block">Tegangan Permukaan</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">
              {(glassSoftness * 300).toFixed(0)} mN/m
            </p>
            <span className="text-[9px] text-slate-500 font-sans">Gaya Koreksi Core Otomatis</span>
          </div>

          {/* 4. Optical Light Transmittance */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase font-sans font-semibold block">Transmisi Cahaya 1310nm</span>
            <p className="text-sm font-bold text-amber-300 mt-0.5">
              {(lightTransmission * 100).toFixed(0)}%
            </p>
            <span className="text-[9px] text-slate-500 font-sans">
              Loss: {state.arcPerformed ? `${state.estimatedLoss.toFixed(2)} dB` : 'Penyambungan berlangsung'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
