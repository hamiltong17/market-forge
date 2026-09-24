import { useState, useEffect, useRef } from "react";
import Card from "./Card";
import io from "socket.io-client";

export default function NewsFeedPage({ selectedTicker, setSelectedTicker }) {
  const [news, setNews] = useState([]);
  const [time, setTime] = useState("");
  const socketRef = useRef(null);

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

  // Socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:4000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ News feed socket connected");
    });

    socketRef.current.on("news", (data) => {
      setNews((prev) => [
        {
          id: Date.now(),
          ...data,
          timestamp: new Date().toLocaleTimeString(),
          read: false,
        },
        ...prev.slice(0, 49),
      ]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Mark news as read
  const markAsRead = (id) => {
    setNews((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  // Get unread count
  const unreadCount = news.filter((item) => !item.read).length;

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Feed</h1>
        <div className="text-cyan-400 text-sm font-mono">{time}</div>
      </div>

      {/* News Feed Column */}
      <Card className="p-4 h-[600px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 sticky top-0 bg-[#0c1224] pb-2">
          <span className="text-lg">📰</span>
          <span className="font-semibold">News Feed</span>
          {unreadCount > 0 && (
            <span className="bg-cyan-500 text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {news.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">📭 No news yet</p>
            <p className="text-sm">Waiting for updates...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg cursor-pointer transition border ${
                  item.read
                    ? "bg-[#0a0c12] border-white/5 opacity-70"
                    : "bg-[#0c1224] border-cyan-500/30 hover:bg-[#0f1628]"
                }`}
                onClick={() => {
                  markAsRead(item.id);
                  setSelectedTicker(item.symbol);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{item.symbol}</span>
                    {!item.read && (
                      <span className="bg-cyan-500 w-2 h-2 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">{item.time || item.timestamp}</span>
                </div>
                <p className="text-sm text-gray-200">{item.headline}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <div className="mt-6 text-center text-[10px] text-gray-500">
        <p>News updates every 15-30 seconds</p>
      </div>
    </div>
  );
}