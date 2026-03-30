import React, { useState } from "react";
import { Link2, Sparkles, ShieldCheck, Calendar, Zap, ChevronDown, Globe, Copy, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { scanUrlSafety } from "../services/geminiService";

interface UrlShortenerProps {
  onShortened: () => void;
}

export default function UrlShortener({ onShortened }: UrlShortenerProps) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [customShortId, setCustomShortId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [shortenedResult, setShortenedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = ["General", "Social", "Work", "Marketing", "Personal"];

  React.useEffect(() => {
    fetch("/api/campaigns")
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(err => console.error("Error fetching campaigns:", err));
  }, []);

  const handleCopy = () => {
    if (shortenedResult) {
      // Copy the REAL URL to clipboard so it actually works
      navigator.clipboard.writeText(shortenedResult);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAiScan = async () => {
    if (!url || !url.startsWith("http")) {
      toast.error("Please enter a valid URL first");
      return;
    }
    setScanning(true);
    try {
      const insights = await scanUrlSafety(url);
      setAiInsights(insights);
      if (insights.category && insights.category !== "Unknown") {
        setCategory(insights.category);
      }
      toast.success("AI Scan complete!");
    } catch (error) {
      toast.error("AI Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          originalUrl: url, 
          category,
          customShortId: customShortId || undefined,
          expiryDate: expiryDate || undefined,
          campaignId: campaignId || undefined,
          aiInsights
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const fullUrl = `${window.location.origin}/${data.shortId}`;
        setShortenedResult(fullUrl);
        toast.success("URL shortened successfully!");
        setUrl("");
        setCustomShortId("");
        setExpiryDate("");
        setCampaignId("");
        setAiInsights(null);
        onShortened();
      } else {
        toast.error(data.error || "Failed to shorten URL");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayUrl = (url: string) => {
    const shortId = url.split('/').pop();
    return `ank.it/${shortId}`;
  };

  return (
    <section className="mb-12">
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-xl shadow-primary/5 border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Zap className="text-primary" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Create New Link</h2>
        </div>

        <form onSubmit={handleShorten} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
              <Globe size={20} />
            </div>
            <input
              type="url"
              placeholder="Paste your long URL here (e.g., https://example.com/very-long-path)"
              className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-32 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handleAiScan}
              disabled={scanning}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface-container-highest hover:bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {scanning ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              AI Scan
            </button>
          </div>

          <AnimatePresence>
            {aiInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-4"
              >
                <div className={`p-2 rounded-lg ${aiInsights.safetyScore > 80 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">AI Safety Score: {aiInsights.safetyScore}/100</span>
                    {aiInsights.isPhishing && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Phishing Risk</span>}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {aiInsights.summary}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-bold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} size={16} />
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-on-surface appearance-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                      Custom ID (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm font-mono">
                        /
                      </div>
                      <input
                        type="text"
                        placeholder="my-cool-link"
                        className="w-full bg-surface-container-high border-none rounded-2xl py-3 pl-8 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all"
                        value={customShortId}
                        onChange={(e) => setCustomShortId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                      Campaign (Optional)
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-on-surface appearance-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                      >
                        <option value="">No Campaign</option>
                        {campaigns.map((camp) => (
                          <option key={camp.id} value={camp.id}>
                            {camp.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                      Expiry Date (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                        <Calendar size={16} />
                      </div>
                      <input
                        type="date"
                        className="w-full bg-surface-container-high border-none rounded-2xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Shorten URL
                <Zap size={20} />
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {shortenedResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Link2 className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">
                    Your shortened conduit
                  </p>
                  <p className="text-xl font-mono font-bold text-on-surface">
                    {getDisplayUrl(shortenedResult)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-outline-variant/10 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-all"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
                <a
                  href={shortenedResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all"
                >
                  Visit
                  <ExternalLink size={18} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
