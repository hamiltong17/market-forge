import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import io from "socket.io-client";

export default function FuturesPage({ selectedTicker, setSelectedTicker }) {
  const [futuresData, setFuturesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFuture, setSelectedFuture] = useState("ES");
  const [time, setTime] = useState("");
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);
  const [dataReceived, setDataReceived] = useState(false);

  // Futures symbols
  const futuresSymbols = [
    { symbol: "ES", name: "S&P 500 E-mini", icon: "📊", color: "#4f8cf7" },
    { symbol: "NQ", name: "Nasdaq-100 E-mini", icon: "📈", color: "#7c3aed" },
    { symbol: "YM", name: "Dow E-mini", icon: "📉", color: "#2563eb" },
    { symbol: "GC", name: "Gold", icon: "🥇", color: "#f59e0b" },
    { symbol: "SI", name: "Silver", icon: "🥈", color: "#94a3b8" },
    { symbol: "CL", name: "Crude Oil WTI", icon: "🛢️", color: "#ef4444" },
    { symbol: "NG", name: "Natural Gas", icon: "🔥", color: "#f97316" },
    { symbol: "ZB", name: "30-Year T-Bond", icon: "🏛️", color: "#8b5cf6" },
    { symbol: "ZN", name: "10-Year T-Note", icon: "🏦", color: "#6366f1" },
    { symbol: "6E", name: "Euro FX", icon: "💶", color: "#06b6d4" },
    { symbol: "6J", name: "Japanese Yen", icon: "💴", color: "#14b8a6" },
    { symbol: "6B", name: "British Pound", icon: "💷", color: "#22c55e" },
  ];

  // Live clock
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

  // Socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    console.log("🔄 Futures page connecting to socket server:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Futures socket connected");
      setConnectionStatus("connected");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Futures socket disconnected");
      setConnectionStatus("disconnected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.log("⚠️ Futures socket connection error:", error.message);
      setConnectionStatus("error");
    });

    socketRef.current.on("allPrices", (data) => {
      console.log("📊 Futures page received allPrices");
      if (data && typeof data === "object") {
        const futuresQuotes = {};
        let count = 0;
        futuresSymbols.forEach((f) => {
          if (data[f.symbol]) {
            futuresQuotes[f.symbol] = {
              price: data[f.symbol].price || 0,
              changePercent: data[f.symbol].changePercent || 0,
              volume: data[f.symbol].volume || 0,
            };
            count++;
          }
        });
        setFuturesData(futuresQuotes);
        setDataReceived(true);
        console.log("📊 Filtered futures prices:", count);
      }
    });

    socketRef.current.on("quote", (data) => {
      if (data && data.symbol) {
        const isFutures = futuresSymbols.some((f) => f.symbol === data.symbol);
        if (isFutures) {
          console.log(`📊 Futures quote received: ${data.symbol} = $${data.price}`);
          setFuturesData((prev) => ({
            ...prev,
            [data.symbol]: {
              price: data.price || 0,
              changePercent: data.changePercent || 0,
              volume: data.volume || 0,
            },
          }));
        }
      }
    });

    socketRef.current.emit("getAllPrices");

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Calculate gainers and losers
  useEffect(() => {
    const entries = Object.entries(futuresData);
    const withData = entries
      .filter(([_, data]) => data && data.changePercent !== undefined && data.price > 0)
      .map(([symbol, data]) => ({ symbol, ...data }));

    if (withData.length > 0) {
      const sorted = [...withData].sort((a, b) => b.changePercent - a.changePercent);
      setGainers(sorted.slice(0, 5));
      setLosers(sorted.slice(-5).reverse());
      setLoading(false);
    }
  }, [futuresData]);

  // Get future icon
  const getFutureIcon = (symbol) => {
    const found = futuresSymbols.find((f) => f.symbol === symbol);
    return found ? found.icon : "📊";
  };

  // Get future color
  const getFutureColor = (symbol) => {
    const found = futuresSymbols.find((f) => f.symbol === symbol);
    return found ? found.color : "#888";
  };

  // Get future name
  const getFutureName = (symbol) => {
    const found = futuresSymbols.find((f) => f.symbol === symbol);
    return found ? found.name : symbol;
  };

  const formatPrice = (num) => {
    if (num === undefined || num === null || num === 0) return "--";
    if (num >= 10000) return "$" + num.toFixed(2);
    if (num >= 100) return "$" + num.toFixed(2);
    if (num >= 1) return "$" + num.toFixed(3);
    return "$" + num.toFixed(4);
  };

  // Filter futures based on search
  const filteredFutures = futuresSymbols.filter((f) =>
    f.symbol.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get current data for selected future
  const currentData = futuresData[selectedFuture];

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header - Updated: removed */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Futures</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time futures and commodities prices
          </p>
        </div>
        <div className="text-cyan-400 text-sm font-mono">{time}</div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search futures... (e.g., ES, NQ, Gold)"
            className="w-full bg-[#0c1224] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card className="p-3 h-[600px] overflow-y-auto">
            <div className="text-gray-400 text-xs mb-2 flex justify-between items-center sticky top-0 bg-[#0c1224] pb-2">
              <span>📊 FUTURES LIST</span>
              <span className="text-[10px] text-gray-500">{filteredFutures.length} contracts</span>
            </div>
            <div className="space-y-1">
              {loading && !dataReceived ? (
                <div className="text-center text-gray-500 py-8 text-sm">Loading futures prices...</div>
              ) : (
                filteredFutures.map((f) => {
                  const data = futuresData[f.symbol];
                  const isSelected = selectedFuture === f.symbol;
                  const hasData = data && data.price > 0;
                  return (
                    <div
                      key={f.symbol}
                      onClick={() => setSelectedFuture(f.symbol)}
                      className={`flex justify-between items-center p-2 cursor-pointer rounded-lg transition ${
                        isSelected
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: getFutureColor(f.symbol) }} className="text-lg">
                          {f.icon}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{f.symbol}</div>
                          <div className="text-[10px] text-gray-500">{f.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {hasData ? formatPrice(data.price) : "--"}
                        </div>
                        {hasData && data.changePercent !== undefined && (
                          <div className={data.changePercent >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                            {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-5">
          <Card className="p-3 h-[600px] overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" style={{ color: getFutureColor(selectedFuture) }}>
                  {getFutureIcon(selectedFuture)}
                </span>
                <span className="font-bold">{selectedFuture}</span>
                <span className="text-xs text-gray-500">{getFutureName(selectedFuture)}</span>
                {currentData && currentData.price > 0 && (
                  <>
                    <span className="text-sm text-gray-300 ml-2">
                      {formatPrice(currentData.price)}
                    </span>
                    {currentData.changePercent !== undefined && (
                      <span className={currentData.changePercent >= 0 ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                        {currentData.changePercent >= 0 ? "+" : ""}{currentData.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="h-[520px] w-full">
              <AdvancedRealTimeChart
                symbol={(() => {
                  const map = {
                    "ES": "ES1!",
                    "NQ": "NQ1!",
                    "YM": "YM1!",
                    "GC": "GC1!",
                    "SI": "SI1!",
                    "CL": "CL1!",
                    "NG": "NG1!",
                    "ZB": "ZB1!",
                    "ZN": "ZN1!",
                    "6E": "6E1!",
                    "6J": "6J1!",
                    "6B": "6B1!",
                  };
                  return map[selectedFuture] || selectedFuture;
                })()}
                theme="dark"
                autosize={true}
                interval="D"
                hide_legend={false}
                allow_symbol_change={true}
                save_image={false}
                container_id={"tradingview_futures_" + selectedFuture}
                studies={["MASD@tv-basicstudies"]}
              />
            </div>
          </Card>
        </div>

        <div className="col-span-3 flex flex-col gap-3">
          <Card className="p-3 flex-1">
            <div className="text-green-400 text-xs mb-2 flex items-center gap-2">
              <span>📈 TOP GAINERS</span>
              <span className="text-[10px] text-gray-500">24h</span>
            </div>
            {loading && !dataReceived ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : gainers.length === 0 ? (
              <div className="text-xs text-gray-500">No data yet</div>
            ) : (
              <div className="space-y-2">
                {gainers.map((f) => (
                  <div
                    key={f.symbol}
                    className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded"
                    onClick={() => setSelectedFuture(f.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getFutureColor(f.symbol) }}>
                        {getFutureIcon(f.symbol)}
                      </span>
                      <span className="text-sm">{f.symbol}</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium">
                      +{f.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3 flex-1">
            <div className="text-red-400 text-xs mb-2 flex items-center gap-2">
              <span>📉 TOP LOSERS</span>
              <span className="text-[10px] text-gray-500">24h</span>
            </div>
            {loading && !dataReceived ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : losers.length === 0 ? (
              <div className="text-xs text-gray-500">No data yet</div>
            ) : (
              <div className="space-y-2">
                {losers.map((f) => (
                  <div
                    key={f.symbol}
                    className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded"
                    onClick={() => setSelectedFuture(f.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getFutureColor(f.symbol) }}>
                        {getFutureIcon(f.symbol)}
                      </span>
                      <span className="text-sm">{f.symbol}</span>
                    </div>
                    <span className="text-red-400 text-sm font-medium">
                      {f.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3">
            <div className="text-gray-400 text-xs mb-2">📊 MARKET STATS</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Contracts</span>
                <span>{futuresSymbols.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">With Data</span>
                <span>{Object.keys(futuresData).filter(k => futuresData[k]?.price > 0).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gainers</span>
                <span className="text-green-400">{gainers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Losers</span>
                <span className="text-red-400">{losers.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .tradingview-widget-copyright,
        [class*="copyright"],
        [class*="attribution"] {
          display: none !important;
        }
        .tv-chart-view-container .tv-chart-view__footer,
        .tv-footer {
          display: none !important;
        }
      `}</style>
    </div>
  );
}