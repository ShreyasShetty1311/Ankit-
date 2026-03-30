import { Bell, Settings, Search, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full top-0 sticky bg-surface/80 backdrop-blur-md z-50 border-b border-outline-variant/5">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
            <Sparkles className="fill-primary" size={24} />
            Shortify Pro
          </div>
          
          <div className="hidden lg:flex items-center bg-surface-container-high px-4 py-2 rounded-full w-80 border border-outline-variant/10">
            <Search size={16} className="text-on-surface-variant/40 mr-2" />
            <input 
              type="text" 
              placeholder="Quick search links..." 
              className="bg-transparent border-none text-sm focus:ring-0 w-full"
            />
            <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-container-highest px-1.5 py-0.5 rounded border border-outline-variant/10">⌘K</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 mr-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Status</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-on-surface-variant/60">All Systems Operational</span>
          </div>

          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 relative">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/10">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-on-surface">Shreyas Shetty</div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Pro Member</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/20 shadow-sm">
              <img
                alt="User profile avatar"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
