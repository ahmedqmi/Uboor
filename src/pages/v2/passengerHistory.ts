import type { ExternalReport, Passenger, SuspiciousFlag, TravelRequest } from '../../types';
import { getExternalReportsForDocument } from '../../utils/suspiciousDetection';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export interface CrossingRecord {
  requestId: string;
  date: Date;
  carPlateNumber: string;
  carType: string;
  carColor: string;
  status: TravelRequest['status'];
  companions: Passenger[];
}

export interface PassengerHistory {
  identity: Passenger | null;
  crossings: CrossingRecord[];
  cases: ExternalReport[];
  systemFlags: SuspiciousFlag[];
  highestSeverity: Severity | null;
}

export function buildPassengerHistory(
  documentNumber: string,
  travelRequests: TravelRequest[],
  suspiciousFlags: Map<string, SuspiciousFlag>
): PassengerHistory {
  const crossings: CrossingRecord[] = [];
  const systemFlags: SuspiciousFlag[] = [];
  const seenReasons = new Set<string>();
  let identity: Passenger | null = null;

  for (const request of travelRequests) {
    const passenger = request.passengers.find((p) => p.documentNumber === documentNumber);
    if (!passenger) continue;

    crossings.push({
      requestId: request.id,
      date: request.submittedAt,
      carPlateNumber: request.carPlateNumber,
      carType: request.carType,
      carColor: request.carColor,
      status: request.status,
      companions: request.passengers.filter((p) => p.id !== passenger.id),
    });

    const flag = suspiciousFlags.get(passenger.id);
    if (flag && flag.source === 'system' && !seenReasons.has(flag.reason)) {
      seenReasons.add(flag.reason);
      systemFlags.push(flag);
    }
  }

  crossings.sort((a, b) => b.date.getTime() - a.date.getTime());
  identity = crossings.length > 0
    ? travelRequests
        .find((r) => r.id === crossings[0].requestId)!
        .passengers.find((p) => p.documentNumber === documentNumber) ?? null
    : null;

  const cases = getExternalReportsForDocument(documentNumber);

  const severities: Severity[] = [
    ...cases.map((c) => c.severity),
    ...systemFlags.map((f) => f.severity),
  ];
  const highestSeverity = severities.length
    ? severities.reduce((worst, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[worst] ? s : worst))
    : null;

  return { identity, crossings, cases, systemFlags, highestSeverity };
}
