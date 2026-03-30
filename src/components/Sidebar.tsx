import { LayoutDashboard, BarChart3, Link2, Megaphone, Settings, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { NavTab } from "../App";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" as NavTab },
    { icon: BarChart3, label: "Analytics" as NavTab },
    { icon: Link2, label: "Links" as NavTab },
    { icon: Megaphone, label: "Campaigns" as NavTab },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-[calc(100vh-72px)] w-64 p-4 gap-2 bg-surface-container-low sticky top-[72px]">
      <div className="mb-8 px-2">
        <div className="text-xl font-bold text-primary">Shortify</div>
        <div className="text-xs text-on-surface-variant font-medium opacity-70">
          Premium URL Shortener
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <motion.button
            key={item.label}
            onClick={() => onTabChange(item.label)}
            whileHover={{ x: 4 }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-300 w-full text-left ${
              activeTab === item.label
                ? "bg-primary/10 text-primary"
                : "text-secondary hover:bg-surface-container-highest"
            }`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.label ? 2.5 : 2} />
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">
          Pro Plan
        </div>
        <div className="text-sm font-medium mb-3 leading-tight">
          Unlock advanced analytics and custom domains.
        </div>
        <button 
          onClick={() => toast.success("Redirecting to checkout...")}
          className="w-full py-2 bg-white text-primary rounded-full text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all active:scale-95"
        >
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}
