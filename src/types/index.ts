export interface Passenger {
  id: string;
  name: string;
  documentType: 'passport' | 'id_card';
  documentNumber: string;
}

export interface TravelRequest {
  id: string;
  carPlateNumber: string;
  carType: string;
  carColor: string;
  passengers: Passenger[];
  submittedAt: Date;
  status: 'pending' | 'approved' | 'flagged';
}

// Types of reporting authorities
export type ReportingAuthority =
  | 'police'           // الشرطة
  | 'immigration'      // الجوازات
  | 'interpol'         // الإنتربول
  | 'customs'          // الجمارك
  | 'security'         // الأمن العام
  | 'court';           // المحكمة

// External report from authorities
export interface ExternalReport {
  id: string;
  passengerId: string;
  passengerDocumentNumber: string;
  authority: ReportingAuthority;
  reportType: 'wanted' | 'travel_ban' | 'watch_list' | 'criminal_record' | 'financial';
  description: string;
  reportDate: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  caseNumber?: string;
}

export interface SuspiciousFlag {
  passengerId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'system' | 'external_report';
  externalReport?: ExternalReport;
}
