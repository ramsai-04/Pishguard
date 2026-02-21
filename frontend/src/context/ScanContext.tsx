import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScanResult, RelatedSite, DashboardStats, CategoryStats } from '@/types';
import { getFirebaseAuthToken } from '@/lib/firebase';

interface ScanContextType {
  scanHistory: ScanResult[];
  safeSites: RelatedSite[];
  fakeSites: RelatedSite[];
  blockedSites: string[];
  favorites: string[];
  lastScannedCategory: string | null;
  addScanResult: (result: ScanResult) => void;
  getStats: () => DashboardStats;
  getCategoryStats: () => CategoryStats[];
  getScansByCategory: (category: string) => ScanResult[];
  clearHistory: () => Promise<void>;
  toggleFavorite: (siteId: string) => void;
  isFavorite: (siteId: string) => boolean;
  getRelatedSafeSites: (category: string) => RelatedSite[];
  getRelatedFakeSites: (category: string) => RelatedSite[];
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
};

interface ScanProviderProps {
  children: ReactNode;
}

export const ScanProvider: React.FC<ScanProviderProps> = ({ children }) => {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [safeSites, setSafeSites] = useState<RelatedSite[]>([]);
  const [fakeSites, setFakeSites] = useState<RelatedSite[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastScannedCategory, setLastScannedCategory] = useState<string | null>(null);
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

  const recomputeDerivedLists = (history: ScanResult[]) => {
    setBlockedSites(history.filter((scan) => scan.isPhishing).map((scan) => scan.url));

    const safeByUrl = new Map<string, RelatedSite>();
    const fakeByUrl = new Map<string, RelatedSite>();
    for (const scan of history) {
      if (scan.isPhishing) {
        if (!fakeByUrl.has(scan.url)) {
          fakeByUrl.set(scan.url, {
            id: scan.id,
            url: scan.url,
            name: scan.domain,
            category: scan.category,
            isSafe: false,
            description: `Detected phishing site - ${scan.explanation.substring(0, 50)}...`,
          });
        }
      } else if (!safeByUrl.has(scan.url)) {
        safeByUrl.set(scan.url, {
          id: scan.id,
          url: scan.url,
          name: scan.domain,
          category: scan.category,
          isSafe: true,
          description: "Verified legitimate website",
        });
      }
    }
    setSafeSites(Array.from(safeByUrl.values()));
    setFakeSites(Array.from(fakeByUrl.values()));
  };

  const loadHistoryFromServer = async () => {
    const token = await getFirebaseAuthToken();
    if (!apiBaseUrl || !token) {
      setScanHistory([]);
      setBlockedSites([]);
      setSafeSites([]);
      setFakeSites([]);
      return;
    }

    const response = await fetch(`${apiBaseUrl}/scan/history?limit=200`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`History API failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: string;
        url: string;
        domain: string;
        category: string;
        isPhishing: boolean;
        isBlocked: boolean;
        score: number;
        explanation: string;
        checkedAt: string;
      }>;
    };

    const history: ScanResult[] = (data.items ?? []).map((item) => ({
      ...item,
      checkedAt: new Date(item.checkedAt),
    }));
    setScanHistory(history);
    recomputeDerivedLists(history);
  };

  useEffect(() => {
    const storedFavorites = localStorage.getItem('phishguard_favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }

    loadHistoryFromServer().catch(() => undefined);
    const onAuthChanged = () => {
      loadHistoryFromServer().catch(() => undefined);
    };
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, []);

  const getPrivacyFlags = (): { saveHistory: boolean; doNotStoreUrls: boolean } => {
    try {
      const stored = localStorage.getItem('phishguard_settings');
      if (!stored) {
        return { saveHistory: true, doNotStoreUrls: false };
      }
      const parsed = JSON.parse(stored) as { saveHistory?: boolean; doNotStoreUrls?: boolean };
      return {
        saveHistory: parsed.saveHistory ?? true,
        doNotStoreUrls: parsed.doNotStoreUrls ?? false,
      };
    } catch {
      return { saveHistory: true, doNotStoreUrls: false };
    }
  };

  const addScanResult = (result: ScanResult) => {
    setLastScannedCategory(result.category);
    const privacy = getPrivacyFlags();
    if (!privacy.saveHistory || privacy.doNotStoreUrls) {
      return;
    }
    setScanHistory((prev) => {
      const updated = [result, ...prev];
      recomputeDerivedLists(updated);
      return updated;
    });
  };

  const getStats = (): DashboardStats => {
    return {
      totalScans: scanHistory.length,
      safeWebsites: scanHistory.filter(s => !s.isPhishing).length,
      blockedWebsites: blockedSites.length,
      phishingDetected: scanHistory.filter(s => s.isPhishing).length,
    };
  };

  const getCategoryStats = (): CategoryStats[] => {
    const categoryMap = new Map<string, { safe: number; phishing: number }>();
    
    scanHistory.forEach(scan => {
      const existing = categoryMap.get(scan.category) || { safe: 0, phishing: 0 };
      if (scan.isPhishing) {
        existing.phishing++;
      } else {
        existing.safe++;
      }
      categoryMap.set(scan.category, existing);
    });

    const iconMap: Record<string, string> = {
      'E-commerce': '🛒',
      'Education': '📚',
      'Health': '🏥',
      'Banking': '🏦',
      'Government': '🏛️',
      'Entertainment': '🎬',
      'Social Media': '📱',
      'Technology': '💻',
      'Other': '🌐',
    };

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.safe + stats.phishing,
      safe: stats.safe,
      phishing: stats.phishing,
      icon: iconMap[category] || '🌐',
    }));
  };

  const getScansByCategory = (category: string): ScanResult[] => {
    return scanHistory.filter(scan => scan.category === category);
  };

  const clearHistory = async () => {
    const token = await getFirebaseAuthToken();
    if (apiBaseUrl && token) {
      const response = await fetch(`${apiBaseUrl}/scan/history`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Clear history API failed with status ${response.status}`);
      }
    }
    setScanHistory([]);
    setBlockedSites([]);
    setSafeSites([]);
    setFakeSites([]);
  };

  const toggleFavorite = (siteId: string) => {
    const updatedFavorites = favorites.includes(siteId)
      ? favorites.filter(id => id !== siteId)
      : [...favorites, siteId];
    setFavorites(updatedFavorites);
    localStorage.setItem('phishguard_favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (siteId: string): boolean => {
    return favorites.includes(siteId);
  };

  const getRelatedSafeSites = (category: string): RelatedSite[] => {
    return safeSites.filter(site => site.category === category).slice(0, 5);
  };

  const getRelatedFakeSites = (category: string): RelatedSite[] => {
    return fakeSites.filter(site => site.category === category).slice(0, 5);
  };

  return (
    <ScanContext.Provider value={{
      scanHistory,
      safeSites,
      fakeSites,
      blockedSites,
      favorites,
      lastScannedCategory,
      addScanResult,
      getStats,
      getCategoryStats,
      getScansByCategory,
      clearHistory,
      toggleFavorite,
      isFavorite,
      getRelatedSafeSites,
      getRelatedFakeSites,
    }}>
      {children}
    </ScanContext.Provider>
  );
};
