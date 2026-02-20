import React, { useState } from 'react';
import { useScan } from '@/context/ScanContext';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Globe, 
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const History: React.FC = () => {
  const { scanHistory, clearHistory } = useScan();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'safe' | 'phishing'>('all');

  const filteredHistory = scanHistory.filter(scan => {
    if (filter === 'all') return true;
    if (filter === 'safe') return !scan.isPhishing;
    if (filter === 'phishing') return scan.isPhishing;
    return true;
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Scan History</h2>
          <p className="text-muted-foreground">View all your previously scanned URLs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {(['all', 'safe', 'phishing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                  filter === f 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          
          {scanHistory.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Scan History</h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? "Start scanning URLs to see your history here"
              : `No ${filter} websites found in your history`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((scan, index) => (
            <div 
              key={scan.id}
              className={cn(
                "glass-card-hover rounded-xl overflow-hidden",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    scan.isPhishing ? "bg-destructive/20" : "bg-success/20"
                  )}>
                    {scan.isPhishing ? (
                      <ShieldAlert className="w-6 h-6 text-destructive" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-success" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        scan.isPhishing 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-success/20 text-success"
                      )}>
                        {scan.isPhishing ? 'Phishing' : 'Safe'}
                      </span>
                      <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                        {scan.category}
                      </span>
                    </div>
                    <p className="font-medium truncate">{scan.domain}</p>
                    <p className="text-sm text-muted-foreground truncate">{scan.url}</p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDate(scan.checkedAt)}
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      scan.isPhishing ? "text-destructive" : "text-success"
                    )}>
                      {scan.isPhishing ? scan.score : 100 - scan.score}% {scan.isPhishing ? 'Risk' : 'Safe'}
                    </div>
                  </div>

                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    {expandedId === scan.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === scan.id && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4 animate-fade-in">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Full URL</h4>
                      <p className="text-sm font-mono break-all bg-secondary/50 p-3 rounded-lg">
                        {scan.url}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Analysis</h4>
                      <p className="text-sm text-foreground/80">
                        {scan.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Domain:</span>
                      <span className="font-medium">{scan.domain}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:hidden">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(scan.checkedAt)}</span>
                    </div>
                    {scan.isBlocked && (
                      <span className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-medium">
                        Auto-Blocked
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
