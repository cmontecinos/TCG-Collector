
import { MylCard, UserCollectionItem } from '../types';

const DB_NAME = 'MylLibraryDB';
const DB_VERSION = 1;

export class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('catalog')) {
          db.createObjectStore('catalog', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('library')) {
          db.createObjectStore('library', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // --- Catalog Methods ---
  async saveToCatalog(card: MylCard): Promise<void> {
    const store = this.db!.transaction('catalog', 'readwrite').objectStore('catalog');
    return new Promise((res) => {
      const req = store.put(card);
      req.onsuccess = () => res();
    });
  }

  async getFromCatalog(id: string): Promise<MylCard | null> {
    const store = this.db!.transaction('catalog', 'readonly').objectStore('catalog');
    return new Promise((res) => {
      const req = store.get(id);
      req.onsuccess = () => res(req.result || null);
    });
  }

  async getAllCatalog(): Promise<MylCard[]> {
    const store = this.db!.transaction('catalog', 'readonly').objectStore('catalog');
    return new Promise((res) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
    });
  }

  // --- Library Methods ---
  async addToLibrary(item: UserCollectionItem): Promise<void> {
    const store = this.db!.transaction('library', 'readwrite').objectStore('library');
    return new Promise((res) => {
      const req = store.add(item);
      req.onsuccess = () => res();
    });
  }

  async removeFromLibrary(id: string): Promise<void> {
    const store = this.db!.transaction('library', 'readwrite').objectStore('library');
    return new Promise((res) => {
      const req = store.delete(id);
      req.onsuccess = () => res();
    });
  }

  async getLibrary(): Promise<UserCollectionItem[]> {
    if (!this.db) return [];
    const store = this.db.transaction('library', 'readonly').objectStore('library');
    return new Promise((res) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
    });
  }

  // --- Backup & Restore ---
  async exportDatabase(): Promise<string> {
    const catalog = await this.getAllCatalog();
    const library = await this.getLibrary();
    return JSON.stringify({ catalog, library, timestamp: Date.now() });
  }

  async importDatabase(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.catalog || !data.library) throw new Error("Invalid backup format");
      
      const tx = this.db!.transaction(['catalog', 'library'], 'readwrite');
      const catStore = tx.objectStore('catalog');
      const libStore = tx.objectStore('library');

      catStore.clear();
      libStore.clear();

      data.catalog.forEach((c: any) => catStore.put(c));
      data.library.forEach((l: any) => libStore.put(l));

      return new Promise((res) => {
        tx.oncomplete = () => res();
      });
    } catch (e) {
      console.error("Import failed", e);
      throw e;
    }
  }

  async clearAll(): Promise<void> {
    const tx = this.db!.transaction(['catalog', 'library'], 'readwrite');
    tx.objectStore('catalog').clear();
    tx.objectStore('library').clear();
  }
}

export const db = new StorageService();
