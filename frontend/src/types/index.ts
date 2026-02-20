export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ScanResult {
  id: string;
  url: string;
  isPhishing: boolean;
  score: number; // 0-100, higher = more likely phishing
  explanation: string;
  category: string;
  checkedAt: Date;
  isBlocked: boolean;
  domain: string;
}

export interface RelatedSite {
  id: string;
  url: string;
  name: string;
  category: string;
  isSafe: boolean;
  description: string;
  isFavorite?: boolean;
}

export interface Complaint {
  id: string;
  websiteUrl: string;
  reason: string;
  description: string;
  userEmail: string;
  submittedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface CategoryStats {
  category: string;
  total: number;
  safe: number;
  phishing: number;
  icon: string;
}

export interface DashboardStats {
  totalScans: number;
  safeWebsites: number;
  blockedWebsites: number;
  phishingDetected: number;
}
