import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import io from "socket.io-client";

export default function AlertsPage({ selectedTicker, setSelectedTicker }) {
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    condition: "above",
    price: "",
    message: "",
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState("");
  const [quotes, setQuotes] = useState({});
  const socketRef = useRef(null);

  // Available symbols for search
  const availableSymbols = [
    "AAPL", "NVDA", "TSLA", "AMD", "PLTR", "SPY", "QQQ", "IWM", "DIA", "LLY",
    "MSFT", "GOOGL", "AMZN", "META", "NFLX", "INTC", "IBM", "CSCO", "ORCL", "ADBE"
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

  // Load alerts from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem("userAlerts");
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
    
    const savedTriggered = localStorage.getItem("triggeredAlerts");
    if (savedTriggered) {
      setTriggeredAlerts(JSON.parse(savedTriggered));
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem("userAlerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem("triggeredAlerts", JSON.stringify(triggeredAlerts));
  }, [triggeredAlerts]);

  // Socket connection for real-time quotes
  useEffect(() => {
    socketRef.current = io("http://localhost:4000", {
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
      
      // Check alerts for this symbol
      checkAlerts(data.symbol, data.price);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [alerts]);

  // Check if any alerts are triggered
  const checkAlerts = (symbol, currentPrice) => {
    const activeAlerts = alerts.filter(
      (alertItem) => alertItem.symbol === symbol && !alertItem.triggered
    );
    
    activeAlerts.forEach((alertItem) => {
      let isTriggered = false;
      if (alertItem.condition === "above" && currentPrice >= alertItem.price) {
        isTriggered = true;
      } else if (alertItem.condition === "below" && currentPrice <= alertItem.price) {
        isTriggered = true;
      }
      
      if (isTriggered) {
        // Mark alert as triggered
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertItem.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
          )
        );
        
        // Add to triggered alerts
        const triggeredAlert = {
          ...alertItem,
          triggeredPrice: currentPrice,
          triggeredAt: new Date().toLocaleTimeString(),
        };
        setTriggeredAlerts((prev) => [triggeredAlert, ...prev.slice(0, 49)]);
        
        // Show browser notification if permitted
        if (Notification.permission === "granted") {
          new Notification(`Alert: ${alertItem.symbol}`, {
            body: `${alertItem.symbol} is now ${alertItem.condition === "above" ? "above" : "below"} $${alertItem.price} (Current: $${currentPrice})`,
          });
        }
      }
    });
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // Search for tickers
  const handleSearchTicker = () => {
    if (!searchQuery.trim()) return;
    const results = availableSymbols.filter(t =>
      t.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  // Select a symbol from search
  const selectSymbol = (symbol) => {
    setNewAlert({ ...newAlert, symbol: symbol });
    setSearchQuery("");
    setSearchResults([]);
  };

  // Show error message (renamed to avoid conflict)
  const showError = (message) => {
    window.alert(message);
  };

  // Create new alert - FIXED (renamed from alert to showError)
  const createAlert = () => {
    console.log("Creating alert:", newAlert);
    
    // Validate inputs
    if (!newAlert.symbol) {
      showError("Please select a symbol");
      return;
    }
    if (!newAlert.price || isNaN(parseFloat(newAlert.price))) {
      showError("Please enter a valid price");
      return;
    }
    
    const alertItem = {
      id: Date.now(),
      symbol: newAlert.symbol,
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      message: newAlert.message || "",
      createdAt: new Date().toLocaleTimeString(),
      triggered: false,
    };
    
    console.log("Saving alert:", alertItem);
    setAlerts((prev) => [alertItem, ...prev]);
    
    // Reset form
    setNewAlert({ symbol: "", condition: "above", price: "", message: "" });
    setShowCreateModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Delete alert
  const deleteAlert = (id) => {
    setAlerts((prev) => prev.filter((alertItem) => alertItem.id !== id));
  };

  // Clear triggered alerts
  const clearTriggeredAlerts = () => {
    setTriggeredAlerts([]);
  };

  // Reactivate alert
  const reactivateAlert = (alertItem) => {
    const newAlertObj = {
      id: Date.now(),
      symbol: alertItem.symbol,
      condition: alertItem.condition,
      price: alertItem.price,
      message: alertItem.message || "",
      createdAt: new Date().toLocaleTimeString(),
      triggered: false,
    };
    setAlerts((prev) => [newAlertObj, ...prev]);
    setTriggeredAlerts((prev) => prev.filter((a) => a.id !== alertItem.id));
  };

  // Get current price for a symbol
  const getCurrentPrice = (symbol) => {
    return quotes[symbol]?.price || null;
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0c1224] rounded-xl p-6 w-96 border border-white/10">
            <h3 className="text-lg font-bold mb-4">Create Price Alert</h3>
            
            {/* Symbol Selection */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Symbol *</label>
              {newAlert.symbol ? (
                <div className="flex items-center justify-between bg-[#071126] rounded-lg px-3 py-2 border border-white/10">
                  <span className="font-medium text-cyan-400">{newAlert.symbol}</span>
                  <button
                    onClick={() => setNewAlert({ ...newAlert, symbol: "" })}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ✕ Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="Enter ticker symbol..."
                    className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSearchTicker}
                    className="mt-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Search
                  </button>
                  {searchResults.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {searchResults.map((symbol) => (
                        <div
                          key={symbol}
                          className="p-2 hover:bg-white/5 rounded cursor-pointer text-sm"
                          onClick={() => selectSymbol(symbol)}
                        >
                          {symbol}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Condition */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Condition</label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
              >
                <option value="above">Above Price ↗</option>
                <option value="below">Below Price ↘</option>
              </select>
            </div>

            {/* Price */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={newAlert.price}
                onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                placeholder="e.g., 300.00"
                className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Message (optional)</label>
              <input
                type="text"
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                placeholder="Custom message for this alert"
                className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={createAlert}
                className="flex-1 bg-cyan-500 py-2 rounded-lg hover:bg-cyan-600 transition"
              >
                Create Alert
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                  setNewAlert({ symbol: "", condition: "above", price: "", message: "" });
                }}
                className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create price alerts and get notified when stocks hit your targets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={requestNotificationPermission}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            🔔 Enable Notifications
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <span>+</span> Create Alert
          </button>
          <div className="text-cyan-400 text-sm font-mono">{time}</div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-gray-400 text-xs mb-1">Active Alerts</div>
          <div className="text-2xl font-bold text-cyan-400">
            {alerts.filter(a => !a.triggered).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-400 text-xs mb-1">Triggered Alerts</div>
          <div className="text-2xl font-bold text-yellow-400">
            {triggeredAlerts.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-400 text-xs mb-1">Total Alerts</div>
          <div className="text-2xl font-bold">{alerts.length + triggeredAlerts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-400 text-xs mb-1">Watching</div>
          <div className="text-2xl font-bold">
            {new Set(alerts.map(a => a.symbol)).size}
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Alerts Column */}
        <Card className="p-4 h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0c1224] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-semibold">Active Alerts</span>
            </div>
            <span className="text-[10px] text-gray-500">Price alerts waiting to trigger</span>
          </div>

          {alerts.filter(a => !a.triggered).length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">🎯 No active alerts</p>
              <p className="text-sm">Click "Create Alert" to set up price notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.filter(a => !a.triggered).map((alertItem) => {
                const currentPrice = getCurrentPrice(alertItem.symbol);
                const isClose = currentPrice && (
                  (alertItem.condition === "above" && currentPrice >= alertItem.price * 0.95) ||
                  (alertItem.condition === "below" && currentPrice <= alertItem.price * 1.05)
                );
                
                return (
                  <div
                    key={alertItem.id}
                    className={`p-3 rounded-lg border transition ${
                      isClose
                        ? "bg-yellow-500/10 border-yellow-500/50"
                        : "bg-[#0c1224] border-white/10 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{alertItem.symbol}</span>
                        <span className="text-xs text-gray-500">{alertItem.createdAt}</span>
                      </div>
                      <button
                        onClick={() => deleteAlert(alertItem.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition"
                      >
                        ✕ Delete
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <span className={`text-sm ${
                        alertItem.condition === "above" ? "text-green-400" : "text-red-400"
                      }`}>
                        {alertItem.condition === "above" ? "↑ Above" : "↓ Below"} ${alertItem.price.toFixed(2)}
                      </span>
                      {currentPrice && (
                        <span className="text-xs text-gray-400 ml-2">
                          Current: ${currentPrice.toFixed(2)}
                          {isClose && (
                            <span className="text-yellow-400 ml-2">⚡ Getting close!</span>
                          )}
                        </span>
                      )}
                    </div>
                    
                    {alertItem.message && (
                      <p className="text-xs text-gray-400">{alertItem.message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Triggered Alerts Column */}
        <Card className="p-4 h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0c1224] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-semibold">Triggered Alerts</span>
            </div>
            <button
              onClick={clearTriggeredAlerts}
              className="text-[10px] text-gray-500 hover:text-white transition"
            >
              Clear All
            </button>
          </div>

          {triggeredAlerts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">✅ No triggered alerts</p>
              <p className="text-sm">When price targets are hit, they'll appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {triggeredAlerts.map((alertItem) => (
                <div
                  key={alertItem.id}
                  className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition"
                  onClick={() => setSelectedTicker(alertItem.symbol)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-400">{alertItem.symbol}</span>
                      <span className="text-xs text-gray-500">{alertItem.triggeredAt}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reactivateAlert(alertItem);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-xs transition"
                    >
                      ⟳ Reactivate
                    </button>
                  </div>
                  
                  <div className="mb-2">
                    <span className={`text-sm ${
                      alertItem.condition === "above" ? "text-green-400" : "text-red-400"
                    }`}>
                      {alertItem.condition === "above" ? "↑ Above" : "↓ Below"} ${alertItem.price.toFixed(2)}
                    </span>
                    {alertItem.triggeredPrice && (
                      <span className="text-xs text-green-400 ml-2">
                        Triggered at: ${alertItem.triggeredPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {alertItem.message && (
                    <p className="text-xs text-gray-400">{alertItem.message}</p>
                  )}
                  
                  <div className="mt-2 text-[10px] text-gray-500">
                    Click to view {alertItem.symbol} chart →
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-[10px] text-gray-500">
        <p>Alerts are checked in real-time as prices update • Browser notifications available when enabled</p>
      </div>
    </div>
  );
}