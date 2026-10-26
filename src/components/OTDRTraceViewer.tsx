import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiberType } from '../types/fiber';
import { 
  generateOTDRTrace, 
  getPointLevelAtDistance, 
  OTDREvent, 
  FIBER_ATTENUATION_RATES 
} from '../utils/otdr';
import { soundEffects } from '../utils/audio';
import { 
  Activity, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  Sliders, 
  Zap,
  Info,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface OTDRTraceViewerProps {
  loss: number; // in dB
  isArcPerformed: boolean;
  fiberType?: FiberType;
  defectType?: string;
  variant?: 'compact' | 'full';
  onOpenFullModal?: () => void;
  traineeName?: string;
  traineeId?: string;
  maxAllowedLoss?: number;
  dynamicDifficulty?: 'easy' | 'normal' | 'hard';
}

export const OTDRTraceViewer: React.FC<OTDRTraceViewerProps> = ({
  loss,
  isArcPerformed,
  fiberType = 'G652D_SM',
  defectType = 'none',
  variant = 'full',
  onOpenFullModal,
  traineeName,
  traineeId,
  maxAllowedLoss,
  dynamicDifficulty = 'normal',
}) => {
  // Instrument controls
  const [wavelength, setWavelength] = useState<1310 | 1550 | 850>(
    fiberType === 'OM3_MM' ? 850 : 1310
  );
  const [pulseWidth, setPulseWidth] = useState<10 | 30 | 100>(30);
  const [zoomMode, setZoomMode] = useState<'full' | 'splice'>('full');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);

  // Markers
  const [activeMarker, setActiveMarker] = useState<'A' | 'B'>('A');
  const [markerAPos, setMarkerAPos] = useState<number>(1.12); // km (pre-splice)
  const [markerBPos, setMarkerBPos] = useState<number>(1.38); // km (post-splice)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(2);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Optical Link Constants
  const totalDistanceKm = 2.5;
  const spliceDistanceKm = 1.25;
  const effectiveLoss = isArcPerformed ? loss : 0.02;

  // Generate trace points and events
  const { points, events, totalLinkLossDb } = useMemo(() => {
    return generateOTDRTrace({
      wavelength,
      pulseWidthNs: pulseWidth,
      totalDistanceKm,
      spliceDistanceKm,
      spliceLossDb: effectiveLoss,
      fiberType,
      isArcPerformed,
      defectType,
    });
  }, [wavelength, pulseWidth, totalDistanceKm, spliceDistanceKm, effectiveLoss, fiberType, isArcPerformed, defectType]);

  // Handle Laser Acquisition Scan
  const triggerLaserAcquisition = () => {
    soundEffects.playLaserPulse();
    setIsScanning(true);
    setScanProgress(0);

    const startTime = Date.now();
    const duration = 1200; // 1.2s sweep

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        soundEffects.playSuccessBeep();
      }
    }, 30);
  };

  // Marker values
  const markerALevel = useMemo(() => getPointLevelAtDistance(markerAPos, points), [markerAPos, points]);
  const markerBLevel = useMemo(() => getPointLevelAtDistance(markerBPos, points), [markerBPos, points]);

  const deltaDistance = Math.abs(markerBPos - markerAPos);
  const deltaLoss = Math.abs(markerALevel - markerBLevel);
  const slope = FIBER_ATTENUATION_RATES[wavelength] || 0.34;
  // 2-point step loss removing fiber attenuation
  const measuredSpliceLoss = Math.max(0, deltaLoss - (deltaDistance * slope));
  const activeTolerance = typeof maxAllowedLoss === 'number' && maxAllowedLoss > 0
    ? maxAllowedLoss
    : (fiberType === 'OM3_MM' || fiberType === 'OM4_MM' ? 0.10 : 0.05);
  const isTelkomPass = effectiveLoss <= activeTolerance;

  // Snap markers directly around the splice point
  const handleSnapToSplice = () => {
    soundEffects.playCursorMove();
    setMarkerAPos(1.15);
    setMarkerBPos(1.35);
    setSelectedEventId(2);
  };

  // Graph coordinate mapping
  const graphWidth = variant === 'compact' ? 280 : 700;
  const graphHeight = variant === 'compact' ? 140 : 280;
  const padding = variant === 'compact' ? { top: 15, right: 15, bottom: 25, left: 35 } : { top: 25, right: 30, bottom: 35, left: 55 };

  const plotWidth = graphWidth - padding.left - padding.right;
  const plotHeight = graphHeight - padding.top - padding.bottom;

  // View ranges
  const minKm = zoomMode === 'splice' ? 0.95 : 0.0;
  const maxKm = zoomMode === 'splice' ? 1.55 : totalDistanceKm + 0.15;
  const minDb = zoomMode === 'splice' ? -2.5 : -28.0;
  const maxDb = zoomMode === 'splice' ? 1.0 : 5.0;

  const kmToX = (km: number) => {
    const clamped = Math.max(minKm, Math.min(maxKm, km));
    return padding.left + ((clamped - minKm) / (maxKm - minKm)) * plotWidth;
  };

  const dbToY = (db: number) => {
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return padding.top + ((maxDb - clamped) / (maxDb - minDb)) * plotHeight;
  };

  const xToKm = (x: number) => {
    const ratio = (x - padding.left) / plotWidth;
    const km = minKm + ratio * (maxKm - minKm);
    return Math.max(0, Math.min(totalDistanceKm, km));
  };

  // Handle Graph Click to move active marker
  const handleGraphClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetKm = Number(xToKm(clickX).toFixed(2));

    soundEffects.playCursorMove();
    if (activeMarker === 'A') {
      setMarkerAPos(targetKm);
    } else {
      setMarkerBPos(targetKm);
    }
  };

  // Generate SVG path for trace
  const tracePathData = useMemo(() => {
    const visiblePoints = points.filter(p => p.distanceKm >= minKm - 0.05 && p.distanceKm <= maxKm + 0.05);
    if (visiblePoints.length === 0) return '';

    return visiblePoints.reduce((acc, pt, idx) => {
      const x = kmToX(pt.distanceKm).toFixed(1);
      const y = dbToY(pt.levelDb).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [points, minKm, maxKm, kmToX, dbToY]);

  // Area under curve for subtle gradient fill
  const areaPathData = useMemo(() => {
    if (!tracePathData) return '';
    const lastX = kmToX(points[points.length - 1]?.distanceKm || maxKm).toFixed(1);
    const bottomY = (padding.top + plotHeight).toFixed(1);
    const firstX = kmToX(points[0]?.distanceKm || minKm).toFixed(1);
    return `${tracePathData} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [tracePathData, points, minKm, maxKm, padding, plotHeight, kmToX]);

  // ==========================================
  // COMPACT VARIANT (For AccuracySidebar)
  // ==========================================
  if (variant === 'compact') {
    return (
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-200">Trace OTDR Titik Sambung</h3>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
            {wavelength} nm
          </span>
        </div>

        {/* Mini SVG Trace */}
        <div className="relative bg-[#070b14] rounded-xl border border-slate-800/80 overflow-hidden p-1 shadow-inner">
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="w-full h-auto select-none"
          >
            {/* Grid lines */}
            <line x1={kmToX(0)} y1={dbToY(0)} x2={kmToX(totalDistanceKm)} y2={dbToY(0)} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={kmToX(0)} y1={dbToY(-10)} x2={kmToX(totalDistanceKm)} y2={dbToY(-10)} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={kmToX(0)} y1={dbToY(-20)} x2={kmToX(totalDistanceKm)} y2={dbToY(-20)} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={kmToX(spliceDistanceKm)} y1={padding.top} x2={kmToX(spliceDistanceKm)} y2={padding.top + plotHeight} stroke="#0ea5e9" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.4" />

            {/* Trace path */}
            <path d={tracePathData} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Splice Drop Marker Point */}
            <circle cx={kmToX(spliceDistanceKm)} cy={dbToY(-0.42 - effectiveLoss)} r="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />

            {/* Loss callout tag */}
            <g transform={`translate(${kmToX(spliceDistanceKm) + 8}, ${dbToY(-0.42 - effectiveLoss) - 10})`}>
              <rect width="64" height="18" rx="4" fill={isTelkomPass ? '#064e3b' : '#881337'} stroke={isTelkomPass ? '#10b981' : '#f43f5e'} strokeWidth="1" />
              <text x="32" y="12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                -{effectiveLoss.toFixed(2)} dB
              </text>
            </g>

            {/* Distance labels */}
            <text x={kmToX(0)} y={graphHeight - 6} fill="#64748b" fontSize="8" fontFamily="monospace">0.0km</text>
            <text x={kmToX(spliceDistanceKm)} y={graphHeight - 6} textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">1.25km (Fusi)</text>
            <text x={kmToX(totalDistanceKm)} y={graphHeight - 6} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">2.5km</text>
          </svg>
        </div>

        {/* Quick Readout */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Redaman Sambungan</span>
            <span className={`font-mono font-bold text-xs ${isTelkomPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {effectiveLoss.toFixed(2)} dB
            </span>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Kesesuaian Toleransi</span>
            <span className={`font-bold text-xs flex items-center gap-1 ${isTelkomPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTelkomPass ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  LULUS (≤ {activeTolerance.toFixed(2)} dB)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  GAGAL (&gt; {activeTolerance.toFixed(2)} dB)
                </>
              )}
            </span>
          </div>
        </div>

        {/* Expand button */}
        {onOpenFullModal && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenFullModal();
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Perbesar / Analisis OTDR Lengkap</span>
          </button>
        )}
      </div>
    );
  }

  // ==========================================
  // FULL VARIANT (For AssessmentCertificate & Modal)
  // ==========================================
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-0 print:border-slate-300 print:bg-white print:text-black">
      {/* Instrument Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:border-slate-300 print:bg-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white print:text-black">
                Visualisasi Trace OTDR (Optical Time-Domain Reflectometer)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isTelkomPass
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isTelkomPass ? `STANDAR LULUS (≤ ${activeTolerance.toFixed(2)} dB)` : `REDAMAN MELEBIHI TOLERANSI (> ${activeTolerance.toFixed(2)} dB)`}
              </span>
              {dynamicDifficulty && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono tracking-wider ${
                  dynamicDifficulty === 'hard'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : dynamicDifficulty === 'easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {dynamicDifficulty === 'hard' ? '⚡ HARD MODE' : dynamicDifficulty === 'easy' ? '🌱 EASY MODE' : 'STANDAR SOP'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Reflektometri domain waktu optik untuk verifikasi redaman fusi di Titik Sambung Km {spliceDistanceKm.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Instrument Controls (Wavelength & Laser Fire) */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {/* Wavelength Switch */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setWavelength(1310);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                wavelength === 1310
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1310 nm
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setWavelength(1550);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                wavelength === 1550
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1550 nm
            </button>
          </div>

          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setZoomMode(zoomMode === 'full' ? 'splice' : 'full');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {zoomMode === 'full' ? (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zoom Sambungan (4x)</span>
              </>
            ) : (
              <>
                <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
                <span>Link Lengkap (1x)</span>
              </>
            )}
          </button>

          {/* Trigger Laser Sweep */}
          <button
            type="button"
            disabled={isScanning}
            onClick={triggerLaserAcquisition}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'fill-white'}`} />
            <span>{isScanning ? 'Memindai...' : 'Tes Laser OTDR'}</span>
          </button>
        </div>
      </div>

      {/* Main Oscilloscope / OTDR CRT Display Screen */}
      <div className="p-4 sm:p-6 bg-[#060a13] relative overflow-hidden print:bg-white">
        {/* Top Telecommunication Status Strip */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1 flex-wrap gap-2 print:text-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <strong className="text-slate-200 print:text-black">LASER:</strong> {wavelength} nm (±20nm)
            </span>
            <span>
              <strong className="text-slate-200 print:text-black">PULSE:</strong> {pulseWidth} ns
            </span>
            <span className="hidden sm:inline">
              <strong className="text-slate-200 print:text-black">IOR:</strong> 1.4677
            </span>
            <span className="hidden sm:inline">
              <strong className="text-slate-200 print:text-black">SLOPE:</strong> {slope.toFixed(2)} dB/km
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">
              Event 2: Sambungan Fusi = -{effectiveLoss.toFixed(2)} dB
            </span>
            <button
              type="button"
              onClick={handleSnapToSplice}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer print:hidden"
            >
              <Crosshair className="w-3 h-3" />
              Kunci Marker A/B
            </button>
          </div>
        </div>

        {/* SVG Display Canvas */}
        <div className="relative rounded-2xl bg-[#040711] border border-slate-800 print:border-slate-300 overflow-hidden shadow-inner select-none">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            onClick={handleGraphClick}
            className="w-full h-auto cursor-crosshair"
          >
            <defs>
              <linearGradient id="otdrTraceGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Lines - Horizontal (dB) */}
            {[-25, -20, -15, -10, -5, 0].map((dbVal) => (
              <g key={`grid-y-${dbVal}`}>
                <line
                  x1={padding.left}
                  y1={dbToY(dbVal)}
                  x2={padding.left + plotWidth}
                  y2={dbToY(dbVal)}
                  stroke="#172236"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={dbToY(dbVal) + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {dbVal} dB
                </text>
              </g>
            ))}

            {/* Grid Lines - Vertical (km) */}
            {(zoomMode === 'splice'
              ? [1.0, 1.1, 1.2, 1.25, 1.3, 1.4, 1.5]
              : [0.0, 0.5, 1.0, 1.25, 1.5, 2.0, 2.5]
            ).map((kmVal) => (
              <g key={`grid-x-${kmVal}`}>
                <line
                  x1={kmToX(kmVal)}
                  y1={padding.top}
                  x2={kmToX(kmVal)}
                  y2={padding.top + plotHeight}
                  stroke={kmVal === spliceDistanceKm ? '#0284c7' : '#172236'}
                  strokeDasharray={kmVal === spliceDistanceKm ? '2 2' : '4 4'}
                  strokeWidth={kmVal === spliceDistanceKm ? '1.2' : '0.8'}
                  opacity={kmVal === spliceDistanceKm ? 0.7 : 0.5}
                />
                <text
                  x={kmToX(kmVal)}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  fill={kmVal === spliceDistanceKm ? '#38bdf8' : '#64748b'}
                  fontSize="9"
                  fontWeight={kmVal === spliceDistanceKm ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {kmVal.toFixed(2)} km
                </text>
              </g>
            ))}

            {/* Shaded Area under Curve */}
            <path d={areaPathData} fill="url(#otdrTraceGlow)" />

            {/* Main Trace Waveform */}
            <path
              d={tracePathData}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Scanning sweep laser line */}
            {isScanning && (
              <line
                x1={padding.left + (scanProgress / 100) * plotWidth}
                y1={padding.top}
                x2={padding.left + (scanProgress / 100) * plotWidth}
                y2={padding.top + plotHeight}
                stroke="#f59e0b"
                strokeWidth="2"
                opacity="0.85"
              />
            )}

            {/* EVENT 1: Launch Connector Pin */}
            {minKm <= 0.05 && (
              <g transform={`translate(${kmToX(0.002)}, ${dbToY(3.6)})`}>
                <circle r="4" fill="#10b981" />
                <text x="6" y="-6" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  E1: Launch
                </text>
              </g>
            )}

            {/* EVENT 2: Fusion Splice Drop Step Annotation */}
            <g transform={`translate(${kmToX(spliceDistanceKm)}, ${dbToY(-0.42 - effectiveLoss)})`}>
              <circle r="5" fill={isTelkomPass ? '#10b981' : '#f43f5e'} stroke="#ffffff" strokeWidth="1.5" />
              {/* Drop step visual arrow */}
              <line x1="0" y1="-18" x2="0" y2="-5" stroke={isTelkomPass ? '#10b981' : '#f43f5e'} strokeWidth="1.5" />

              {/* Callout Card */}
              <g transform="translate(8, -32)">
                <rect
                  width="135"
                  height="34"
                  rx="6"
                  fill="#091322"
                  stroke={isTelkomPass ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                  opacity="0.95"
                />
                <text x="8" y="14" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  E2: Sambungan Fusi
                </text>
                <text
                  x="8"
                  y="26"
                  fill={isTelkomPass ? '#34d399' : '#fb7185'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Loss: -{effectiveLoss.toFixed(2)} dB {isTelkomPass ? '✓ PASS' : '✗ FAIL'}
                </text>
              </g>
            </g>

            {/* EVENT 3: End of Fiber Fresnel Reflection */}
            {maxKm >= totalDistanceKm && (
              <g transform={`translate(${kmToX(totalDistanceKm)}, ${dbToY(-0.42 - effectiveLoss - 0.42 + 8.5)})`}>
                <circle r="4" fill="#f59e0b" />
                <text x="-8" y="-8" textAnchor="end" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  E3: End of Fiber
                </text>
              </g>
            )}

            {/* MARKER A (Green vertical cursor) */}
            {markerAPos >= minKm && markerAPos <= maxKm && (
              <g>
                <line
                  x1={kmToX(markerAPos)}
                  y1={padding.top}
                  x2={kmToX(markerAPos)}
                  y2={padding.top + plotHeight}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Marker Flag A */}
                <g transform={`translate(${kmToX(markerAPos) - 10}, ${padding.top + 2})`}>
                  <polygon points="0,0 20,0 20,12 10,16 0,12" fill="#10b981" />
                  <text x="10" y="10" textAnchor="middle" fill="#022c22" fontSize="9" fontWeight="black">
                    A
                  </text>
                </g>
                <circle cx={kmToX(markerAPos)} cy={dbToY(markerALevel)} r="3.5" fill="#10b981" />
              </g>
            )}

            {/* MARKER B (Amber/Cyan vertical cursor) */}
            {markerBPos >= minKm && markerBPos <= maxKm && (
              <g>
                <line
                  x1={kmToX(markerBPos)}
                  y1={padding.top}
                  x2={kmToX(markerBPos)}
                  y2={padding.top + plotHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Marker Flag B */}
                <g transform={`translate(${kmToX(markerBPos) - 10}, ${padding.top + 2})`}>
                  <polygon points="0,0 20,0 20,12 10,16 0,12" fill="#f59e0b" />
                  <text x="10" y="10" textAnchor="middle" fill="#451a03" fontSize="9" fontWeight="black">
                    B
                  </text>
                </g>
                <circle cx={kmToX(markerBPos)} cy={dbToY(markerBLevel)} r="3.5" fill="#f59e0b" />
              </g>
            )}
          </svg>
        </div>

        {/* Dual Cursor Readout Dashboard */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:grid-cols-4">
          {/* Marker A Info */}
          <div
            onClick={() => setActiveMarker('A')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeMarker === 'A'
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Marker A (Pre-Splice)
              </span>
              {activeMarker === 'A' && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">AKTIF</span>
              )}
            </div>
            <p className="font-mono text-xs text-slate-200">
              Jarak: <strong className="text-white">{markerAPos.toFixed(3)} km</strong>
            </p>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              Level: <strong className="text-emerald-300">{markerALevel.toFixed(2)} dB</strong>
            </p>
          </div>

          {/* Marker B Info */}
          <div
            onClick={() => setActiveMarker('B')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeMarker === 'B'
                ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/30'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Marker B (Post-Splice)
              </span>
              {activeMarker === 'B' && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">AKTIF</span>
              )}
            </div>
            <p className="font-mono text-xs text-slate-200">
              Jarak: <strong className="text-white">{markerBPos.toFixed(3)} km</strong>
            </p>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              Level: <strong className="text-amber-300">{markerBLevel.toFixed(2)} dB</strong>
            </p>
          </div>

          {/* Delta Readout (A-B) */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Diferensial Marker (B - A)
            </span>
            <p className="font-mono text-xs text-slate-200">
              ΔJarak: <strong className="text-cyan-400">{(deltaDistance * 1000).toFixed(0)} m</strong> ({deltaDistance.toFixed(3)} km)
            </p>
            <p className="font-mono text-xs text-slate-200 mt-0.5">
              ΔLoss: <strong className="text-cyan-400">{deltaLoss.toFixed(2)} dB</strong>
            </p>
          </div>

          {/* Measured 2-Point Splice Loss */}
          <div className={`p-3 rounded-2xl border ${
            isTelkomPass ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-rose-950/30 border-rose-500/40'
          }`}>
            <span className="text-[10px] font-bold text-slate-300 uppercase block mb-1">
              2-Point Splice Loss
            </span>
            <p className={`font-mono text-lg font-black ${isTelkomPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {effectiveLoss.toFixed(2)} dB
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Toleransi: ≤ {activeTolerance.toFixed(2)} dB ({isTelkomPass ? 'LULUS' : 'GAGAL'})
            </span>
          </div>
        </div>
      </div>

      {/* OTDR Event Table (Tabel Kejadian ITU-T / Telkom) */}
      <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/80 print:bg-white print:border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tabel Kejadian Jalur Serat Optik (OTDR Event Table)
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Total Jarak Link: {totalDistanceKm} km • Total Redaman: {totalLinkLossDb} dB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider print:border-slate-300 print:text-slate-600">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3">Tipe Kejadian (Event)</th>
                <th className="py-2.5 px-3 text-center">Lokasi (km)</th>
                <th className="py-2.5 px-3 text-center">Loss Event (dB)</th>
                <th className="py-2.5 px-3 text-center">Loss Kumulatif</th>
                <th className="py-2.5 px-3 text-center">Reflektansi</th>
                <th className="py-2.5 px-3 text-right">Status Kepatuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 print:divide-slate-300">
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => {
                    soundEffects.playCursorMove();
                    setSelectedEventId(ev.id);
                    if (ev.type === 'splice') handleSnapToSplice();
                  }}
                  className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                    selectedEventId === ev.id ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    #{ev.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-white print:text-black">
                        {ev.name}
                      </span>
                      <span className="text-[10px] text-slate-400 print:text-slate-600">
                        {ev.description}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-300 print:text-black">
                    {ev.distanceKm.toFixed(3)} km
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span
                      className={
                        ev.type === 'splice'
                          ? isTelkomPass
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-slate-300 print:text-black'
                      }
                    >
                      {ev.eventLossDb.toFixed(2)} dB
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400 print:text-slate-700">
                    {ev.cumulativeLossDb.toFixed(2)} dB
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400 print:text-slate-700">
                    {ev.reflectanceDb ? `${ev.reflectanceDb.toFixed(1)} dB` : 'Non-reflective'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {(() => {
                      const isPass = ev.type === 'splice' ? isTelkomPass : ev.status === 'pass';
                      const isFail = ev.type === 'splice' ? !isTelkomPass : ev.status === 'fail';

                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPass
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isFail
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isPass ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> PASS
                            </>
                          ) : isFail ? (
                            <>
                              <AlertTriangle className="w-3 h-3" /> GAGAL
                            </>
                          ) : (
                            'TERMINASI'
                          )}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
