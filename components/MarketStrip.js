export default function MarketStrip() {
  const items = [
    ["SPY", "+0.74%"],
    ["QQQ", "+1.05%"],
    ["IWM", "+0.62%"],
    ["DIA", "+0.43%"],
    ["VIX", "-1.52%"],
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {items.map(([symbol, change]) => (
        <div
          key={symbol}
          className="bg-[#071126] rounded-xl p-4 border border-cyan-500/10"
        >
          <div className="text-sm text-zinc-400">{symbol}</div>

          <div
            className={
              change.includes("-")
                ? "text-red-400 text-xl font-bold"
                : "text-green-400 text-xl font-bold"
            }
          >
            {change}
          </div>
        </div>
      ))}
    </div>
  );
}