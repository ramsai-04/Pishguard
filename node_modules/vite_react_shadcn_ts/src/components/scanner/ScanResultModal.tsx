import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  Share2, 
  Info, 
  X,
  Ban,
  Clock,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanResult } from '@/types';
import { cn } from '@/lib/utils';

interface ScanResultModalProps {
  result: ScanResult;
  onClose: () => void;
  onViewDetails: () => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({ 
  result, 
  onClose, 
  onViewDetails 
}) => {
  const isSafe = !result.isPhishing;

  const handleShare = async () => {
    const text = `PhishGuard Scan Result:\nURL: ${result.url}\nStatus: ${isSafe ? '✅ Safe' : '⚠️ Phishing'}\nSafety Score: ${isSafe ? 100 - result.score : result.score}%`;
    
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleOpenSite = () => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative w-full max-w-md rounded-2xl p-6 animate-scale-in",
          isSafe 
            ? "bg-gradient-to-br from-success/20 to-emerald-900/40 border border-success/30" 
            : "bg-gradient-to-br from-destructive/20 to-red-900/40 border border-destructive/30"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div 
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              isSafe ? "bg-success/20 pulse-safe" : "bg-destructive/20 pulse-danger"
            )}
          >
            {isSafe ? (
              <ShieldCheck className="w-10 h-10 text-success" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-destructive" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className={cn(
          "text-2xl font-display font-bold text-center mb-2",
          isSafe ? "text-success" : "text-destructive"
        )}>
          {isSafe ? 'Website is Safe!' : '⚠️ Phishing Detected!'}
        </h2>

        {/* Score */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            isSafe ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            Safety Score: {isSafe ? 100 - result.score : result.score}% {isSafe ? 'Safe' : 'Risk'}
          </div>
        </div>

        {/* URL Info */}
        <div className="glass-card p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Scanned URL</span>
          </div>
          <p className="text-sm font-mono break-all text-foreground">{result.url}</p>
          
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {result.checkedAt.toLocaleTimeString()}
              </span>
            </div>
            <div className="px-2 py-1 bg-secondary rounded text-xs">
              {result.category}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {result.explanation.substring(0, 150)}...
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {isSafe ? (
            <>
              <Button 
                variant="gradient-success" 
                onClick={handleOpenSite}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Site
              </Button>
              <Button 
                variant="glass" 
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="gradient-danger"
                className="gap-2"
                disabled
              >
                <Ban className="w-4 h-4" />
                Blocked
              </Button>
              <Button 
                variant="glass" 
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Report
              </Button>
            </>
          )}
        </div>

        <Button 
          variant="ghost" 
          onClick={onViewDetails}
          className="w-full mt-3 gap-2"
        >
          <Info className="w-4 h-4" />
          View Full Details
        </Button>

        <Button 
          variant="ghost" 
          onClick={onClose}
          className="w-full mt-2 text-muted-foreground"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
