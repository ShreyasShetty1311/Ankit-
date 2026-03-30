import { useState, useEffect } from "react";
import { Megaphone, Plus, Search, Filter, ArrowRight, BarChart3, Users, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  category: string;
  linkCount: number;
  totalClicks: number;
  status: "active" | "paused" | "completed";
  createdAt: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching campaigns based on categories
    const fetchCampaigns = async () => {
      try {
        const response = await fetch("/api/urls");
        const urls = await response.json();
        
        const categories = ["General", "Social", "Work", "Marketing", "Personal"];
        const campaignData: Campaign[] = categories.map((cat, i) => {
          const catUrls = urls.filter((u: any) => u.category === cat);
          return {
            id: `camp-${i}`,
            name: `${cat} Outreach 2026`,
            category: cat,
            linkCount: catUrls.length,
            totalClicks: catUrls.reduce((acc: number, curr: any) => acc + curr.clickCount, 0),
            status: catUrls.length > 0 ? "active" : "paused",
            createdAt: new Date().toISOString()
          };
        });
        
        setCampaigns(campaignData);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant animate-pulse">Orchestrating campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Marketing Campaigns</h2>
          <p className="text-on-surface-variant/60">Organize and track your links by strategic initiatives.</p>
        </div>
        <button 
          onClick={() => toast.info("Campaign creation coming soon in Pro plan!")}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <motion.div
            key={campaign.id}
            whileHover={{ y: -5 }}
            className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl ${campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-on-surface-variant/10 text-on-surface-variant'}`}>
                <Megaphone size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                campaign.status === 'paused' ? 'bg-orange-500/10 text-orange-500' : 
                'bg-blue-500/10 text-blue-500'
              }`}>
                {campaign.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-on-surface mb-1">{campaign.name}</h3>
            <p className="text-sm text-on-surface-variant/60 mb-6">{campaign.category} Strategy</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-container-high p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-on-surface-variant/60 mb-1">
                  <Target size={14} />
                  <span className="text-[10px] font-bold uppercase">Links</span>
                </div>
                <div className="text-lg font-bold">{campaign.linkCount}</div>
              </div>
              <div className="bg-surface-container-high p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-on-surface-variant/60 mb-1">
                  <BarChart3 size={14} />
                  <span className="text-[10px] font-bold uppercase">Clicks</span>
                </div>
                <div className="text-lg font-bold">{campaign.totalClicks}</div>
              </div>
            </div>
            
            <button 
              onClick={() => toast.info(`Viewing details for ${campaign.name}`)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-2xl font-bold text-sm transition-all group"
            >
              View Analytics
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/20">
          <Megaphone size={48} className="text-on-surface-variant/20 mb-4" />
          <h3 className="text-xl font-bold text-on-surface mb-2">No campaigns yet</h3>
          <p className="text-on-surface-variant/60">Create your first campaign to start tracking strategic goals.</p>
        </div>
      )}
    </div>
  );
}
