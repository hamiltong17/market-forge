const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// Store watchlist (in memory)
let userWatchlist = ["AAPL", "NVDA", "TSLA", "AMD", "PLTR", "SPY", "QQQ"];

// ALL tickers including market strip symbols
const tickers = [
  "SPY", "QQQ", "TSLA", "NVDA", "AAPL", "AMD", "PLTR", "IWM", "DIA", "LLY"
];

// Comprehensive list of available tickers for search
const availableTickers = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AMD", 
  "PLTR", "SPY", "QQQ", "IWM", "DIA", "LLY", "NFLX", "INTC", 
  "IBM", "CSCO", "ORCL", "ADBE", "CRM", "PYPL", "DIS", "BA", 
  "WMT", "JPM", "V", "JNJ", "WFC", "KO", "PEP", "MCD", "NKE", 
  "SBUX", "COST", "HD", "LOW", "TGT", "CVS", "UNH", "ABBV", 
  "MRK", "PFE", "BMY", "GILD", "AMGN", "BIIB"
];

// Store current prices (all as numbers)
let prices = {};

// Fallback prices (June 5, 2026 closes)
const fallbackPrices = {
  AAPL: 307.34, NVDA: 205.10, TSLA: 391.00, AMD: 466.38,
  PLTR: 97.05, SPY: 568.00, QQQ: 520.00, IWM: 200.00,
  DIA: 420.00, LLY: 789.12,
  MSFT: 450.23, GOOGL: 185.42, AMZN: 189.56, META: 512.34,
  NFLX: 678.90, INTC: 45.67, IBM: 198.76, CSCO: 54.32,
  ORCL: 134.56, ADBE: 567.89, CRM: 298.76, PYPL: 67.89,
  DIS: 112.34, BA: 187.65, WMT: 76.54, JPM: 198.23,
  V: 275.43, JNJ: 156.78, WFC: 56.78, KO: 62.34,
  PEP: 172.45, MCD: 287.65, NKE: 102.34, SBUX: 92.45,
  COST: 787.23, HD: 345.67, LOW: 234.56, TGT: 145.67,
  CVS: 78.90, UNH: 523.45, ABBV: 167.89, MRK: 112.34,
  PFE: 28.45, BMY: 51.23, GILD: 76.54, AMGN: 289.76, BIIB: 234.56
};

// Initialize prices with fallbacks (ensure all are numbers)
tickers.forEach(symbol => {
  prices[symbol] = {
    price: parseFloat(fallbackPrices[symbol] || 100),
    changePercent: parseFloat((Math.random() * 8 - 4).toFixed(2))
  };
});

// Also initialize available tickers
availableTickers.forEach(symbol => {
  if (!prices[symbol]) {
    prices[symbol] = {
      price: parseFloat(fallbackPrices[symbol] || 100),
      changePercent: parseFloat((Math.random() * 8 - 4).toFixed(2))
    };
  }
});

