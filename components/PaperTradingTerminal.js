import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import io from "socket.io-client";

export default function PaperTradingTerminal({ 
  selectedTicker, 
  setSelectedTicker, 
  quotes,
  onTradeExecuted 
}) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fundAmount, setFundAmount] = useState(100);
  const [tradeSymbol, setTradeSymbol] = useState(selectedTicker || "AAPL");
  const [tradeSide, setTradeSide] = useState("buy");
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("trade");
  const [positions, setPositions] = useState([]);

  const socketRef = useRef(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

  // Load wallet on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = localStorage.getItem('userId');
    if (userId) {
      loadWallet(userId);
      loadTransactions(userId);
    }
  }, []);

  // Socket for real-time prices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      reconnection: true,
    });
    socketRef.current.on("quote", (data) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.symbol === data.symbol
            ? { ...p, currentPrice: data.price, unrealizedPL: (data.price - p.entryPrice) * p.quantity }
            : p
        )
      );
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const loadWallet = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/frge/wallet/${userId}`);
      const data = await response.json();
      if (data.success) {
        setWallet(data.data);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadTransactions = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/frge/transactions/${userId}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const createWallet = async () => {
    const userId = localStorage.getItem('userId') || Date.now().toString();
    localStorage.setItem('userId', userId);
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/frge/create-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data);
        setMessage('✅ Wallet created! Buy funds to start trading.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const buyFunds = async () => {
    if (!wallet) {
      setMessage('❌ Please create a wallet first');
      return;
    }
    if (fundAmount < 10) {
      setMessage('❌ Minimum fund purchase is $10');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/frge/buy-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          amount: parseFloat(fundAmount),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data.wallet);
        setMessage(`✅ Bought $${fundAmount} in funds! Paper buying power: $${data.data.wallet.paperBalance.toLocaleString()}`);
        loadTransactions(localStorage.getItem('userId'));
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const executeTrade = async () => {
    if (!wallet) {
      setMessage('❌ Please create a wallet first');
      return;
    }
    const price = quotes[tradeSymbol]?.price;
    if (!price) {
      setMessage('❌ Price not available');
      return;
    }
    const cost = price * tradeQuantity;
    if (cost > wallet.paperBalance) {
      setMessage('❌ Insufficient paper balance');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/frge/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          symbol: tradeSymbol,
          side: tradeSide,
          quantity: tradeQuantity,
          price,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data.wallet);
        setMessage(`✅ ${tradeSide.toUpperCase()} ${tradeQuantity} shares of ${tradeSymbol} at $${price.toFixed(2)}`);
        setPositions((prev) => [
          ...prev,
          {
            symbol: tradeSymbol,
            quantity: tradeQuantity,
            entryPrice: price,
            currentPrice: price,
            unrealizedPL: 0,
          },
        ]);
        if (onTradeExecuted) {
          onTradeExecuted({
            symbol: tradeSymbol,
            side: tradeSide,
            quantity: tradeQuantity,
            price,
          });
        }
        loadTransactions(localStorage.getItem('userId'));
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const closePosition = async (index) => {
    const position = positions[index];
    const currentPrice = quotes[position.symbol]?.price || position.currentPrice;
    const profit = (currentPrice - position.entryPrice) * position.quantity;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/frge/close-position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          position,
          currentPrice,
          profit,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data.wallet);
        setPositions((prev) => prev.filter((_, i) => i !== index));
        if (data.data.coinsAwarded) {
          setMessage(`✅ Position closed! Profit: $${profit.toFixed(2)} | Earned ${data.data.coinsAwarded} FRGE coins!`);
        } else {
          setMessage(`✅ Position closed! Profit: $${profit.toFixed(2)}`);
        }
        loadTransactions(localStorage.getItem('userId'));
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const convertToShares = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/frge/convert-shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localStorage.getItem('userId') }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data.wallet);
        setMessage(`✅ Converted ${data.data.transaction.coins} FRGE coins into ${data.data.transaction.shares} FRGE shares!`);
        loadTransactions(localStorage.getItem('userId'));
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const currentPrice = quotes[tradeSymbol]?.price || 0;
  const estimatedCost = currentPrice * tradeQuantity;

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📊 Paper Trading Terminal</h1>
          <p className="text-gray-400 text-sm mt-1">
            Buy funds, trade real stocks, earn FRGE coins
          </p>
        </div>
        <div className="text-cyan-400 text-sm font-mono">{time}</div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.includes('❌') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* No Wallet State */}
      {!wallet ? (
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-5xl mb-4">💼</div>
          <h2 className="text-xl font-bold mb-2">Create Your Wallet</h2>
          <p className="text-gray-400 text-sm mb-6">
            Start earning FRGE coins by trading. Buy funds to begin.
          </p>
          <button
            onClick={createWallet}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </Card>
      ) : (
        <>
          {/* Wallet Summary */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-gray-400 text-xs">FRGE Coins</div>
              <div className="text-2xl font-bold text-yellow-400">
                {wallet.coins?.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-gray-500">Earned from profits</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs">Paper Funds</div>
              <div className="text-2xl font-bold text-cyan-400">
                ${wallet.paperFunds?.toFixed(2) || 0}
              </div>
              <div className="text-[10px] text-gray-500">Real money deposited</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs">Paper Balance</div>
              <div className="text-2xl font-bold text-white">
                ${wallet.paperBalance?.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-gray-500">50x buying power</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs">FRGE Shares</div>
              <div className="text-2xl font-bold text-purple-400">
                {wallet.sharesAllocated?.toFixed(4) || 0}
              </div>
              <div className="text-[10px] text-gray-500">Post-IPO shares</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-xs">Total Earned</div>
              <div className="text-2xl font-bold text-green-400">
                {wallet.totalEarned?.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-gray-500">All-time coins</div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {['trade', 'positions', 'wallet', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm transition capitalize ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-white'
                    : 'bg-[#0c1224] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {tab === 'trade' ? '💰 Trade' :
                 tab === 'positions' ? '📈 Positions' :
                 tab === 'wallet' ? '💼 Wallet' :
                 '📜 History'}
              </button>
            ))}
          </div>

          {/* TRADE TAB */}
          {activeTab === 'trade' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Buy Funds Panel */}
              <div className="col-span-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">💵 Buy Paper Funds</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Deposit real money to get 50x paper buying power
                  </p>
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 block mb-1">Amount ($)</label>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(Math.max(10, parseFloat(e.target.value) || 10))}
                      className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                      min="10"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mb-3 space-y-1">
                    <div className="flex justify-between">
                      <span>Platform fee (5%)</span>
                      <span className="text-red-400">-${(fundAmount * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Funds added</span>
                      <span className="text-cyan-400">${(fundAmount * 0.95).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Paper buying power</span>
                      <span className="text-green-400">${(fundAmount * 0.95 * 50).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={buyFunds}
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Buy Funds'}
                  </button>
                </Card>
              </div>

              {/* Trade Panel */}
              <div className="col-span-8">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">📈 Place Trade</h3>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setTradeSide('buy')}
                      className={`flex-1 py-2 rounded-lg transition ${
                        tradeSide === 'buy'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setTradeSide('sell')}
                      className={`flex-1 py-2 rounded-lg transition ${
                        tradeSide === 'sell'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Symbol</label>
                      <input
                        type="text"
                        value={tradeSymbol}
                        onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                        className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Price</label>
                      <div className="bg-[#071126] rounded-lg px-3 py-2 border border-white/10 text-white">
                        ${currentPrice?.toFixed(2) || '---'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={tradeQuantity}
                      onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                      min="1"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mb-3">
                    <span>Estimated Cost</span>
                    <span className="text-white font-mono font-bold">
                      ${estimatedCost.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={executeTrade}
                    disabled={loading || !currentPrice}
                    className={`w-full py-2 rounded-lg font-medium transition ${
                      tradeSide === 'buy'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Processing...' : `${tradeSide.toUpperCase()} ${tradeSymbol}`}
                  </button>
                </Card>
              </div>
            </div>
          )}

          {/* POSITIONS TAB */}
          {activeTab === 'positions' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">📈 Open Positions</h3>
              {positions.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  No open positions. Place a trade to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {positions.map((p, i) => {
                    const current = quotes[p.symbol]?.price || p.currentPrice;
                    const pl = (current - p.entryPrice) * p.quantity;
                    const plPercent = ((current - p.entryPrice) / p.entryPrice) * 100;
                    return (
                      <div key={i} className="bg-[#0c1224] p-3 rounded-lg border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-cyan-400">{p.symbol}</div>
                          <div className="text-xs text-gray-400">
                            {p.quantity} shares @ ${p.entryPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className={`font-medium ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${pl.toFixed(2)} ({plPercent.toFixed(2)}%)
                          </div>
                          <div className="text-xs text-gray-500">
                            Current: ${current.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => closePosition(i)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg text-xs transition"
                        >
                          Close
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">💼 Your Wallet</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">FRGE Coins</span>
                    <span className="text-yellow-400 font-bold">{wallet.coins?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Coins Earned</span>
                    <span className="text-white">{wallet.totalEarned?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paper Funds</span>
                    <span className="text-cyan-400">${wallet.paperFunds?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paper Balance</span>
                    <span className="text-white">${wallet.paperBalance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">FRGE Shares</span>
                    <span className="text-purple-400">{wallet.sharesAllocated?.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Spent</span>
                    <span className="text-red-400">${wallet.totalSpent?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={convertToShares}
                    disabled={loading || wallet.coins < 100 || !wallet.ipoConversionReady}
                    className="w-full bg-purple-500 hover:bg-purple-400 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {wallet.ipoConversionReady
                      ? `Convert ${wallet.coins} Coins → ${(wallet.coins / 100).toFixed(4)} Shares`
                      : 'Convert to Shares (IPO Pending)'}
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-2">
                    Conversion rate: 100 FRGE coins = 1 FRGE share
                  </p>
                  <p className="text-[10px] text-yellow-400 text-center mt-1">
                    {wallet.ipoConversionReady
                      ? '✅ IPO launched! Convert your coins now.'
                      : '⏳ Conversion unlocks when MarketForge IPO launches'}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">📊 How It Works</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <p>Buy funds with real money → get 50x paper buying power</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <p>Trade real stocks with paper funds through Alpaca</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <p>Earn 10 FRGE coins for every $1 of profit on closed trades</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold">4.</span>
                    <p>Coins accumulate in your wallet until IPO launch</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold">5.</span>
                    <p>After IPO + revenue target, convert 100 coins → 1 FRGE share</p>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <p className="text-xs text-cyan-400">
                      💡 Your FRGE coins represent early participation in MarketForge's success.
                      The more profitable trades you make, the more coins you earn.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">📜 Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  No transactions yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-[#0c1224] p-3 rounded-lg border border-white/5 flex justify-between items-center">
                      <div>
                        <div className={`font-medium text-sm ${
                          tx.type === 'buy_funds' ? 'text-cyan-400' :
                          tx.type === 'earn_coins' ? 'text-yellow-400' :
                          tx.type === 'convert_to_shares' ? 'text-purple-400' :
                          'text-white'
                        }`}>
                          {tx.type === 'buy_funds' ? '💵 Bought Funds' :
                           tx.type === 'earn_coins' ? '🪙 Earned Coins' :
                           tx.type === 'convert_to_shares' ? '🔄 Converted to Shares' :
                           tx.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {tx.type === 'buy_funds' && (
                          <span className="text-cyan-400">+${tx.fundsAdded?.toFixed(2)}</span>
                        )}
                        {tx.type === 'earn_coins' && (
                          <span className="text-yellow-400">+{tx.coins} FRGE</span>
                        )}
                        {tx.type === 'convert_to_shares' && (
                          <span className="text-purple-400">+{tx.shares} shares</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}