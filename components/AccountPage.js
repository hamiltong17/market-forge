import { useState, useEffect } from "react";
import Card from "./Card";
import SocialAuth from "./SocialAuth";
import { getFirebaseAuth, getFirebaseDb } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AccountPage({ tradeHistory = [] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [subscriptions, setSubscriptions] = useState({
    dailyNewsletter: true,
    priceAlerts: true,
    forgePicks: true,
    marketUpdates: false,
    earningsReports: false,
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [time, setTime] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true);

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
    const db = getFirebaseDb();
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setEmail(user.email);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setName(data.name || "");
          setSubscriptions(data.subscriptions || subscriptions);
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const showStatus = (message, type = "info") => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), 5000);
  };

  const toggleSubscription = (key) => {
    setSubscriptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSocialAuthSuccess = (user) => {
    setIsLoggedIn(true);
    setEmail(user.email);
    setName(user.displayName || user.email?.split('@')[0] || 'User');
    showStatus(`Welcome ${user.displayName || 'User'}!`, "success");
    setShowLoginModal(false);
  };

  // Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      showStatus("Firebase not ready. Please refresh.", "error");
      return;
    }
    if (!email || !password) {
      showStatus("Please enter email and password", "error");
      return;
    }
    if (password.length < 6) {
      showStatus("Password must be at least 6 characters", "error");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name || email.split("@")[0],
        subscriptions: subscriptions,
        signupDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      showStatus("Account created successfully! Welcome to MarketForge!", "success");
      setShowLoginModal(false);
      setPassword("");
    } catch (error) {
      console.error("Sign up error:", error);
      if (error.code === "auth/email-already-in-use") {
        showStatus("Email already in use. Please log in.", "error");
      } else if (error.code === "auth/weak-password") {
        showStatus("Password is too weak. Use at least 6 characters.", "error");
      } else {
        showStatus(error.message, "error");
      }
    }
    setIsLoading(false);
  };

  // Log In
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth) {
      showStatus("Firebase not ready. Please refresh.", "error");
      return;
    }
    if (!email || !password) {
      showStatus("Please enter email and password", "error");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showStatus("Logged in successfully!", "success");
      setShowLoginModal(false);
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential") {
        showStatus("Invalid email or password", "error");
      } else {
        showStatus(error.message, "error");
      }
    }
    setIsLoading(false);
  };

  // Log Out
  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUserData(null);
      setEmail("");
      setName("");
      setPassword("");
      showStatus("Logged out successfully", "info");
    } catch (error) {
      console.error(error);
      showStatus("Error logging out", "error");
    }
  };

  // Save Preferences
  const savePreferences = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db || !auth.currentUser) {
      showStatus("Please log in to save preferences", "error");
      return;
    }
    setIsLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        name: name,
        subscriptions: subscriptions,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setUserData({ ...userData, name, subscriptions });
      showStatus("Preferences saved successfully!", "success");
    } catch (error) {
      console.error(error);
      showStatus("Error saving preferences", "error");
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 max-h-screen overflow-y-auto">
          <div className="bg-[#0c1224] rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-white/10">
            <h3 className="text-lg font-bold mb-4">{isSignUpMode ? "Create Account" : "Welcome Back"}</h3>

            <SocialAuth onAuthSuccess={handleSocialAuthSuccess} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0c1224] px-3 text-gray-500">or use email</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsSignUpMode(true)}
                className={`flex-1 py-2 rounded-lg text-sm transition ${isSignUpMode ? "bg-cyan-500" : "bg-gray-700"}`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setIsSignUpMode(false)}
                className={`flex-1 py-2 rounded-lg text-sm transition ${!isSignUpMode ? "bg-cyan-500" : "bg-gray-700"}`}
              >
                Log In
              </button>
            </div>

            <form onSubmit={isSignUpMode ? handleSignUp : handleLogin}>
              {isSignUpMode && (
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
              )}

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Email</label>
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
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUpMode ? "At least 6 characters" : "Enter your password"}
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? "Please wait..." : (isSignUpMode ? "Create Account" : "Log In")}
              </button>
            </form>

            <button
              onClick={() => setShowLoginModal(false)}
              className="mt-4 w-full text-gray-400 hover:text-white text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your account and email preferences
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn && userData?.photoURL && (
            <img
              src={userData.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-cyan-500/30"
            />
          )}
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
        <div className="max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-xl font-bold">Account Access</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Sign up with Google, Apple, Facebook, X, or email
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg font-medium transition"
            >
              Sign Up / Log In
            </button>
          </Card>
        </div>
      ) : (
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
                {userData?.signupDate && (
                  <div className="mt-2 text-xs text-gray-500">
                    Member since: {new Date(userData.signupDate).toLocaleDateString()}
                  </div>
                )}
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
                    <span className="text-sm">📰 Daily Newsletter</span>
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
                    <span className="text-sm">⚡ Price Alerts</span>
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
                    <span className="text-sm">🔮 Forge Picks</span>
                    <p className="text-[10px] text-gray-500">AI-powered options recommendations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={subscriptions.forgePicks}
                    onChange={() => toggleSubscription("forgePicks")}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm">📊 Market Updates</span>
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
                    <span className="text-sm">💰 Earnings Reports</span>
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

          {/* Trade History Section */}
          <div className="mt-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <h3 className="font-semibold">Trade History</h3>
                  <span className="text-xs text-gray-500 ml-2">{tradeHistory.length} trades</span>
                </div>
                {tradeHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear all trade history?")) {
                        localStorage.removeItem("tradeHistory");
                        window.location.reload();
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {tradeHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No trades executed yet</p>
                  <p className="text-xs mt-1">Go to the dashboard to start trading</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left py-2 px-3">Symbol</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-right py-2 px-3">Qty</th>
                        <th className="text-right py-2 px-3">Price</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-right py-2 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeHistory.map((trade, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="py-2 px-3 font-bold text-cyan-400">{trade.symbol}</td>
                          <td className="py-2 px-3">
                            <span className={trade.type === "buy" ? "text-green-400" : "text-red-400"}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">{trade.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">${trade.price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono">${trade.total.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-gray-500 text-xs">{trade.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}