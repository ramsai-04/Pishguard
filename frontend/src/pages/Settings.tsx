import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useScan } from '@/context/ScanContext';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Target, 
  BarChart2, 
  Brain, 
  History, 
  Shield, 
  Bell, 
  Globe, 
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearHistory } = useScan();
  
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      toast.success('History cleared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear history';
      toast.error(message);
    }
  };

  const handleSaveApiUrl = () => {
    updateSettings({ apiUrl });
    toast.success('API URL saved');
  };

  const handleResetSettings = () => {
    resetSettings();
    setApiUrl('');
    toast.success('Settings reset to defaults');
  };

  const sensitivityOptions = [
    { value: 'low', label: 'Low', description: 'Fewer alerts, may miss some threats' },
    { value: 'medium', label: 'Medium', description: 'Balanced detection' },
    { value: 'high', label: 'High', description: 'Maximum protection, more alerts' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Settings</h2>
            <p className="text-muted-foreground">
              Customize your PhishGuard experience
            </p>
          </div>
        </div>
      </div>

      {/* Theme Mode */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          <h3 className="text-lg font-display font-semibold">Theme Mode</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => updateSettings({ theme: 'light' })}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all",
              settings.theme === 'light'
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Sun className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">Light</p>
          </button>
          <button
            onClick={() => updateSettings({ theme: 'dark' })}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all",
              settings.theme === 'dark'
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Moon className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">Dark</p>
          </button>
        </div>
      </div>

      {/* Detection Sensitivity */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-semibold">Detection Sensitivity</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {sensitivityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSettings({ detectionSensitivity: option.value })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                settings.detectionSensitivity === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <p className="font-medium capitalize">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-display font-semibold mb-4">Preferences</h3>
        
        {/* Show Confidence Score */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Show Confidence Score</p>
              <p className="text-sm text-muted-foreground">Display scan result confidence percentage</p>
            </div>
          </div>
          <Switch
            checked={settings.showConfidenceScore}
            onCheckedChange={(checked) => updateSettings({ showConfidenceScore: checked })}
          />
        </div>

        {/* Explainability (XAI) */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Explainability (XAI)</p>
              <p className="text-sm text-muted-foreground">Show detailed result explanations</p>
            </div>
          </div>
          <Switch
            checked={settings.enableXAI}
            onCheckedChange={(checked) => updateSettings({ enableXAI: checked })}
          />
        </div>

        {/* Save History */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Save History</p>
              <p className="text-sm text-muted-foreground">Store analyzed URLs in history</p>
            </div>
          </div>
          <Switch
            checked={settings.saveHistory}
            onCheckedChange={(checked) => updateSettings({ saveHistory: checked })}
          />
        </div>

        {/* Privacy Control */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Privacy Mode</p>
              <p className="text-sm text-muted-foreground">Do not store URLs (incognito scanning)</p>
            </div>
          </div>
          <Switch
            checked={settings.doNotStoreUrls}
            onCheckedChange={(checked) => updateSettings({ doNotStoreUrls: checked })}
          />
        </div>

        {/* Alert on High Risk */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">High Risk Alerts</p>
              <p className="text-sm text-muted-foreground">Show warning when phishing risk is high</p>
            </div>
          </div>
          <Switch
            checked={settings.alertOnHighRisk}
            onCheckedChange={(checked) => updateSettings({ alertOnHighRisk: checked })}
          />
        </div>
      </div>

      {/* History Management */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-semibold">History Management</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          Clear all your scan history data. This action cannot be undone.
        </p>
        <Button variant="destructive" onClick={handleClearHistory} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Clear All History
        </Button>
      </div>

      {/* Backend API Settings */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-semibold">Backend API Settings</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          Optional: Configure a custom API endpoint for URL scanning.
        </p>
        <div className="flex gap-3">
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com/scan"
            className="bg-secondary/50 flex-1"
          />
          <Button onClick={handleSaveApiUrl} className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* About App */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-semibold">About PhishGuard</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground">Built with</span>
            <span className="font-medium">React, TypeScript, Tailwind CSS</span>
          </div>
          <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground">Team</span>
            <span className="font-medium">PhishGuard Security Team</span>
          </div>
        </div>
      </div>

      {/* Reset All Settings */}
      <div className="glass-card p-6 rounded-2xl border-destructive/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold">Reset All Settings</h3>
            <p className="text-muted-foreground text-sm">
              Reset all settings to their default values
            </p>
          </div>
          <Button variant="outline" onClick={handleResetSettings} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
