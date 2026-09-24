export default async function handler(req, res) {

  const tickers = [
    "SPY",
    "QQQ",
    "IWM",
    "DIA",
    "TSLA",
    "NVDA",
    "AAPL"
  ];

  try {

    const requests = tickers.map(async (ticker) => {

      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`
      );

      const data = await response.json();

      const result = data.results?.[0];

      return {
        symbol: ticker,
        price: result?.c || 0,
        changePercent: result?.dp || 0,
      };

    });

    const quotes = await Promise.all(requests);

    res.status(200).json(quotes);

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch quotes",
    });

  }

}