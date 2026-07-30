import { ReactNode } from "react";

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  blurRadius?: number;
  tint?: string;
  cornerRadius?: string;
  withShine?: boolean;
  withDistortion?: boolean;
  dark?: boolean;
}

export function LiquidGlass({
  children,
  className = "",
  blurRadius = 40,
  tint,
  cornerRadius = "28px",
  withShine = true,
  withDistortion = false,
  dark = false,
}: LiquidGlassProps) {
  const defaultTint = dark
    ? "rgba(15, 15, 25, 0.55)"
    : "rgba(255, 255, 255, 0.15)";

  const resolvedTint = tint ?? defaultTint;

  const borderColor = dark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.4)";

  const shineGradient = dark
    ? "linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 50%)"
    : "linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 50%)";

  return (
    <div
      className={`relative ${className}`}
      style={{
        backdropFilter: `blur(${blurRadius}px)`,
        WebkitBackdropFilter: `blur(${blurRadius}px)`,
        backgroundColor: resolvedTint,
        borderRadius: cornerRadius,
        border: `1px solid ${borderColor}`,
        boxShadow: dark
          ? `0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 40px rgba(0,0,0,0.3) inset`
          : `0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 40px rgba(255,255,255,0.1) inset`,
        transform: withDistortion ? "scale(1.01)" : "none",
        opacity: withDistortion ? 0.98 : 1,
      }}
    >
      {withShine && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: cornerRadius,
            background: shineGradient,
            mixBlendMode: "lighten",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
