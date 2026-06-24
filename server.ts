import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Increase payload limit to support base64 PDFs
  app.use(express.json({ limit: "20mb" }));

  // Initialize Gemini client lazily/safely
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // Shared helpers
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Removed gemini-1.5-flash, which is being phased out by Google and was
  // adding a guaranteed-fail hop (and its retry/backoff delay) to every request.
  const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"];

  // Per-call timeout (ms). Without this, a hung request can block the whole
  // model+retry chain for a long time before the heuristic fallback ever runs.
  const CALL_TIMEOUT_MS = 15000;

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      promise
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  async function callGemini(contents: any[], config: any): Promise<string> {
    for (const modelName of MODELS) {
      // Reduced from 3 to 2 attempts per model — the heuristic fallback is solid,
      // so there's no need to make users wait through a long retry chain.
      let attempts = 2;
      while (attempts > 0) {
        try {
          const response = await withTimeout(
            ai!.models.generateContent({ model: modelName, contents, config }),
            CALL_TIMEOUT_MS
          );
          if (response?.text) {
            console.log(`[Phoenix] Served by model: ${modelName}`);
            return response.text;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed (attempt ${3 - attempts}/2):`, err?.message || err);
          const isTemporary =
            err?.status === 503 ||
            err?.status === 429 ||
            String(err).includes("503") ||
            String(err).includes("demand") ||
            String(err).includes("UNAVAILABLE") ||
            String(err).includes("Timed out");
          if (!isTemporary) break;
          attempts--;
          if (attempts > 0) await sleep((3 - attempts) * 750);
        }
      }
    }
    return "";
  }

  // ─────────────────────────────────────────────
  // Endpoint: Diagnose Crisis (Agent 1)
  // ─────────────────────────────────────────────
  app.post("/api/diagnose", async (req, res) => {
    try {
      const { goal, availableHours, requiredHours, progress, pdfData } = req.body;

      if (!goal) return res.status(400).json({ error: "Goal is required." });
      if (availableHours === undefined || requiredHours === undefined || progress === undefined)
        return res.status(400).json({ error: "Missing required numeric fields." });

      const parsedAvailable = Number(availableHours);
      const parsedRequired = Number(requiredHours);
      const parsedProgress = Number(progress);
      const deficit = parsedRequired - parsedAvailable;

      if (!ai) return res.status(500).json({ error: "Gemini API Key is not configured." });

      const contents: any[] = [];

      if (pdfData && typeof pdfData === "string") {
        const base64Part = pdfData.includes(";base64,") ? pdfData.split(";base64,")[1] : pdfData;
        contents.push({ inlineData: { data: base64Part, mimeType: "application/pdf" } });
        console.log(`[Phoenix] /api/diagnose — PDF attached (${(base64Part.length / 1024).toFixed(0)}KB base64)`);
      } else {
        console.log("[Phoenix] /api/diagnose — no PDF attached, text-only request");
      }

      contents.push(`
You are the Phoenix Crisis Recovery Agent, designed for high-stress, last-minute deadline situations.
Evaluate the current project status:
- Goal: "${goal}"
- Available Hours until Deadline: ${parsedAvailable} hours
- Required Hours of Work Left: ${parsedRequired} hours
- Hour Deficit: ${deficit} hours (Deficit = Required Hours - Available Hours)
- Progress Made: ${parsedProgress}%

Conduct a realistic, blunt, and highly tailored analysis of this deadline crisis.
Determine:
1. The overall risk level ("Critical", "High", "Moderate", or "Low"). If they are in a deficit, risk should generally be "High" or "Critical".
2. The top 3 most likely failure causes for this exact context. Keep them direct, practical, and highly relevant.

Return ONLY valid JSON:
{ "risk_level": "Critical"|"High"|"Moderate"|"Low", "failure_causes": ["string","string","string"] }
`);

      const responseText = await callGemini(contents, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_level: { type: Type.STRING, enum: ["Critical", "High", "Moderate", "Low"] },
            failure_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["risk_level", "failure_causes"],
        },
      });

      let result;
      if (responseText) {
        result = JSON.parse(responseText.trim());
      } else {
        console.warn("All models failed for /api/diagnose — using heuristic fallback.");
        let calculatedRisk: "Critical" | "High" | "Moderate" | "Low" = "Low";
        if (deficit > 5) calculatedRisk = "Critical";
        else if (deficit > 0) calculatedRisk = "High";
        else if (deficit > -5) calculatedRisk = "Moderate";
        result = {
          risk_level: calculatedRisk,
          failure_causes: [
            `Severe time shortage: You are short by ${deficit > 0 ? deficit : 0} hours relative to estimated workload.`,
            `High risk of feature creep given the low progress state (${parsedProgress}%).`,
            "Potential productivity fatigue or delay in execution start.",
          ],
          note: "Generated via local heuristic recovery engine due to temporary high demand on Gemini.",
        };
      }

      res.json({ ...result, deficit, availableHours: parsedAvailable, requiredHours: parsedRequired });
    } catch (error: any) {
      console.error("Diagnosis error:", error);
      res.status(500).json({ error: error?.message || "An unexpected error occurred during diagnosis." });
    }
  });

  // ─────────────────────────────────────────────
  // Endpoint: Survival Version Generator (Agent 2)
  // ─────────────────────────────────────────────
  app.post("/api/survival-version", async (req, res) => {
    try {
      const { goal, availableHours, requiredHours, progress, risk_level, failure_causes, features, pdfData } = req.body;

      if (!goal || !features) return res.status(400).json({ error: "Goal and feature list are required." });
      if (availableHours === undefined || requiredHours === undefined)
        return res.status(400).json({ error: "Missing required numeric fields." });

      const parsedAvailable = Number(availableHours);
      const parsedRequired = Number(requiredHours);
      const parsedProgress = progress !== undefined ? Number(progress) : null;

      let featureList: string[] = Array.isArray(features)
        ? features
        : features.split("\n").map((f: string) => f.trim()).filter(Boolean);

      if (featureList.length === 0)
        return res.status(400).json({ error: "Please list at least one feature to triage." });

      if (!ai) return res.status(500).json({ error: "Gemini API Key is not configured." });

      const contents: any[] = [];

      if (pdfData && typeof pdfData === "string") {
        const base64Part = pdfData.includes(";base64,") ? pdfData.split(";base64,")[1] : pdfData;
        contents.push({ inlineData: { data: base64Part, mimeType: "application/pdf" } });
        console.log(`[Phoenix] /api/survival-version — PDF attached (${(base64Part.length / 1024).toFixed(0)}KB base64)`);
      } else {
        console.log("[Phoenix] /api/survival-version — no PDF attached, text-only request");
      }

      contents.push(`
You are the Phoenix Survival Version Generator, an elite triage agent for high-stress deadlines.
Crisis context:
- Goal: "${goal}"
- Available Hours: ${parsedAvailable} | Required Hours: ${parsedRequired}
- Progress Made So Far: ${parsedProgress !== null ? `${parsedProgress}%` : "Unknown"}
- Risk Level: ${risk_level || "Unknown"}
- Failure Causes: ${JSON.stringify(failure_causes || [])}

Planned features:
${featureList.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Split into "keep" (essential to a working demo) and "cut" (safe to remove).
Estimate success_chance_before (0-100) and success_chance_after (0-100, should be significantly higher).
Keep should be 40-60% of original features unless extreme deficit justifies less.
If progress made so far is already high, weigh that in favor of keeping more features.

Return ONLY valid JSON:
{ "keep": ["string"], "cut": ["string"], "success_chance_before": number, "success_chance_after": number }
`);

      const responseText = await callGemini(contents, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keep: { type: Type.ARRAY, items: { type: Type.STRING } },
            cut: { type: Type.ARRAY, items: { type: Type.STRING } },
            success_chance_before: { type: Type.INTEGER },
            success_chance_after: { type: Type.INTEGER },
          },
          required: ["keep", "cut", "success_chance_before", "success_chance_after"],
        },
      });

      let result;
      if (responseText) {
        result = JSON.parse(responseText.trim());
      } else {
        console.warn("All models failed for /api/survival-version — using heuristic fallback.");
        const halfLength = Math.max(1, Math.floor(featureList.length / 2));
        const diff = parsedRequired - parsedAvailable;
        let success_chance_before = diff > 10 ? 10 : diff > 5 ? 25 : diff > 0 ? 40 : 80;
        result = {
          keep: featureList.slice(0, halfLength),
          cut: featureList.slice(halfLength),
          success_chance_before,
          success_chance_after: Math.min(95, success_chance_before + 45),
          note: "Calculated via fallback heuristic recovery.",
        };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Survival Version error:", error);
      res.status(500).json({ error: error?.message || "An unexpected error occurred during triage." });
    }
  });

  // ─────────────────────────────────────────────
  // Endpoint: Rescue Planner (Agent 3)
  // ─────────────────────────────────────────────
  app.post("/api/rescue-plan", async (req, res) => {
    try {
      const { goal, availableHours, requiredHours, progress, risk_level, failure_causes, keep, success_chance_after, pdfData } = req.body;

      if (!goal || !keep) return res.status(400).json({ error: "Goal and triage features are required." });

      const parsedAvailable = Math.max(1, Number(availableHours) || 0);
      const parsedRequired = Math.max(1, Number(requiredHours) || 0);
      const parsedProgress = progress !== undefined ? Number(progress) : null;
      const keepList: string[] = Array.isArray(keep) ? keep : ["Core MVP Demonstration"];

      if (!ai) return res.status(500).json({ error: "Gemini API Key is not configured." });

      const contents: any[] = [];

      if (pdfData && typeof pdfData === "string") {
        const base64Part = pdfData.includes(";base64,") ? pdfData.split(";base64,")[1] : pdfData;
        contents.push({ inlineData: { data: base64Part, mimeType: "application/pdf" } });
        console.log(`[Phoenix] /api/rescue-plan — PDF attached (${(base64Part.length / 1024).toFixed(0)}KB base64)`);
      } else {
        console.log("[Phoenix] /api/rescue-plan — no PDF attached, text-only request");
      }

      contents.push(`
You are the Phoenix Rescue Planner, an expert disaster-recovery PM for high-stakes software deadlines.
Goal: "${goal}" | Available: ${parsedAvailable}h | Required: ${parsedRequired}h
Progress Made So Far: ${parsedProgress !== null ? `${parsedProgress}%` : "Unknown"}
Risk: ${risk_level || "Unknown"} | Failure Causes: ${JSON.stringify(failure_causes || [])}
Features to build (ONLY these): ${keepList.map(f => `- ${f}`).join("\n")}
Success chance after triage: ${success_chance_after || 50}%
${pdfData ? "\nA source document (assignment spec / problem statement) is attached above. Use its specific requirements, grading criteria, and constraints to make tasks concrete and accurate — reference exact requirement names where relevant instead of generic phrasing." : ""}

Generate a concrete hour-by-hour rescue plan. Rules:
1. Total blocks must NOT exceed ${parsedAvailable} hours.
2. Last block must be type "deploy" if this is a software/demo deliverable, or "test" as the final polish step if this is an assignment/document deliverable with no live demo or pitch involved.
3. Tasks must be specific 1-sentence actions (not vague like "work on frontend").
4. Only use features from the keep list above.
5. buffer_hours = ${parsedAvailable} - total_hours_planned (can be 0).

Return ONLY valid JSON:
{ "blocks": [{ "hour_range": "Hour 1-2", "task": "string", "type": "build"|"test"|"deploy"|"pitch" }], "total_hours_planned": number, "buffer_hours": number }
`);

      const responseText = await callGemini(contents, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hour_range: { type: Type.STRING },
                  task: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["hour_range", "task", "type"],
              },
            },
            total_hours_planned: { type: Type.INTEGER },
            buffer_hours: { type: Type.INTEGER },
          },
          required: ["blocks", "total_hours_planned", "buffer_hours"],
        },
      });

      let result;
      if (responseText) {
        result = JSON.parse(responseText.trim());
      } else {
        console.warn("All models failed for /api/rescue-plan — using heuristic fallback.");
        const total_hours_planned = parsedAvailable > 5 ? parsedAvailable - 1 : parsedAvailable;
        const buffer_hours = parsedAvailable - total_hours_planned;
        const deployType = parsedAvailable % 2 === 0 ? "deploy" : "pitch";
        const blocks: any[] = [];
        const mainHours = total_hours_planned - 1;
        if (mainHours > 0) {
          const half = Math.max(1, Math.floor(mainHours / 2));
          blocks.push({ hour_range: `Hour 1–${half}`, task: `Develop core interface and logic for ${keepList[0]}.`, type: "build" });
          if (mainHours > half) {
            blocks.push({ hour_range: `Hour ${half + 1}–${mainHours}`, task: `Test and validate ${keepList[1] || keepList[0]} functionality.`, type: "test" });
          }
        } else {
          // Very tight deficits (e.g. 1-2 available hours) still need at least one build block
          // before the final deploy/pitch block, otherwise the plan is just "deploy" with nothing built.
          blocks.push({ hour_range: "Hour 1", task: `Implement the bare minimum version of ${keepList[0]}.`, type: "build" });
        }
        blocks.push({ hour_range: `Hour ${total_hours_planned}`, task: "Deploy final build and run smoke tests.", type: deployType });
        result = { blocks, total_hours_planned, buffer_hours, note: "Calculated via fallback heuristic recovery." };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Rescue Planner error:", error);
      res.status(500).json({ error: error?.message || "An unexpected error occurred during planning." });
    }
  });

  // ─────────────────────────────────────────────
  // Endpoint: Simulation Engine (Agent 4)
  // ─────────────────────────────────────────────
  app.post("/api/simulate", async (req, res) => {
    try {
      const { goal, availableHours, requiredHours, progress, risk_level, failure_causes, keep, success_chance_after, blocks } = req.body;

      if (!goal) return res.status(400).json({ error: "Goal is required." });

      const parsedAvailable = Math.max(1, Number(availableHours) || 0);
      const parsedRequired = Math.max(1, Number(requiredHours) || 0);
      const parsedProgress = progress !== undefined ? Number(progress) : null;
      const keepList: string[] = Array.isArray(keep) ? keep : [];
      const blockList = Array.isArray(blocks) ? blocks : [];

      if (!ai) return res.status(500).json({ error: "Gemini API Key is not configured." });

      const contents: any[] = [`
You are the Phoenix Simulation Engine. Simulate two parallel futures for this deadline crisis.

Goal: "${goal}"
Available Hours: ${parsedAvailable} | Original Required Hours: ${parsedRequired}
Progress Made So Far: ${parsedProgress !== null ? `${parsedProgress}%` : "Unknown"}
Risk Level: ${risk_level || "High"}
Failure Causes: ${JSON.stringify(failure_causes || [])}
Survival Features (kept after triage): ${JSON.stringify(keepList)}
Rescue Plan: ${JSON.stringify(blockList)}
Success Chance After Triage: ${success_chance_after || 50}%

Generate TWO timelines of exactly 5 events each:

TIMELINE A — "Original Plan": What happens trying to build everything without triage. Must end in failure.
- Events escalate in severity: neutral → warning → failure
- Reference the actual goal and features specifically
- Last event MUST be type "failure"

TIMELINE B — "Phoenix Plan": What happens following the rescue plan exactly. Must end in success.
- Events escalate positively: neutral → milestone → success  
- Reference specific rescue plan actions
- Last event MUST be type "success"

All event hours must be within ${parsedAvailable} hours.

Return ONLY valid JSON:
{
  "timeline_a": [{ "hour": number, "event": "string", "type": "warning"|"failure"|"neutral" }],
  "timeline_b": [{ "hour": number, "event": "string", "type": "milestone"|"success"|"neutral" }],
  "outcome_a": "Failed Submission"|"Incomplete"|"Missed Deadline",
  "outcome_b": "Submitted"|"Delivered"|"MVP Complete"
}
`];

      const responseText = await callGemini(contents, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeline_a: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hour: { type: Type.NUMBER },
                  event: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["warning", "failure", "neutral"] },
                },
                required: ["hour", "event", "type"],
              },
            },
            timeline_b: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hour: { type: Type.NUMBER },
                  event: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["milestone", "success", "neutral"] },
                },
                required: ["hour", "event", "type"],
              },
            },
            outcome_a: { type: Type.STRING, enum: ["Failed Submission", "Incomplete", "Missed Deadline"] },
            outcome_b: { type: Type.STRING, enum: ["Submitted", "Delivered", "MVP Complete"] },
          },
          required: ["timeline_a", "timeline_b", "outcome_a", "outcome_b"],
        },
      });

      let result;
      if (responseText) {
        result = JSON.parse(responseText.trim());
      } else {
        console.warn("All models failed for /api/simulate — using heuristic fallback.");
        const h = parsedAvailable;
        result = {
          timeline_a: [
            { hour: Math.round(h * 0.1), event: `Started building all features for "${goal}" without any scope reduction.`, type: "neutral" },
            { hour: Math.round(h * 0.3), event: "Underestimated complexity — first major feature is already behind schedule.", type: "warning" },
            { hour: Math.round(h * 0.5), event: "Multiple blocked tasks and untested integrations piling up simultaneously.", type: "warning" },
            { hour: Math.round(h * 0.75), event: "Critical bugs discovered — no time left to fix and still ship everything.", type: "warning" },
            { hour: h, event: `Deadline reached with core functionality incomplete. Submission failed.`, type: "failure" },
          ],
          timeline_b: [
            { hour: Math.round(h * 0.1), event: `Focused execution begins on ${keepList[0] || "core feature"} only.`, type: "neutral" },
            { hour: Math.round(h * 0.3), event: `${keepList[0] || "Core feature"} complete and working as expected.`, type: "milestone" },
            { hour: Math.round(h * 0.55), event: "All survival features integrated — running targeted test suite.", type: "milestone" },
            { hour: Math.round(h * 0.8), event: "Tests passing. Build deployed to production environment successfully.", type: "milestone" },
            { hour: h, event: `"${goal}" submitted on time. Phoenix plan executed perfectly.`, type: "success" },
          ],
          outcome_a: "Failed Submission",
          outcome_b: "Submitted",
          note: "Calculated via fallback heuristic simulation.",
        };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: error?.message || "An unexpected error occurred during simulation." });
    }
  });

  // Serve static assets or mount Vite Dev Server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();