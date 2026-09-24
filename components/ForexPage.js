import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import io from "socket.io-client";

export default function ForexPage({ selectedTicker, setSelectedTicker }) {
  const [forexData, setForexData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedForex, setSelectedForex] = useState("EUR-USD");
  const [time, setTime] = useState("");
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);
  const [dataReceived, setDataReceived] = useState(false);

  const forexSymbols = [
    { symbol: "EUR-USD", name: "Euro / US Dollar", icon: "💶", color: "#06b6d4" },
    { symbol: "GBP-USD", name: "British Pound / US Dollar", icon: "💷", color: "#22c55e" },
    { symbol: "USD-JPY", name: "US Dollar / Japanese Yen", icon: "💴", color: "#14b8a6" },
    { symbol: "USD-CHF", name: "US Dollar / Swiss Franc", icon: "🇨🇭", color: "#8b5cf6" },
    { symbol: "AUD-USD", name: "Australian Dollar / US Dollar", icon: "🇦🇺", color: "#f59e0b" },
    { symbol: "USD-CAD", name: "US Dollar / Canadian Dollar", icon: "🇨🇦", color: "#ef4444" },
    { symbol: "NZD-USD", name: "New Zealand Dollar / US Dollar", icon: "🇳🇿", color: "#ec4899" },
    { symbol: "EUR-GBP", name: "Euro / British Pound", icon: "💶💷", color: "#6366f1" },
    { symbol: "EUR-JPY", name: "Euro / Japanese Yen", icon: "💶💴", color: "#8b5cf6" },
    { symbol: "GBP-JPY", name: "British Pound / Japanese Yen", icon: "💷💴", color: "#22c55e" },
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
    console.log("🔄 Forex page connecting to socket server:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Forex socket connected");
      setConnectionStatus("connected");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Forex socket disconnected");
      setConnectionStatus("disconnected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.log("⚠️ Forex socket connection error:", error.message);
      setConnectionStatus("error");
    });

    socketRef.current.on("allPrices", (data) => {
      console.log("📊 Forex page received allPrices");
      if (data && typeof data === "object") {
        const forexQuotes = {};
        let count = 0;
        forexSymbols.forEach((f) => {
          if (data[f.symbol]) {
            forexQuotes[f.symbol] = {
              price: data[f.symbol].price || 0,
              changePercent: data[f.symbol].changePercent || 0,
              volume: data[f.symbol].volume || 0,
            };
            count++;
          }
        });
        setForexData(forexQuotes);
        setDataReceived(true);
        console.log("📊 Filtered forex prices:", count);
      }
    });

    socketRef.current.on("quote", (data) => {
      if (data && data.symbol) {
        const isForex = forexSymbols.some((f) => f.symbol === data.symbol);
        if (isForex) {
          console.log(`💱 Forex quote received: ${data.symbol} = ${data.price}`);
          setForexData((prev) => ({
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
    const entries = Object.entries(forexData);
    const withData = entries
      .filter(([_, data]) => data && data.changePercent !== undefined && data.price > 0)
      .map(([symbol, data]) => ({ symbol, ...data }));

    if (withData.length > 0) {
      const sorted = [...withData].sort((a, b) => b.changePercent - a.changePercent);
      setGainers(sorted.slice(0, 5));
      setLosers(sorted.slice(-5).reverse());
      setLoading(false);
    }
  }, [forexData]);

  const getForexIcon = (symbol) => {
    const found = forexSymbols.find((f) => f.symbol === symbol);
    return found ? found.icon : "💱";
  };

  const getForexColor = (symbol) => {
    const found = forexSymbols.find((f) => f.symbol === symbol);
    return found ? found.color : "#888";
  };

  const getForexName = (symbol) => {
    const found = forexSymbols.find((f) => f.symbol === symbol);
    return found ? found.name : symbol;
  };

  const formatPrice = (num) => {
    if (num === undefined || num === null || num === 0) return "--";
    if (num >= 100) return num.toFixed(2);
    if (num >= 10) return num.toFixed(3);
    if (num >= 1) return num.toFixed(4);
    return num.toFixed(5);
  };

  const filteredForex = forexSymbols.filter((f) =>
    f.symbol.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentData = forexData[selectedForex];

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header - Updated: removed */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Forex</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time currency exchange rates
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
            placeholder="Search forex pair... (e.g., EUR-USD, GBP-JPY)"
            className="w-full bg-[#0c1224] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card className="p-3 h-[600px] overflow-y-auto">
            <div className="text-gray-400 text-xs mb-2 flex justify-between items-center sticky top-0 bg-[#0c1224] pb-2">
              <span>💱 FOREX PAIRS</span>
              <span className="text-[10px] text-gray-500">{filteredForex.length} pairs</span>
            </div>
            <div className="space-y-1">
              {loading && !dataReceived ? (
                <div className="text-center text-gray-500 py-8 text-sm">Loading forex prices...</div>
              ) : (
                filteredForex.map((f) => {
                  const data = forexData[f.symbol];
                  const isSelected = selectedForex === f.symbol;
                  const hasData = data && data.price > 0;
                  return (
                    <div
                      key={f.symbol}
                      onClick={() => setSelectedForex(f.symbol)}
                      className={`flex justify-between items-center p-2 cursor-pointer rounded-lg transition ${
                        isSelected
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: getForexColor(f.symbol) }} className="text-lg">
                          {f.icon}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{f.symbol}</div>
                          <div className="text-[10px] text-gray-500">{f.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">
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
                <span className="text-xl" style={{ color: getForexColor(selectedForex) }}>
                  {getForexIcon(selectedForex)}
                </span>
                <span className="font-bold">{selectedForex}</span>
                <span className="text-xs text-gray-500">{getForexName(selectedForex)}</span>
                {currentData && currentData.price > 0 && (
                  <>
                    <span className="text-sm text-gray-300 ml-2 font-mono">
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
                symbol={selectedForex.replace("-", "")}
                theme="dark"
                autosize={true}
                interval="D"
                hide_legend={false}
                allow_symbol_change={true}
                save_image={false}
                container_id={"tradingview_forex_" + selectedForex}
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
                    onClick={() => setSelectedForex(f.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getForexColor(f.symbol) }}>
                        {getForexIcon(f.symbol)}
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
                    onClick={() => setSelectedForex(f.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getForexColor(f.symbol) }}>
                        {getForexIcon(f.symbol)}
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
                <span className="text-gray-400">Pairs</span>
                <span>{forexSymbols.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">With Data</span>
                <span>{Object.keys(forexData).filter(k => forexData[k]?.price > 0).length}</span>
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