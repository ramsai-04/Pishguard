import React from 'react';
import { 
  Shield, 
  Target, 
  Users, 
  Zap,
  CheckCircle,
  Globe,
  Lock,
  Eye
} from 'lucide-react';

export const About: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Instant Detection',
      description: 'Real-time URL analysis using advanced algorithms to identify phishing threats instantly.'
    },
    {
      icon: Lock,
      title: 'Auto-Blocking',
      description: 'Automatically blocks detected phishing websites to prevent accidental access.'
    },
    {
      icon: Eye,
      title: 'Detailed Reports',
      description: 'Comprehensive analysis reports explaining why a website is flagged as dangerous.'
    },
    {
      icon: Users,
      title: 'Community Protection',
      description: 'User reports help improve detection and protect the entire community.'
    },
  ];

  const howToUse = [
    {
      step: 1,
      title: 'Enter the URL',
      description: 'Copy and paste any suspicious website URL into the scanner on the home page.'
    },
    {
      step: 2,
      title: 'Wait for Analysis',
      description: 'Our system analyzes the URL against multiple security indicators and patterns.'
    },
    {
      step: 3,
      title: 'Review Results',
      description: 'View the safety score, detailed explanation, and recommended actions.'
    },
    {
      step: 4,
      title: 'Take Action',
      description: 'Safe sites can be opened directly; phishing sites are automatically blocked.'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="glass-card p-8 rounded-2xl text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center float-animation">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-4">
          About <span className="gradient-text">PhishGuard</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          PhishGuard is your trusted companion for safe internet browsing. We help you identify 
          and avoid phishing websites that could steal your personal information, passwords, 
          and financial data.
        </p>
      </div>

      {/* Mission */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold">Our Mission</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          In today's digital world, phishing attacks have become increasingly sophisticated, 
          targeting individuals and organizations alike. Our mission is to provide a simple, 
          accessible, and powerful tool that empowers everyone to verify website authenticity 
          before sharing sensitive information. We believe that online security should be 
          available to all, not just cybersecurity experts.
        </p>
      </div>

      {/* Features */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">Key Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature, index) => (
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

      {/* How to Use */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">How to Use PhishGuard</h2>
        <div className="space-y-4">
          {howToUse.map((item, index) => (
            <div 
              key={item.step}
              className="flex gap-4 p-4 bg-secondary/30 rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">{item.step}</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">Why It Matters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <p className="text-3xl font-bold font-display text-primary">3.4B+</p>
            <p className="text-sm text-muted-foreground">Phishing emails sent daily</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold font-display text-destructive">$17.4B</p>
            <p className="text-sm text-muted-foreground">Lost to phishing annually</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold font-display text-warning">85%</p>
            <p className="text-sm text-muted-foreground">Organizations affected</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold font-display text-success">99%</p>
            <p className="text-sm text-muted-foreground">Preventable with awareness</p>
          </div>
        </div>
        <p className="text-muted-foreground text-center mt-4">
          Phishing is one of the most common and dangerous cyber threats. With PhishGuard, 
          you can protect yourself and your loved ones from falling victim to these attacks.
        </p>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground p-4">
        <Globe className="w-5 h-5 inline-block mr-2" />
        Protecting users worldwide with advanced phishing detection technology
      </div>
    </div>
  );
};

export default About;
