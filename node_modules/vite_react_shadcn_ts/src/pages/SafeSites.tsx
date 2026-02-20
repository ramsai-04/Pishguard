import React, { useState } from 'react';
import { useScan } from '@/context/ScanContext';
import { ShieldCheck, ExternalLink, Search, Globe, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const SafeSites: React.FC = () => {
  const { safeSites, lastScannedCategory, getRelatedSafeSites, toggleFavorite, isFavorite } = useScan();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(safeSites.map(s => s.category))];
  const relatedSites = lastScannedCategory ? getRelatedSafeSites(lastScannedCategory) : [];

  const filteredSites = safeSites.filter(site => {
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
      {/* Recommended Sites Based on Last Scan */}
      {relatedSites.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold">
              Recommended Safe Sites for "{lastScannedCategory}"
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedSites.map((site) => (
              <div
                key={site.id}
                className="p-3 bg-secondary/30 rounded-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{site.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => window.open(site.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Safe Websites</h2>
            <p className="text-muted-foreground">
              Trusted and verified websites across different categories
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search safe sites..."
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
                    ? "bg-success/20 text-success"
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
              "glass-card-hover p-4 rounded-xl animate-fade-in",
              isFavorite(site.id) && "border-warning/30 bg-warning/5"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{site.name}</h3>
                  <span className="px-2 py-0.5 bg-success/20 text-success rounded-full text-xs">
                    Verified
                  </span>
                  {isFavorite(site.id) && (
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mb-2">{site.url}</p>
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
                    {isFavorite(site.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(site.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedSites.length === 0 && (
        <div className="glass-card p-12 rounded-2xl text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Sites Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default SafeSites;
