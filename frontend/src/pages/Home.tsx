import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URLScanner } from '@/components/scanner/URLScanner';
import { ScanResultModal } from '@/components/scanner/ScanResultModal';
import { ScanResult } from '@/types';
import { useScan } from '@/context/ScanContext';
import { Shield, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export const Home: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const { addScanResult, getStats } = useScan();
  const navigate = useNavigate();
  const stats = getStats();

  const handleScanComplete = (result: ScanResult) => {
    addScanResult(result);
    setScanResult(result);
  };

  const handleViewDetails = () => {
    setScanResult(null);
    navigate('/history');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalScans}</p>
              <p className="text-xs text-muted-foreground">Total Scans</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.safeWebsites}</p>
              <p className="text-xs text-muted-foreground">Safe Sites</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.phishingDetected}</p>
              <p className="text-xs text-muted-foreground">Threats Found</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.blockedWebsites}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <URLScanner onScanComplete={handleScanComplete} />

      {/* Features */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
              <span className="text-primary font-bold">1</span>
            </div>
            <h4 className="font-medium mb-1">Enter URL</h4>
            <p className="text-sm text-muted-foreground">
              Paste any website URL you want to verify
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
              <span className="text-primary font-bold">2</span>
            </div>
            <h4 className="font-medium mb-1">Instant Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Our system scans for phishing indicators
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
              <span className="text-primary font-bold">3</span>
            </div>
            <h4 className="font-medium mb-1">Get Results</h4>
            <p className="text-sm text-muted-foreground">
              View detailed safety report and recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {scanResult && (
        <ScanResultModal
          result={scanResult}
          onClose={() => setScanResult(null)}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
};

export default Home;
