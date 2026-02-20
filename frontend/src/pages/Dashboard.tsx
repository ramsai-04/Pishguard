import React from 'react';
import { useScan } from '@/context/ScanContext';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Ban,
  TrendingUp,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export const Dashboard: React.FC = () => {
  const { getStats, getCategoryStats, scanHistory } = useScan();
  const stats = getStats();
  const categoryStats = getCategoryStats();

  const pieData = [
    { name: 'Safe', value: stats.safeWebsites, color: 'hsl(142, 76%, 45%)' },
    { name: 'Phishing', value: stats.phishingDetected, color: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  const statCards = [
    {
      title: 'Total Scans',
      value: stats.totalScans,
      icon: Shield,
      color: 'primary',
      description: 'URLs analyzed'
    },
    {
      title: 'Safe Websites',
      value: stats.safeWebsites,
      icon: ShieldCheck,
      color: 'success',
      description: 'Verified legitimate'
    },
    {
      title: 'Threats Detected',
      value: stats.phishingDetected,
      icon: ShieldAlert,
      color: 'destructive',
      description: 'Phishing attempts'
    },
    {
      title: 'Blocked Sites',
      value: stats.blockedWebsites,
      icon: Ban,
      color: 'warning',
      description: 'Auto-blocked threats'
    },
  ];

  const getColorClass = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      primary: { bg: 'bg-primary/20', text: 'text-primary' },
      success: { bg: 'bg-success/20', text: 'text-success' },
      destructive: { bg: 'bg-destructive/20', text: 'text-destructive' },
      warning: { bg: 'bg-warning/20', text: 'text-warning' },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const colors = getColorClass(card.color);
          return (
            <div 
              key={card.title} 
              className="glass-card-hover p-6 rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg)}>
                  <card.icon className={cn("w-6 h-6", colors.text)} />
                </div>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold font-display mb-1">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold">Scan Distribution</h3>
          </div>

          {stats.totalScans > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No data yet</p>
                <p className="text-sm text-muted-foreground/70">Start scanning URLs to see statistics</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold">Category Breakdown</h3>
          </div>

          {categoryStats.length > 0 ? (
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">{cat.total} scans</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-success to-destructive rounded-full"
                        style={{ 
                          width: `100%`,
                          background: `linear-gradient(to right, hsl(142, 76%, 45%) ${(cat.safe / cat.total) * 100}%, hsl(0, 72%, 51%) ${(cat.safe / cat.total) * 100}%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{cat.safe} safe</span>
                      <span>{cat.phishing} phishing</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No categories yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-display font-semibold mb-4">Recent Activity</h3>
        {scanHistory.length > 0 ? (
          <div className="space-y-3">
            {scanHistory.slice(0, 5).map((scan, index) => (
              <div 
                key={scan.id}
                className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  scan.isPhishing ? "bg-destructive/20" : "bg-success/20"
                )}>
                  {scan.isPhishing ? (
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{scan.domain}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scan.checkedAt).toLocaleString()}
                  </p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium shrink-0",
                  scan.isPhishing 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-success/20 text-success"
                )}>
                  {scan.isPhishing ? 'Blocked' : 'Safe'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
