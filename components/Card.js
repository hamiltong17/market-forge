export default function Card({
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`
	glow
        bg-[#060b16]
        border
        border-cyan-500/10
        rounded-2xl
        p-5
        shadow-[0_0_30px_rgba(0,255,255,0.05)]
        backdrop-blur-xl
        overflow-hidden
        ${className}
      `}
    >
      {title && (
        <h2 className="text-lg font-semibold mb-5 text-white">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}