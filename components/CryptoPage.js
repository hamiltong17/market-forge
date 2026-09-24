import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import io from "socket.io-client";

export default function CryptoPage({ selectedTicker, setSelectedTicker }) {
  const [cryptoData, setCryptoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC-USD");
  const [time, setTime] = useState("");
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);
  const [dataReceived, setDataReceived] = useState(false);

  // Cryptocurrency symbols
  const cryptoSymbols = [
    { symbol: "BTC-USD", name: "Bitcoin", icon: "₿", color: "#f7931a" },
    { symbol: "ETH-USD", name: "Ethereum", icon: "⟠", color: "#627eea" },
    { symbol: "SOL-USD", name: "Solana", icon: "◎", color: "#9945ff" },
    { symbol: "XRP-USD", name: "XRP", icon: "✕", color: "#00aae4" },
    { symbol: "ADA-USD", name: "Cardano", icon: "₳", color: "#0033ad" },
    { symbol: "DOGE-USD", name: "Dogecoin", icon: "Ð", color: "#c2a633" },
    { symbol: "DOT-USD", name: "Polkadot", icon: "●", color: "#e6007a" },
    { symbol: "LINK-USD", name: "Chainlink", icon: "🔗", color: "#2a5ada" },
    { symbol: "AVAX-USD", name: "Avalanche", icon: "▲", color: "#e84142" },
    { symbol: "MATIC-USD", name: "Polygon", icon: "◆", color: "#8247e5" },
    { symbol: "SHIB-USD", name: "Shiba Inu", icon: "🐕", color: "#ff6100" },
    { symbol: "UNI-USD", name: "Uniswap", icon: "🦄", color: "#ff007a" },
    { symbol: "LTC-USD", name: "Litecoin", icon: "Ł", color: "#345d9d" },
    { symbol: "BCH-USD", name: "Bitcoin Cash", icon: "₿", color: "#8dc451" },
    { symbol: "ATOM-USD", name: "Cosmos", icon: "⚛", color: "#2e3148" },
    { symbol: "FIL-USD", name: "Filecoin", icon: "◉", color: "#0090ff" },
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

  // Socket connection for real-time data
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    console.log("🔄 Crypto page connecting to socket server:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Crypto socket connected");
      setConnectionStatus("connected");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Crypto socket disconnected");
      setConnectionStatus("disconnected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.log("⚠️ Crypto socket connection error:", error.message);
      setConnectionStatus("error");
    });

    socketRef.current.on("allPrices", (data) => {
      console.log("📊 Crypto page received allPrices");
      if (data && typeof data === "object") {
        const cryptoQuotes = {};
        let count = 0;
        cryptoSymbols.forEach((c) => {
          if (data[c.symbol]) {
            cryptoQuotes[c.symbol] = {
              price: data[c.symbol].price || 0,
              changePercent: data[c.symbol].changePercent || 0,
              volume: data[c.symbol].volume || 0,
            };
            count++;
          }
        });
        setCryptoData(cryptoQuotes);
        setDataReceived(true);
        console.log("📊 Filtered crypto prices:", count);
      }
    });

    socketRef.current.on("quote", (data) => {
      if (data && data.symbol) {
        const isCrypto = cryptoSymbols.some((c) => c.symbol === data.symbol);
        if (isCrypto) {
          console.log(`🪙 Crypto quote received: ${data.symbol} = $${data.price}`);
          setCryptoData((prev) => ({
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
    const entries = Object.entries(cryptoData);
    const withData = entries
      .filter(([_, data]) => data && data.changePercent !== undefined && data.price > 0)
      .map(([symbol, data]) => ({ symbol, ...data }));

    if (withData.length > 0) {
      const sorted = [...withData].sort((a, b) => b.changePercent - a.changePercent);
      setGainers(sorted.slice(0, 5));
      setLosers(sorted.slice(-5).reverse());
      setLoading(false);
    }
  }, [cryptoData]);

  // Get crypto icon
  const getCryptoIcon = (symbol) => {
    const found = cryptoSymbols.find((c) => c.symbol === symbol);
    return found ? found.icon : "₿";
  };

  // Get crypto color
  const getCryptoColor = (symbol) => {
    const found = cryptoSymbols.find((c) => c.symbol === symbol);
    return found ? found.color : "#888";
  };

  // Get crypto name
  const getCryptoName = (symbol) => {
    const found = cryptoSymbols.find((c) => c.symbol === symbol);
    return found ? found.name : symbol;
  };

  const formatPrice = (num) => {
    if (num === undefined || num === null || num === 0) return "--";
    if (num >= 1000) return "$" + num.toFixed(2);
    if (num >= 1) return "$" + num.toFixed(3);
    if (num >= 0.01) return "$" + num.toFixed(4);
    if (num >= 0.0001) return "$" + num.toFixed(6);
    return "$" + num.toFixed(8);
  };

  // Filter cryptos based on search
  const filteredCryptos = cryptoSymbols.filter((c) =>
    c.symbol.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get current data for selected crypto
  const currentData = cryptoData[selectedCrypto];

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header - Updated: removed */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Crypto</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time cryptocurrency prices
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
            placeholder="Search crypto... (e.g., Bitcoin, ETH, SOL)"
            className="w-full bg-[#0c1224] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Crypto List */}
        <div className="col-span-4">
          <Card className="p-3 h-[600px] overflow-y-auto">
            <div className="text-gray-400 text-xs mb-2 flex justify-between items-center sticky top-0 bg-[#0c1224] pb-2">
              <span>🪙 CRYPTO LIST</span>
              <span className="text-[10px] text-gray-500">{filteredCryptos.length} assets</span>
            </div>
            <div className="space-y-1">
              {loading && !dataReceived ? (
                <div className="text-center text-gray-500 py-8 text-sm">Loading crypto prices...</div>
              ) : (
                filteredCryptos.map((c) => {
                  const data = cryptoData[c.symbol];
                  const isSelected = selectedCrypto === c.symbol;
                  const hasData = data && data.price > 0;
                  return (
                    <div
                      key={c.symbol}
                      onClick={() => setSelectedCrypto(c.symbol)}
                      className={`flex justify-between items-center p-2 cursor-pointer rounded-lg transition ${
                        isSelected
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: getCryptoColor(c.symbol) }} className="text-lg">
                          {c.icon}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{c.symbol}</div>
                          <div className="text-[10px] text-gray-500">{c.name}</div>
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

        {/* Center: Chart */}
        <div className="col-span-5">
          <Card className="p-3 h-[600px] overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" style={{ color: getCryptoColor(selectedCrypto) }}>
                  {getCryptoIcon(selectedCrypto)}
                </span>
                <span className="font-bold">{selectedCrypto}</span>
                <span className="text-xs text-gray-500">{getCryptoName(selectedCrypto)}</span>
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
                symbol={selectedCrypto.replace("-", "")}
                theme="dark"
                autosize={true}
                interval="D"
                hide_legend={false}
                allow_symbol_change={true}
                save_image={false}
                container_id={"tradingview_crypto_" + selectedCrypto}
                studies={["MASD@tv-basicstudies"]}
              />
            </div>
          </Card>
        </div>

        {/* Right: Gainers/Losers */}
        <div className="col-span-3 flex flex-col gap-3">
          {/* Top Gainers */}
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
                {gainers.map((c) => (
                  <div
                    key={c.symbol}
                    className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded"
                    onClick={() => setSelectedCrypto(c.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getCryptoColor(c.symbol) }}>
                        {getCryptoIcon(c.symbol)}
                      </span>
                      <span className="text-sm">{c.symbol}</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium">
                      +{c.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Losers */}
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
                {losers.map((c) => (
                  <div
                    key={c.symbol}
                    className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded"
                    onClick={() => setSelectedCrypto(c.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: getCryptoColor(c.symbol) }}>
                        {getCryptoIcon(c.symbol)}
                      </span>
                      <span className="text-sm">{c.symbol}</span>
                    </div>
                    <span className="text-red-400 text-sm font-medium">
                      {c.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Market Stats */}
          <Card className="p-3">
            <div className="text-gray-400 text-xs mb-2">📊 MARKET STATS</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Assets</span>
                <span>{cryptoSymbols.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">With Data</span>
                <span>{Object.keys(cryptoData).filter(k => cryptoData[k]?.price > 0).length}</span>
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