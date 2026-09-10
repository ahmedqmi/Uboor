import type { Passenger, SuspiciousFlag, ExternalReport, ReportingAuthority } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

// Simulated external reports database - in production this would come from external systems
const EXTERNAL_REPORTS_DB: ExternalReport[] = [
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'A55667788',
    authority: 'police',
    reportType: 'wanted',
    description: 'مطلوب في قضية احتيال مالي',
    reportDate: new Date('2024-06-15'),
    severity: 'critical',
    caseNumber: 'POL-2024-78453',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'B98765432',
    authority: 'immigration',
    reportType: 'travel_ban',
    description: 'ممنوع من السفر بأمر قضائي',
    reportDate: new Date('2024-08-20'),
    severity: 'critical',
    caseNumber: 'IMM-2024-12099',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: '2233445566',
    authority: 'interpol',
    reportType: 'watch_list',
    description: 'مدرج في قائمة المراقبة الدولية',
    reportDate: new Date('2024-03-10'),
    severity: 'high',
    caseNumber: 'INTERPOL-2024-5543',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: '9876543210',
    authority: 'customs',
    reportType: 'criminal_record',
    description: 'سوابق في تهريب بضائع',
    reportDate: new Date('2023-11-05'),
    severity: 'high',
    caseNumber: 'CUS-2023-99821',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'D11223344',
    authority: 'court',
    reportType: 'financial',
    description: 'قضايا مالية معلقة - شيكات بدون رصيد',
    reportDate: new Date('2024-01-22'),
    severity: 'medium',
    caseNumber: 'COURT-2024-33456',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'C55667788',
    authority: 'security',
    reportType: 'watch_list',
    description: 'مراقبة أمنية - سفر متكرر لمناطق حساسة',
    reportDate: new Date('2024-09-01'),
    severity: 'medium',
    caseNumber: 'SEC-2024-77123',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: '2233445566',
    authority: 'customs',
    reportType: 'criminal_record',
    description: 'ضبط بضائع غير مصرح بها في عبور سابق',
    reportDate: new Date('2023-08-14'),
    severity: 'medium',
    caseNumber: 'CUS-2023-44120',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'B98765432',
    authority: 'court',
    reportType: 'financial',
    description: 'حكم قضائي بحجز تحفظي على الأصول',
    reportDate: new Date('2024-07-02'),
    severity: 'high',
    caseNumber: 'COURT-2024-19087',
  },
  {
    id: uuidv4(),
    passengerId: '',
    passengerDocumentNumber: 'C55667788',
    authority: 'police',
    reportType: 'watch_list',
    description: 'بلاغ متابعة - ارتباط بقضية قيد التحقيق',
    reportDate: new Date('2025-02-11'),
    severity: 'medium',
    caseNumber: 'POL-2025-10233',
  },
];

// Check for external reports
export function checkExternalReports(passenger: Passenger): ExternalReport | null {
  const report = EXTERNAL_REPORTS_DB.find(
    (r) => r.passengerDocumentNumber === passenger.documentNumber
  );

  if (report) {
    return {
      ...report,
      passengerId: passenger.id,
    };
  }

  return null;
}

// All reports filed against a document number, newest first
export function getExternalReportsForDocument(documentNumber: string): ExternalReport[] {
  return EXTERNAL_REPORTS_DB.filter((r) => r.passengerDocumentNumber === documentNumber).sort(
    (a, b) => b.reportDate.getTime() - a.reportDate.getTime()
  );
}

export function checkPassengerSuspicious(passenger: Passenger): SuspiciousFlag | null {
  // First check external reports (higher priority)
  const externalReport = checkExternalReports(passenger);
  if (externalReport) {
    return {
      passengerId: passenger.id,
      reason: externalReport.description,
      severity: externalReport.severity,
      source: 'external_report',
      externalReport,
    };
  }

  // Check document number patterns
  for (const { pattern, reason, severity } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(passenger.documentNumber)) {
      return {
        passengerId: passenger.id,
        reason,
        severity,
        source: 'system',
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
        source: 'system',
      };
    }
  }

  // Check for very short document numbers (potentially invalid)
  if (passenger.documentNumber.length < 5) {
    return {
      passengerId: passenger.id,
      reason: 'رقم الوثيقة قصير جداً',
      severity: 'low',
      source: 'system',
    };
  }

  // Check for duplicate patterns in document number
  if (/^(.)\1{5,}$/.test(passenger.documentNumber)) {
    return {
      passengerId: passenger.id,
      reason: 'رقم وثيقة مكرر بشكل مشبوه',
      severity: 'medium',
      source: 'system',
    };
  }

  return null;
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '#7f1d1d';
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

export function getSeverityLabel(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'خطورة حرجة';
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

export function getAuthorityLabel(authority: ReportingAuthority): string {
  switch (authority) {
    case 'police':
      return 'الشرطة';
    case 'immigration':
      return 'الجوازات';
    case 'interpol':
      return 'الإنتربول';
    case 'customs':
      return 'الجمارك';
    case 'security':
      return 'الأمن العام';
    case 'court':
      return 'المحكمة';
    default:
      return 'جهة غير محددة';
  }
}

export function getReportTypeLabel(reportType: string): string {
  switch (reportType) {
    case 'wanted':
      return 'مطلوب';
    case 'travel_ban':
      return 'منع سفر';
    case 'watch_list':
      return 'قائمة مراقبة';
    case 'criminal_record':
      return 'سوابق جنائية';
    case 'financial':
      return 'قضايا مالية';
    default:
      return 'غير محدد';
  }
}

export function getAuthorityIcon(authority: ReportingAuthority): string {
  switch (authority) {
    case 'police':
      return '👮';
    case 'immigration':
      return '🛂';
    case 'interpol':
      return '🌐';
    case 'customs':
      return '📦';
    case 'security':
      return '🔒';
    case 'court':
      return '⚖️';
    default:
      return '🏛️';
  }
}
