import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, Zap, Trophy, Clock, Wrench, Rocket, Presentation } from "lucide-react";

interface RescueBlock {
  hour_range: string;
  task: string;
  type: "build" | "test" | "deploy" | "pitch" | "write" | "review" | "format" | "submit" | "analyze" | "synthesize" | "cite" | "draft" | "design" | "rehearse" | "record" | "finalize" | "debug";
}

interface ChecklistTrackerProps {
  blocks: RescueBlock[];
  goal: string;
  sessionKey: string;
}

const TYPE_META: Record<string, { Icon: any; color: string; bg: string; border: string }> = {
  build: { Icon: Wrench, color: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-500/20" },
  test: { Icon: CheckSquare, color: "text-yellow-400", bg: "bg-yellow-950/20", border: "border-yellow-500/20" },
  deploy: { Icon: Rocket, color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-500/20" },
  pitch: { Icon: Presentation, color: "text-orange-400", bg: "bg-orange-950/20", border: "border-orange-500/20" },
};

export default function ChecklistTracker({ blocks, goal, sessionKey }: ChecklistTrackerProps) {
  const storageKey = `phoenix-checklist-${sessionKey}`;

  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === blocks.length) return parsed;
      }
    } catch {}
    return new Array(blocks.length).fill(false);
  });

  const [justChecked, setJustChecked] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {}
  }, [checked, storageKey]);

  const doneCount = checked.filter(Boolean).length;
  const totalCount = blocks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount;

  useEffect(() => {
    if (allDone && totalCount > 0) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, totalCount]);

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
    if (!checked[idx]) {
      setJustChecked(idx);
      setTimeout(() => setJustChecked(null), 600);
    }
  };

  const reset = () => {
    setChecked(new Array(blocks.length).fill(false));
  };

  return (
    <div className="mt-6 bg-zinc-950/40 border border-zinc-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
            Live Execution Tracker
          </span>
          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {doneCount}/{totalCount}
          </span>
        </div>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            reset
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-zinc-600">Completion</span>
          <span className={`text-[10px] font-mono font-bold ${allDone ? "text-emerald-400" : "text-orange-400"}`}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Celebration banner */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-300">All blocks complete — you made it!</div>
                <div className="text-[10px] text-emerald-500/80 font-mono mt-0.5">"{goal}" — Phoenix plan executed.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocks */}
      <div className="px-4 pb-4 pt-3 space-y-2">
        {blocks.map((block, idx) => {
          const meta = TYPE_META[block.type] || TYPE_META.build;
          const Icon = meta.Icon;
          const done = checked[idx];
          const flash = justChecked === idx;

          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => toggle(idx)}
              animate={flash ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                done
                  ? "bg-emerald-950/15 border-emerald-500/20 opacity-70"
                  : `${meta.bg} ${meta.border} hover:brightness-110`
              }`}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                {done ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className={`w-4 h-4 ${meta.color}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-500">{block.hour_range}</span>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${meta.color} ${meta.bg} ${meta.border}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {block.type}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed transition-colors ${done ? "line-through text-zinc-600" : "text-zinc-300"}`}>
                  {block.task}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}