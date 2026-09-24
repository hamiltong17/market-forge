import { useState } from "react";

export default function Sidebar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: "dashboard", name: "Home", icon: "📊" },
    { id: "watchlist", name: "Watchlist", icon: "📋" },
    { id: "crypto", name: "Crypto", icon: "🪙" },
    { id: "forex", name: "Forex", icon: "💱" },
    { id: "futures", name: "Futures", icon: "📈" },
    { id: "forgetalk", name: "Forge Talk", icon: "🔥" },
    { id: "forge", name: "Forge Picks", icon: "🔮" },
    { id: "newsfeed", name: "News Feed", icon: "📰" },
    { id: "alerts", name: "Alerts", icon: "🔔" },
    { id: "account", name: "Account", icon: "👤" },
    { id: "contact", name: "Contact", icon: "📧" },
  ];

  return (
    <div className="w-64 bg-[#0a0c12] border-r border-white/10 p-4 min-h-screen">
      <div className="mb-8">
        <div className="text-xl font-bold text-cyan-400">MarketForge</div>
        <div className="text-xs text-gray-500 mt-1">Never Miss a Trade</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              currentPage === item.id
                ? "bg-cyan-500/10 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}