import { useState, useEffect } from "react";
import Card from "./Card";
import { getFirebaseAuth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ForgeTalk({ selectedTicker, setSelectedTicker }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [sentiment, setSentiment] = useState("neutral");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [time, setTime] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("hot");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

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

  // Check auth status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load posts from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPosts = localStorage.getItem("forgeTalkPosts");
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        setPosts(parsed);
      } catch (e) {
        setPosts(getDefaultPosts());
      }
    } else {
      setPosts(getDefaultPosts());
    }
  }, []);

  // Save posts to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (posts.length > 0) {
      localStorage.setItem("forgeTalkPosts", JSON.stringify(posts));
    }
  }, [posts]);

  // Default posts to show when empty
  const getDefaultPosts = () => {
    return [
      {
        id: 1,
        author: "MarketForge_AI",
        symbol: "NVDA",
        content: "NVIDIA's AI chip dominance is creating massive opportunities. Looking at the 52-week high of $771, I'm bullish on the AI semiconductor sector heading into Q3 earnings.",
        sentiment: "bullish",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likes: 24,
        replies: [
          {
            id: 101,
            author: "TechTrader",
            content: "Agree! The AI demand is insane. I'm holding through earnings.",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            likes: 8,
          },
        ],
      },
      {
        id: 2,
        author: "ValueInvestor",
        symbol: "AAPL",
        content: "Apple's ecosystem is underrated. Services revenue is growing, and the Vision Pro is just the beginning. Long-term hold.",
        sentiment: "bullish",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        likes: 15,
        replies: [],
      },
      {
        id: 3,
        author: "Options_King",
        symbol: "TSLA",
        content: "Tesla's volatility is a trader's dream. I'm watching for a breakout above resistance at $302.72.",
        sentiment: "neutral",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        likes: 12,
        replies: [
          {
            id: 102,
            author: "DayTrader",
            content: "What's your target? I'm looking at $350 if it breaks through.",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            likes: 4,
          },
        ],
      },
    ];
  };

  // Popular symbols
  const popularSymbols = ["AAPL", "NVDA", "TSLA", "AMD", "SPY", "QQQ", "IWM", "PLTR"];

  // Handle creating a new post
  const createPost = () => {
    if (!user) {
      alert("Please log in to create a post");
      return;
    }
    if (!newPost.trim()) {
      alert("Please write something");
      return;
    }
    if (!selectedSymbol) {
      alert("Please select a ticker symbol");
      return;
    }

    const post = {
      id: Date.now(),
      author: user.displayName || user.email?.split("@")[0] || "Anonymous",
      authorId: user.uid,
      symbol: selectedSymbol.toUpperCase(),
      content: newPost.trim(),
      sentiment: sentiment,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setSelectedSymbol("");
    setSentiment("neutral");
    setIsLoading(false);
  };

  // Handle adding a reply
  const addReply = (postId) => {
    if (!user) {
      alert("Please log in to reply");
      return;
    }
    if (!replyContent.trim()) {
      alert("Please write a reply");
      return;
    }

    const reply = {
      id: Date.now(),
      author: user.displayName || user.email?.split("@")[0] || "Anonymous",
      authorId: user.uid,
      content: replyContent.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
    };

    setPosts(posts.map(p =>
      p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
    ));
    setReplyContent("");
    setReplyTo(null);
  };

  // Handle liking a post
  const likePost = (postId) => {
    setPosts(posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  // Handle liking a reply
  const likeReply = (postId, replyId) => {
    setPosts(posts.map(p =>
      p.id === postId ? {
        ...p,
        replies: p.replies.map(r =>
          r.id === replyId ? { ...r, likes: r.likes + 1 } : r
        )
      } : p
    ));
  };

  // Get sentiment emoji and color
  const getSentimentDisplay = (sentiment) => {
    switch (sentiment) {
      case "bullish": return { emoji: "📈", color: "text-green-400" };
      case "bearish": return { emoji: "📉", color: "text-red-400" };
      default: return { emoji: "➡️", color: "text-yellow-400" };
    }
  };

  // Filter and sort posts
  const getFilteredPosts = () => {
    let filtered = [...posts];

    if (activeFilter !== "all") {
      filtered = filtered.filter(p => p.symbol === activeFilter);
    }

    if (sortBy === "hot") {
      filtered.sort((a, b) => (b.likes + b.replies.length) - (a.likes + a.replies.length));
    } else if (sortBy === "new") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === "top") {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🔥 Forge Talk</h1>
          <p className="text-gray-400 text-sm mt-1">
            Share and collaborate on investing ideas with the community
          </p>
        </div>
        <div className="text-cyan-400 text-sm font-mono">{time}</div>
      </div>

      {/* Create Post */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
            {user ? (user.displayName || user.email?.split("@")[0] || "U")[0].toUpperCase() : "?"}
          </div>
          <div>
            <div className="text-sm font-medium">
              {user ? user.displayName || user.email?.split("@")[0] || "Anonymous" : "Please log in"}
            </div>
            <div className="text-xs text-gray-500">
              {user ? "Share your trading idea" : "Log in to share ideas"}
            </div>
          </div>
        </div>

        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder={user ? "What's your investment idea?" : "Log in to share your ideas..."}
          disabled={!user}
          rows="3"
          className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500 transition disabled:opacity-50"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500 text-sm"
          >
            <option value="">Select symbol...</option>
            {popularSymbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
            className="bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500 text-sm"
          >
            <option value="bullish">📈 Bullish</option>
            <option value="neutral">➡️ Neutral</option>
            <option value="bearish">📉 Bearish</option>
          </select>

          <button
            onClick={createPost}
            disabled={!user || !newPost.trim() || !selectedSymbol}
            className="ml-auto bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Post Idea
          </button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeFilter === "all"
                ? "bg-cyan-500 text-white"
                : "bg-[#0c1224] text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            All
          </button>
          {popularSymbols.slice(0, 6).map(s => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                activeFilter === s
                  ? "bg-cyan-500 text-white"
                  : "bg-[#0c1224] text-gray-400 hover:text-white border border-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0c1224] rounded-lg px-3 py-1 border border-white/10 text-sm outline-none focus:border-cyan-500"
          >
            <option value="hot">🔥 Hot</option>
            <option value="new">🕐 New</option>
            <option value="top">⬆ Top</option>
          </select>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400">
              <p className="text-lg mb-2">🔥 No posts yet</p>
              <p className="text-sm">Be the first to share an investing idea!</p>
            </div>
          </Card>
        ) : (
          filteredPosts.map((post) => {
            const sentimentDisplay = getSentimentDisplay(post.sentiment);
            const timeAgo = new Date(post.timestamp).toLocaleString();

            return (
              <Card key={post.id} className="p-4 hover:border-cyan-500/20 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                      {post.author[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author}</span>
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyan-400 font-medium">{post.symbol}</span>
                        <span className={`text-xs ${sentimentDisplay.color}`}>
                          {sentimentDisplay.emoji} {post.sentiment.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => likePost(post.id)}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition flex items-center gap-1"
                  >
                    ❤️ {post.likes}
                  </button>
                </div>

                <p className="text-gray-300 text-sm ml-11 mb-3">{post.content}</p>

                <button
                  onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition ml-11"
                >
                  💬 Reply ({post.replies.length})
                </button>

                {replyTo === post.id && (
                  <div className="mt-3 ml-11">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500 text-sm"
                      />
                      <button
                        onClick={() => addReply(post.id)}
                        className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent("");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {post.replies.length > 0 && (
                  <div className="mt-3 ml-11 space-y-2 border-l-2 border-white/5 pl-4">
                    {post.replies.map((reply) => {
                      const replyTime = new Date(reply.timestamp).toLocaleString();
                      return (
                        <div key={reply.id} className="bg-[#0c1224] p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-cyan-400">
                                  {reply.author}
                                </span>
                                <span className="text-xs text-gray-500">{replyTime}</span>
                              </div>
                              <p className="text-sm text-gray-300 mt-1">{reply.content}</p>
                            </div>
                            <button
                              onClick={() => likeReply(post.id, reply.id)}
                              className="text-xs text-gray-400 hover:text-cyan-400 transition flex items-center gap-1"
                            >
                              ❤️ {reply.likes}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{posts.length}</div>
          <div className="text-xs text-gray-500">Total Posts</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {posts.filter(p => p.sentiment === "bullish").length}
          </div>
          <div className="text-xs text-gray-500">Bullish</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {posts.filter(p => p.sentiment === "bearish").length}
          </div>
          <div className="text-xs text-gray-500">Bearish</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {posts.reduce((sum, p) => sum + p.replies.length, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Replies</div>
        </Card>
      </div>
    </div>
  );
}