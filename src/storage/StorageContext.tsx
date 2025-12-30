import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface StorageContextType {
  get: <T = any>(key: string) => Promise<T | undefined>;
  set: <T = any>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  getAll: () => Promise<Record<string, any>>;
  isReady: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Chrome storage API is available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      setIsReady(true);
    } else {
      // Fallback for development or non-Chrome environments
      setIsReady(true);
    }
  }, []);

  const get = useCallback(async <T = any,>(key: string): Promise<T | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] as T | undefined);
        });
      });
    }
    // Fallback to localStorage for development
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const set = useCallback(async <T = any,>(key: string, value: T): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    }
    // Fallback to localStorage for development
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set storage:', error);
    }
  }, []);

  const remove = useCallback(async (key: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    }
    // Fallback to localStorage for development
    localStorage.removeItem(key);
  }, []);

  const getAll = useCallback(async (): Promise<Record<string, any>> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
          resolve(result);
        });
      });
    }
    // Fallback to localStorage for development
    const all: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          all[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          // Skip invalid JSON
        }
      }
    }
    return all;
  }, []);

  const value: StorageContextType = {
    get,
    set,
    remove,
    getAll,
    isReady,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
