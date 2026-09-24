import { useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardGrid from "../components/DashboardGrid";
import WatchlistPage from "../components/WatchlistPage";
import NewsFeedPage from "../components/NewsFeedPage";
import AlertsPage from "../components/AlertsPage";
import ForgePicksPage from "../components/ForgePicksPage";
import ForgeTalk from "../components/ForgeTalk";
import CryptoPage from "../components/CryptoPage";
import FuturesPage from "../components/FuturesPage";
import ForexPage from "../components/ForexPage";
import ContactPage from "../components/ContactPage";
import AccountPage from "../components/AccountPage";

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState("IWM");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [tradeHistory, setTradeHistory] = useState([]);

  const addTrade = (trade) => {
    setTradeHistory((prev) => {
      const updated = [trade, ...prev.slice(0, 49)];
      try {
        localStorage.setItem("tradeHistory", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardGrid
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
            onTrade={addTrade}
          />
        );
      case "watchlist":
        return (
          <WatchlistPage
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
          />
        );
      case "crypto":
        return <CryptoPage />;
      case "forex":
        return <ForexPage />;
      case "futures":
        return <FuturesPage />;
      case "forgetalk":
        return <ForgeTalk selectedTicker={selectedTicker} setSelectedTicker={setSelectedTicker} />;
      case "newsfeed":
        return (
          <NewsFeedPage
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
          />
        );
      case "alerts":
        return (
          <AlertsPage
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
          />
        );
      case "forge":
        return (
          <ForgePicksPage
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
          />
        );
      case "contact":
        return <ContactPage />;
      case "account":
        return <AccountPage tradeHistory={tradeHistory} />;
      default:
        return (
          <DashboardGrid
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
            onTrade={addTrade}
          />
        );
    }
  };

  return (
    <div className="bg-[#030712] min-h-screen text-white flex">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1">
        {renderPage()}
      </div>
    </div>
  );
}