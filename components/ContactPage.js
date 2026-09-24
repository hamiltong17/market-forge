import { useState, useEffect } from "react";
import Card from "./Card";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState("");

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ message: "Please fill in all required fields", type: "error" });
      return;
    }

    setIsLoading(true);
    setStatus({ message: "", type: "" });

    try {
      // Send to your API endpoint
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ 
          message: "✅ Message sent successfully! We'll get back to you soon.", 
          type: "success" 
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      // Fallback: Open email client
      const subject = encodeURIComponent(`Contact: ${formData.subject || "General Inquiry"}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      window.location.href = `mailto:contact.mrktforge@gmail.com?subject=${subject}&body=${body}`;
      
      setStatus({ 
        message: "✅ Email client opened. Please send your message manually.", 
        type: "success" 
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 text-white bg-[#070b14] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📧 Contact Us</h1>
          <p className="text-gray-400 text-sm mt-1">
            Have questions? We'd love to hear from you.
          </p>
        </div>
        <div className="text-cyan-400 text-sm font-mono">{time}</div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Contact Form */}
        <div className="col-span-7">
          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows="5"
                  className="w-full bg-[#071126] rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>

              {status.message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  status.type === "success" 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="col-span-5">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Get in Touch</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <a href="mailto:contact.mrktforge@gmail.com" className="text-cyan-400 hover:underline text-sm">
                    contact.mrktforge@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <div className="text-sm font-medium">Response Time</div>
                  <div className="text-sm text-gray-400">Within 24-48 hours</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <div className="text-sm font-medium">Support Hours</div>
                  <div className="text-sm text-gray-400">Mon-Fri: 9AM - 6PM EST</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="text-sm font-medium">Privacy</div>
                  <div className="text-sm text-gray-400">Your data is secure and never shared</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="p-4 mt-4">
            <h4 className="text-sm font-semibold mb-2">Frequently Asked</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 block">
                How do I start trading?
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 block">
                What is Forge Picks?
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 block">
                How do I withdraw funds?
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 block">
                What are the fees?
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}