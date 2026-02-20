import React from 'react';
import { 
  Lock, 
  Shield, 
  Eye, 
  Server,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  UserCheck
} from 'lucide-react';

export const Privacy: React.FC = () => {
  const privacyFeatures = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'All data is encrypted using industry-standard AES-256 encryption both in transit and at rest.'
    },
    {
      icon: Eye,
      title: 'No URL Logging',
      description: 'We do not store or log the URLs you scan. Your browsing activity remains completely private.'
    },
    {
      icon: Server,
      title: 'Local Processing',
      description: 'URL analysis is performed locally on your device whenever possible for maximum privacy.'
    },
    {
      icon: UserCheck,
      title: 'User Control',
      description: 'You have full control over your data. Delete your account and all associated data anytime.'
    },
  ];

  const safetyTips = [
    {
      icon: CheckCircle,
      title: 'Check the URL Carefully',
      description: 'Always look at the full URL. Phishing sites often use misspelled versions of legitimate domains (e.g., "amaz0n.com" instead of "amazon.com").'
    },
    {
      icon: Lock,
      title: 'Look for HTTPS',
      description: 'Ensure the website uses HTTPS (look for the padlock icon). However, note that HTTPS alone doesn\'t guarantee a site is legitimate.'
    },
    {
      icon: AlertTriangle,
      title: 'Be Wary of Urgent Messages',
      description: 'Phishing attacks often create a sense of urgency. Be suspicious of messages claiming your account will be closed unless you act immediately.'
    },
    {
      icon: Eye,
      title: 'Verify Sender Identity',
      description: 'Before clicking any link, verify the sender\'s email address. Hover over links to see the actual destination URL.'
    },
    {
      icon: Shield,
      title: 'Use Two-Factor Authentication',
      description: 'Enable 2FA on all your important accounts. This adds an extra layer of security even if your password is compromised.'
    },
    {
      icon: Lightbulb,
      title: 'Trust Your Instincts',
      description: 'If something feels off about a website or email, trust your gut. It\'s better to verify than to become a victim.'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Privacy & Safety</h1>
            <p className="text-muted-foreground">Your security is our top priority</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          At PhishGuard, we take your privacy seriously. This page explains how we protect your 
          data and provides essential tips to keep you safe online. We believe in transparency 
          and want you to feel confident using our service.
        </p>
      </div>

      {/* Privacy Features */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">How We Protect Your Privacy</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {privacyFeatures.map((feature, index) => (
            <div 
              key={feature.title}
              className="p-4 bg-secondary/30 rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Use PhishGuard */}
      <div className="glass-card p-6 rounded-2xl border-primary/30">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-display font-bold">Why Use PhishGuard?</h2>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Instant Protection:</strong> Our real-time URL 
            scanner analyzes websites in seconds, giving you immediate peace of mind before 
            entering any sensitive information.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Always Updated:</strong> Our phishing database 
            is continuously updated with the latest threats, ensuring you're protected against 
            even the newest scams.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Easy to Use:</strong> Simply paste any URL and 
            get a clear, easy-to-understand safety report. No technical knowledge required.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Free & Accessible:</strong> Basic URL scanning 
            is completely free. We believe everyone deserves access to online security tools.
          </p>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">Online Safety Tips</h2>
        <div className="space-y-4">
          {safetyTips.map((tip, index) => (
            <div 
              key={tip.title}
              className="flex gap-4 p-4 bg-secondary/30 rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <tip.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Handling */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-4">Your Data, Your Control</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">What We Collect:</strong> We only collect the 
            minimum data necessary to provide our service - your email for account creation 
            and optional scan history for your convenience.
          </p>
          <p>
            <strong className="text-foreground">What We Don't Do:</strong> We never sell your 
            data to third parties. We don't track your browsing behavior beyond our app. We 
            don't share your scan history with anyone.
          </p>
          <p>
            <strong className="text-foreground">Data Deletion:</strong> You can request complete 
            deletion of your account and all associated data at any time. We comply with GDPR 
            and other privacy regulations.
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center text-sm text-muted-foreground p-4">
        <p>
          Have questions about our privacy practices?{' '}
          <a href="#" className="text-primary hover:underline">Contact our privacy team</a>
        </p>
      </div>
    </div>
  );
};

export default Privacy;
