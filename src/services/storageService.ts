import { Poem } from "../types";

const DB_NAME = 'InkVerseDB';
const DB_VERSION = 1;
const STORE_NAME = 'poems';

// Open Database Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const storageService = {
  // Save or Update a Poem
  savePoem: async (poem: Poem): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(poem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Delete a Poem
  deletePoem: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Get All Poems
  getAllPoems: async (): Promise<Poem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by dateCreated descending (newest first)
        const poems = request.result as Poem[];
        poems.sort((a, b) => b.dateCreated - a.dateCreated);
        resolve(poems);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Export Data to JSON File
  exportData: async (): Promise<void> => {
    const poems = await storageService.getAllPoems();
    const dataStr = JSON.stringify(poems, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `ink_verse_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Import Data from JSON File
  importData: async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          const poems = JSON.parse(json);
          
          if (!Array.isArray(poems)) {
            throw new Error("Invalid format: Root must be an array");
          }

          const db = await openDB();
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          let count = 0;
          poems.forEach((poem: any) => {
             // Simple validation
             if (poem.id && poem.content) {
               store.put(poem);
               count++;
             }
          });

          transaction.oncomplete = () => resolve(count);
          transaction.onerror = () => reject(transaction.error);

        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
};