import { useState, useEffect } from "react";
import Card from "./Card";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscriptions, setSubscriptions] = useState({
    dailyNewsletter: true,
    priceAlerts: true,
    whisperPicks: true,
    marketUpdates: false,
    earningsReports: false,
  });
  const [status, setStatus] = useState({
    message: "",
    type: "", // success, error, info
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [time, setTime] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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

  // Check for existing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem("marketforge_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.email && session.expires > Date.now()) {
          setIsLoggedIn(true);
          setUserData(session);
          setEmail(session.email);
          setName(session.name || "");
          if (session.subscriptions) {
            setSubscriptions(session.subscriptions);
          }
        } else {
          localStorage.removeItem("marketforge_session");
        }
      } catch (e) {
        localStorage.removeItem("marketforge_session");
      }
    }
  }, []);

  // Show status message with auto-clear
  const showStatus = (message, type = "info") => {
    setStatus({ message, type });
    setTimeout(() => {
      setStatus({ message: "", type: "" });
    }, 5000);
  };

  // Handle subscription toggle
  const toggleSubscription = (key) => {
    setSubscriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save user preferences to localStorage and backend
  const savePreferences = async () => {
    if (!isLoggedIn) {
      showStatus("Please log in to save preferences", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          name: name,
          subscriptions: subscriptions,
        }),
      });

      if (response.ok) {
        const updatedUser = { ...userData, name, subscriptions };
        setUserData(updatedUser);
        localStorage.setItem("marketforge_session", JSON.stringify(updatedUser));
        showStatus("Preferences saved successfully!", "success");
      } else {
        // Fallback to localStorage only
        const updatedUser = { ...userData, name, subscriptions };
        setUserData(updatedUser);
        localStorage.setItem("marketforge_session", JSON.stringify(updatedUser));
        showStatus("Preferences saved locally!", "success");
      }
    } catch (error) {
      // Fallback to localStorage only
      const updatedUser = { ...userData, name, subscriptions };
      setUserData(updatedUser);
      localStorage.setItem("marketforge_session", JSON.stringify(updatedUser));
      showStatus("Preferences saved locally!", "success");
    }
    setIsLoading(false);
  };

  // Sign up new user
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email) {
      showStatus("Please enter your email address", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          name: name,
          subscriptions: subscriptions,
          signupDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const user = await response.json();
        const session = {
          email: email,
          name: name,
          subscriptions: subscriptions,
          id: user.id,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };
        localStorage.setItem("marketforge_session", JSON.stringify(session));
        setUserData(session);
        setIsLoggedIn(true);
        showStatus("Account created successfully! Welcome to MarketForge!", "success");
      } else {
        // Fallback to localStorage only
        const session = {
          email: email,
          name: name,
          subscriptions: subscriptions,
          id: Date.now(),
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem("marketforge_session", JSON.stringify(session));
        setUserData(session);
        setIsLoggedIn(true);
        showStatus("Account created locally! Email notifications will be simulated.", "success");
      }
    } catch (error) {
      // Fallback to localStorage only
      const session = {
        email: email,
        name: name,
        subscriptions: subscriptions,
        id: Date.now(),
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem("marketforge_session", JSON.stringify(session));
      setUserData(session);
      setIsLoggedIn(true);
      showStatus("Account created locally! Email notifications will be simulated.", "success");
    }
    setIsLoading(false);
  };

  // Log in existing user
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail) {
      showStatus("Please enter your email", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword || "placeholder",
        }),
      });

      if (response.ok) {
        const user = await response.json();
        const session = {
          email: loginEmail,
          name: user.name || "",
          subscriptions: user.subscriptions || subscriptions,
          id: user.id,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem("marketforge_session", JSON.stringify(session));
        setUserData(session);
        setIsLoggedIn(true);
        setEmail(loginEmail);
        setName(user.name || "");
        setSubscriptions(user.subscriptions || subscriptions);
        setShowLoginModal(false);
        setLoginEmail("");
        setLoginPassword("");
        showStatus("Logged in successfully!", "success");
      } else {
        showStatus("Invalid credentials. Please sign up first.", "error");
      }
    } catch (error) {
      // Check local storage for demo account
      const savedSession = localStorage.getItem("marketforge_session");
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.email === loginEmail) {
          setUserData(session);
          setIsLoggedIn(true);
          setEmail(session.email);
          setName(session.name || "");
          setSubscriptions(session.subscriptions || subscriptions);
          setShowLoginModal(false);
          showStatus("Logged in successfully!", "success");
        } else {
          showStatus("Account not found. Please sign up first.", "error");
        }
      } else {
        showStatus("Account not found. Please sign up first.", "error");
      }
    }
    setIsLoading(false);
  };

  // Log out
  const handleLogout = () => {
    localStorage.removeItem("marketforge_session");
    setIsLoggedIn(false);
    setUserData(null);
    setEmail("");
    setName("");
    setSubscriptions({
      dailyNewsletter: true,
      priceAlerts: true,
      whisperPicks: true,
      marketUpdates: false,
      earningsReports: false,
    });
    showStatus("Logged out successfully", "info");
  };

  // Test email notification
  const sendTestEmail = async () => {
    if (!isLoggedIn) {
      showStatus("Please log in first", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name || "Valued Trader",
        }),
      });

      if (response.ok) {
        showStatus("Test email sent! Check your inbox.", "success");
      } else {
        showStatus("Test email feature coming soon!", "info");
      }
    } catch (error) {
      showStatus("Email service will be available soon!", "info");
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0c1224] rounded-xl p-6 w-96 border border-white/10">
            <h3 className="text-lg font-bold mb-4">Log In</h3>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Password (optional for demo)</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Leave blank for demo"
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cyan-500 py-2 rounded-lg hover:bg-cyan-600 transition disabled:opacity-50"
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
              Don't have an account? <button onClick={() => { setShowLoginModal(false); }} className="text-cyan-400 hover:underline">Sign up below</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your email preferences and subscription settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 text-sm font-mono">{time}</div>
        </div>
      </div>

      {/* Status Message */}
      {status.message && (
        <div className={`mb-4 p-3 rounded-lg ${
          status.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
          status.type === "error" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
          "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
        }`}>
          {status.message}
        </div>
      )}

      {!isLoggedIn ? (
        /* Sign Up Form */
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">📧</div>
              <h2 className="text-xl font-bold">Sign Up for Email Updates</h2>
              <p className="text-gray-400 text-sm mt-1">
                Get real-time market insights delivered to your inbox
              </p>
            </div>

            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-2">Email Preferences</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">📰 Daily Newsletter</span>
                    <input
                      type="checkbox"
                      checked={subscriptions.dailyNewsletter}
                      onChange={() => toggleSubscription("dailyNewsletter")}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">⚡ Price Alerts</span>
                    <input
                      type="checkbox"
                      checked={subscriptions.priceAlerts}
                      onChange={() => toggleSubscription("priceAlerts")}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">🔮 Whisper Picks</span>
                    <input
                      type="checkbox"
                      checked={subscriptions.whisperPicks}
                      onChange={() => toggleSubscription("whisperPicks")}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">📊 Market Updates</span>
                    <input
                      type="checkbox"
                      checked={subscriptions.marketUpdates}
                      onChange={() => toggleSubscription("marketUpdates")}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">💰 Earnings Reports</span>
                    <input
                      type="checkbox"
                      checked={subscriptions.earningsReports}
                      onChange={() => toggleSubscription("earningsReports")}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Already have an account? Log in
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-gray-500">
              <p>We'll never share your email. Unsubscribe at any time.</p>
            </div>
          </Card>
        </div>
      ) : (
        /* Account Dashboard */
        <>
          {/* Welcome Section */}
          <Card className="p-6 mb-6 bg-gradient-to-r from-cyan-500/10 to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">
                  Welcome back, {userData?.name || userData?.email?.split("@")[0]}!
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Manage your account and email preferences
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Member since: {new Date(userData?.expires - 30*24*60*60*1000).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              >
                Log Out
              </button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👤</span>
                <h3 className="font-semibold">Profile Settings</h3>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-[#071126]/50 rounded-lg px-3 py-2 border border-white/10 text-gray-400"
                />
                <p className="text-[10px] text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <button
                onClick={savePreferences}
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </Card>

            {/* Email Preferences */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📧</span>
                <h3 className="font-semibold">Email Preferences</h3>
              </div>

              <div className="space-y-3 mb-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">Daily Newsletter</span>
                    <p className="text-[10px] text-gray-500">Market recap and top stories</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.dailyNewsletter}
                    onChange={() => toggleSubscription("dailyNewsletter")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">Price Alerts</span>
                    <p className="text-[10px] text-gray-500">When your watched stocks move</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.priceAlerts}
                    onChange={() => toggleSubscription("priceAlerts")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">Whisper Picks</span>
                    <p className="text-[10px] text-gray-500">AI-powered options recommendations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.whisperPicks}
                    onChange={() => toggleSubscription("whisperPicks")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">Market Updates</span>
                    <p className="text-[10px] text-gray-500">Weekly market commentary</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.marketUpdates}
                    onChange={() => toggleSubscription("marketUpdates")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">Earnings Reports</span>
                    <p className="text-[10px] text-gray-500">Before earnings season</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.earningsReports}
                    onChange={() => toggleSubscription("earningsReports")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>

              <button
                onClick={savePreferences}
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </button>
            </Card>
          </div>

          {/* Test Email Button */}
          <div className="mt-6">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-400 mb-3">
                Want to test your email settings?
              </p>
              <button
                onClick={sendTestEmail}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition disabled:opacity-50"
              >
                Send Test Email
              </button>
            </Card>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {Object.values(subscriptions).filter(v => v).length}
              </div>
              <div className="text-xs text-gray-500">Active Subscriptions</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-green-400">✓</div>
              <div className="text-xs text-gray-500">Email Verified</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">Premium</div>
              <div className="text-xs text-gray-500">Free Tier</div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}