// Socket connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);
  
  // Send current watchlist immediately
  socket.emit("watchlist", userWatchlist);
  console.log("📋 Sent watchlist:", userWatchlist);
  
  // Send current prices
  socket.emit("allPrices", prices);
  console.log("💰 Sent prices for", Object.keys(prices).length, "tickers");
  
  // Handle adding ticker to watchlist
  socket.on("addToWatchlist", (ticker) => {
    console.log("📥 Add request received for:", ticker);
    if (!userWatchlist.includes(ticker)) {
      userWatchlist.push(ticker);
      console.log(`✅ Added ${ticker} to watchlist`);
      io.emit("watchlist", userWatchlist);
    } else {
      console.log(`⚠️ ${ticker} already in watchlist`);
    }
  });
  
  // Handle removing ticker from watchlist
  socket.on("removeFromWatchlist", (ticker) => {
    console.log("🗑️ Remove request received for:", ticker);
    const index = userWatchlist.indexOf(ticker);
    if (index > -1) {
      userWatchlist.splice(index, 1);
      console.log(`✅ Removed ${ticker} from watchlist`);
      io.emit("watchlist", userWatchlist);
    }
  });
  
  // Handle search for tickers
  socket.on("searchTickers", (query, callback) => {
    console.log("🔍 Search request for:", query);
    const results = availableTickers.filter(t => 
      t.toLowerCase().includes(query.toLowerCase())
    );
    console.log(`📊 Found ${results.length} results`);
    if (callback && typeof callback === "function") {
      callback(results);
    }
  });
  
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Update prices every 2 seconds for ALL tickers
setInterval(() => {
  // Update all tickers (including IWM, DIA, LLY)
  tickers.forEach((symbol) => {
    if (prices[symbol]) {
      // Ensure we're working with numbers
      const currentPrice = parseFloat(prices[symbol].price);
      const currentChangePercent = parseFloat(prices[symbol].changePercent);
      
      // Normal stocks: 0.1% to 0.4% movement
      const movementPercent = (Math.random() - 0.5) * 0.6;
      const movement = currentPrice * (movementPercent / 100);
      let newPrice = currentPrice + movement;
      
      if (newPrice < 10) newPrice = 10;
      if (newPrice > 1000) newPrice = 1000;
      
      const actualChangePercent = ((newPrice - currentPrice) / currentPrice) * 100;
      const newChangePercent = currentChangePercent + (actualChangePercent * 0.2);
      
      // Store as numbers
      prices[symbol].price = parseFloat(newPrice.toFixed(2));
      prices[symbol].changePercent = parseFloat(newChangePercent.toFixed(2));
      
      io.emit("quote", {
        symbol,
        price: prices[symbol].price,
        changePercent: prices[symbol].changePercent,
      });
    }
  });
}, 2000);

// News feed every 15 seconds
const mockNewsFeed = [
  { symbol: "NVDA", headline: "NVIDIA announces new AI chip, stock surges" },
  { symbol: "TSLA", headline: "Tesla delivery numbers beat estimates" },
  { symbol: "AAPL", headline: "Apple Vision Pro gets major software update" },
  { symbol: "AMD", headline: "AMD gains market share in data center segment" },
  { symbol: "PLTR", headline: "Palantir secures new government contract" },
  { symbol: "SPY", headline: "S&P 500 hits new all-time high" },
  { symbol: "QQQ", headline: "Tech rally continues as Fed signals rate cuts" },
  { symbol: "IWM", headline: "Small caps outperform as rotation accelerates" },
  { symbol: "DIA", headline: "Dow Jones hits record high on strong earnings" },
  { symbol: "LLY", headline: "Eli Lilly's new weight loss drug shows promising results" },
  { symbol: "LLY", headline: "Eli Lilly exceeds earnings expectations" },
  { symbol: "MSFT", headline: "Microsoft announces new AI features" },
  { symbol: "GOOGL", headline: "Google Cloud revenue accelerates" },
  { symbol: "META", headline: "Meta's new social platform goes viral" },
];

setInterval(() => {
  const randomNews = mockNewsFeed[Math.floor(Math.random() * mockNewsFeed.length)];
  io.emit("news", {
    symbol: randomNews.symbol,
    headline: randomNews.headline,
    time: new Date().toLocaleTimeString()
  });
}, 15000);

// Alerts every 20-40 seconds
const alertMessages = [
  "Price target upgraded",
  "Unusual options activity detected",
  "Volume spike detected",
  "Support level broken",
  "Institutional buying detected",
  "Short interest increasing",
  "Analyst upgrade",
  "Earnings beat expected",
  "New FDA approval pending",
  "Partnership announcement imminent"
];

setInterval(() => {
  const randomTicker = userWatchlist[Math.floor(Math.random() * userWatchlist.length)];
  const randomMessage = alertMessages[Math.floor(Math.random() * alertMessages.length)];
  io.emit("alert", {
    symbol: randomTicker,
    message: randomMessage,
    time: new Date().toLocaleTimeString()
  });
}, Math.random() * 20000 + 20000);

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Socket server running on http://localhost:${PORT}`);
  console.log(`📋 Watchlist: ${userWatchlist.join(", ")}`);
  console.log(`📊 Tracking: ${tickers.join(", ")}`);
  console.log(`🔍 Available tickers: ${availableTickers.length} stocks`);
  console.log(`\n💡 Market Strip: SPY, QQQ, IWM, DIA, LLY`);
  console.log(`💡 Try searching for: MSFT, GOOGL, or AMZN\n`);
});