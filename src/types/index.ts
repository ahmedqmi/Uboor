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

export interface SuspiciousFlag {
  passengerId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}
