import type { Passenger, SuspiciousFlag } from '../types';

// Simulated watchlist - in production this would come from a database
const SUSPICIOUS_PATTERNS = [
  { pattern: /^123/, reason: 'رقم وثيقة يبدأ بنمط مشبوه', severity: 'medium' as const },
  { pattern: /^000/, reason: 'رقم وثيقة غير صالح', severity: 'high' as const },
  { pattern: /^999/, reason: 'رقم وثيقة في قائمة المراقبة', severity: 'high' as const },
];

const SUSPICIOUS_NAMES = [
  { name: 'مجهول', reason: 'اسم غير محدد', severity: 'medium' as const },
  { name: 'غير معروف', reason: 'اسم غير محدد', severity: 'medium' as const },
];

export function checkPassengerSuspicious(passenger: Passenger): SuspiciousFlag | null {
  // Check document number patterns
  for (const { pattern, reason, severity } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(passenger.documentNumber)) {
      return {
        passengerId: passenger.id,
        reason,
        severity,
      };
    }
  }

  // Check suspicious names
  for (const { name, reason, severity } of SUSPICIOUS_NAMES) {
    if (passenger.name.includes(name)) {
      return {
        passengerId: passenger.id,
        reason,
        severity,
      };
    }
  }

  // Check for very short document numbers (potentially invalid)
  if (passenger.documentNumber.length < 5) {
    return {
      passengerId: passenger.id,
      reason: 'رقم الوثيقة قصير جداً',
      severity: 'low',
    };
  }

  // Check for duplicate patterns in document number
  if (/^(.)\1{5,}$/.test(passenger.documentNumber)) {
    return {
      passengerId: passenger.id,
      reason: 'رقم وثيقة مكرر بشكل مشبوه',
      severity: 'medium',
    };
  }

  return null;
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return '#dc2626';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#eab308';
    default:
      return '#6b7280';
  }
}

export function getSeverityLabel(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'خطورة عالية';
    case 'medium':
      return 'خطورة متوسطة';
    case 'low':
      return 'خطورة منخفضة';
    default:
      return 'غير محدد';
  }
}
