import { useState, useEffect } from "react";
import Card from "./Card";

export default function WalletWidget() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = localStorage.getItem('userId');
    if (!userId) { setLoading(false); return; }

    fetch(`${API_BASE}/api/frge/wallet/${userId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setWallet(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-3">
        <div className="text-xs text-gray-400">WALLET</div>
        <div className="text-xs text-gray-500 mt-2">Loading...</div>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className="p-3">
        <div className="text-xs text-gray-400 mb-2">WALLET</div>
        <div className="text-xs text-gray-500 italic">No wallet connected</div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="text-xs text-gray-400 mb-2 flex justify-between">
        <span>WALLET</span>
        <span className="text-[10px] text-cyan-400">● live</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">FRGE Coins</span>
          <span className="text-sm font-bold text-yellow-400">
            {wallet.coins?.toLocaleString() || 0}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Paper Funds</span>
          <span className="text-sm font-medium text-cyan-400">
            ${wallet.paperFunds?.toFixed(2) || '0.00'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Buying Power</span>
          <span className="text-sm font-medium text-white">
            ${wallet.paperBalance?.toLocaleString() || 0}
          </span>
        </div>

        {wallet.sharesAllocated > 0 && (
          <div className="flex justify-between items-center pt-1 border-t border-white/5">
            <span className="text-xs text-gray-400">FRGE Shares</span>
            <span className="text-sm font-bold text-purple-400">
              {wallet.sharesAllocated.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-500">
        {wallet.ipoConversionReady
          ? '✅ IPO ready — convert coins'
          : '⏳ IPO pending'}
      </div>
    </Card>
  );
}