import React, { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onEnter: (deadlineHours?: number) => void;
}

// ── Agent cards — 4 corners, like AbstractCards reference ──
const CARDS = [
  {
    num: "01",
    label: "Crisis Assessment",
    preview: ["CRITICAL — 9h deficit", "→ Auth won't ship", "→ Backend untested", "→ Deploy unconfigured"],
    border: "border-red-500/40",
    bg: "bg-red-950/25",
    glow: "shadow-red-500/10",
    accent: "text-red-400",
    dot: "bg-red-500",
    // desktop absolute positions
    pos: "w-[220px] top-[7%] left-[3%]",
    rotate: -9,
  },
  {
    num: "02",
    label: "Survival Version",
    preview: ["✓ Core UI", "✓ API integration", "✕ Auth (defer)", "✕ Analytics (v2)", "15% → 85% odds"],
    border: "border-orange-500/40",
    bg: "bg-orange-950/25",
    glow: "shadow-orange-500/10",
    accent: "text-orange-400",
    dot: "bg-orange-500",
    pos: "w-[210px] top-[5%] right-[3%]",
    rotate: 8,
  },
  {
    num: "03",
    label: "Rescue Planner",
    preview: ["H0–2: Core layout", "H2–4: API wiring", "H4–5: Integration test", "H5–6: Deploy + demo"],
    border: "border-blue-500/40",
    bg: "bg-blue-950/25",
    glow: "shadow-blue-500/10",
    accent: "text-blue-400",
    dot: "bg-blue-500",
    pos: "w-[210px] bottom-[14%] left-[2%]",
    rotate: 6,
  },
  {
    num: "04",
    label: "Simulation Engine",
    preview: ["Timeline A: ✕ Failed", "→ Missed 4 features", "Timeline B: ✓ Shipped", "→ MVP delivered"],
    border: "border-violet-500/40",
    bg: "bg-violet-950/25",
    glow: "shadow-violet-500/10",
    accent: "text-violet-400",
    dot: "bg-violet-500",
    pos: "w-[210px] bottom-[12%] right-[2%]",
    rotate: -7,
  },
];

