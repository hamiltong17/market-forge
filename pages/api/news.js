export default async function handler(req, res) {

  const ticker = req.query.ticker || "SPY";

  try {

    // FINNHUB COMPANY NEWS
    const finnhubResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2025-01-01&to=2026-12-31&token=${process.env.FINNHUB_API_KEY}`
    );

    const finnhubData = await finnhubResponse.json();

    // NEWSAPI FALLBACK
    const newsApiResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${ticker}&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );

    const newsApiData = await newsApiResponse.json();

    // FORMAT FINNHUB NEWS
    const finnhubNews = (finnhubData || []).slice(0, 5).map((article) => ({
      source: "Finnhub",
      title: article.headline,
      url: article.url,
      image: article.image,
      date: article.datetime,
      summary: article.summary,
    }));

    // FORMAT NEWSAPI NEWS
    const newsApiNews = (newsApiData.articles || []).slice(0, 5).map((article) => ({
      source: article.source?.name || "NewsAPI",
      title: article.title,
      url: article.url,
      image: article.urlToImage,
      date: article.publishedAt,
      summary: article.description,
    }));

    // MERGE BOTH
    const combinedNews = [
      ...finnhubNews,
      ...newsApiNews,
    ];

    res.status(200).json(combinedNews);

  } catch (error) {

    console.error("News fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch news",
    });

  }

}