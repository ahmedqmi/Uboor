import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { TravelRequest, SuspiciousFlag } from '../types';
import { checkPassengerSuspicious } from '../utils/suspiciousDetection';
import {
  saveTravelRequest,
  getAllTravelRequests,
  updateTravelRequestStatus,
  saveSuspiciousFlag,
  getAllSuspiciousFlags,
} from '../utils/database';
import { sampleTravelRequests } from '../utils/sampleData';

interface TravelContextType {
  travelRequests: TravelRequest[];
  suspiciousFlags: Map<string, SuspiciousFlag>;
  isLoading: boolean;
  addTravelRequest: (request: TravelRequest) => Promise<void>;
  updateRequestStatus: (id: string, status: TravelRequest['status']) => Promise<void>;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export function TravelProvider({ children }: { children: ReactNode }) {
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);
  const [suspiciousFlags, setSuspiciousFlags] = useState<Map<string, SuspiciousFlag>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        let [requests, flags] = await Promise.all([
          getAllTravelRequests(),
          getAllSuspiciousFlags(),
        ]);

        // If database is empty, load sample data
        if (requests.length === 0) {
          const newFlags = new Map<string, SuspiciousFlag>();

          for (const request of sampleTravelRequests) {
            // Check passengers for suspicious activity
            for (const passenger of request.passengers) {
              const flag = checkPassengerSuspicious(passenger);
              if (flag) {
                newFlags.set(passenger.id, flag);
                await saveSuspiciousFlag(flag);
              }
            }
            await saveTravelRequest(request);
          }

          requests = sampleTravelRequests;
          flags = newFlags;
        }

        setTravelRequests(requests);
        setSuspiciousFlags(flags);
      } catch (error) {
        console.error('Failed to load data from database:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const addTravelRequest = useCallback(async (request: TravelRequest) => {
    // Check each passenger for suspicious activity
    const newFlags = new Map(suspiciousFlags);
    let hasHighSeverityFlag = false;

    for (const passenger of request.passengers) {
      const flag = checkPassengerSuspicious(passenger);
      if (flag) {
        newFlags.set(passenger.id, flag);
        if (flag.severity === 'high') {
          hasHighSeverityFlag = true;
        }
        // Save flag to database
        await saveSuspiciousFlag(flag);
      }
    }

    // Update request status based on flags
    const updatedRequest: TravelRequest = {
      ...request,
      status: hasHighSeverityFlag ? 'flagged' : 'pending',
    };

    // Save to database
    await saveTravelRequest(updatedRequest);

    setSuspiciousFlags(newFlags);
    setTravelRequests((prev) => [...prev, updatedRequest]);
  }, [suspiciousFlags]);

  const updateRequestStatus = useCallback(async (id: string, status: TravelRequest['status']) => {
    // Update in database
    await updateTravelRequestStatus(id, status);

    setTravelRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  }, []);

  return (
    <TravelContext.Provider
      value={{
        travelRequests,
        suspiciousFlags,
        isLoading,
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
