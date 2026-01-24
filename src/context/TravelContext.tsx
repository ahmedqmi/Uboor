import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TravelRequest, SuspiciousFlag } from '../types';
import { checkPassengerSuspicious } from '../utils/suspiciousDetection';

interface TravelContextType {
  travelRequests: TravelRequest[];
  suspiciousFlags: Map<string, SuspiciousFlag>;
  addTravelRequest: (request: TravelRequest) => void;
  updateRequestStatus: (id: string, status: TravelRequest['status']) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export function TravelProvider({ children }: { children: ReactNode }) {
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);
  const [suspiciousFlags, setSuspiciousFlags] = useState<Map<string, SuspiciousFlag>>(new Map());

  const addTravelRequest = useCallback((request: TravelRequest) => {
    // Check each passenger for suspicious activity
    const newFlags = new Map(suspiciousFlags);
    let hasHighSeverityFlag = false;

    request.passengers.forEach((passenger) => {
      const flag = checkPassengerSuspicious(passenger);
      if (flag) {
        newFlags.set(passenger.id, flag);
        if (flag.severity === 'high') {
          hasHighSeverityFlag = true;
        }
      }
    });

    // Update request status based on flags
    const updatedRequest: TravelRequest = {
      ...request,
      status: hasHighSeverityFlag ? 'flagged' : 'pending',
    };

    setSuspiciousFlags(newFlags);
    setTravelRequests((prev) => [...prev, updatedRequest]);
  }, [suspiciousFlags]);

  const updateRequestStatus = useCallback((id: string, status: TravelRequest['status']) => {
    setTravelRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  }, []);

  return (
    <TravelContext.Provider
      value={{
        travelRequests,
        suspiciousFlags,
        addTravelRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravelContext() {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
}
