import { MotorAd } from '../types';

const DB_NAME = 'jamhur_motor_db';
const DB_VERSION = 1;
const STORE_NAME = 'ads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal membuka IndexedDB.'));
    };
  });
}

export async function getAllAds(): Promise<MotorAd[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const ads: MotorAd[] = request.result || [];
      // Sort newest updated first
      ads.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      resolve(ads);
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal memuat iklan.'));
    };
  });
}

export async function getAdById(id: string): Promise<MotorAd | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal memuat data iklan.'));
    };
  });
}

export async function saveAd(ad: MotorAd): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(ad);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal menyimpan iklan ke IndexedDB.'));
    };
  });
}

export async function deleteAd(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal menghapus iklan.'));
    };
  });
}

export async function backupAllAds(): Promise<string> {
  const ads = await getAllAds();
  const backupData = {
    app: 'Jamhur Motor',
    version: 1,
    exportedAt: new Date().toISOString(),
    totalAds: ads.length,
    ads,
  };
  return JSON.stringify(backupData, null, 2);
}

export async function restoreAds(
  jsonData: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<number> {
  const parsed = JSON.parse(jsonData);
  const adsToImport: MotorAd[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.ads)
    ? parsed.ads
    : null;

  if (!adsToImport) {
    throw new Error('Format file cadangan JSON tidak valid.');
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    tx.onerror = () => reject(tx.error || new Error('Gagal restore data.'));
    tx.oncomplete = () => resolve(adsToImport.length);

    if (mode === 'replace') {
      store.clear();
    }

    for (const ad of adsToImport) {
      if (!ad.id) {
        ad.id = 'ad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
      if (!ad.createdAt) ad.createdAt = Date.now();
      if (!ad.updatedAt) ad.updatedAt = Date.now();
      if (!Array.isArray(ad.photos)) ad.photos = [];
      if (typeof ad.description !== 'string') ad.description = '';

      store.put(ad);
    }
  });
}
