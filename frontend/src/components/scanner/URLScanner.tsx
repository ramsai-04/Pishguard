import React, { useState } from 'react';
import { Search, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanResult } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { toast } from 'sonner';
import { getFirebaseAuthToken } from '@/lib/firebase';

interface URLScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export const URLScanner: React.FC<URLScannerProps> = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { settings } = useSettings();

  const detectCategory = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('amazon') || lowerUrl.includes('flipkart') || lowerUrl.includes('shop') || lowerUrl.includes('store') || lowerUrl.includes('buy')) return 'E-commerce';
    if (lowerUrl.includes('coursera') || lowerUrl.includes('udemy') || lowerUrl.includes('edu') || lowerUrl.includes('learn') || lowerUrl.includes('school')) return 'Education';
    if (lowerUrl.includes('health') || lowerUrl.includes('medical') || lowerUrl.includes('doctor') || lowerUrl.includes('hospital')) return 'Health';
    if (lowerUrl.includes('bank') || lowerUrl.includes('paypal') || lowerUrl.includes('chase') || lowerUrl.includes('finance')) return 'Banking';
    if (lowerUrl.includes('gov') || lowerUrl.includes('government')) return 'Government';
    if (lowerUrl.includes('netflix') || lowerUrl.includes('youtube') || lowerUrl.includes('movie') || lowerUrl.includes('music')) return 'Entertainment';
    if (lowerUrl.includes('facebook') || lowerUrl.includes('twitter') || lowerUrl.includes('instagram') || lowerUrl.includes('social')) return 'Social Media';
    if (lowerUrl.includes('google') || lowerUrl.includes('microsoft') || lowerUrl.includes('tech') || lowerUrl.includes('software')) return 'Technology';
    return 'Other';
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  interface ScanApiResponse {
    id?: string;
    isPhishing: boolean;
    score: number;
    explanation: string;
    category?: string;
    domain?: string;
    isBlocked?: boolean;
    checkedAt?: string;
  }

  const handleScan = async () => {
    if (!url.trim()) return;

    setIsScanning(true);

    try {
      if (!settings.apiUrl) {
        toast.error('Set backend API URL in Settings before scanning.');
        return;
      }

      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const token = await getFirebaseAuthToken();

      const response = await fetch(settings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: normalizedUrl,
          sensitivity: settings.detectionSensitivity,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        throw new Error(`Scan API failed with status ${response.status}`);
      }

      const data = (await response.json()) as ScanApiResponse;

      if (
        typeof data.isPhishing !== 'boolean' ||
        typeof data.score !== 'number' ||
        typeof data.explanation !== 'string'
      ) {
        throw new Error('Invalid scan API response format');
      }

      const result: ScanResult = {
        id: data.id ?? crypto.randomUUID(),
        url: normalizedUrl,
        isPhishing: data.isPhishing,
        score: Math.min(100, Math.max(0, data.score)),
        explanation: data.explanation,
        category: data.category ?? detectCategory(normalizedUrl),
        checkedAt: data.checkedAt ? new Date(data.checkedAt) : new Date(),
        isBlocked: data.isBlocked ?? data.isPhishing,
        domain: data.domain ?? extractDomain(normalizedUrl),
      };

      onScanComplete(result);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Scan timed out. Please retry.'
          : error instanceof Error
            ? error.message
            : 'Failed to scan URL';
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-8 rounded-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center float-animation">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">
          URL Security Scanner
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Enter a website URL to check if it's safe or potentially harmful
        </p>

        <div className="relative">
          <Input
            type="text"
            placeholder="Enter URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-14 pl-12 pr-4 text-lg bg-secondary/50 border-border focus:border-primary"
            disabled={isScanning}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>

        <Button
          onClick={handleScan}
          disabled={!url.trim() || isScanning}
          size="xl"
          variant="gradient"
          className="w-full mt-4"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning URL...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Scan URL
            </>
          )}
        </Button>

        {isScanning && (
          <div className="mt-6">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent shimmer" />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Analyzing URL security...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
