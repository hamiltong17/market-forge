import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import io from "socket.io-client";

export default function WatchlistPage({ selectedTicker, setSelectedTicker }) {
  const [quotes, setQuotes] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState("");
  const socketRef = useRef(null);

  // Helper function to safely get change percent as number
  const getSafeChangePercent = (value) => {
    if (value === undefined || value === null) return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

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

  // Socket connection - wrapped to only run on client side
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Connect once when component mounts
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected");
    });

    socketRef.current.on("watchlist", (data) => {
      console.log("📋 Watchlist received:", data);
      setWatchlist(data);
    });

    socketRef.current.on("allPrices", (data) => {
      console.log("💰 All prices received:", Object.keys(data).length);
      setQuotes(data);
    });

    socketRef.current.on("quote", (data) => {
      setQuotes((prev) => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          changePercent: getSafeChangePercent(data.changePercent),
        },
      }));
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Search for tickers to add - uses the persistent socket connection
  const handleSearchTicker = () => {
    if (!searchQuery.trim() || !socketRef.current) {
      console.log("No search query or socket not connected");
      return;
    }
    
    console.log("🔍 Searching for:", searchQuery);
    socketRef.current.emit("searchTickers", searchQuery, (results) => {
      console.log("📊 Search results:", results);
      setSearchResults(results || []);
    });
  };

  // Add ticker to watchlist
  const addToWatchlist = (ticker) => {
    if (!socketRef.current) return;
    console.log("➕ Adding to watchlist:", ticker);
    socketRef.current.emit("addToWatchlist", ticker);
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Remove ticker from watchlist
  const removeFromWatchlist = (ticker) => {
    if (!socketRef.current) return;
    console.log("➖ Removing from watchlist:", ticker);
    socketRef.current.emit("removeFromWatchlist", ticker);
  };

  const getMarketCap = (price) => {
    if (!price) return "--";
    if (price > 500) return "$3.2T";
    if (price > 200) return "$2.8T";
    if (price > 100) return "$1.5T";
    if (price > 50) return "$800B";
    return "$200B";
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Add Ticker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0c1224] rounded-xl p-6 w-96 border border-white/10">
            <h3 className="text-lg font-bold mb-4">Add to Watchlist</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTicker()}
                placeholder="Enter ticker symbol (e.g., MSFT, GOOGL)"
                className="flex-1 bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSearchTicker}
                className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600 transition"
              >
                Search
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((ticker) => (
                  <div
                    key={ticker}
                    className="flex justify-between items-center p-2 hover:bg-white/5 rounded cursor-pointer transition"
                    onClick={() => addToWatchlist(ticker)}
                  >
                    <div>
                      <span className="font-medium">{ticker}</span>
                      {quotes[ticker]?.price && (
                        <span className="text-gray-400 text-xs ml-2">
                          ${quotes[ticker].price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-cyan-400 text-sm">+ Add</span>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-4">
                No results found for "{searchQuery}"
              </div>
            )}
            <button
              onClick={() => {
                setShowAddModal(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="mt-4 w-full text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your favorite stocks in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <span>+</span> Add Ticker
          </button>
          <div className="text-cyan-400 text-sm font-mono">{time}</div>
        </div>
      </div>

      {/* Watchlist Table */}
      {watchlist.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400">
            <p className="text-lg mb-2">Your watchlist is empty</p>
            <p className="text-sm">Click "Add Ticker" to start tracking stocks</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="text-left py-4 px-4">Symbol</th>
                  <th className="text-right py-4 px-4">Price</th>
                  <th className="text-right py-4 px-4">Change</th>
                  <th className="text-right py-4 px-4">Day Range</th>
                  <th className="text-right py-4 px-4">Volume</th>
                  <th className="text-right py-4 px-4">Market Cap</th>
                  <th className="text-right py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((symbol) => {
                  const quote = quotes[symbol];
                  const changePercent = quote?.changePercent !== undefined && !isNaN(quote.changePercent) 
                    ? parseFloat(quote.changePercent) 
                    : undefined;
                  const isPositive = changePercent >= 0;
                  const price = quote?.price ? parseFloat(quote.price) : null;
                  const dayRangeLow = price ? price * 0.98 : 0;
                  const dayRangeHigh = price ? price * 1.02 : 0;
                  
                  return (
                    <tr
                      key={symbol}
                      className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer group"
                      onClick={() => setSelectedTicker(symbol)}
                    >
                      <td className="py-3 px-4 font-medium">{symbol}</td>
                      <td className="text-right py-3 px-4">
                        {price ? `$${price.toFixed(2)}` : "--"}
                      </td>
                      <td className="text-right py-3 px-4">
                        {changePercent !== undefined ? (
                          <span className={isPositive ? "text-green-400" : "text-red-400"}>
                            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                          </span>
                        ) : "--"}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300 text-sm">
                        {price ? (
                          <>
                            ${dayRangeLow.toFixed(2)} - ${dayRangeHigh.toFixed(2)}
                          </>
                        ) : "--"}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300 text-sm">
                        {Math.floor(Math.random() * 50000000) + 10000000}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300 text-sm">
                        {getMarketCap(price)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(symbol);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm transition opacity-0 group-hover:opacity-100"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stats Summary */}
      {watchlist.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-gray-400 text-xs mb-1">Total Holdings</div>
            <div className="text-2xl font-bold">{watchlist.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-400 text-xs mb-1">Gainers Today</div>
            <div className="text-2xl font-bold text-green-400">
              {watchlist.filter(s => {
                const change = quotes[s]?.changePercent;
                return change !== undefined && !isNaN(change) && parseFloat(change) > 0;
              }).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-400 text-xs mb-1">Losers Today</div>
            <div className="text-2xl font-bold text-red-400">
              {watchlist.filter(s => {
                const change = quotes[s]?.changePercent;
                return change !== undefined && !isNaN(change) && parseFloat(change) < 0;
              }).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-400 text-xs mb-1">Avg Change</div>
            <div className="text-2xl font-bold">
              {(() => {
                const changes = watchlist
                  .filter(s => quotes[s]?.changePercent !== undefined && !isNaN(quotes[s].changePercent))
                  .map(s => parseFloat(quotes[s].changePercent));
                if (changes.length === 0) return "--";
                const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
                return (
                  <span className={avg >= 0 ? "text-green-400" : "text-red-400"}>
                    {avg >= 0 ? "+" : ""}{avg.toFixed(2)}%
                  </span>
                );
              })()}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}