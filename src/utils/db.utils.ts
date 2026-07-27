import type { Position3D } from '../types';

// =============================================================================
// IndexedDB Config
// =============================================================================

const DB_NAME = 'image_space_db';
const DB_VERSION = 1;
const STORE_NAME = 'user_images';

export interface StoredUserImage {
    id: string;
    description: string;
    dataUrl: string;
    spherePos: Position3D;
    gridPos: Position3D;
    timestamp: number;
}

// =============================================================================
// Helper: Open IndexedDB Connection
// =============================================================================

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// =============================================================================
// Public API
// =============================================================================

export const saveUserImagesToDB = async (records: StoredUserImage[]): Promise<void> => {
    if (!records || records.length === 0) return;
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        records.forEach((record) => {
            store.put(record);
        });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error('IndexedDB kayıt hatası:', err);
    }
};

export const getAllUserImagesFromDB = async (): Promise<StoredUserImage[]> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('IndexedDB okuma hatası:', err);
        return [];
    }
};

export const clearUserImagesFromDB = async (): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error('IndexedDB temizleme hatası:', err);
    }
};
