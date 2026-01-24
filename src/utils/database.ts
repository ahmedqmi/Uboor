import { openDB, type IDBPDatabase } from 'idb';
import type { TravelRequest, SuspiciousFlag } from '../types';

const DB_NAME = 'uboor-db';
const DB_VERSION = 1;

interface UboorDB {
  travelRequests: {
    key: string;
    value: TravelRequest & { submittedAt: string };
  };
  suspiciousFlags: {
    key: string;
    value: SuspiciousFlag;
  };
}

let dbInstance: IDBPDatabase<UboorDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<UboorDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<UboorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create travelRequests store
      if (!db.objectStoreNames.contains('travelRequests')) {
        db.createObjectStore('travelRequests', { keyPath: 'id' });
      }
      // Create suspiciousFlags store
      if (!db.objectStoreNames.contains('suspiciousFlags')) {
        db.createObjectStore('suspiciousFlags', { keyPath: 'passengerId' });
      }
    },
  });

  return dbInstance;
}

// Travel Requests
export async function saveTravelRequest(request: TravelRequest): Promise<void> {
  const db = await getDB();
  const serializedRequest = {
    ...request,
    submittedAt: request.submittedAt.toISOString(),
  };
  await db.put('travelRequests', serializedRequest);
}

export async function getAllTravelRequests(): Promise<TravelRequest[]> {
  const db = await getDB();
  const requests = await db.getAll('travelRequests');
  return requests.map((req) => ({
    ...req,
    submittedAt: new Date(req.submittedAt),
  }));
}

export async function updateTravelRequestStatus(
  id: string,
  status: TravelRequest['status']
): Promise<void> {
  const db = await getDB();
  const request = await db.get('travelRequests', id);
  if (request) {
    request.status = status;
    await db.put('travelRequests', request);
  }
}

export async function deleteTravelRequest(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('travelRequests', id);
}

// Suspicious Flags
export async function saveSuspiciousFlag(flag: SuspiciousFlag): Promise<void> {
  const db = await getDB();
  await db.put('suspiciousFlags', flag);
}

export async function getAllSuspiciousFlags(): Promise<Map<string, SuspiciousFlag>> {
  const db = await getDB();
  const flags = await db.getAll('suspiciousFlags');
  const flagMap = new Map<string, SuspiciousFlag>();
  flags.forEach((flag) => {
    flagMap.set(flag.passengerId, flag);
  });
  return flagMap;
}

export async function deleteSuspiciousFlag(passengerId: string): Promise<void> {
  const db = await getDB();
  await db.delete('suspiciousFlags', passengerId);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('travelRequests');
  await db.clear('suspiciousFlags');
}
