import React, { useState } from 'react';
import { useScan } from '@/context/ScanContext';
import { ShieldAlert, AlertTriangle, Search, Ban, Star, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FakeSites: React.FC = () => {
  const { fakeSites, lastScannedCategory, getRelatedFakeSites, toggleFavorite, isFavorite } = useScan();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(fakeSites.map(s => s.category))];
  const relatedSites = lastScannedCategory ? getRelatedFakeSites(lastScannedCategory) : [];

  const filteredSites = fakeSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(search.toLowerCase()) ||
                         site.url.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort favorites to top
  const sortedSites = [...filteredSites].sort((a, b) => {
    const aFav = isFavorite(a.id) ? -1 : 1;
    const bFav = isFavorite(b.id) ? -1 : 1;
    return aFav - bFav;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Related Phishing Sites Based on Last Scan */}
      {relatedSites.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-display font-semibold">
              Known Phishing Sites in "{lastScannedCategory}" Category
            </h3>
          </div>
          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive/90">
              These are known phishing sites related to your recent scan. Be aware and avoid them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedSites.map((site) => (
              <div
                key={site.id}
                className="p-3 bg-secondary/30 rounded-xl flex items-center gap-3 border border-destructive/20"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-destructive">{site.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{site.url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Header */}
      <div className="glass-card p-6 rounded-2xl border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-destructive/20 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Known Phishing Sites</h2>
            <p className="text-muted-foreground">
              Identified fraudulent websites - DO NOT visit these sites
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive/90">
            <strong>Warning:</strong> These websites have been identified as phishing attempts. 
            They may try to steal your personal information, passwords, or financial data. 
            Never enter any credentials on these sites.
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search phishing sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors capitalize",
                  selectedCategory === cat
                    ? "bg-destructive/20 text-destructive"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {sortedSites.map((site, index) => (
          <div
            key={site.id}
            className={cn(
              "glass-card p-4 rounded-xl border-destructive/20 animate-fade-in",
              isFavorite(site.id) && "border-warning/30 bg-warning/5"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-destructive">{site.name}</h3>
                  <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded-full text-xs">
                    Blocked
                  </span>
                  {isFavorite(site.id) && (
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-mono truncate mb-2">
                  {site.url}
                </p>
                <p className="text-sm text-muted-foreground/80">{site.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-secondary rounded text-xs">{site.category}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "ml-auto gap-1",
                      isFavorite(site.id) ? "text-warning" : "text-muted-foreground"
                    )}
                    onClick={() => toggleFavorite(site.id)}
                  >
                    <Star className={cn("w-4 h-4", isFavorite(site.id) && "fill-warning")} />
                    {isFavorite(site.id) ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Auto-blocked
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedSites.length === 0 && (
        <div className="glass-card p-12 rounded-2xl text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Phishing Sites Found</h3>
          <p className="text-muted-foreground">
            No matching phishing sites in our database
          </p>
        </div>
      )}
    </div>
  );
};

export default FakeSites;
