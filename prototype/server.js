const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const types = { ".html": "text/html; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
function readEnv() {
  const values = {};
  try {
    for (const line of fs.readFileSync(path.join(root, "..", ".env.local"), "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !match[1].startsWith("#")) values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  } catch {}
  return values;
}
function sendJson(res, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(body);
}
async function synthesize(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 20_000) return sendJson(res, 413, { error: "Request is too large." });
  }
  let input;
  try { input = JSON.parse(body); } catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }
  const voiceKey = input?.voice === "female" ? "ELEVENLABS_VOICE_ID_SARAH" : input?.voice === "male" ? "ELEVENLABS_VOICE_ID_RIVER" : null;
  const scenes = input?.scenes;
  if (!voiceKey || !Array.isArray(scenes) || scenes.length < 1 || scenes.length > 8 || scenes.some(s => typeof s !== "string" || !s.trim())) return sendJson(res, 400, { error: "Choose a voice and provide 1–8 non-empty scene narrations." });
  const text = scenes.join("\n\n");
  if (text.length > 5000) return sendJson(res, 413, { error: "Narration is too long for this prototype sample (maximum 5,000 characters)." });
  const env = readEnv();
  const apiKey = env.ELEVENLABS_API_KEY;
  const voiceId = env[voiceKey];
  if (!apiKey || !voiceId) return sendJson(res, 503, { error: "ElevenLabs is not configured. Add the API key and River/Sarah voice IDs to .env.local, then restart the server." });
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL || "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.95 } }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      let detail;
      try { detail = await response.json(); } catch {}
      const providerMessage = typeof detail?.detail?.message === "string" ? detail.detail.message : null;
      if (response.status === 402 && providerMessage) return sendJson(res, 502, { error: `ElevenLabs: ${providerMessage}` });
      return sendJson(res, 502, { error: providerMessage || `ElevenLabs returned HTTP ${response.status}. Check the API key, voice access, and account quota.` });
    }
    const result = await response.json();
    const alignment = result.alignment || result.normalized_alignment;
    if (typeof result.audio_base64 !== "string" || !alignment) return sendJson(res, 502, { error: "ElevenLabs response did not include audio and word timing." });
    return sendJson(res, 200, { audio: result.audio_base64, alignment, text, voice: input.voice });
  } catch {
    return sendJson(res, 502, { error: "Could not connect to ElevenLabs from this machine. Check network access and try again." });
  }
}
async function generatePlan(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 10_000) return sendJson(res, 413, { error: "Request is too large." });
  }
  let input;
  try { input = JSON.parse(body); } catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }
  const topic = typeof input?.topic === "string" ? input.topic.trim().slice(0, 180) : "";
  const notes = typeof input?.notes === "string" ? input.notes.trim().slice(0, 2000) : "";
  if (!topic) return sendJson(res, 400, { error: "Enter a topic before generating a storyboard." });
  const env = readEnv();
  if (!env.GEMINI_API_KEY) return sendJson(res, 503, { error: "Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the server." });
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      scenes: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, narration: { type: "string" },
      }, required: ["title", "narration"] } },
    },
    required: ["title", "scenes"],
  };
  const prompt = `Create a scientifically accurate, friendly short educational explainer for learners in India. Topic: ${JSON.stringify(topic)}. Teaching notes: ${JSON.stringify(notes || "Explain why gravity and elevation make the overall flow of a river move downstream, while bends may turn locally.")}. Return exactly four ordered scenes for a vertical motion-graphics video about rivers flowing downhill: (1) river source/headwaters, (2) gravity and elevation slope, (3) smaller streams joining, (4) river bends while its overall course descends. Total narration 105–145 words, conversational, clear spoken English. Do not invent statistics or cite sources. Keep each scene narration concise and self-contained. Do not write captions; the app will create timed spoken captions from the audio alignment.`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL || "gemini-3.8-flash")}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.4 } }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) return sendJson(res, 502, { error: `Gemini returned HTTP ${response.status}. Check the API key, model, and account quota.` });
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.find(part => typeof part.text === "string")?.text;
    if (!text) return sendJson(res, 502, { error: "Gemini returned no storyboard text." });
    let plan;
    try { plan = JSON.parse(text); } catch { return sendJson(res, 502, { error: "Gemini returned an invalid storyboard. Try again." }); }
    if (typeof plan.title !== "string" || !Array.isArray(plan.scenes) || plan.scenes.length !== 4 || plan.scenes.some(scene => !scene || ["title", "narration"].some(key => typeof scene[key] !== "string" || !scene[key].trim()))) return sendJson(res, 502, { error: "Gemini storyboard did not match the four-scene contract. Try again." });
    const wordCount = plan.scenes.reduce((sum, scene) => sum + scene.narration.trim().split(/\s+/).length, 0);
    if (wordCount < 70 || wordCount > 180) return sendJson(res, 502, { error: "Gemini returned a script outside the target length. Try again." });
    const components = ["River source", "Gravity slope", "Stream merge", "River meander"];
    return sendJson(res, 200, { title: plan.title.slice(0, 120), scenes: plan.scenes.map((scene, index) => ({ title: scene.title.slice(0, 100), caption: scene.narration.trim().split(/\s+/).slice(0, 6).join(" "), narration: scene.narration.slice(0, 1200), component: components[index] })), wordCount, model: env.GEMINI_MODEL || "gemini-3.8-flash" });
  } catch {
    return sendJson(res, 502, { error: "Could not connect to Gemini from this machine. Check network access and try again." });
  }
}
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  if (pathname === "/api/plan" && req.method === "POST") {
    generatePlan(req, res);
    return;
  }
  if (pathname === "/api/tts" && req.method === "POST") {
    synthesize(req, res);
    return;
  }
  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "API route not found." });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  const requested = pathname === "/" ? "/home.html" : pathname === "/demo" ? "/index.html" : pathname;
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(data);
  });
});
server.listen(4173, "127.0.0.1", () => process.stdout.write("ClairoVid demo: http://127.0.0.1:4173\n"));
