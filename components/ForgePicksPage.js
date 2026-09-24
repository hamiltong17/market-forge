import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import Card from "./Card";
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

export default function ForgePicksPage({ selectedTicker, setSelectedTicker }) {
  const [oracleData, setOracleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("IWM");
  const [searchInput, setSearchInput] = useState("");
  const [time, setTime] = useState("");
  const [quotes, setQuotes] = useState({});
  const [showFullDisclosure, setShowFullDisclosure] = useState(false);
  const socketRef = useRef(null);

  // Available symbols for search
  const popularSymbols = [
    "AAPL", "NVDA", "TSLA", "AMD", "PLTR", "SPY", "QQQ", "IWM", "DIA", "LLY",
    "MSFT", "GOOGL", "AMZN", "META", "NFLX", "INTC", "IBM", "CSCO", "ORCL", "ADBE"
  ];

  // API base URL (your backend server)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

  // Socket connection for real-time quotes - only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("quote", (data) => {
      setQuotes((prev) => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          changePercent: data.changePercent,
        },
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch oracle data from your backend
  const fetchOracleData = async (ticker) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/oracle/${encodeURIComponent(ticker)}?interval=1min&outputsize=390`,
        { cache: "no-store" }
      );
      const data = await response.json();
      setOracleData(data);
      console.log("Oracle data received:", data);
    } catch (error) {
      console.error("Error fetching oracle data:", error);
      setOracleData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchOracleData(symbol);
    }
  }, [symbol]);

  // Handle search
  const handleSearch = () => {
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
      setSearchInput("");
      if (setSelectedTicker) {
        setSelectedTicker(searchInput.trim().toUpperCase());
      }
    }
  };

  // Get current price for the selected symbol
  const currentPrice = quotes[symbol]?.price || oracleData?.quote?.current;

  // Helper to format numbers
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return "--";
    return num.toFixed(decimals);
  };

  // Helper to get confidence color
  const getConfidenceColor = (score) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Helper to get bias color
  const getBiasColor = (bias) => {
    if (bias === "bullish") return "text-green-400";
    if (bias === "bearish") return "text-red-400";
    return "text-yellow-400";
  };

  // Helper to get bias icon
  const getBiasIcon = (bias) => {
    if (bias === "bullish") return "📈";
    if (bias === "bearish") return "📉";
    return "➡️";
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Forge Picks</h1>
          <p className="text-gray-400 text-sm mt-1">
            AI-powered options recommendations based on market analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 text-sm font-mono">{time}</div>
        </div>
      </div>

      {/* Symbol Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search ticker... (e.g., AAPL, NVDA, TSLA)"
            className="w-full bg-[#0c1224] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg text-sm font-medium transition"
        >
          Analyze
        </button>
      </div>

      {/* Popular Tickers */}
      <div className="flex gap-2 flex-wrap mb-6">
        {popularSymbols.map((sym) => (
          <button
            key={sym}
            onClick={() => {
              setSymbol(sym);
              if (setSelectedTicker) setSelectedTicker(sym);
            }}
            className={`px-3 py-1 rounded-lg text-xs transition ${
              symbol === sym
                ? "bg-cyan-500 text-white"
                : "bg-[#0c1224] text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-cyan-400">Loading forge picks...</div>
        </div>
      ) : oracleData ? (
        <>
          {/* Current Price & Market State */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Current Price</div>
              <div className="text-2xl font-bold text-cyan-400">
                ${formatNumber(currentPrice)}
              </div>
              {oracleData.quote?.percentChange && (
                <div className={`text-xs ${oracleData.quote.percentChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {oracleData.quote.percentChange >= 0 ? "+" : ""}{oracleData.quote.percentChange.toFixed(2)}%
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Market Bias</div>
              <div className={`text-2xl font-bold ${getBiasColor(oracleData.oracle?.bias)} flex items-center gap-2`}>
                {getBiasIcon(oracleData.oracle?.bias)} {oracleData.oracle?.bias?.toUpperCase() || "NEUTRAL"}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Combined Score</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(oracleData.oracle?.score || 0)}`}>
                {oracleData.oracle?.score || 0}
              </div>
              <div className="text-xs text-gray-500">Price + News sentiment</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Expiration</div>
              <div className="text-lg font-bold text-white">
                {oracleData.oracle?.expiration || "--"}
              </div>
              <div className="text-xs text-gray-500">Next trading day</div>
            </Card>
          </div>

          {/* News Sentiment Section */}
          {oracleData.oracle?.headlines && oracleData.oracle.headlines.length > 0 && (
            <Card className="p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📰</span>
                  <span className="font-semibold">News Sentiment</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getBiasColor(oracleData.oracle?.newsBias)}`}>
                    {oracleData.oracle?.newsBias?.toUpperCase() || "NEUTRAL"} ({oracleData.oracle?.newsScore || 0})
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {oracleData.oracle.headlines.slice(0, 3).map((headline, idx) => (
                  <div key={idx} className="text-sm text-gray-300 border-l-2 border-cyan-500/50 pl-3 py-1">
                    {headline.title}
                  </div>
                ))}
              </div>
              {oracleData.oracle?.reason && (
                <div className="mt-3 pt-2 border-t border-white/10 text-xs text-gray-400">
                  <span className="text-cyan-400">Analysis:</span> {oracleData.oracle.reason}
                </div>
              )}
            </Card>
          )}

          {/* Technical Levels */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Recent High</div>
              <div className="text-xl font-bold text-green-400">
                ${formatNumber(oracleData.oracle?.recentHigh)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs mb-1">Recent Low</div>
              <div className="text-xl font-bold text-red-400">
                ${formatNumber(oracleData.oracle?.recentLow)}
              </div>
            </Card>
          </div>

          {/* Options Recommendations - Main Feature */}
          <div className="grid grid-cols-2 gap-6">
            {/* CALL Option */}
            <Card className="p-4 border-t-4 border-t-green-500">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <span className="font-bold text-green-400">CALL Recommendation</span>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${getConfidenceColor(oracleData.oracle?.call?.score)}`}>
                  Score: {oracleData.oracle?.call?.score || 0}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Strike Price</span>
                  <span className="font-mono font-bold">${formatNumber(oracleData.oracle?.call?.strike)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expiration</span>
                  <span>{oracleData.oracle?.call?.expiration || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bid / Ask</span>
                  <span className="font-mono">${formatNumber(oracleData.oracle?.call?.bid)} / ${formatNumber(oracleData.oracle?.call?.ask)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Implied Volatility</span>
                  <span>{formatNumber(oracleData.oracle?.call?.iv)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delta</span>
                  <span>{formatNumber(oracleData.oracle?.call?.delta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume / OI</span>
                  <span>{oracleData.oracle?.call?.volume?.toLocaleString()} / {oracleData.oracle?.call?.openInterest?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10">
                <div className="text-xs text-gray-400">
                  <span className="text-green-400">Strategy:</span> Buy call if price holds above support
                </div>
              </div>
            </Card>

            {/* PUT Option */}
            <Card className="p-4 border-t-4 border-t-red-500">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📉</span>
                  <span className="font-bold text-red-400">PUT Recommendation</span>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${getConfidenceColor(oracleData.oracle?.put?.score)}`}>
                  Score: {oracleData.oracle?.put?.score || 0}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Strike Price</span>
                  <span className="font-mono font-bold">${formatNumber(oracleData.oracle?.put?.strike)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expiration</span>
                  <span>{oracleData.oracle?.put?.expiration || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bid / Ask</span>
                  <span className="font-mono">${formatNumber(oracleData.oracle?.put?.bid)} / ${formatNumber(oracleData.oracle?.put?.ask)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Implied Volatility</span>
                  <span>{formatNumber(oracleData.oracle?.put?.iv)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delta</span>
                  <span>{formatNumber(oracleData.oracle?.put?.delta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume / OI</span>
                  <span>{oracleData.oracle?.put?.volume?.toLocaleString()} / {oracleData.oracle?.put?.openInterest?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10">
                <div className="text-xs text-gray-400">
                  <span className="text-red-400">Strategy:</span> Buy put if price breaks below support
                </div>
              </div>
            </Card>
          </div>

          {/* Market Analysis Summary */}
          <Card className="p-4 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔮</span>
              <span className="font-semibold">AI Market Analysis</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {oracleData.oracle?.bias === "bullish" && 
                `The market shows bullish momentum for ${symbol}. ${oracleData.oracle?.reason || "Price action and volume indicate upward pressure."} Consider call options for upside exposure.`}
              {oracleData.oracle?.bias === "bearish" && 
                `The market shows bearish signals for ${symbol}. ${oracleData.oracle?.reason || "Price action suggests downward movement."} Consider put options or downside protection.`}
              {(!oracleData.oracle?.bias || oracleData.oracle?.bias === "neutral") && 
                `Market conditions for ${symbol} are mixed. ${oracleData.oracle?.reason || "Wait for clearer direction before entering positions."}`}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <span>Volume Ratio: {oracleData.oracle?.volumeRatio || 1}x</span>
              <span className="ml-4">Day Change: {oracleData.oracle?.dayChangePct || 0}%</span>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-gray-400">
            <p className="text-lg mb-2">🔮 No forge picks available</p>
            <p className="text-sm">Search for a ticker to get AI-powered options recommendations</p>
            <p className="text-xs mt-4 text-gray-500">Make sure your backend server is running on port 3000</p>
          </div>
        </Card>
      )}

      {/* Disclosure Section - Collapsible */}
      <div className="mt-8 pt-4 border-t border-white/10 text-[10px] text-gray-500">
        <button
          onClick={() => setShowFullDisclosure(!showFullDisclosure)}
          className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-2 text-xs font-medium"
        >
          <span>{showFullDisclosure ? "▼" : "▶"}</span>
          <span>{showFullDisclosure ? "Hide" : "Read"} Full Disclosure & Legal Notice</span>
        </button>

        {showFullDisclosure && (
          <div className="mt-3 space-y-2 text-gray-400 leading-relaxed">
            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">Opinion-Based Information &amp; Projections:</span>
              {" "}The analysis, price targets, and recommendations provided through Forge Picks are statements of opinion and belief regarding potential market movements. Under Section 11 of the Securities Act of 1933, a statement of opinion is not an “untrue statement of a material fact” simply because the opinion ultimately proves incorrect, provided the opinion was sincerely held at the time it was made. However, a statement of opinion may give rise to liability if it omits material facts about the basis for the opinion or the issuer’s knowledge concerning it, and if those facts conflict with what a reasonable investor would take from the statement itself.
            </p>

            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">Not an Offering or Recommendation to Buy/Sell Securities:</span>
              {" "}Forge Picks is provided for informational and educational purposes only. It does not constitute an offer to sell, a solicitation of an offer to buy, or a recommendation to purchase or sell any security. Nothing in Forge Picks should be construed as investment, tax, or legal advice. All investment strategies and investments involve risk of loss, including the possible loss of principal.
            </p>

            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">“Forward-Looking Statements”:</span>
              {" "}Any statements regarding future price movements, projected returns, or market conditions are forward-looking statements based on current expectations and assumptions. These statements are not guarantees of future performance. Actual results may differ materially from those expressed or implied.
            </p>

            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">No Guarantee of Accuracy or Completeness:</span>
              {" "}MarketForge does not warrant that the information, projections, or analyses provided through Forge Picks are accurate, complete, or reliable. Past performance does not guarantee future results. Users should conduct their own independent research and consult with a qualified financial advisor before making any investment decisions.
            </p>

            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">Limitation of Liability:</span>
              {" "}To the fullest extent permitted by law, MarketForge and its affiliates, directors, officers, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of Forge Picks or reliance on any information contained therein.
            </p>

            <p className="text-[10px]">
              <span className="font-semibold text-gray-300">Section 11 &amp; 12(a)(2) Liability:</span>
              {" "}Statements of opinion or belief contained in Forge Picks are based on MarketForge’s reasonable inquiry and analysis at the time they are made. If any such opinion statement is later determined to have lacked a reasonable basis, or if material facts regarding the basis for such opinion are omitted, liability may arise under Section 11 or Section 12(a)(2) of the Securities Act of 1933. MarketForge disclaims any intent to mislead and encourages users to verify all information independently.
            </p>

            <p className="text-[10px] text-yellow-400/70 pt-2 border-t border-white/5 mt-2">
              ⚠️ By using Forge Picks, you acknowledge that you have read, understood, and agreed to this disclosure. MarketForge is not a registered investment advisor. All content is for informational purposes only and does not constitute financial advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}