import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from 'next/dynamic';
import Card from "./Card";
import WalletWidget from "./WalletWidget";
import PaperTradingTerminal from "./PaperTradingTerminal";
import io from "socket.io-client";

// Dynamically import TradingView chart to avoid SSR issues
const AdvancedRealTimeChart = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.AdvancedRealTimeChart),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#0c1224] flex items-center justify-center text-gray-500">
        Loading chart...
      </div>
    )
  }
);

export default function DashboardGrid({ selectedTicker, setSelectedTicker, onTrade }) {
  const [quotes, setQuotes] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [showTerminal, setShowTerminal] = useState(false);
  const [coinToast, setCoinToast] = useState(null);

  const watchlist = useMemo(
    () => ["SPY", "QQQ", "TSLA", "NVDA", "AAPL", "AMD", "PLTR"],
    []
  );

  // Live clock
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Socket layer for real-time data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.log("Connection error:", error);
      setConnectionStatus("error");
    });

    socket.on("quote", (data) => {
      if (data && data.symbol) {
        setQuotes((prev) => ({
          ...prev,
          [data.symbol]: {
            price: data.price || 0,
            changePercent: data.changePercent || 0,
            volume: data.volume || 0,
          },
        }));
      }
    });

    socket.on("allPrices", (data) => {
      if (data && typeof data === "object") {
        setQuotes(data);
        console.log("Received all prices:", Object.keys(data).length);
      }
    });

    socket.on("alert", (data) => {
      setAlerts((prev) => [
        { id: Date.now(), ...data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 14),
      ]);
    });

    socket.on("news", (data) => {
      setNews((prev) => [
        { id: Date.now(), ...data, time: data.time || new Date().toLocaleTimeString() },
        ...prev.slice(0, 11),
      ]);
    });

    // Listen for FRGE coin awards to show celebration toast
    socket.on("frge:award", (data) => {
      setCoinToast({
        coins: data.coins,
        symbol: data.symbol,
        profit: data.profit,
      });
      setTimeout(() => setCoinToast(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Symbol mapping for TradingView widget
  const getTvSymbol = useCallback((t) => {
    const map = {
      SPY: "AMEX:SPY",
      QQQ: "NASDAQ:QQQ",
      IWM: "AMEX:IWM",
      DIA: "AMEX:DIA",
      LLY: "NYSE:LLY",
      TSLA: "NASDAQ:TSLA",
      NVDA: "NASDAQ:NVDA",
      AAPL: "NASDAQ:AAPL",
      AMD: "NASDAQ:AMD",
      PLTR: "NYSE:PLTR",
      MSFT: "NASDAQ:MSFT",
      GOOGL: "NASDAQ:GOOGL",
      AMZN: "NASDAQ:AMZN",
      META: "NASDAQ:META",
    };
    return map[t] || ("NASDAQ:" + t);
  }, []);

  // Get real-time market strip data
  const marketStrip = useMemo(() => {
    const symbols = ["SPY", "QQQ", "IWM", "DIA", "LLY"];
    return symbols.map((symbol) => ({
      symbol,
      price: quotes[symbol]?.price,
      changePercent: quotes[symbol]?.changePercent,
      change: quotes[symbol]?.changePercent ? 
        (quotes[symbol].changePercent >= 0 ? "+" : "") + quotes[symbol].changePercent.toFixed(2) + "%" : 
        "--"
    }));
  }, [quotes]);

  // Get real-time top movers
  const topMovers = useMemo(() => {
    const watchlistWithChanges = watchlist
      .filter(symbol => quotes[symbol]?.changePercent !== undefined)
      .map(symbol => ({
        symbol,
        changePercent: quotes[symbol].changePercent,
        price: quotes[symbol].price
      }))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 4);
    
    return watchlistWithChanges;
  }, [quotes, watchlist]);

  const currentPrice = quotes[selectedTicker]?.price || 0;

  // Handle trade callback from PaperTradingTerminal
  const handleTradeExecuted = useCallback((trade) => {
    if (onTrade) onTrade(trade);
    setAlerts((prev) => [
      { 
        id: Date.now(), 
        symbol: trade.symbol, 
        message: `${trade.side?.toUpperCase() || "TRADE"} ${trade.quantity} shares at $${trade.price?.toFixed(2)}`,
        time: new Date().toLocaleTimeString() 
      },
      ...prev.slice(0, 14),
    ]);
  }, [onTrade]);

  // If terminal is open, render it full-screen
  if (showTerminal) {
    return (
      <PaperTradingTerminal
        selectedTicker={selectedTicker}
        setSelectedTicker={setSelectedTicker}
        quotes={quotes}
        onTradeExecuted={handleTradeExecuted}
      />
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 p-4 text-white bg-[#070b14] relative">

      {/* FRGE COIN AWARD TOAST */}
      {coinToast && (
        <div className="fixed top-6 right-6 z-[70] animate-slide-in">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🪙</div>
              <div>
                <div className="text-yellow-400 font-bold text-lg">
                  +{coinToast.coins.toLocaleString()} FRGE
                </div>
                <div className="text-xs text-gray-300">
                  {coinToast.symbol} profit: ${coinToast.profit?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="col-span-12 flex justify-between items-center gap-4 border-b border-white/10 pb-2">
        <div className="flex-1">
          <input
            value={search}
            placeholder="Search ticker... (e.g., AAPL, NVDA, TSLA)"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                const newTicker = search.trim().toUpperCase();
                setSelectedTicker(newTicker);
                setSearch("");
              }
            }}
            className="w-full max-w-md bg-[#0c1224] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* CONNECTION INDICATOR */}
          <div className="flex items-center gap-1.5">
            <div className={
              "w-2 h-2 rounded-full " +
              (connectionStatus === "connected" ? "bg-green-400 animate-pulse" :
               connectionStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
               "bg-red-400")
            }></div>
            <span className="text-[10px] text-gray-500 uppercase">{connectionStatus}</span>
          </div>

          {/* TRADE TERMINAL BUTTON */}
          <button
            onClick={() => setShowTerminal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 text-white"
          >
            💰 Paper Trade
          </button>

          <div className="text-cyan-400 text-sm font-mono">{time}</div>
        </div>
      </div>

      {/* TICKER TAPE */}
      <div className="col-span-12 flex gap-4 overflow-x-auto py-2 border-b border-white/10">
        {marketStrip.map((m) => (
          <div
            key={m.symbol}
            className="min-w-[120px] cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition"
            onClick={() => setSelectedTicker(m.symbol)}
          >
            <div className="text-gray-400 text-xs">{m.symbol}</div>
            {m.price ? (
              <>
                <div className="text-white text-xs">${m.price.toFixed(2)}</div>
                <div className={m.changePercent >= 0 ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                  {m.change}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-xs">Waiting...</div>
            )}
          </div>
        ))}
      </div>

      {/* LEFT: WATCHLIST */}
      <div className="col-span-2 flex flex-col gap-3">
        <Card className="p-3 h-[280px] overflow-y-auto">
          <div className="text-gray-400 text-xs mb-2">
            <span>📋 WATCHLIST</span>
          </div>
          {watchlist.map((t) => (
            <div
              key={t}
              onClick={() => setSelectedTicker(t)}
              className={"flex justify-between items-center py-2 cursor-pointer text-sm hover:bg-white/5 px-2 rounded transition " + (selectedTicker === t ? "text-cyan-400 bg-cyan-500/10" : "text-white")}
            >
              <span className="font-medium">{t}</span>
              <div className="flex flex-col items-end">
                <span className="text-gray-300 text-xs">${quotes[t]?.price?.toFixed(2) ?? "--"}</span>
                {quotes[t]?.changePercent && (
                  <span className={"text-[10px] " + (quotes[t].changePercent >= 0 ? "text-green-400" : "text-red-400")}>
                    {(quotes[t].changePercent >= 0 ? "+" : "") + quotes[t].changePercent.toFixed(2) + "%"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </Card>

        {/* WALLET WIDGET */}
        <WalletWidget />
      </div>

      {/* CENTER: CHART */}
      <div className="col-span-7">
        <Card className="h-[520px] overflow-hidden">
          <div className="h-full w-full tradingview-container">
            <AdvancedRealTimeChart
              symbol={getTvSymbol(selectedTicker)}
              theme="dark"
              autosize={true}
              interval="D"
              hide_legend={false}
              allow_symbol_change={true}
              save_image={false}
              container_id={"tradingview_" + selectedTicker}
              studies={["MASD@tv-basicstudies"]}
            />
          </div>
        </Card>
      </div>

      {/* RIGHT: MARKET INTEL STACK */}
      <div className="col-span-3 flex flex-col gap-3">
        {/* TOP MOVERS */}
        <Card className="p-3">
          <div className="text-xs text-gray-400 mb-2">
            <span>🔥 TOP MOVERS</span>
          </div>
          {topMovers.length === 0 ? (
            <div className="text-xs text-gray-500 italic">Loading movers...</div>
          ) : (
            topMovers.map((m) => (
              <div
                key={m.symbol}
                className="flex justify-between items-center text-sm py-1.5 cursor-pointer hover:bg-white/5 px-2 rounded transition"
                onClick={() => setSelectedTicker(m.symbol)}
              >
                <span className="font-medium">{m.symbol}</span>
                <div className="flex flex-col items-end">
                  <span className="text-gray-300 text-xs">${m.price?.toFixed(2) ?? "--"}</span>
                  <span className={m.changePercent >= 0 ? "text-green-400" : "text-red-400"}>
                    {(m.changePercent >= 0 ? "+" : "") + m.changePercent.toFixed(2) + "%"}
                  </span>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* NEWS FEED */}
        <Card className="p-3 h-[220px] overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2 sticky top-0 bg-[#0c1224] pb-1">
            <span>📰 NEWS FLOW</span>
          </div>
          {news.length === 0 ? (
            <div className="text-xs text-gray-500 italic">Waiting for news...</div>
          ) : (
            news.map((n) => (
              <div
                key={n.id}
                className="text-xs border-b border-white/5 py-2 hover:bg-white/5 cursor-pointer transition"
                onClick={() => setSelectedTicker(n.symbol)}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-cyan-400 font-medium shrink-0 text-[10px]">{n.symbol}:</span>
                  <span className="text-gray-300 flex-1 text-[10px]">{n.headline}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{n.time}</span>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* ALERTS */}
        <Card className="p-3 h-[180px] overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2 sticky top-0 bg-[#0c1224] pb-1">
            <span>⚡ ALERTS</span>
          </div>
          {alerts.length === 0 ? (
            <div className="text-xs text-gray-500 italic">Waiting for triggers...</div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="text-xs py-1.5 border-b border-white/5 hover:bg-yellow-500/5 cursor-pointer transition"
                onClick={() => setSelectedTicker(a.symbol)}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-yellow-400 font-medium text-[10px]">{a.symbol}:</span>
                  <span className="text-gray-300 flex-1 text-[10px]">{a.message}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{a.time}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* GLOBAL CSS */}
      <style jsx global>{`
        .tradingview-container iframe {
          height: 100%;
          width: 100%;
        }
        .tradingview-widget-copyright,
        [class*="copyright"],
        [class*="attribution"] {
          display: none !important;
        }
        .tv-chart-view-container .tv-chart-view__footer,
        .tv-footer {
          display: none !important;
        }
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}