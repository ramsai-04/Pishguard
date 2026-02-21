import React, { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, FileText, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getFirebaseAuthToken } from "@/lib/firebase";

const reportReasons = [
  "Phishing attempt",
  "Malware distribution",
  "Scam website",
  "Identity theft",
  "Financial fraud",
  "Data harvesting",
  "Impersonation",
  "Other",
];

export const SafetyCenter: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

  const normalizeUrl = (rawUrl: string): string =>
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!apiBaseUrl) {
        throw new Error("API base URL is not configured");
      }
      const token = await getFirebaseAuthToken();
      if (!token) {
        throw new Error("Please sign in to submit reports");
      }

      const response = await fetch(`${apiBaseUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          websiteUrl: normalizeUrl(websiteUrl.trim()),
          reason: selectedReason,
          description: description.trim(),
          userEmail: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(err?.message || `Report submission failed (${response.status})`);
      }

      setIsSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep the internet safe!",
      });

      setTimeout(() => {
        setIsSubmitted(false);
        setWebsiteUrl("");
        setSelectedReason("");
        setDescription("");
        setEmail("");
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast({
        title: "Submission Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Safety Center</h2>
            <p className="text-muted-foreground">Report suspicious websites and help protect others</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium mb-1">Report Threats</h3>
            <p className="text-sm text-muted-foreground">Help identify dangerous websites</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium mb-1">Document Evidence</h3>
            <p className="text-sm text-muted-foreground">Provide details for investigation</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium mb-1">Protect Community</h3>
            <p className="text-sm text-muted-foreground">Keep everyone safe online</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-display font-bold mb-6">Submit a Report</h3>

        {isSubmitted ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h4 className="text-xl font-bold mb-2">Report Submitted Successfully!</h4>
            <p className="text-muted-foreground">Our team will review your report and take appropriate action.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Suspicious Website URL *</label>
              <Input
                type="text"
                placeholder="Enter the website URL"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason for Report *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`p-2 rounded-lg text-sm border transition-colors ${
                      selectedReason === reason
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                placeholder="Describe the issue in detail."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/50 min-h-[120px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Email (for follow-up)</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                By submitting this report, you help protect users from online threats.
              </p>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={!websiteUrl || !selectedReason || !description || isSubmitting}>
              {isSubmitting ? "Submitting..." : <>
                <Send className="w-5 h-5" />
                Submit Report
              </>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SafetyCenter;
