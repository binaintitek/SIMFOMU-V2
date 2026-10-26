import { FiberType } from '../types/fiber';

export interface OTDREvent {
  id: number;
  type: 'launch_connector' | 'splice' | 'end_of_fiber';
  name: string;
  distanceKm: number;
  eventLossDb: number;
  cumulativeLossDb: number;
  reflectanceDb: number | null; // e.g. -45 dB, -24 dB
  attenuationDbPerKm: number;
  status: 'pass' | 'fail' | 'info';
  description: string;
}

export interface OTDRPoint {
  distanceKm: number;
  levelDb: number;
  isEvent?: boolean;
  eventLabel?: string;
}

export interface OTDRConfig {
  wavelength: 1310 | 1550 | 850;
  pulseWidthNs: 10 | 30 | 100;
  totalDistanceKm: number;
  spliceDistanceKm: number;
  spliceLossDb: number;
  fiberType?: FiberType | string;
  isArcPerformed: boolean;
  defectType?: string;
}

// Typical attenuation rates per ITU-T standards
export const FIBER_ATTENUATION_RATES: Record<number, number> = {
  1310: 0.34, // dB/km for standard Single Mode G.652.D
  1550: 0.20, // dB/km for Single Mode long-haul / FTTH
  850: 2.40,  // dB/km for OM3 Multimode
};

