import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { StoredSessionSummary } from '../audio/types';

interface MasteringDb {
  sessions: {
    key: string;
    value: StoredSessionSummary;
  };
}

const DB_NAME = 'mastering-studio-wasm';
const DB_VERSION = 1;
const LAST_SESSION_KEY = 'last-session';

let dbPromise: Promise<IDBPDatabase<MasteringDb>> | null = null;

function getDb(): Promise<IDBPDatabase<MasteringDb>> {
  dbPromise ??= openDB<MasteringDb>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('sessions');
    }
  });

  return dbPromise;
}

export async function saveLastSession(summary: StoredSessionSummary): Promise<void> {
  const db = await getDb();
  await db.put('sessions', summary, LAST_SESSION_KEY);
}

export async function getLastSession(): Promise<StoredSessionSummary | undefined> {
  const db = await getDb();
  return db.get('sessions', LAST_SESSION_KEY);
}
