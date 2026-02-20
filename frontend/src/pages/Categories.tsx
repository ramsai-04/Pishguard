import React, { useState } from 'react';
import { useScan } from '@/context/ScanContext';
import { 
  LayoutGrid, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, string> = {
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

export const Categories: React.FC = () => {
  const { getCategoryStats, getScansByCategory } = useScan();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categoryStats = getCategoryStats();
  const selectedScans = selectedCategory ? getScansByCategory(selectedCategory) : [];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <LayoutGrid className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Categories</h2>
            <p className="text-muted-foreground">
              Your scanned websites organized by category
            </p>
          </div>
        </div>
      </div>

      {categoryStats.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Categories Yet</h3>
          <p className="text-muted-foreground">
            Start scanning URLs to see them organized by category
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Category List */}
          <div className="space-y-3">
            {categoryStats.map((cat, index) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(
                  selectedCategory === cat.category ? null : cat.category
                )}
                className={cn(
                  "w-full glass-card-hover p-4 rounded-xl text-left transition-all animate-fade-in",
                  selectedCategory === cat.category && "border-primary/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{categoryIcons[cat.category] || '🌐'}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{cat.category}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-success">{cat.safe} safe</span>
                      <span className="text-destructive">{cat.phishing} phishing</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-display">{cat.total}</span>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform",
                      selectedCategory === cat.category && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(cat.safe / cat.total) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(142, 76%, 45%), hsl(160, 80%, 50%))'
                    }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Selected Category Details */}
          <div className="glass-card p-6 rounded-2xl">
            {selectedCategory ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{categoryIcons[selectedCategory] || '🌐'}</span>
                  <h3 className="text-xl font-display font-bold">{selectedCategory}</h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedScans.map((scan, index) => (
                    <div
                      key={scan.id}
                      className="p-3 bg-secondary/30 rounded-lg animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          scan.isPhishing ? "bg-destructive/20" : "bg-success/20"
                        )}>
                          {scan.isPhishing ? (
                            <ShieldAlert className="w-4 h-4 text-destructive" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-success" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{scan.domain}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(scan.checkedAt)}
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium shrink-0",
                          scan.isPhishing 
                            ? "bg-destructive/20 text-destructive" 
                            : "bg-success/20 text-success"
                        )}>
                          {scan.isPhishing ? 'Phishing' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div>
                  <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a category to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
