// pages/trade.js
import { useState, useEffect } from "react";
import Head from "next/head";
import io from "socket.io-client";
import PaperTradingTerminal from "../components/PaperTradingTerminal";

export default function TradePage() {
  const [quotes, setQuotes] = useState({});
  const [selectedTicker, setSelectedTicker] = useState("AAPL");

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
    socket.on("quote", (data) => {
      setQuotes(prev => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          changePercent: data.changePercent,
          volume: data.volume,
        },
      }));
    });
    return () => socket.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Paper Trading Terminal | MarketForge</title>
      </Head>
      <PaperTradingTerminal
        selectedTicker={selectedTicker}
        setSelectedTicker={setSelectedTicker}
        quotes={quotes}
      />
    </>
  );
}