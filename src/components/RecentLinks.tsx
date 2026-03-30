import { useState, useEffect, useMemo } from "react";
import { 
  Copy, ExternalLink, Check, Trash2, BarChart3, 
  Search, Filter, ArrowUpDown, Calendar, QrCode, 
  Download, MoreVertical, Edit3, ShieldAlert,
  Clock, TrendingUp, MousePointer2, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { QRCodeSVG } from "qrcode.react";

interface UrlData {
  id: string;
  originalUrl: string;
  shortId: string;
  clickCount: number;
  clickHistory: string[];
  createdAt: string;
  category: string;
  expiryDate?: string;
  aiInsights?: {
    summary: string;
    safetyScore: number;
    isPhishing: boolean;
  };
}

interface RecentLinksProps {
  onRefresh: () => void;
  showOnlyAnalytics?: boolean;
  key?: any;
}

export default function RecentLinks({ onRefresh, showOnlyAnalytics = false }: RecentLinksProps) {
  const [links, setLinks] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "clicks">("newest");
  const [selectedLink, setSelectedLink] = useState<UrlData | null>(null);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/urls");
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
    const interval = setInterval(fetchLinks, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Link deleted");
        setDeletingId(null);
        fetchLinks();
      }
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const copyToClipboard = (shortId: string, id: string) => {
    const fullUrl = `${window.location.origin}/${shortId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLinks = useMemo(() => {
    return links
      .filter(link => {
        const matchesSearch = link.originalUrl.toLowerCase().includes(search.toLowerCase()) || 
                             link.shortId.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "All" || link.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return b.clickCount - a.clickCount;
      });
  }, [links, search, categoryFilter, sortBy]);

  const exportToCsv = () => {
    const headers = ["Original URL,Short URL,Clicks,Category,Created At"];
    const rows = filteredLinks.map(link => 
      `"${link.originalUrl}","${window.location.origin}/${link.shortId}",${link.clickCount},"${link.category}","${link.createdAt}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `links_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = (history: string[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, "MMM dd");
    }).reverse();

    const counts = last7Days.map(day => {
      const count = history.filter(ts => format(new Date(ts), "MMM dd") === day).length;
      return { name: day, clicks: count };
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant animate-pulse">Synchronizing your digital conduits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header / Stats */}
      {!showOnlyAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                <MousePointer2 size={20} />
              </div>
              <span className="text-sm font-bold text-on-surface-variant/60 uppercase">Total Clicks</span>
            </div>
            <div className="text-3xl font-bold">{links.reduce((acc, curr) => acc + curr.clickCount, 0)}</div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-bold text-on-surface-variant/60 uppercase">Active Links</span>
            </div>
            <div className="text-3xl font-bold">{links.length}</div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                <Tag size={20} />
              </div>
              <span className="text-sm font-bold text-on-surface-variant/60 uppercase">Top Category</span>
            </div>
            <div className="text-3xl font-bold">
              {Object.entries(links.reduce((acc: any, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
              }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "None"}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
          <input
            type="text"
            placeholder="Search links or IDs..."
            className="w-full bg-surface-container-high border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl">
            <Filter size={16} className="text-on-surface-variant/60" />
            <select 
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {["General", "Social", "Work", "Marketing", "Personal"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl">
            <ArrowUpDown size={16} className="text-on-surface-variant/60" />
            <select 
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest</option>
              <option value="clicks">Most Clicks</option>
            </select>
          </div>
          <button 
            onClick={exportToCsv}
            className="p-2.5 bg-surface-container-high hover:bg-primary/10 text-primary rounded-xl transition-colors"
            title="Export to CSV"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredLinks.map((link) => (
            <motion.div
              layout
              key={link.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden hover:border-primary/30 transition-all group"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {link.category}
                      </span>
                      {link.expiryDate && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${new Date(link.expiryDate) < new Date() ? 'text-red-500' : 'text-orange-500'}`}>
                          <Clock size={12} />
                          {new Date(link.expiryDate) < new Date() ? 'Expired' : `Expires ${format(new Date(link.expiryDate), "MMM dd")}`}
                        </span>
                      )}
                      {link.aiInsights?.isPhishing && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <ShieldAlert size={12} />
                          High Risk
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-on-surface truncate mb-1">
                      {link.originalUrl}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {format(new Date(link.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart3 size={14} />
                        {link.clickCount} clicks
                      </div>
                    </div>
                  </div>

                  {/* Middle: Short Link */}
                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2 bg-surface-container-high p-1.5 rounded-2xl border border-outline-variant/5">
                      <div className="px-4 py-2 font-mono font-bold text-primary text-sm">
                        {window.location.origin}/{link.shortId}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(link.shortId, link.id)}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-on-surface-variant"
                      >
                        {copiedId === link.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                      <a 
                        href={`/${link.shortId}`} 
                        target="_blank" 
                        className="p-2 hover:bg-white rounded-xl transition-colors text-on-surface-variant"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {deletingId === link.id ? (
                        <motion.div 
                          key="confirm"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-2 bg-red-500/10 p-1 rounded-2xl border border-red-500/20"
                        >
                          <button 
                            onClick={() => handleDelete(link.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)}
                            className="px-3 py-2 text-on-surface-variant text-xs font-bold hover:bg-surface-container-high rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="actions"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex items-center gap-2"
                        >
                          <button 
                            onClick={() => setShowQr(showQr === link.id ? null : link.id)}
                            className={`p-3 rounded-2xl transition-all ${showQr === link.id ? 'bg-primary text-white' : 'bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary'}`}
                          >
                            <QrCode size={20} />
                          </button>
                          <button 
                            onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}
                            className={`p-3 rounded-2xl transition-all ${selectedLink?.id === link.id ? 'bg-primary text-white' : 'bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary'}`}
                          >
                            <BarChart3 size={20} />
                          </button>
                          <button 
                            onClick={() => setDeletingId(link.id)}
                            className="p-3 bg-surface-container-high hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 rounded-2xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Expanded Content: QR Code */}
                <AnimatePresence>
                  {showQr === link.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-outline-variant/10 flex flex-col items-center gap-4"
                    >
                      <div className="bg-white p-4 rounded-2xl shadow-inner">
                        <QRCodeSVG value={`${window.location.origin}/${link.shortId}`} size={160} />
                      </div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Scan to visit link</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded Content: Analytics */}
                <AnimatePresence>
                  {(selectedLink?.id === link.id || showOnlyAnalytics) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-outline-variant/10"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant/60 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Click Trends (Last 7 Days)
                          </h4>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={getChartData(link.clickHistory)}>
                                <defs>
                                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant/60 mb-3">AI Insights</h4>
                            <div className="bg-surface-container-high rounded-2xl p-4 text-sm">
                              {link.aiInsights ? (
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Safety Score</span>
                                    <span className={`font-bold ${link.aiInsights.safetyScore > 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                                      {link.aiInsights.safetyScore}/100
                                    </span>
                                  </div>
                                  <p className="text-on-surface-variant leading-relaxed italic">
                                    "{link.aiInsights.summary}"
                                  </p>
                                </>
                              ) : (
                                <p className="text-on-surface-variant/40 italic">No AI insights generated for this link.</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant/60 mb-3">Last Clicked</h4>
                            <div className="text-sm font-medium">
                              {link.clickHistory.length > 0 
                                ? format(new Date(link.clickHistory[link.clickHistory.length - 1]), "MMM dd, HH:mm")
                                : "Never clicked"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/20">
            <div className="bg-surface-container-high p-6 rounded-full mb-4">
              <Search size={48} className="text-on-surface-variant/20" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No links found</h3>
            <p className="text-on-surface-variant/60">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
