import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenTool } from "lucide-react";

interface LoadingScreenProps {
  onFinished: () => void;
}

export function LoadingScreen({ onFinished }: LoadingScreenProps) {
  const [stage, setStage] = useState<"pen" | "fire" | "logo">("pen");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("fire"), 1000);
    const t2 = setTimeout(() => setStage("logo"), 2200);
    const t3 = setTimeout(() => onFinished(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: "linear-gradient(135deg, #0f0010 0%, #1a0008 50%, #0f0a00 100%)" }}
    >
      <div className="flex flex-col items-center gap-8">

        {/* Stage 1 & 2: Pen & Flame */}
        <AnimatePresence mode="wait">
          {stage !== "logo" && (
            <motion.div
              key="pen-flame"
              initial={{ scale: 0.4, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {/* Pen (Draws itself in) */}
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ position: "absolute", zIndex: 10, display: "flex" }}
              >
                 <PenTool style={{ width: 44, height: 44, color: "white" }} strokeWidth={1.5} />
              </motion.div>

              {/* Fire catches on the pen at stage 'fire' */}
              <AnimatePresence>
                {stage === "fire" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, pointerEvents: "none" }}
                  >
                    {/* Glow behind flame */}
                    <motion.div
                      animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        position: "absolute",
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 60%)",
                        filter: "blur(16px)",
                      }}
                    />

                    <svg viewBox="0 0 80 96" width="140" height="140" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", opacity: 0.85, overflow: "visible" }}>
                      <defs>
                        <radialGradient id="lg1" cx="50%" cy="85%" r="65%">
                          <stop offset="0%" stopColor="#fef3c7" />
                          <stop offset="30%" stopColor="#fbbf24" />
                          <stop offset="65%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </radialGradient>
                      </defs>

                      {/* Flame wrapped around pen */}
                      <motion.path
                        d="M40 93 C16 93 4 76 4 60 C4 44 14 36 22 28 C19 40 27 45 27 45 C27 29 33 17 40 4 C46 17 52 24 49 37 C56 29 60 20 56 12 C72 24 76 44 76 60 C76 76 64 93 40 93Z"
                        fill="url(#lg1)"
                        animate={{ scaleX: [1, 1.05, 0.95, 1], scaleY: [1, 0.95, 1.05, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ transformOrigin: "center bottom", filter: "drop-shadow(0 4px 16px rgba(239,68,68,0.8))", mixBlendMode: "screen" }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text reveal (Logo) */}
        <AnimatePresence>
          {stage === "logo" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <h1
                className="text-5xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f97316 40%, #ef4444 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                FlameBoard
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8, letterSpacing: 3, fontWeight: 500 }}
              >
                YOUR INFINITE CANVAS
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading dots */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ef4444)",
              }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

      </div>
    </div>
  );
}
