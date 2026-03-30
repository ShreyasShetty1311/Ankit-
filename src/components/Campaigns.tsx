import { useState, useEffect, FormEvent } from "react";
import { Megaphone, Plus, Calendar, BarChart3, Link2, ArrowRight, Loader2, X, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
}

interface UrlData {
  id: string;
  originalUrl: string;
  shortId: string;
  clickCount: number;
  category: string;
  campaignId?: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [links, setLinks] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [campRes, linkRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/urls")
      ]);
      const [campData, linkData] = await Promise.all([
        campRes.json(),
        linkRes.json()
      ]);
      setCampaigns(campData);
      setLinks(linkData);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name) return;

    setCreating(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      });

      if (response.ok) {
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
        setNewCampaign({ name: "", description: "" });
        fetchData();
      } else {
        toast.error("Failed to create campaign");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const getCampaignStats = (campaignId: string) => {
    const campaignLinks = links.filter(l => l.campaignId === campaignId);
    const totalClicks = campaignLinks.reduce((sum, l) => sum + l.clickCount, 0);
    return {
      linkCount: campaignLinks.length,
      totalClicks
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant">Loading your marketing engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
            <Megaphone className="text-primary" size={32} />
            Campaigns
          </h1>
          <p className="text-on-surface-variant mt-1">Group and track your marketing efforts</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const stats = getCampaignStats(campaign.id);
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                  campaign.status === 'paused' ? 'bg-orange-500/10 text-orange-500' : 
                  'bg-on-surface-variant/10 text-on-surface-variant'
                }`}>
                  {campaign.status}
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant/40 flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(campaign.createdAt), "MMM dd, yyyy")}
                </div>
              </div>

              <h3 className="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                {campaign.name}
              </h3>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 h-10">
                {campaign.description || "No description provided."}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/5">
                <div>
                  <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">Links</div>
                  <div className="flex items-center gap-2 text-on-surface font-bold">
                    <Link2 size={16} className="text-primary" />
                    {stats.linkCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">Total Clicks</div>
                  <div className="flex items-center gap-2 text-on-surface font-bold">
                    <BarChart3 size={16} className="text-primary" />
                    {stats.totalClicks}
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface-variant hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
                View Details
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          );
        })}

        {campaigns.length === 0 && (
          <div className="col-span-full py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-primary/5 p-4 rounded-full mb-4">
              <Megaphone size={40} className="text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No campaigns yet</h3>
            <p className="text-on-surface-variant max-w-xs">
              Create your first campaign to group related links and track their collective performance.
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-xl font-bold">Create New Campaign</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                    Campaign Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., Summer Sale 2026"
                    className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2 ml-1">
                    Description
                  </label>
                  <textarea 
                    placeholder="Briefly describe the goal of this campaign..."
                    className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all h-24 resize-none"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={creating}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={20} className="animate-spin" /> : "Create Campaign"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