export function generateOTDRTrace(config: OTDRConfig): {
  points: OTDRPoint[];
  events: OTDREvent[];
  launchLevelDb: number;
  endLevelDb: number;
  totalLinkLossDb: number;
} {
  const {
    wavelength,
    pulseWidthNs,
    totalDistanceKm,
    spliceDistanceKm,
    spliceLossDb,
    isArcPerformed,
    defectType = 'none',
  } = config;

  const slope = FIBER_ATTENUATION_RATES[wavelength] || 0.34;
  const actualLoss = isArcPerformed ? spliceLossDb : 0.02;

  // Pulse width width factor (dead zone in km)
  // 10ns ~ 1.5m (0.0015km), 30ns ~ 4.5m (0.0045km), 100ns ~ 15m (0.015km)
  const deadZoneKm = pulseWidthNs === 10 ? 0.008 : pulseWidthNs === 30 ? 0.018 : 0.035;

  const points: OTDRPoint[] = [];
  const numSteps = 220;
  const stepKm = totalDistanceKm / numSteps;

  const launchLevelDb = 0.0;
  let cumulativeLossAtSplice = 0;
  let totalLinkLossDb = 0;

  // Event 0: Launch connector Fresnel reflection spike
  // Spikes up to +3.5 dB then drops down to baseline
  points.push({ distanceKm: 0.0, levelDb: -5.0 });
  points.push({ distanceKm: 0.002, levelDb: 3.6, isEvent: true, eventLabel: 'Launch' });
  points.push({ distanceKm: deadZoneKm, levelDb: launchLevelDb });

  let currentLevel = launchLevelDb;

  for (let i = 1; i <= numSteps; i++) {
    const dist = i * stepKm;

    // Small pseudo-random backscatter Rayleigh noise (±0.02 dB)
    // using deterministic sin/cos so the curve is stable across renders
    const noise = Math.sin(dist * 137.5) * 0.018 + Math.cos(dist * 293.1) * 0.012;

    if (dist < spliceDistanceKm) {
      // Span 1: Fiber before splice
      currentLevel = launchLevelDb - dist * slope + noise;
      points.push({ distanceKm: Number(dist.toFixed(4)), levelDb: Number(currentLevel.toFixed(3)) });
    } else if (Math.abs(dist - spliceDistanceKm) < stepKm) {
      // Right at splice point
      const preSpliceLevel = launchLevelDb - spliceDistanceKm * slope;
      cumulativeLossAtSplice = spliceDistanceKm * slope;

      // Pre-splice point
      points.push({
        distanceKm: Number((spliceDistanceKm - 0.005).toFixed(4)),
        levelDb: Number(preSpliceLevel.toFixed(3)),
      });

      // If there is an angle defect or bubble, add slight reflective peak
      if (defectType !== 'none' && defectType !== 'waist') {
        points.push({
          distanceKm: Number(spliceDistanceKm.toFixed(4)),
          levelDb: Number((preSpliceLevel + 0.35).toFixed(3)),
          isEvent: true,
          eventLabel: 'Reflectance Spiklet',
        });
      }

      // The distinct downward step: Drop by actualLoss dB
      const postSpliceLevel = preSpliceLevel - actualLoss;
      points.push({
        distanceKm: Number((spliceDistanceKm + deadZoneKm * 0.5).toFixed(4)),
        levelDb: Number(postSpliceLevel.toFixed(3)),
        isEvent: true,
        eventLabel: `Splice Loss: -${actualLoss.toFixed(2)} dB`,
      });

      currentLevel = postSpliceLevel;
    } else if (dist <= totalDistanceKm - 0.01) {
      // Span 2: Fiber after splice continuing with slope
      const distFromSplice = dist - spliceDistanceKm;
      const baseLevel = launchLevelDb - spliceDistanceKm * slope - actualLoss;
      currentLevel = baseLevel - distFromSplice * slope + noise;
      points.push({ distanceKm: Number(dist.toFixed(4)), levelDb: Number(currentLevel.toFixed(3)) });
    }
  }

  // End of fiber: prominent Fresnel reflection peak (glass to air interface)
  const levelBeforeEnd =
    launchLevelDb - spliceDistanceKm * slope - actualLoss - (totalDistanceKm - spliceDistanceKm) * slope;
  totalLinkLossDb = Math.abs(levelBeforeEnd);

  // Fiber end reflective spike
  points.push({
    distanceKm: Number((totalDistanceKm - 0.005).toFixed(4)),
    levelDb: Number(levelBeforeEnd.toFixed(3)),
  });
  points.push({
    distanceKm: Number(totalDistanceKm.toFixed(4)),
    levelDb: Number((levelBeforeEnd + 8.5).toFixed(3)),
    isEvent: true,
    eventLabel: 'End of Fiber (Glass/Air)',
  });
  // Plunge into noise floor (-26 dB)
  points.push({
    distanceKm: Number((totalDistanceKm + 0.04).toFixed(4)),
    levelDb: -26.0,
  });
  points.push({
    distanceKm: Number((totalDistanceKm + 0.15).toFixed(4)),
    levelDb: -27.5,
  });

  // Calculate events
  const isTelkomPass = actualLoss <= 0.05;

  const events: OTDREvent[] = [
    {
      id: 1,
      type: 'launch_connector',
      name: 'Konektor Awal (Launch Port)',
      distanceKm: 0.0,
      eventLossDb: 0.12,
      cumulativeLossDb: 0.12,
      reflectanceDb: -46.5,
      attenuationDbPerKm: slope,
      status: 'pass',
      description: 'Fresnel reflection pada konektor peluncur OTB / patch cord awal.',
    },
    {
      id: 2,
      type: 'splice',
      name: 'Titik Sambung Fusi (Fusion Splice)',
      distanceKm: spliceDistanceKm,
      eventLossDb: actualLoss,
      cumulativeLossDb: Number((cumulativeLossAtSplice + actualLoss).toFixed(3)),
      reflectanceDb: defectType !== 'none' ? -58.2 : null,
      attenuationDbPerKm: slope,
      status: isTelkomPass ? 'pass' : 'fail',
      description: isTelkomPass
        ? `LULUS: Redaman ${actualLoss.toFixed(2)} dB memenuhi standar Telkom (≤ 0.05 dB). Non-reflective event.`
        : `GAGAL: Redaman ${actualLoss.toFixed(2)} dB melampaui batas maksimal Telkom (0.05 dB). Wajib potong & fusi ulang.`,
    },
    {
      id: 3,
      type: 'end_of_fiber',
      name: 'Ujung Serat (Fiber End / Break)',
      distanceKm: totalDistanceKm,
      eventLossDb: Number(totalLinkLossDb.toFixed(2)),
      cumulativeLossDb: Number((totalLinkLossDb + 0.12).toFixed(2)),
      reflectanceDb: -24.2,
      attenuationDbPerKm: slope,
      status: 'info',
      description: 'Pemantulan Fresnel 4% akibat diskontinuitas indeks bias kaca ke udara terbuka.',
    },
  ];

  return {
    points,
    events,
    launchLevelDb,
    endLevelDb: levelBeforeEnd,
    totalLinkLossDb: Number(totalLinkLossDb.toFixed(2)),
  };
}

export function getPointLevelAtDistance(
  targetDistanceKm: number,
  points: OTDRPoint[]
): number {
  if (points.length === 0) return 0;
  if (targetDistanceKm <= points[0].distanceKm) return points[0].levelDb;
  if (targetDistanceKm >= points[points.length - 1].distanceKm) {
    return points[points.length - 1].levelDb;
  }

  // Find surrounding points for linear interpolation
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (targetDistanceKm >= p1.distanceKm && targetDistanceKm <= p2.distanceKm) {
      const span = p2.distanceKm - p1.distanceKm;
      if (span === 0) return p1.levelDb;
      const t = (targetDistanceKm - p1.distanceKm) / span;
      return p1.levelDb + t * (p2.levelDb - p1.levelDb);
    }
  }

  return points[points.length - 1].levelDb;
}
