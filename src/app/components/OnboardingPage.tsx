import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, ChevronRight, X, Rocket, Palette, Sparkles, Wrench } from "lucide-react";

const SECTIONS = [
    {
        icon: Rocket,
        color: "#ef4444",
        title: "Infinite Board Management",
        items: [
            { emoji: "🗂️", label: "Template Gallery", desc: "Pre-designed layouts — Brainstorm, Mood Board, Mind Map, Kanban — to instantly start your project." },
            { emoji: "♾️", label: "Infinite Canvas", desc: "A boundless workspace with no page limits. Draw, think, and organise freely." },
            { emoji: "🖼️", label: "Live Previews", desc: "Dashboard thumbnails update in real time to show the latest state of each board." },
            { emoji: "🔍", label: "Management Suite", desc: "Search, rename, and organise all your boards from the dashboard." },
        ],
    },
    {
        icon: Palette,
        color: "#f97316",
        title: "The Creative Toolkit",
        items: [
            { emoji: "🖊️", label: "Professional Pen Suite", desc: "Pen, Pencil, and Marker tools with adjustable thickness for precise drawing." },
            { emoji: "🟡", label: "Intelligent Highlighter", desc: "Semi-transparent highlighting with curated colours." },
            { emoji: "📝", label: "Digital Stationery", desc: "Resizable Sticky Notes and geometric Shapes for organising ideas visually." },
            { emoji: "🖼️", label: "Media Integration", desc: "Upload and place images directly onto the board." },
            { emoji: "🔲", label: "Lasso Tool", desc: "Select, group, copy, and move multiple elements at once." },
            { emoji: "⚠️", label: "Important", desc: "You can only resize and delete photos and shapes while the Shapes Toolkit is active.", highlight: true },
        ],
    },
    {
        icon: Sparkles,
        color: "#8b5cf6",
        title: "Flame Board AI",
        items: [
            { emoji: "📋", label: "Notes Summary", desc: "AI reads your sticky notes and generates a professional summary instantly." },
            { emoji: "💡", label: "Idea Expansion", desc: "Type one idea — AI generates four related ideas as sticky notes on your board." },
            { emoji: "💬", label: "Board Chat", desc: "A chat system that reads your board context and helps you brainstorm." },
            { emoji: "🎨", label: "Aesthetic Director", desc: "AI-generated mood boards with visual ideas and layout suggestions." },
        ],
    },
    {
        icon: Wrench,
        color: "#10b981",
        title: "Pro Workflow & UX",
        items: [
            { emoji: "🔎", label: "Fluid Navigation", desc: "Smooth zooming from 0.1x to 5x and panning using the Zoom Pill." },
            { emoji: "📤", label: "High Quality Export", desc: "One-click export to PNG." },
            { emoji: "↩️", label: "Deep Undo/Redo", desc: "Reliable history system — ⌘Z to undo, ⌘⇧Z to redo." },
            { emoji: "⌨️", label: "Keyboard Shortcuts", desc: "Press ? anywhere on the canvas to open the shortcuts cheat sheet." },
            { emoji: "🌙", label: "Premium Dark Mode", desc: "Glassmorphic UI with full dark mode support." },
        ],
    },
];

interface OnboardingPageProps {
    onFinished: () => void;
}

export function OnboardingPage({ onFinished }: OnboardingPageProps) {
    const [step, setStep] = useState(0);
    const isLast = step === SECTIONS.length - 1;
    const section = SECTIONS[step];
    const Icon = section.icon;

    const handleFinish = () => {
        localStorage.setItem("flameboard-onboarding-done", "1");
        onFinished();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0f0f17 0%, #1a0a0a 50%, #0f0f17 100%)" }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position: "absolute", top: "20%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
                <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
            </div>

            <div className="relative w-full max-w-2xl mx-4">
                {/* Skip button */}
                <button onClick={handleFinish}
                    className="absolute -top-10 right-0 text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors">
                    <X className="size-3.5" /> Skip intro
                </button>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-3xl p-8"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(24px)",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl" style={{ background: section.color + "22" }}>
                                <Icon className="size-7" style={{ color: section.color }} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">
                                    {step + 1} of {SECTIONS.length}
                                </p>
                                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-8">
                            {section.items.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="flex items-start gap-3 rounded-2xl px-4 py-3"
                                    style={{
                                        background: (item as any).highlight
                                            ? "rgba(239,68,68,0.1)"
                                            : "rgba(255,255,255,0.03)",
                                        border: (item as any).highlight
                                            ? "1px solid rgba(239,68,68,0.3)"
                                            : "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                                    <div>
                                        <span className="text-sm font-semibold text-white">{item.label} </span>
                                        <span className="text-sm text-gray-400">{item.desc}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            {/* Dots */}
                            <div className="flex gap-2">
                                {SECTIONS.map((_, i) => (
                                    <button key={i} onClick={() => setStep(i)}
                                        className="rounded-full transition-all"
                                        style={{
                                            width: i === step ? 24 : 8,
                                            height: 8,
                                            background: i === step ? section.color : "rgba(255,255,255,0.2)",
                                        }} />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                {step > 0 && (
                                    <button onClick={() => setStep(step - 1)}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                        style={{ background: "rgba(255,255,255,0.06)" }}>
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={isLast ? handleFinish : () => setStep(step + 1)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                                    style={{ background: `linear-gradient(135deg, ${section.color}, #f97316)` }}>
                                    {isLast ? (
                                        <><Flame className="size-4" /> Get Started</>
                                    ) : (
                                        <>Next <ChevronRight className="size-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
