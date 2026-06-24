import React, { useState, useRef, useLayoutEffect } from "react";
import LandingPage from "./LandingPage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Flame, Hourglass, Clock, AlertTriangle, Upload, FileText, X,
  ChevronRight, ShieldAlert, Compass, Zap, RefreshCw, Sparkles,
  Info, Wrench, CheckSquare, Rocket, Presentation, GitBranch,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DiagnosisResponse {
  risk_level: "Critical" | "High" | "Moderate" | "Low";
  failure_causes: string[];
  deficit: number;
  availableHours: number;
  requiredHours: number;
  note?: string;
}

interface SurvivalResponse {
  keep: string[];
  cut: string[];
  success_chance_before: number;
  success_chance_after: number;
  note?: string;
}

interface RescueBlock {
  hour_range: string;
  task: string;
  type: "build" | "test" | "deploy" | "pitch";
}

interface RescueResponse {
  blocks: RescueBlock[];
  total_hours_planned: number;
  buffer_hours: number;
  note?: string;
}

interface SimEvent {
  hour: number;
  event: string;
  type: "warning" | "failure" | "neutral" | "milestone" | "success";
}

interface SimulationResponse {
  timeline_a: SimEvent[];
  timeline_b: SimEvent[];
  outcome_a: "Failed Submission" | "Incomplete" | "Missed Deadline";
  outcome_b: "Submitted" | "Delivered" | "MVP Complete";
  note?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB — matches the dropzone copy

const PRESETS = [
  {
    title: "⚡ This demo, right now",
    goal: "Ship hackathon MVP before judging",
    availableHours: 6,
    requiredHours: 18,
    progress: 15,
    features: "Landing Page\nUser Auth\nCore Feature Flow\nAPI Integration\nReal-time Updates\nDemo Data Seeding\nMobile Responsive\nDeploy to Production",
    badge: true,
  },
  {
    title: "Hackathon project demo",
    goal: "Deploy working React App prototype",
    availableHours: 6,
    requiredHours: 15,
    progress: 20,
    features: "User Authentication\nReal-time Leaderboard\nInteractive Graph Engine\nPDF Summary Download\nAI Recommendation Chat\nOffline Cache Sync",
  },
  {
    title: "University project submission",
    goal: "Complete Final CS Assignment",
    availableHours: 24,
    requiredHours: 32,
    progress: 40,
    features: "B-Tree Implementation\nDynamic Benchmark Graphs\nTest Suite\nLaTeX Formatted PDF\nCommand Line Sandbox",
  },
  {
    title: "Investor pitch slide deck",
    goal: "Create Series A presentation & demo",
    availableHours: 12,
    requiredHours: 8,
    progress: 75,
    features: "12 Slides\nVideo Screencast\nFinancial Forecasting Tool\nInteractive Clickable Prototype\nFAQ Sheet",
  },
];

const LOADING_STEPS = [
  "Simulating temporal crash course...",
  "Evaluating project delivery trajectory...",
  "Cross-analyzing workload complexity...",
  "Running survival model analysis...",
  "Formatting urgent triage directives...",
];

const SURVIVAL_LOADING_STEPS = [
  "Parsing feature dependencies...",
  "Running triage optimization...",
  "Dropping luxury product elements...",
  "Calculating survival success odds...",
  "Drafting emergency development list...",
];

const RESCUE_LOADING_STEPS = [
  "Plotting your escape route...",
  "Allocating survival hours...",
  "Synthesizing schedule timelines...",
  "Optimizing work blocks...",
  "Finalizing critical execution path...",
];

const SIMULATION_LOADING_STEPS = [
  "Simulating original trajectory...",
  "Modeling Phoenix recovery path...",
  "Calculating timeline divergence...",
  "Projecting final outcomes...",
  "Rendering parallel futures...",
];

// ── Agent showcase data (used in the Stickygrid-style pinned section) ──
const AGENTS = [
  {
    num: "01",
    name: "Crisis Assessment",
    desc: "Diagnoses your deadline gap. Identifies your top failure causes with brutal precision. Risk-levels your crisis in seconds.",
    accent: "text-red-400",
    border: "border-red-500/30",
    bar: "bg-red-500",
    glow: "from-red-900/20",
    icon: ShieldAlert,
  },
  {
    num: "02",
    name: "Survival Version Generator",
    desc: "Triages your entire feature list. Keeps only what's essential for a working demo. Jumps your success odds from 15% to 85%.",
    accent: "text-orange-400",
    border: "border-orange-500/30",
    bar: "bg-orange-500",
    glow: "from-orange-900/20",
    icon: Sparkles,
  },
  {
    num: "03",
    name: "Rescue Planner",
    desc: "Builds a concrete hour-by-hour execution schedule using only your survival features. Specific tasks, not vague advice.",
    accent: "text-blue-400",
    border: "border-blue-500/30",
    bar: "bg-blue-500",
    glow: "from-blue-900/20",
    icon: Compass,
  },
  {
    num: "04",
    name: "Simulation Engine",
    desc: "Simulates two parallel futures — your original plan vs. the Phoenix plan. Watch them diverge in real time.",
    accent: "text-violet-400",
    border: "border-violet-500/30",
    bar: "bg-violet-500",
    glow: "from-violet-900/20",
    icon: GitBranch,
  },
];

// ─────────────────────────────────────────────
// AnimatedChance
// ─────────────────────────────────────────────

function AnimatedChance({ before, after }: { before: number; after: number }) {
  const safeBefore = Number(before) || 0;
  const safeAfter = Number(after) || 0;
  const [currentBefore, setCurrentBefore] = useState(0);
  const [currentAfter, setCurrentAfter] = useState(0);

  React.useEffect(() => {
    setCurrentBefore(0); setCurrentAfter(0);
    const steps = 40;
    const intervalTime = 1200 / steps;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      if (count >= steps) {
        setCurrentBefore(safeBefore); setCurrentAfter(safeAfter);
        clearInterval(timer);
      } else {
        setCurrentBefore(Math.round((safeBefore / steps) * count));
        setCurrentAfter(Math.round((safeAfter / steps) * count));
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [safeBefore, safeAfter]);

  const jumpValue = safeAfter - safeBefore;

  return (
    <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80 mt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        Calculated Survival Odds Comparison
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="text-center bg-zinc-900/40 p-4 rounded-lg border border-zinc-800">
          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Original Plan Success</span>
          <div className="text-3xl font-extrabold text-red-500 leading-none">{currentBefore}%</div>
          <span className="text-[10px] text-zinc-600 block mt-1.5 font-mono">Severe deadline risk</span>
        </div>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-full flex items-center gap-2 mb-1">
            <div className="h-px bg-zinc-800 flex-grow" />
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-full animate-pulse">
              +{jumpValue > 0 ? jumpValue : 0}% Survival Jump
            </span>
            <div className="h-px bg-zinc-800 flex-grow" />
          </div>
          <span className="text-[9px] font-mono text-zinc-500">By executing scope triage</span>
        </div>
        <div className="text-center bg-emerald-950/15 p-4 rounded-lg border border-emerald-500/20 relative">
          <div className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="block text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">Survival Plan Success</span>
          <div className="text-4xl font-extrabold text-emerald-400 leading-none">{currentAfter}%</div>
          <span className="text-[10px] text-emerald-500/80 block mt-1.5 font-mono font-semibold">Highly survivable path</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SimulationEngine
// ─────────────────────────────────────────────

function SimulationEngine({ data }: { data: SimulationResponse }) {
  const [visibleA, setVisibleA] = useState(0);
  const [visibleB, setVisibleB] = useState(0);

  React.useEffect(() => {
    setVisibleA(0); setVisibleB(0);
    const total = Math.max(data.timeline_a.length, data.timeline_b.length);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleA(Math.min(i, data.timeline_a.length));
      setVisibleB(Math.min(i, data.timeline_b.length));
      if (i >= total) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, [data]);

  const getEventStyle = (type: SimEvent["type"]) => {
    switch (type) {
      case "failure": return { dot: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bg: "bg-red-950/20" };
      case "warning": return { dot: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-950/20" };
      case "success": return { dot: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-950/20" };
      case "milestone": return { dot: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-950/20" };
      default: return { dot: "bg-zinc-500", text: "text-zinc-400", border: "border-zinc-700/30", bg: "bg-zinc-900/20" };
    }
  };

  const outcomeAStyle = data.outcome_a === "Failed Submission"
    ? "bg-red-950/60 border-red-500/40 text-red-300"
    : "bg-amber-950/60 border-amber-500/40 text-amber-300";

  return (
    <div className="mt-6 space-y-4">
      {data.note && (
        <div className="flex items-start gap-2.5 bg-amber-950/25 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs font-mono">
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>⚡ Heuristic Simulation Active — {data.note}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline A */}
        <div className="bg-zinc-950/40 border border-red-500/20 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-amber-600" />
          <h5 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Timeline A — Original Plan
          </h5>
          <div className="space-y-2">
            {data.timeline_a.slice(0, visibleA).map((event, idx) => {
              const s = getEventStyle(event.type);
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${s.border} ${s.bg}`}>
                  <div className="flex-shrink-0 mt-0.5 flex flex-col items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-[9px] font-mono text-zinc-600">{event.hour}h</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${s.text}`}>{event.event}</p>
                </motion.div>
              );
            })}
          </div>
          {visibleA >= data.timeline_a.length && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`mt-3 text-center py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${outcomeAStyle}`}>
              ✕ {data.outcome_a}
            </motion.div>
          )}
        </div>

        {/* Timeline B */}
        <div className="bg-zinc-950/40 border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500" />
          <h5 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Timeline B — Phoenix Plan
          </h5>
          <div className="space-y-2">
            {data.timeline_b.slice(0, visibleB).map((event, idx) => {
              const s = getEventStyle(event.type);
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${s.border} ${s.bg}`}>
                  <div className="flex-shrink-0 mt-0.5 flex flex-col items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-[9px] font-mono text-zinc-600">{event.hour}h</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${s.text}`}>{event.event}</p>
                </motion.div>
              );
            })}
          </div>
          {visibleB >= data.timeline_b.length && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-3 text-center py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              ✓ {data.outcome_b}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AgentsShowcase — Stickygrid-inspired pinned section
// Each agent card flies in + the active one expands as you scroll
// ─────────────────────────────────────────────

function AgentsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Parallax on each card — vary speed by index like Stickygrid's data-speed
      panelsRef.current.forEach((panel, i) => {
        if (!panel) return;
        const speed = [0.15, -0.1, 0.2, -0.05][i] ?? 0;
        gsap.to(panel, {
          yPercent: speed * 60,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Pinned counter that counts up 01→04 as you scroll through the section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 0.4,
        },
      });

      AGENTS.forEach((_, i) => {
        tl.to(counterRef.current, {
          textContent: String(i + 1).padStart(2, "0"),
          duration: 0.5,
          snap: { textContent: 1 },
          ease: "none",
        }, i * 0.25);
      });

      // Stagger-in each card on scroll enter
      panelsRef.current.forEach((panel, i) => {
        if (!panel) return;
        gsap.from(panel, {
          opacity: 0,
          y: 50,
          scale: 0.96,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: panel,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          delay: i * 0.06,
        });
      });

    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="w-full py-24 px-4 relative">
      {/* Section header */}
      <div className="max-w-4xl mx-auto mb-16 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.28em] text-red-400 uppercase mb-3">
            The Recovery Stack
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">
            4 AI Agents.<br />
            <span className="text-zinc-500">One coordinated rescue.</span>
          </h2>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <span ref={counterRef} className="text-[6vw] font-bold text-zinc-800 leading-none tabular-nums select-none">
            01
          </span>
          <span className="text-[10px] font-mono text-zinc-700 tracking-wider">/ {String(AGENTS.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Cards grid — 2×2 on desktop, 1-col on mobile */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.num}
              ref={(el) => { panelsRef.current[idx] = el; }}
              className={`relative bg-zinc-900/50 border ${agent.border} rounded-2xl p-6 overflow-hidden will-change-transform group hover:bg-zinc-900/80 transition-colors duration-300`}
            >
              {/* Accent bar top */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${agent.bar}`} />
              {/* Ambient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.glow} to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-zinc-800/60 ${agent.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-mono tracking-[0.2em] ${agent.accent} opacity-60`}>
                    {agent.num}
                  </span>
                </div>
                <h3 className={`text-base font-bold mb-2 ${agent.accent} font-mono tracking-tight`}>
                  {agent.name}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Separator stat bar */}
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-3 gap-4 border-t border-zinc-800/60 pt-8">
        {[
          { value: "15%→85%", label: "Success rate jump" },
          { value: "< 2s", label: "Per agent response" },
          { value: "4-tier", label: "Gemini model fallback" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-xl md:text-2xl font-bold text-zinc-100 font-mono tracking-tight">{s.value}</div>
            <div className="text-[11px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// ErrorBoundary
// ─────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("ErrorBoundary:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-zinc-900 border border-red-500/30 p-6 rounded-xl shadow-xl">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Application Error</h2>
            <pre className="text-left bg-zinc-950 p-3 rounded text-xs font-mono text-red-400 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button onClick={() => window.location.reload()}
              className="mt-6 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded text-sm transition-colors">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [initialHours, setInitialHours] = useState<number | undefined>(undefined);

  const handleEnter = (deadlineHours?: number) => {
    setInitialHours(deadlineHours);
    setShowLanding(false);
  };

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <LandingPage onEnter={handleEnter} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            // The AgentsShowcase section inside MainApp sets up ScrollTrigger
            // instances on mount, while this very transition is still animating
            // the container's position. Without a refresh once it settles,
            // ScrollTrigger can lock in stale start/end offsets, which makes
            // the pinned counter and card stagger fire at the wrong scroll
            // positions (or not at all) on first load.
            onAnimationComplete={() => ScrollTrigger.refresh()}
          >
            <MainApp onBack={() => setShowLanding(true)} initialHours={initialHours} />
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

// ─────────────────────────────────────────────
// MainApp
// ─────────────────────────────────────────────

function MainApp({ onBack, initialHours }: { onBack: () => void; initialHours?: number }) {
  // Form state
  const [goal, setGoal] = useState("");
  const [availableHours, setAvailableHours] = useState<number | "">(initialHours ?? "");
  const [progress, setProgress] = useState<number>(0);
  const [requiredHours, setRequiredHours] = useState<number | "">("");
  const [featuresText, setFeaturesText] = useState("");

  // Live UTC clock + deadline countdown
  const [utcTime, setUtcTime] = useState("");
  const [deadlineCountdown, setDeadlineCountdown] = useState("");
  React.useEffect(() => {
    const startMs = Date.now();
    const deadlineMs = typeof availableHours === "number" && availableHours > 0
      ? startMs + availableHours * 3600 * 1000
      : null;

    const update = () => {
      const now = new Date();
      setUtcTime(
        `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`
      );
      if (deadlineMs) {
        const remaining = Math.max(0, deadlineMs - Date.now());
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setDeadlineCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  // Only restart the deadline timer when availableHours changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableHours]);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfReading, setPdfReading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent states
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResponse | null>(null);

  const [survivalLoading, setSurvivalLoading] = useState(false);
  const [survivalLoadingStepIdx, setSurvivalLoadingStepIdx] = useState(0);
  const [survivalError, setSurvivalError] = useState<string | null>(null);
  const [survivalResult, setSurvivalResult] = useState<SurvivalResponse | null>(null);

  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueLoadingStepIdx, setRescueLoadingStepIdx] = useState(0);
  const [rescueError, setRescueError] = useState<string | null>(null);
  const [rescueResult, setRescueResult] = useState<RescueResponse | null>(null);

  const [simLoading, setSimLoading] = useState(false);
  const [simLoadingStepIdx, setSimLoadingStepIdx] = useState(0);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  const stepIntervalRef = useRef<any>(null);

  const calcAvailable = typeof availableHours === "number" ? availableHours : 0;
  const calcRequired = typeof requiredHours === "number" ? requiredHours : 0;
  const localDeficit = calcRequired - calcAvailable;

  // ── PDF handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    processPdfFile(f);
  };
  const processPdfFile = (file: File) => {
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a file under 10MB.`);
      return;
    }
    setError(null); setPdfFile(file); setPdfBase64(null); setPdfReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPdfBase64(reader.result);
      setPdfReading(false);
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded PDF file.");
      setPdfReading(false);
    };
    reader.readAsDataURL(file);
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF content is accepted."); return; }
    processPdfFile(f);
  };
  const removeFile = () => {
    setPdfFile(null); setPdfBase64(null); setPdfReading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setGoal(preset.goal); setAvailableHours(preset.availableHours);
    setRequiredHours(preset.requiredHours); setProgress(preset.progress);
    setFeaturesText(preset.features); setError(null); setResult(null);
    setSurvivalResult(null); setSurvivalError(null);
    setRescueResult(null); setRescueError(null);
    setSimResult(null); setSimError(null);
  };

  // ── Agent 1: Diagnose ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) { setError("Please describe your goal first."); return; }
    if (availableHours === "" || availableHours < 0) { setError("Please enter positive hours remaining."); return; }
    if (requiredHours === "" || requiredHours < 0) { setError("Please specify estimated work remaining."); return; }
    if (pdfReading) { setError("Still reading your PDF — please wait a moment and try again."); return; }

    setLoading(true); setError(null); setResult(null);
    setSurvivalResult(null); setSurvivalError(null);
    setRescueResult(null); setRescueError(null);
    setSimResult(null); setSimError(null);
    setLoadingStepIdx(0);

    stepIntervalRef.current = setInterval(
      () => setLoadingStepIdx((p) => (p + 1) % LOADING_STEPS.length), 1200
    );

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, availableHours, requiredHours, progress, pdfData: pdfBase64 }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Server error ${res.status}`); }
      setResult(await res.json());
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while diagnosing your crisis.");
    } finally {
      setLoading(false); clearInterval(stepIntervalRef.current);
    }
  };

  // ── Agent 2: Survival Version ──
  const handleGenerateSurvival = async () => {
    if (!featuresText.trim()) { setSurvivalError("Please enter your feature list first."); return; }
    setSurvivalLoading(true); setSurvivalError(null); setSurvivalResult(null);
    setSurvivalLoadingStepIdx(0); setRescueResult(null); setRescueError(null);
    setSimResult(null); setSimError(null);

    const interval = setInterval(() => setSurvivalLoadingStepIdx((p) => (p + 1) % SURVIVAL_LOADING_STEPS.length), 1200);
    try {
      const res = await fetch("/api/survival-version", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, availableHours, requiredHours, progress,
          risk_level: result?.risk_level, failure_causes: result?.failure_causes,
          features: featuresText, pdfData: pdfBase64,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Triage error ${res.status}`); }
      setSurvivalResult(await res.json());
    } catch (err: any) {
      setSurvivalError(err?.message || "Failed to generate survival triage version.");
    } finally {
      setSurvivalLoading(false); clearInterval(interval);
    }
  };

  // ── Agent 3: Rescue Plan ──
  const handleGenerateRescuePlan = async () => {
    if (!survivalResult) return;
    setRescueLoading(true); setRescueError(null); setRescueResult(null);
    setRescueLoadingStepIdx(0); setSimResult(null); setSimError(null);

    const interval = setInterval(() => setRescueLoadingStepIdx((p) => (p + 1) % RESCUE_LOADING_STEPS.length), 1200);
    try {
      const res = await fetch("/api/rescue-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, availableHours, requiredHours, progress,
          risk_level: result?.risk_level, failure_causes: result?.failure_causes,
          keep: survivalResult.keep, success_chance_after: survivalResult.success_chance_after,
          pdfData: pdfBase64,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Rescue error ${res.status}`); }
      setRescueResult(await res.json());
    } catch (err: any) {
      setRescueError(err?.message || "Failed to generate rescue plan.");
    } finally {
      setRescueLoading(false); clearInterval(interval);
    }
  };

  // ── Agent 4: Simulation Engine ──
  const handleRunSimulation = async () => {
    if (!rescueResult) return;
    setSimLoading(true); setSimError(null); setSimResult(null); setSimLoadingStepIdx(0);

    const interval = setInterval(() => setSimLoadingStepIdx((p) => (p + 1) % SIMULATION_LOADING_STEPS.length), 1200);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, availableHours, requiredHours, progress,
          risk_level: result?.risk_level, failure_causes: result?.failure_causes,
          keep: survivalResult?.keep, success_chance_after: survivalResult?.success_chance_after,
          blocks: rescueResult.blocks,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Simulation error ${res.status}`); }
      setSimResult(await res.json());
    } catch (err: any) {
      setSimError(err?.message || "Failed to run simulation.");
    } finally {
      setSimLoading(false); clearInterval(interval);
    }
  };

  const getRiskColors = (risk: string) => {
    const map: Record<string, any> = {
      Critical: { textColor: "text-red-400", bgColor: "bg-red-950/60", borderColor: "border-red-500/50", accentColor: "bg-red-500" },
      High: { textColor: "text-amber-400", bgColor: "bg-amber-950/60", borderColor: "border-amber-500/50", accentColor: "bg-amber-500" },
      Moderate: { textColor: "text-yellow-400", bgColor: "bg-yellow-950/60", borderColor: "border-yellow-500/50", accentColor: "bg-yellow-500" },
      Low: { textColor: "text-emerald-400", bgColor: "bg-emerald-950/60", borderColor: "border-emerald-500/50", accentColor: "bg-emerald-500" },
    };
    return map[risk] || { textColor: "text-zinc-400", bgColor: "bg-zinc-950/60", borderColor: "border-zinc-500/50", accentColor: "bg-zinc-500" };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500 selection:text-white">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-900/8 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-orange-950/8 rounded-full blur-[130px] pointer-events-none z-0" />

      <div className="relative z-10">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={onBack}
                className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                ← <span className="hidden sm:inline">Back</span>
              </button>
              <div className="w-px h-4 bg-zinc-800 flex-shrink-0" />
              <div className="p-1.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg shadow-lg shadow-red-500/20 flex-shrink-0">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 via-orange-400 to-amber-200 bg-clip-text text-transparent flex-shrink-0">
                Phoenix
              </h1>
              <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/30 bg-red-950/40 text-red-400 truncate">
                Crisis Recovery Agent
              </span>
            </div>
            <div className="text-right">
              {deadlineCountdown ? (
                <div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-red-400 tabular-nums">{deadlineCountdown}</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-wider mt-0.5">until deadline</div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-zinc-600 font-mono">UTC {utcTime || "—"}</div>
                  <div className="text-[9px] text-zinc-700 font-mono">Gemini Tunnel Active</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Agent showcase section (Stickygrid-inspired) ── */}
        <AgentsShowcase />

        {/* ── Divider ── */}
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-600 uppercase">Run Your Crisis Recovery</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-10">

          {/* Presets */}
          <section className="mb-8">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Select a crisis scenario preset</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESETS.map((p, idx) => (
                <button key={idx} type="button" onClick={() => applyPreset(p)}
                  className={`text-left border p-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    (p as any).badge
                      ? "bg-red-950/30 hover:bg-red-950/50 border-red-500/40 hover:border-red-400/60"
                      : "bg-zinc-900/50 hover:bg-zinc-800/70 border-zinc-800 hover:border-zinc-700"
                  }`}>
                  <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    (p as any).badge
                      ? "bg-gradient-to-r from-red-500/0 via-red-400 to-red-500/0"
                      : "bg-gradient-to-r from-red-500/0 via-red-500/60 to-red-500/0"
                  }`} />
                  {(p as any).badge && (
                    <span className="absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-wider">
                      You're here
                    </span>
                  )}
                  <h3 className={`text-[10px] font-mono mb-1 transition-colors uppercase tracking-wider ${
                    (p as any).badge ? "text-red-400 group-hover:text-red-300" : "text-zinc-600 group-hover:text-orange-400"
                  }`}>{p.title}</h3>
                  <p className="text-sm font-medium text-zinc-300 line-clamp-1">{p.goal}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600 font-mono">
                    <span>{p.availableHours}h left</span>
                    <span className="text-zinc-800">·</span>
                    <span>{p.progress}% done</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Form + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Main Form */}
            <main className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 h-0.5 w-[120px]" />
              <h2 className="text-base font-semibold font-mono mb-5 text-zinc-200 tracking-tight">
                Crisis Inputs
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                    Goal / Output Expected
                  </label>
                  <div className="relative">
                    <input type="text" required maxLength={140} value={goal} onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Build Hackathon Project, CS204 Lab, VC Pitch deck"
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/60 rounded-lg py-2.5 pl-3 pr-14 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-colors" />
                    <div className="absolute right-3 top-2.5 text-zinc-700 text-[10px] font-mono">{goal.length}/140</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /><span>Hours remaining</span>
                    </label>
                    <input type="number" min="1" max="1000" required value={availableHours}
                      onChange={(e) => setAvailableHours(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Hours left until deadline"
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/60 rounded-lg py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1">
                      <Hourglass className="w-3.5 h-3.5" /><span>Hours of work left</span>
                    </label>
                    <input type="number" min="1" max="1000" required value={requiredHours}
                      onChange={(e) => setRequiredHours(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Estimated hours required"
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/60 rounded-lg py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">% complete so far</label>
                    <span className="text-sm font-mono font-bold text-orange-400">{progress}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none" />
                  <div className="flex justify-between text-[9px] text-zinc-700 mt-1.5 font-mono">
                    <span>JUST STARTING</span><span>HALF WAY</span><span>ALMOST DONE</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                    Upload problem statement (PDF, optional)
                  </label>
                  <div
                    onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center cursor-pointer ${
                      pdfFile ? "border-emerald-500/40 bg-emerald-950/10"
                        : dragActive ? "border-red-500 bg-red-950/15"
                        : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/30"
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                    {pdfFile ? (
                      <div className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded border border-zinc-800/60" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-left min-w-0">
                          <div className="flex-shrink-0 p-1.5 bg-red-950/60 text-red-400 rounded">
                            {pdfReading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-300 truncate">{pdfFile.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {pdfReading ? "Reading file…" : `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · ready`}
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={removeFile} className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2">
                        <Upload className={`w-7 h-7 mb-2 transition-colors ${dragActive ? "text-red-400" : "text-zinc-600"}`} />
                        <p className="text-xs text-zinc-500">Drop PDF here, or <span className="text-red-400 font-semibold">browse</span></p>
                        <p className="text-[10px] text-zinc-700 mt-1 font-mono">PDF only · up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {result && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-800/65 pt-5 mt-5 text-left">
                      <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-orange-400 mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /><span>List your planned features (one per line)</span>
                      </label>
                      <textarea rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)}
                        placeholder={"User Auth\nDashboard\nUpload\nAnalytics"}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-orange-500/60 rounded-xl py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-colors font-mono leading-relaxed" />
                      <p className="text-[10px] text-zinc-600 mt-1.5">The Survival Agent will triage this list to only what you can actually ship.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading || pdfReading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg active:scale-[0.98] transition-all duration-150 text-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /><span className="font-mono tracking-wide text-xs">{LOADING_STEPS[loadingStepIdx]}</span></>
                  ) : (
                    <><Flame className="w-4 h-4 group-hover:scale-125 transition-transform" /><span>Diagnose My Crisis</span><ChevronRight className="w-4 h-4" /></>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                </button>
              </form>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-5 space-y-4">
              <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-4 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <Compass className="w-4 h-4 text-orange-400" /><span>Deterministic Deficit Calculator</span>
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-center">
                      <span className="block text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Available</span>
                      <span className="text-xl font-bold text-zinc-200">{availableHours !== "" ? `${availableHours}h` : "--"}</span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-center">
                      <span className="block text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Required</span>
                      <span className="text-xl font-bold text-zinc-200">{requiredHours !== "" ? `${requiredHours}h` : "--"}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-left">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Deficit Outcome</span>
                      <span className="text-[9px] font-mono bg-zinc-900 text-zinc-600 px-1.5 py-0.5 rounded">JS Computed</span>
                    </div>
                    {availableHours === "" || requiredHours === "" ? (
                      <div className="text-sm text-zinc-600 italic py-2">Enter metrics to compute deficit.</div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-4xl font-extrabold leading-none tracking-tight ${localDeficit > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {localDeficit > 0 ? `+${localDeficit}` : localDeficit}
                          </span>
                          <span className="text-sm text-zinc-500 font-mono">hours</span>
                        </div>
                        {localDeficit > 0 ? (
                          <div className="mt-3 flex items-start gap-2 text-xs text-red-400/90 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                            <div>
                              <p className="font-semibold">Severe hour deficit</p>
                              <p className="text-zinc-500 text-[11px] mt-0.5">Short by {localDeficit}h — scope cutting required.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-start gap-2 text-xs text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-lg">
                            <Zap className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                            <div>
                              <p className="font-semibold">Mathematically feasible</p>
                              <p className="text-zinc-500 text-[11px] mt-0.5">Surplus of {Math.abs(localDeficit)}h. Stay focused.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900/10 border border-zinc-900 p-4 rounded-2xl flex items-start gap-2.5 text-left">
                <Info className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-600 leading-normal">
                  <span className="font-semibold text-zinc-500">Survival Triage:</span> Phoenix generates immediate diagnostic summaries to identify critical bottlenecks. Fill in realistic figures to unlock recovery tactics.
                </div>
              </div>
            </aside>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="mt-6 bg-red-950/80 border border-red-500/40 text-red-200 p-4 rounded-xl flex items-start gap-3 shadow-xl text-left">
                <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold mb-1">System Exception Raised</h4>
                  <p className="text-sm text-red-300 break-words">{error}</p>
                </div>
                <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-100 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Panel */}
          <AnimatePresence>
            {result && (
              <motion.section initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="mt-10 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left">
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl ${getRiskColors(result.risk_level).accentColor}`} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-5 pl-2">
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Agent 01 — Diagnosis Generated</div>
                    <h3 className="text-xl font-bold text-zinc-100">Crisis recovery analysis for &ldquo;{goal}&rdquo;</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${getRiskColors(result.risk_level).bgColor} ${getRiskColors(result.risk_level).borderColor} ${getRiskColors(result.risk_level).textColor}`}>
                      <span className={`w-2 h-2 rounded-full ${getRiskColors(result.risk_level).accentColor} animate-pulse`} />
                      {result.risk_level} Risk
                    </div>
                  </div>
                </div>

                {result.note && (
                  <div className="flex items-start gap-2.5 bg-amber-950/25 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-mono mb-6 pl-2 ml-2">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div><span className="font-bold uppercase tracking-wider block mb-0.5">⚡ Heuristic Recovery Active</span><span>{result.note}</span></div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pl-2">
                  {[
                    { label: "Available hours", value: result.availableHours, unit: "h", color: "text-zinc-100" },
                    { label: "Required estimate", value: result.requiredHours, unit: "h", color: "text-zinc-100" },
                    { label: "Work hour gap", value: result.deficit > 0 ? `+${result.deficit}` : result.deficit, unit: "h", color: result.deficit > 0 ? "text-red-500" : "text-emerald-500" },
                  ].map((m, i) => (
                    <div key={i} className="bg-zinc-950/55 border border-zinc-800/40 p-4 rounded-xl">
                      <span className="block text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">{m.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-extrabold ${m.color}`}>{m.value}</span>
                        <span className="text-xs font-mono text-zinc-500">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/60 pl-6 relative mb-6">
                  <div className="absolute top-0 bottom-0 left-0 bg-orange-500/20 w-1 rounded-l" />
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold mb-3">Most Likely Failure Causes</h4>
                  <ul className="space-y-3">
                    {result.failure_causes.map((cause, idx) => (
                      <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                        className="text-sm text-zinc-300 leading-relaxed flex items-start gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span>{cause}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Agent 2 trigger */}
                <div className="border-t border-zinc-800/60 pt-6 pl-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-orange-950 rounded-lg"><Compass className="w-4 h-4 text-orange-400" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">Survival Version Generator</h4>
                      <p className="text-[11px] text-zinc-600">Agent 02 — triages your feature list into essential keeps and cuts.</p>
                    </div>
                  </div>
                  {!survivalResult && !survivalLoading && (
                    <button type="button" onClick={handleGenerateSurvival}
                      className="w-full bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 text-zinc-100 font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]">
                      <Zap className="w-4 h-4 text-amber-400" /><span>Generate Survival Version</span>
                    </button>
                  )}
                  {survivalLoading && (
                    <div className="w-full bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                      <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                      <span className="text-xs font-mono text-zinc-400">{SURVIVAL_LOADING_STEPS[survivalLoadingStepIdx]}</span>
                    </div>
                  )}
                  {survivalError && (
                    <div className="mt-3 bg-red-950/40 border border-red-500/20 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{survivalError}</span>
                    </div>
                  )}
                </div>

                {/* Agent 2 results */}
                <AnimatePresence>
                  {survivalResult && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      className="border-t border-zinc-800/60 pt-6 mt-6 pl-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-base font-bold text-zinc-100">Emergency Survival Architecture</h4>
                      </div>
                      {survivalResult.note && (
                        <div className="flex items-start gap-2.5 bg-amber-950/25 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-mono mb-4">
                          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div><span className="font-bold block mb-0.5">⚡ Heuristic Recovery Active</span><span>{survivalResult.note}</span></div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-950/40 border border-emerald-500/20 p-4 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 w-1" />
                          <h5 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /><span>Keep / Core Deliverables</span>
                          </h5>
                          <ul className="space-y-2">
                            {survivalResult.keep.map((f, i) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">✓</span><span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-zinc-950/40 border border-red-500/20 p-4 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-0 bg-red-500 w-1" />
                          <h5 className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold mb-3">Cut / Defer to v2</h5>
                          <ul className="space-y-2">
                            {survivalResult.cut.map((f, i) => (
                              <li key={i} className="text-xs text-zinc-400/80 flex items-start gap-2 line-through decoration-red-500/40">
                                <span className="text-red-500/80 font-bold">✕</span><span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <AnimatedChance before={survivalResult.success_chance_before} after={survivalResult.success_chance_after} />

                      {/* Agent 3 trigger */}
                      <div className="border-t border-zinc-800/60 pt-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 bg-blue-950 rounded-lg"><Compass className="w-4 h-4 text-blue-400" /></div>
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-100">Rescue Planner</h4>
                            <p className="text-[11px] text-zinc-600">Agent 03 — maps survival features into an hour-by-hour execution schedule.</p>
                          </div>
                        </div>
                        {!rescueResult && !rescueLoading && (
                          <button type="button" onClick={handleGenerateRescuePlan}
                            className="w-full bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 text-zinc-100 font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]">
                            <Zap className="w-4 h-4 text-blue-400" /><span>Generate Rescue Plan</span>
                          </button>
                        )}
                        {rescueLoading && (
                          <div className="w-full bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span className="text-xs font-mono text-zinc-400">{RESCUE_LOADING_STEPS[rescueLoadingStepIdx]}</span>
                          </div>
                        )}
                        {rescueError && (
                          <div className="mt-3 bg-red-950/40 border border-red-500/20 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{rescueError}</span>
                          </div>
                        )}

                        {/* Agent 3 results */}
                        <AnimatePresence>
                          {rescueResult && (
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-6">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                  Hour-by-Hour Execution Timeline
                                </h5>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Total: <strong className="text-zinc-300">{rescueResult.total_hours_planned}h</strong>
                                </span>
                              </div>
                              {rescueResult.note && (
                                <div className="flex items-start gap-2.5 bg-amber-950/25 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-mono">
                                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div><span className="font-bold block mb-0.5">⚡ Heuristic Recovery Active</span><span>{rescueResult.note}</span></div>
                                </div>
                              )}
                              <div className="relative pl-4 border-l border-zinc-800 space-y-3">
                                {rescueResult.blocks.map((block, idx) => {
                                  const typeMap: Record<string, { border: string; badge: string; Icon: any }> = {
                                    build: { border: "border-l-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", Icon: Wrench },
                                    test: { border: "border-l-yellow-500", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", Icon: CheckSquare },
                                    deploy: { border: "border-l-green-500", badge: "bg-green-500/10 text-green-400 border-green-500/20", Icon: Rocket },
                                    pitch: { border: "border-l-orange-500", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", Icon: Presentation },
                                  };
                                  const t = typeMap[block.type] || typeMap.build;
                                  return (
                                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                                      className={`relative bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl border-l-4 ${t.border}`}>
                                      <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-zinc-700" />
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono font-bold text-zinc-500">{block.hour_range}</span>
                                        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${t.badge} flex items-center gap-1`}>
                                          <t.Icon className="w-3 h-3" /><span>{block.type}</span>
                                        </span>
                                      </div>
                                      <p className="text-xs text-zinc-300 leading-relaxed">{block.task}</p>
                                    </motion.div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 font-mono">Allocation Efficiency</span>
                                {rescueResult.buffer_hours > 0 ? (
                                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                    {rescueResult.buffer_hours}h buffer — use for testing
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                                    No buffer — execute exactly as planned
                                  </span>
                                )}
                              </div>

                              {/* Agent 4 trigger */}
                              <div className="border-t border-zinc-800/60 pt-6 mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="p-1.5 bg-violet-950 rounded-lg"><GitBranch className="w-4 h-4 text-violet-400" /></div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-zinc-100">Simulation Engine</h4>
                                    <p className="text-[11px] text-zinc-600">Agent 04 — simulates two parallel futures side by side.</p>
                                  </div>
                                </div>
                                {!simResult && !simLoading && (
                                  <button type="button" onClick={handleRunSimulation}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 text-zinc-100 font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]">
                                    <GitBranch className="w-4 h-4 text-violet-400" /><span>Run Simulation</span>
                                  </button>
                                )}
                                {simLoading && (
                                  <div className="w-full bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                                    <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                                    <span className="text-xs font-mono text-zinc-400">{SIMULATION_LOADING_STEPS[simLoadingStepIdx]}</span>
                                  </div>
                                )}
                                {simError && (
                                  <div className="mt-3 bg-red-950/40 border border-red-500/20 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{simError}</span>
                                  </div>
                                )}
                                <AnimatePresence>
                                  {simResult && (
                                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                      <SimulationEngine data={simResult} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <footer className="text-center text-[10px] text-zinc-700 font-mono tracking-wide py-10 border-t border-zinc-900">
          Phoenix — Deadline Trauma Operations Center · Gemini Powered · Stay sharp, move fast.
        </footer>
      </div>
    </div>
  );
}