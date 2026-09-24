// pages/api/frge/[...slug].js
import FrgeCoinService from '../../../services/frgeCoin';

export default async function handler(req, res) {
  const { slug } = req.query;
  const route = slug?.[0];

  try {
    let result;

    switch (route) {
      case 'create-wallet':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        result = FrgeCoinService.createWallet(req.body.userId);
        return res.json({ success: true, data: result });

      case 'buy-funds':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        result = FrgeCoinService.buyFunds(req.body.userId, req.body.amount);
        return res.json({ success: true, data: result });

      case 'trade': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { userId, symbol, side, quantity, price } = req.body;
        const wallet = FrgeCoinService.getWallet(userId);
        if (!wallet) throw new Error('Wallet not found');

        const cost = quantity * price;
        if (side === 'buy') {
          if (cost > wallet.paperBalance) throw new Error('Insufficient paper balance');
          FrgeCoinService.updatePaperBalance(userId, wallet.paperBalance - cost);
        } else {
          FrgeCoinService.updatePaperBalance(userId, wallet.paperBalance + cost);
        }

        return res.json({
          success: true,
          data: { wallet: FrgeCoinService.getWallet(userId) },
        });
      }

      case 'close-position': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { userId: uid, position, currentPrice, profit } = req.body;
        const w = FrgeCoinService.getWallet(uid);
        if (!w) throw new Error('Wallet not found');

        const returnAmount = (position.entryPrice * position.quantity) + profit;
        FrgeCoinService.updatePaperBalance(uid, w.paperBalance + returnAmount);

        let coinsAwarded = 0;
        if (profit > 0) {
          const award = FrgeCoinService.awardCoins(uid, { symbol: position.symbol, profit });
          if (award.awarded) coinsAwarded = award.coins;
        }

        return res.json({
          success: true,
          data: {
            wallet: FrgeCoinService.getWallet(uid),
            coinsAwarded,
          },
        });
      }

      case 'convert-shares': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        result = FrgeCoinService.convertToShares(req.body.userId);
        return res.json({ success: true, data: result });
      }

      case 'wallet': {
        const userId = slug?.[1];
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const wallet = FrgeCoinService.getWalletSummary(userId);
        if (!wallet) return res.status(404).json({ success: false, error: 'Wallet not found' });
        return res.json({ success: true, data: wallet });
      }

      case 'transactions': {
        const userId = slug?.[1];
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return res.json({ success: true, data: FrgeCoinService.getTransactionHistory(userId) });
      }

      case 'launch-ipo': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        result = FrgeCoinService.launchIPO(req.body.userId);
        return res.json({ success: true, data: result });
      }

      default:
        return res.status(404).json({ success: false, error: `Unknown route: ${route}` });
    }
  } catch (error) {
    console.error('FRGE API error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
}