const MARQUEE_ITEMS = [
  "CRISIS ASSESSMENT", "·", "SCOPE TRIAGE", "·",
  "RESCUE PLANNING", "·", "OUTCOME SIMULATION", "·",
  "BUILT FOR HACKATHONS", "·", "GEMINI POWERED", "·",
  "LAST MINUTE LIFE SAVER", "·", "SCOPE TRIAGE", "·",
  "RESCUE PLANNING", "·", "OUTCOME SIMULATION", "·",
  "47 BUILDERS RESCUED THIS WEEKEND", "·", "GEMINI POWERED", "·",
];

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [deadlineHours, setDeadlineHours] = useState(6);
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headlineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Random initial state for each card — same pattern as AbstractCards reference
    const initials = CARDS.map(() => ({
      rotation: Math.round(Math.random() * 50 - 25),
      scale: 1.45,
    }));

    const ctx = gsap.context(() => {

      // ── Nav ──
      gsap.from(navRef.current, {
        y: -20, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.05,
      });

      // ── Eyebrow ──
      gsap.from(eyebrowRef.current, {
        y: 12, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.25,
      });

      // ── Headline lines — overflow:hidden clip reveal (index.css .line pattern) ──
      headlineRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          y: "108%",
          opacity: 0,
          duration: 1.0,
          ease: "power4.out",
          delay: 0.35 + i * 0.12,
        });
      });

      // ── Subtitle ──
      gsap.from(subtitleRef.current, {
        y: 22, opacity: 0, duration: 0.75, ease: "power3.out", delay: 0.9,
      });

      // ── CTA ──
      gsap.from(ctaRef.current, {
        scale: 0.86, opacity: 0, duration: 0.65, ease: "back.out(1.7)", delay: 1.08,
      });

      // ── Pills ──
      gsap.from(pillsRef.current, {
        y: 10, opacity: 0, duration: 0.5, ease: "power2.out", delay: 1.22,
      });

      // ── Marquee fade in + GSAP ticker ──
      gsap.from(marqueeRef.current, { opacity: 0, duration: 0.6, delay: 1.35 });
      if (marqueeTrackRef.current) {
        gsap.to(marqueeTrackRef.current, {
          x: "-50%",
          duration: 22,
          ease: "none",
          repeat: -1,
        });
      }

      // ── Cards — AbstractCards scatter from center ──
      innerRefs.current.forEach((inner, idx) => {
        const wrapper = wrapperRefs.current[idx];
        if (!inner || !wrapper) return;

        const measureOffset = () => {
          const wRect = wrapper.getBoundingClientRect();
          const sRect = section.getBoundingClientRect();
          return {
            x: sRect.left + sRect.width / 2 - (wRect.left + wRect.width / 2),
            y: sRect.top + sRect.height / 2 - (wRect.top + wRect.height / 2),
          };
        };

        gsap.fromTo(
          inner,
          {
            x: () => measureOffset().x,
            y: () => measureOffset().y,
            scale: initials[idx].scale,
            rotate: initials[idx].rotation,
            opacity: 0,
          },
          {
            x: 0, y: 0,
            scale: 1,
            rotate: CARDS[idx].rotate,
            opacity: 1,
            duration: 1.3,
            ease: "back.inOut(1.6)",
            delay: 0.4 + idx * 0.07,
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col select-none"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] bg-red-900/7 rounded-full blur-[180px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[600px] bg-orange-900/6 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-violet-900/4 rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />

      {/* ── Nav ── */}
      <nav
        ref={navRef}
        className="relative z-20 flex items-center justify-between px-7 md:px-12 pt-8 pb-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg shadow-lg shadow-red-500/25">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-mono font-bold tracking-[0.18em] text-zinc-100">
            PHOENIX
          </span>
          <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/30 bg-red-950/40 text-red-400 tracking-wider ml-0.5">
            Crisis Recovery Agent
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-600">
          <span className="hidden md:block tracking-wider">4 AI Agents · Gemini Powered</span>
          <button
            onClick={() => onEnter(deadlineHours)}
            className="px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 rounded-full text-zinc-400 hover:text-zinc-200 transition-all duration-200 text-[11px] font-mono tracking-wider"
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* ── Desktop floating cards (AbstractCards pattern) ── */}
      {CARDS.map((card, idx) => (
        <div
          key={card.num}
          ref={(el) => { wrapperRefs.current[idx] = el; }}
          className={`absolute hidden lg:block ${card.pos} z-10`}
        >
          <div
            ref={(el) => { innerRefs.current[idx] = el; }}
            className={`w-full rounded-2xl border ${card.border} ${card.bg} shadow-xl ${card.glow} p-4 backdrop-blur-md will-change-transform`}
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
              <span className={`text-[10px] font-mono tracking-[0.2em] ${card.accent} uppercase`}>
                {card.num}
              </span>
            </div>
            <div className="text-xs font-bold text-zinc-100 mb-2 leading-snug font-mono">
              {card.label}
            </div>
            <div className="space-y-1">
              {card.preview.map((line, i) => (
                <div key={i} className={`text-[10px] font-mono ${line.startsWith("✕") || line.startsWith("Timeline A") ? "text-red-400/70" : line.startsWith("✓") || line.startsWith("Timeline B") ? "text-emerald-400/80" : line.startsWith("→") ? "text-zinc-500" : "text-zinc-400"}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ── Hero center ── */}
      <div className="relative z-20 flex flex-col items-center justify-center flex-1 px-6 text-center pt-2 pb-1">

        {/* Eyebrow */}
        <div ref={eyebrowRef} className="flex items-center gap-2 mb-5 sm:mb-8">
          <div className="w-6 sm:w-10 h-[1px] bg-gradient-to-r from-transparent to-red-500/60 flex-shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.28em] text-red-400 uppercase text-center">
            Last Minute Life Saver 
          </span>
          <div className="w-6 sm:w-10 h-[1px] bg-gradient-to-l from-transparent to-red-500/60 flex-shrink-0" />
        </div>

        {/* Big editorial headline — each line in overflow:hidden */}
        <div className="overflow-hidden mb-0.5">
          <div
            ref={(el) => { headlineRefs.current[0] = el; }}
            className="text-[11vw] md:text-[8vw] font-bold leading-[0.87] tracking-[-0.035em] text-zinc-500"
          >
            Your demo is
          </div>
        </div>
        <div className="overflow-hidden mb-3 sm:mb-5">
          <div
            ref={(el) => { headlineRefs.current[1] = el; }}
            className="text-[11vw] md:text-[8vw] font-bold leading-[0.87] tracking-[-0.035em] text-zinc-700"
          >
            in {deadlineHours} hours.
          </div>
        </div>
        <div className="overflow-hidden mb-0.5">
          <div
            ref={(el) => { headlineRefs.current[2] = el; }}
            className="text-[12vw] md:text-[9vw] font-bold leading-[0.84] tracking-[-0.04em] bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent"
          >
            Phoenix
          </div>
        </div>
        <div className="overflow-hidden mb-5 sm:mb-8">
          <div
            ref={(el) => { headlineRefs.current[3] = el; }}
            className="text-[12vw] md:text-[9vw] font-bold leading-[0.84] tracking-[-0.04em] text-zinc-100"
          >
            rescues you.
          </div>
        </div>

        {/* Subtitle */}
        <div ref={subtitleRef} className="max-w-[340px] md:max-w-[420px] mb-4 sm:mb-6">
          <p className="text-sm md:text-[15px] text-zinc-500 leading-relaxed">
            You've built maybe 20% of it. Diagnose the crisis,
            cut your scope to what can actually ship,
            get a concrete hour-by-hour plan. Right now.
          </p>
        </div>

        {/* Deadline input widget */}
        <div ref={pillsRef} className="mb-5 sm:mb-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-zinc-900/70 border border-red-500/25 rounded-full px-5 py-3 shadow-lg shadow-red-950/20 max-w-xs">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap">Deadline in</span>
          <input
            type="number"
            min={1}
            max={72}
            value={deadlineHours}
            onChange={(e) => setDeadlineHours(Math.max(1, Math.min(72, Number(e.target.value) || 1)))}
            className="w-10 bg-transparent text-red-400 font-mono font-bold text-center text-xl outline-none border-b border-red-500/40 focus:border-red-400 transition-colors"
          />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">hours</span>
          <span className="hidden sm:block w-px h-4 bg-zinc-700" />
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            CRISIS ACTIVE
          </span>
        </div>

        {/* CTA */}
        <button
          ref={ctaRef}
          onClick={() => onEnter(deadlineHours)}
          className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-4 px-10 rounded-full text-sm tracking-[0.1em] uppercase shadow-2xl shadow-red-600/25 flex items-center gap-3 hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
        >
          <Flame className="w-4 h-4" />
          <span>Start My Recovery</span>
          <span className="text-orange-200 transition-transform duration-200 group-hover:translate-x-1">→</span>
          {/* shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        </button>

        {/* Tech pills */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-[10px] font-mono text-zinc-700 tracking-wider">
          {["4 AI Agents", "Gemini Powered", "Fallback Heuristics", "No Auth Required"].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-zinc-700" />{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Mobile / tablet cards — animated 2×2 grid (hidden on lg+) ── */}
      <div className="relative z-20 lg:hidden px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {CARDS.map((card, idx) => (
            <motion.div
              key={card.num}
              initial={{ opacity: 0, y: 32, rotate: idx % 2 === 0 ? -4 : 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, rotate: idx % 2 === 0 ? -1.5 : 1.5, scale: 1 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.55 + idx * 0.1,
              }}
              className={`rounded-2xl border ${card.border} ${card.bg} p-3.5 shadow-lg will-change-transform ${idx % 2 === 0 ? "mobile-card-float-odd" : "mobile-card-float-even"}`}
              style={{ animationDelay: `${1.2 + idx * 0.15}s` }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
                <span className={`text-[9px] font-mono tracking-[0.2em] ${card.accent} uppercase`}>{card.num}</span>
              </div>
              <div className="text-[11px] font-bold text-zinc-100 mb-2 leading-snug font-mono">{card.label}</div>
              <div className="space-y-1">
                {card.preview.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + idx * 0.1 + i * 0.06, duration: 0.35 }}
                    className={`text-[10px] font-mono leading-relaxed ${
                      line.startsWith("✕") || line.startsWith("Timeline A") ? "text-red-400/80"
                      : line.startsWith("✓") || line.startsWith("Timeline B") ? "text-emerald-400/80"
                      : line.startsWith("→") ? "text-zinc-500"
                      : "text-zinc-400"
                    }`}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Marquee strip — GSAP ticker ── */}
      <div
        ref={marqueeRef}
        className="relative z-20 w-full overflow-hidden border-t border-zinc-800/50 py-3"
        style={{ opacity: 0 }}
      >
        <div
          ref={marqueeTrackRef}
          className="flex gap-7 whitespace-nowrap will-change-transform"
          style={{ width: "max-content" }}
        >
          {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono tracking-[0.22em] ${
                item === "·" ? "text-red-500/40" : "text-zinc-700"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bottom quote ── */}
      <div className="relative z-20 px-6 py-4 text-center border-t border-zinc-800/30">
        <p className="text-[10px] font-mono text-zinc-700 max-w-lg mx-auto leading-relaxed tracking-wide">
          "ChatGPT gives advice when asked. Phoenix performs a structured crisis-recovery workflow —
          diagnose failure, reduce scope, build a rescue plan, simulate outcomes."
        </p>
      </div>
    </div>
  );
}