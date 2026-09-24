// services/frgeCoin.js

class FrgeCoinService {
  constructor() {
    this.wallets = new Map();
    this.transactions = new Map();
    this.rates = {
      coinsPerProfitDollar: 10, // 10 FRGE coins per $1 profit
      minProfitThreshold: 5,     // Minimum $5 profit to earn coins
    };
  }

  // Create a new wallet for a user
  createWallet(userId) {
    const wallet = {
      userId,
      coins: 0,
      paperFunds: 0,
      paperBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ipoConversionReady: false,
      sharesAllocated: 0,
    };
    this.wallets.set(userId, wallet);
    this.transactions.set(userId, []);
    return wallet;
  }

  // Get wallet
  getWallet(userId) {
    return this.wallets.get(userId) || null;
  }

  // Buy paper funds with real money
  buyFunds(userId, amount, paymentMethod = 'stripe') {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found');

    // 5% platform fee
    const fee = amount * 0.05;
    const fundsAdded = amount - fee;
    const paperBuyingPower = fundsAdded * 50; // 50x leverage

    wallet.paperFunds += fundsAdded;
    wallet.paperBalance += paperBuyingPower;
    wallet.totalSpent += amount;

    const transaction = {
      id: Date.now(),
      type: 'buy_funds',
      amount,
      fee,
      fundsAdded,
      paperBuyingPower,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    wallet.transactions.push(transaction);
    this.transactions.get(userId).push(transaction);
    wallet.lastUpdated = new Date().toISOString();

    return {
      wallet,
      transaction,
    };
  }

  // Award FRGE coins for a profitable trade
  awardCoins(userId, trade) {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found');

    if (trade.profit <= this.rates.minProfitThreshold) {
      return { awarded: false, reason: 'Profit below minimum threshold' };
    }

    const coins = Math.floor(trade.profit * this.rates.coinsPerProfitDollar);

    wallet.coins += coins;
    wallet.totalEarned += coins;

    const transaction = {
      id: Date.now(),
      type: 'earn_coins',
      coins,
      tradeSymbol: trade.symbol,
      tradeProfit: trade.profit,
      rate: this.rates.coinsPerProfitDollar,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    wallet.transactions.push(transaction);
    this.transactions.get(userId).push(transaction);
    wallet.lastUpdated = new Date().toISOString();

    return {
      awarded: true,
      coins,
      wallet,
      transaction,
    };
  }

  // Update paper balance after trade
  updatePaperBalance(userId, newBalance) {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found');
    wallet.paperBalance = newBalance;
    wallet.lastUpdated = new Date().toISOString();
    return wallet;
  }

  // Convert FRGE coins to shares (only when IPO launches)
  convertToShares(userId) {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found');

    if (!wallet.ipoConversionReady) {
      throw new Error('IPO not launched yet. Coins are still accumulating.');
    }

    // Conversion rate: 100 coins = 1 share
    const conversionRate = 100;
    const shares = wallet.coins / conversionRate;

    if (shares <= 0) throw new Error('Insufficient coins to convert');

    const transaction = {
      id: Date.now(),
      type: 'convert_to_shares',
      coins: wallet.coins,
      shares: parseFloat(shares.toFixed(4)),
      conversionRate,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    wallet.sharesAllocated += parseFloat(shares.toFixed(4));
    wallet.coins = 0;
    wallet.transactions.push(transaction);

    return {
      wallet,
      transaction,
    };
  }

  // Mark IPO as launched (admin action)
  launchIPO(userId) {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found');
    wallet.ipoConversionReady = true;
    wallet.lastUpdated = new Date().toISOString();
    return wallet;
  }

  // Get transaction history
  getTransactionHistory(userId) {
    return this.transactions.get(userId) || [];
  }

  // Get wallet summary
  getWalletSummary(userId) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;

    return {
      ...wallet,
      estimatedShareValue: wallet.sharesAllocated * 10, // $10 per share estimate
      coinValueEstimate: wallet.coins * 0.10, // $0.10 per coin estimate
    };
  }
}

module.exports = new FrgeCoinService();