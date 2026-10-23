import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function readEnv(file) {
  const values = {};
  for (const line of file.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !match[1].startsWith('#')) values[match[1]] = match[2];
  }
  return values;
}

async function requestJson(url, options, provider) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(180_000) });
  } catch {
    throw new Error(`${provider} request could not connect. Check network access and provider availability.`);
  }
  if (!response.ok) throw new Error(`${provider} returned HTTP ${response.status}. Response details were withheld to protect credentials.`);
  try { return await response.json(); }
  catch { throw new Error(`${provider} returned an unreadable response.`); }
}

function validatePlan(plan) {
  const allowed = new Set(['river_source', 'gravity_slope', 'stream_merge', 'river_meander', 'destination']);
  if (!plan || typeof plan.title !== 'string' || !Array.isArray(plan.scenes) || plan.scenes.length !== 5) throw new Error('Gemini plan did not match the five-scene contract.');
  for (const scene of plan.scenes) {
    if (!scene || !['title', 'narration', 'visual'].every(k => typeof scene[k] === 'string') || !allowed.has(scene.visual)) throw new Error('Gemini plan included a missing field or unsupported visual.');
  }
  const words = plan.scenes.map(s => s.narration.trim().split(/\s+/).length).reduce((a, b) => a + b, 0);
  if (words < 120 || words > 190) throw new Error(`The generated script is ${words} words; expected 120–190 for a short voice sample.`);
  return words;
}

function voiceMeta(voiceList, id, label) {
  const voice = (voiceList?.voices || []).find(v => v.voice_id === id);
  return {
    id,
    label: voice?.name || label,
    gender: voice?.labels?.gender || null,
    accent: voice?.labels?.accent || null,
    language: voice?.labels?.language || null,
  };
}

function mapAlignment(text, alignment, scenes) {
  if (!alignment || !Array.isArray(alignment.characters) || !Array.isArray(alignment.character_start_times_seconds) || !Array.isArray(alignment.character_end_times_seconds)) throw new Error('ElevenLabs did not return character timing data.');
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  if (characters.length !== starts.length || characters.length !== ends.length) throw new Error('ElevenLabs alignment arrays have inconsistent lengths.');
  const alignedText = characters.join('');
  if (alignedText !== text) throw new Error('Returned speech alignment does not match the generated script text; refusing to guess timings.');
  if (starts.some((v, i) => !Number.isFinite(v) || v < 0 || (i && v < starts[i - 1])) || ends.some((v, i) => !Number.isFinite(v) || v < starts[i])) throw new Error('Returned speech alignment contains invalid or unordered times.');
  const sceneTimings = [];
  const captions = [];
  let offset = 0;
  for (let index = 0; index < scenes.length; index++) {
    const narration = scenes[index].narration;
    const startIndex = offset + narration.search(/\S/);
    const endIndex = offset + narration.length - 1 - [...narration].reverse().join('').search(/\S/);
    sceneTimings.push({ start: starts[startIndex], end: ends[endIndex] });
    const wordMatches = [...narration.matchAll(/\S+/g)];
    for (let i = 0; i < wordMatches.length; i += 7) {
      const chunk = wordMatches.slice(i, i + 7);
      const localStart = chunk[0].index;
      const last = chunk[chunk.length - 1];
      const localEnd = last.index + last[0].length - 1;
      captions.push({
        scene: index,
        text: narration.slice(localStart, localEnd + 1),
        start: starts[offset + localStart],
        end: ends[offset + localEnd],
      });
    }
    offset += narration.length + (index < scenes.length - 1 ? 2 : 0);
  }
  const duration = Math.max(...ends);
  if (!Number.isFinite(duration) || duration < 10) throw new Error('Speech duration could not be read from the alignment.');
  return { sceneTimings, captions, duration, alignmentVersion: 'elevenlabs-character-alignment-v1' };
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function previewHtml(plan, timeline, voices) {
  const safePlan = escapeJsonForHtml(plan);
  const safeTimeline = escapeJsonForHtml(timeline);
  const safeVoices = escapeJsonForHtml(voices.map((v, i) => ({ index: i, name: v.label, gender: v.gender, accent: v.accent, language: v.language })));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ClairoVid.ai · Live API Video Preview</title>
<style>
:root{color-scheme:dark;--bg:#101216;--panel:#191c22;--line:#30343d;--text:#f4f5f7;--muted:#abb1bd;--mint:#a7e9d0;--green:#3e9d7d;font:15px/1.5 system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 20% 0,#203a32 0,transparent 42%),var(--bg);color:var(--text)}main{max-width:1100px;margin:auto;padding:28px}.brand{font-size:18px;font-weight:750}.tag{color:#eed696;background:#37301f;border:1px solid #635738;border-radius:999px;padding:5px 10px;font-size:11px}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.layout{display:grid;grid-template-columns:minmax(300px,400px) 1fr;gap:26px;align-items:start}.phone{width:100%;aspect-ratio:9/16;border-radius:23px;background:#f0f0e5;overflow:hidden;box-shadow:0 20px 60px #0008}.phone canvas{width:100%;height:100%;display:block}.card{background:var(--panel);border:1px solid var(--line);border-radius:17px;padding:20px;margin-bottom:14px}h1{font-size:30px;letter-spacing:-.7px;margin:0 0 6px}.muted{color:var(--muted)}.small{font-size:12px}.audio{width:100%;margin-top:13px}.voices{display:grid;grid-template-columns:1fr 1fr;gap:10px}.voice{background:#111419;border:1px solid var(--line);padding:12px;border-radius:12px}.voice b{display:block;font-size:13px}.voice button,button{background:#22272f;border:1px solid #3b414b;color:var(--text);border-radius:10px;padding:9px 11px;cursor:pointer}.voice button.active,.primary{background:var(--mint);border-color:var(--mint);color:#11251d;font-weight:700}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.range{width:100%;accent-color:#70ccaa}.captions{min-height:52px;color:#d9e4dd;font-size:14px;padding-top:10px}.progress{height:5px;background:#30343d;border-radius:4px;overflow:hidden}.progress i{display:block;background:var(--green);width:0;height:100%}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meta div{background:#111419;padding:10px;border-radius:10px;font-size:12px}.meta b{display:block;color:var(--mint);margin-bottom:3px}.notice{border:1px solid #554a30;background:#29251b;color:#ecdba6;border-radius:11px;padding:11px;font-size:12px;margin-top:12px}.script{white-space:pre-wrap;max-height:240px;overflow:auto;font-size:13px;color:#d4d8de}.error{color:#f4a69b}.export-status{min-height:20px;font-size:12px;color:var(--mint)}@media(max-width:760px){main{padding:15px}.layout{grid-template-columns:1fr}.phone{max-width:350px;margin:auto}.header{gap:10px;align-items:start}h1{font-size:25px}}
</style></head><body><main>
<div class="header"><div class="brand">ClairoVid.ai <span class="muted">· live generation sample</span></div><span class="tag">GEMINI + ELEVENLABS API</span></div>
<h1 id="title"></h1><p class="muted">A real structured script and character-timed narration drive this synchronized motion preview.</p>
<div class="layout"><div><div class="phone"><canvas id="video" width="540" height="960"></canvas></div><div class="controls"><button id="export" class="primary">Export video with selected voice (WebM)</button><button id="stop">Stop</button></div><div class="export-status" id="exportStatus"></div></div>
<div><section class="card"><h2 style="margin:0 0 4px">Compare the two voices</h2><p class="muted small" style="margin:0 0 13px">Both samples use the exact same script. Names and labels are read from the ElevenLabs account when available.</p><div class="voices" id="voiceCards"></div><audio id="audio" class="audio" controls preload="metadata"></audio><div class="controls"><button id="play">▶ Play selected narration with video</button><button id="pause">Pause</button></div><input id="seek" class="range" type="range" min="0" max="1000" value="0"><div class="progress"><i id="progress"></i></div><div class="captions" id="caption">Select a voice to preview the narrated explainer.</div></section>
<section class="card"><h2 style="margin:0 0 9px">How this run was built</h2><div class="meta"><div><b>Plan</b>Live Gemini structured output</div><div><b>Narration</b>Live ElevenLabs audio</div><div><b>Timing</b>ElevenLabs character alignment</div><div><b>Visuals</b>Trusted local scene renderer</div><div><b>Output target</b>Vertical 9:16, 30 fps</div><div><b>Sample duration</b><span id="duration"></span></div></div><div class="notice">This is a prototype-quality renderer, not the production Remotion renderer. The video download is WebM because no MP4 encoder is installed here. Caption timing and narration are real; visuals are template-driven from the approved scene types.</div></section>
<section class="card"><h2 style="margin:0 0 8px">Gemini narration script</h2><div id="script" class="script"></div></section></div></div>
</main>
<script id="plan-data" type="application/json">${safePlan}</script><script id="timeline-data" type="application/json">${safeTimeline}</script><script id="voice-data" type="application/json">${safeVoices}</script>
<script>
const plan=JSON.parse(document.getElementById('plan-data').textContent), timeline=JSON.parse(document.getElementById('timeline-data').textContent), voices=JSON.parse(document.getElementById('voice-data').textContent);const audio=document.getElementById('audio'),canvas=document.getElementById('video'),ctx=canvas.getContext('2d');let selected=0,raf=0,audioCtx=null,source=null,dest=null,recorder=null,parts=[];const C={ink:'#26332f',green:'#328f73',mint:'#b9e7d3',blue:'#82c5cf',blue2:'#d1eef0',yellow:'#f4ca70',cream:'#f4f0e6',cloud:'#fffdf7',coral:'#e68f77'};document.getElementById('title').textContent=plan.title;document.getElementById('duration').textContent=timeline.duration.toFixed(1)+' sec';document.getElementById('script').textContent=plan.scenes.map(s=>s.narration).join('\\n\\n');
function rr(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}function label(t,x,y,size=25,color=C.ink,weight=650){ctx.fillStyle=color;ctx.font=weight+' '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(t,x,y)}function wrap(t,max,font){ctx.font=font;let lines=[],line='';for(const w of t.split(' ')){const n=line?line+' '+w:w;if(ctx.measureText(n).width>max&&line){lines.push(line);line=w}else line=n}if(line)lines.push(line);return lines}
function draw(i,p,t){const w=540,h=960,g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#faf7ef');g.addColorStop(1,'#e8f0e8');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.25;ctx.fillStyle=C.mint;ctx.beginPath();ctx.arc(30,220,96,0,7);ctx.fill();ctx.beginPath();ctx.arc(510,570,120,0,7);ctx.fill();ctx.globalAlpha=1;rr(34,28,472,54,26,'#e5eee6');label('WHY RIVERS FLOW DOWNHILL',270,63,17,C.green,800);label(String(i+1).padStart(2,'0')+' / '+plan.scenes.length,467,63,14,'#718078',700);const s=plan.scenes[i];const bob=Math.sin(p*6.28)*8;
if(s.visual==='river_source'){ctx.fillStyle='#c7d9ce';ctx.beginPath();ctx.moveTo(35,490);ctx.lineTo(218,190);ctx.lineTo(345,380);ctx.lineTo(505,210);ctx.lineTo(505,620);ctx.lineTo(35,620);ctx.closePath();ctx.fill();ctx.fillStyle=C.blue;ctx.beginPath();ctx.moveTo(250,350);ctx.bezierCurveTo(230,430,330,450,280,530);ctx.bezierCurveTo(260,570,310,590,350,625);ctx.lineTo(430,625);ctx.lineTo(370,525);ctx.lineTo(335,440);ctx.closePath();ctx.fill();rr(92,195,355,76,20,C.cloud);label('Water starts high in the hills',270,243,22,C.ink,700)}
if(s.visual==='gravity_slope'){ctx.fillStyle='#c6ddcf';ctx.beginPath();ctx.moveTo(58,270);ctx.lineTo(488,550);ctx.lineTo(488,665);ctx.lineTo(58,665);ctx.closePath();ctx.fill();ctx.strokeStyle=C.green;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(155,340);ctx.lineTo(360,490);ctx.stroke();ctx.beginPath();ctx.moveTo(330,476);ctx.lineTo(365,494);ctx.lineTo(345,460);ctx.stroke();ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(188+p*120,365+p*88,21,0,6.29);ctx.fill();rr(108,170,325,84,19,C.cloud);label('Gravity pulls water lower',270,223,24,C.ink,700);label('HIGHER ELEVATION',136,686,14,C.green,800);label('LOWER ELEVATION',398,686,14,C.green,800)}
if(s.visual==='stream_merge'){ctx.strokeStyle=C.blue;ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(135,250);ctx.bezierCurveTo(145,360,270,430,270,590);ctx.stroke();ctx.beginPath();ctx.moveTo(405,255);ctx.bezierCurveTo(395,370,270,425,270,590);ctx.stroke();ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(270,590,17,0,6.29);ctx.fill();rr(92,170,356,75,19,C.cloud);label('Small streams join one river',270,218,23,C.ink,700);label('CONFLUENCE',270,680,15,C.green,800)}
if(s.visual==='river_meander'){ctx.fillStyle='#d9e4cf';ctx.fillRect(55,255,430,390);ctx.strokeStyle='#a1c78e';ctx.lineWidth=76;ctx.beginPath();ctx.moveTo(105,310);ctx.bezierCurveTo(490,300,75,425,450,470);ctx.stroke();ctx.strokeStyle=C.blue;ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(105,310);ctx.bezierCurveTo(490,300,75,425,450,470);ctx.stroke();rr(89,165,362,74,18,C.cloud);label('The river bends, but keeps descending',270,211,21,C.ink,700);label('LOCAL BENDS · OVERALL FLOW',270,690,14,C.green,800)}
if(s.visual==='destination'){ctx.fillStyle=C.yellow;ctx.beginPath();ctx.arc(420,260,55,0,6.29);ctx.fill();ctx.fillStyle='#c8e0c5';ctx.beginPath();ctx.moveTo(30,520);ctx.quadraticCurveTo(220,400,510,505);ctx.lineTo(510,710);ctx.lineTo(30,710);ctx.fill();ctx.fillStyle=C.blue;ctx.beginPath();ctx.moveTo(50,575);ctx.bezierCurveTo(175,525,290,590,490,540);ctx.lineTo(510,680);ctx.lineTo(45,680);ctx.closePath();ctx.fill();rr(95,165,350,76,19,C.cloud);label('Water reaches a lake or sea',270,213,23,C.ink,700);label('DOWNHILL · DOWNSTREAM',270,745,15,C.green,800)}
rr(30,805,480,118,22,'#26332f');const active=timeline.captions.find(c=>c.start<=t&&t<c.end&&c.scene===i);const caption=active?.text||s.title;wrap(caption,418,'600 23px system-ui,sans-serif').slice(0,3).forEach((line,n)=>label(line,270,850+n*29,23,'#fffdf7',600));label('CLAiROVID.AI  ·  LEARN IT IN MOTION',270,942,12,'#668276',750)}
function frame(){const t=audio.currentTime||0;let i=timeline.sceneTimings.findIndex(s=>t>=s.start&&t<=s.end);if(i<0)i=t<timeline.sceneTimings[0].start?0:plan.scenes.length-1;const st=timeline.sceneTimings[i];draw(i,Math.max(0,Math.min(1,(t-st.start)/(st.end-st.start||1))),t);document.getElementById('caption').textContent=timeline.captions.find(c=>c.start<=t&&t<c.end)?.text||' ';document.getElementById('progress').style.width=(timeline.duration?t/timeline.duration*100:0)+'%';document.getElementById('seek').value=timeline.duration?t/timeline.duration*1000:0;if(!audio.paused)raf=requestAnimationFrame(frame)}
const cardBox=document.getElementById('voiceCards');voices.forEach((v,i)=>{const meta=[v.gender,v.accent,v.language].filter(Boolean).join(' · ');const d=document.createElement('div');d.className='voice';d.innerHTML='<b></b><div class="muted small"></div><button type="button"></button>';d.querySelector('b').textContent=v.name||('Voice '+String.fromCharCode(65+i));d.querySelector('.muted').textContent=meta||'Voice ID '+(i+1);const b=d.querySelector('button');b.textContent='Select voice';b.addEventListener('click',()=>choose(i));d.dataset.index=i;cardBox.appendChild(d)});
function choose(i){selected=i;audio.pause();audio.src='./output/live-run/voice-'+(i+1)+'.mp3';audio.load();document.querySelectorAll('.voice').forEach((el,n)=>el.querySelector('button').classList.toggle('active',n===i));document.getElementById('caption').textContent='Voice selected. Press play to hear the narration with the synchronized scenes.';draw(0,0,0)}choose(0);
document.getElementById('play').onclick=async()=>{try{await audio.play();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}catch{document.getElementById('caption').textContent='Allow local audio playback in the browser, then try again.'}};document.getElementById('pause').onclick=()=>audio.pause();document.getElementById('stop').onclick=()=>{audio.pause();audio.currentTime=0;cancelAnimationFrame(raf);draw(0,0,0)};audio.addEventListener('play',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)});audio.addEventListener('pause',()=>cancelAnimationFrame(raf));audio.addEventListener('ended',()=>{cancelAnimationFrame(raf);draw(plan.scenes.length-1,1,timeline.duration)});document.getElementById('seek').addEventListener('input',e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value)/1000*audio.duration;frame()});
async function setupAudioRouting(){if(!audioCtx){audioCtx=new AudioContext();source=audioCtx.createMediaElementSource(audio);dest=audioCtx.createMediaStreamDestination();source.connect(audioCtx.destination);source.connect(dest)}await audioCtx.resume()}
document.getElementById('export').onclick=async()=>{const status=document.getElementById('exportStatus');if(!canvas.captureStream||!window.MediaRecorder){status.textContent='This browser cannot record WebM. Use the synchronized preview and MP3 files instead.';return}try{await setupAudioRouting();const vstream=canvas.captureStream(30);const stream=new MediaStream([...vstream.getVideoTracks(),...dest.stream.getAudioTracks()]);parts=[];let mime='video/webm;codecs=vp9,opus';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';recorder=new MediaRecorder(stream,{mimeType:mime});recorder.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};recorder.onstop=()=>{const blob=new Blob(parts,{type:recorder.mimeType});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ClairoVid-river-flow-voice-'+(selected+1)+'.webm';a.click();stream.getTracks().forEach(t=>t.stop());status.textContent='Narrated WebM exported ('+Math.round(blob.size/1024)+' KB).';};audio.currentTime=0;await audio.play();recorder.start();status.textContent='Recording synchronized video and selected voice…';cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);audio.addEventListener('ended',()=>{if(recorder&&recorder.state==='recording')recorder.stop()},{once:true})}catch{status.textContent='Export failed in this browser. Play the audio and video preview instead.'}};
draw(0,0,0);
</script></body></html>`;
}

const envPath = path.join(root, '.env.local');
const env = readEnv(await fs.readFile(envPath, 'utf8'));
const geminiKey = env.GEMINI_API_KEY;
const elevenKey = env.ELEVENLABS_API_KEY;
const voiceIds = [env.ELEVENLABS_VOICE_ID_INDIAN_MALE, env.ELEVENLABS_VOICE_ID_INDIAN_FEMALE];
if (!geminiKey || !elevenKey || voiceIds.some(v => !v)) throw new Error('Missing required provider configuration in .env.local. No values were displayed.');
const geminiModel = env.GEMINI_MODEL || 'gemini-3.8-flash';
const elevenModel = env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const runDir = path.join(here, 'output', 'live-run');
await fs.mkdir(runDir, { recursive: true });

const schema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    learning_objective: { type: 'string' },
    scenes: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' },
      narration: { type: 'string' },
      visual: { type: 'string', enum: ['river_source', 'gravity_slope', 'stream_merge', 'river_meander', 'destination'] },
    }, required: ['title', 'narration', 'visual'] } },
  }, required: ['title', 'learning_objective', 'scenes'],
};
const prompt = `Create a scientifically accurate, friendly educational explainer for English-speaking learners in India: “Why do rivers flow downhill, and do they always move in one direction?”
Return exactly five scenes for a vertical motion-graphics video. The total narration must be 140–160 words, about 60–75 seconds at natural Indian English pacing. Keep scene narration conversational and speakable. Correct the misconception carefully: gravity drives water down an elevation gradient overall; a river can meander and locally turn, while its net course is downhill; pumps can move water uphill, so do not claim all water always flows downhill. Explain source, gravity, stream merging, bends, and destination. Do not invent facts, citations, or statistics. Each scene must use only its matching visual enum: river_source, gravity_slope, stream_merge, river_meander, destination. Keep each scene narration self-contained and in order.`;
const gemini = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.45 },
  }),
}, 'Gemini');
const planText = gemini.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
if (!planText) throw new Error('Gemini returned no structured script.');
let plan;
try { plan = JSON.parse(planText); } catch { throw new Error('Gemini returned invalid JSON for the storyboard.'); }
const wordCount = validatePlan(plan);
const script = plan.scenes.map(s => s.narration).join('\n\n');
await fs.writeFile(path.join(runDir, 'plan.json'), JSON.stringify({ ...plan, word_count: wordCount, model: geminiModel }, null, 2));

let voiceList = { voices: [] };
try { voiceList = await requestJson('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': elevenKey } }, 'ElevenLabs voice lookup'); }
catch { /* Voice metadata is optional; the IDs are still validated by TTS below. */ }
const voices = voiceIds.map((id, i) => voiceMeta(voiceList, id, `Voice ${String.fromCharCode(65 + i)}`));
const outputs = [];
for (let i = 0; i < voiceIds.length; i++) {
  const result = await requestJson(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceIds[i])}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
    body: JSON.stringify({ text: script, model_id: elevenModel, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, speed: 1, use_speaker_boost: true } }),
  }, `ElevenLabs voice ${i + 1}`);
  if (typeof result.audio_base64 !== 'string' || !result.alignment) throw new Error(`ElevenLabs voice ${i + 1} returned no audio or alignment.`);
  await fs.writeFile(path.join(runDir, `voice-${i + 1}.mp3`), Buffer.from(result.audio_base64, 'base64'));
  await fs.writeFile(path.join(runDir, `voice-${i + 1}-alignment.json`), JSON.stringify(result.alignment, null, 2));
  outputs.push(mapAlignment(script, result.alignment, plan.scenes));
}
const timeline = outputs.map((o, i) => ({ voiceIndex: i, sceneTimings: o.sceneTimings, captions: o.captions, duration: o.duration, alignmentVersion: o.alignmentVersion }));
await fs.writeFile(path.join(runDir, 'timeline.json'), JSON.stringify(timeline, null, 2));
await fs.writeFile(path.join(here, 'live-preview.html'), previewHtml(plan, timeline[0], voices));
await fs.writeFile(path.join(runDir, 'run-summary.json'), JSON.stringify({ title: plan.title, wordCount, geminiModel, elevenModel, voices: voices.map(v => ({ label: v.label, gender: v.gender, accent: v.accent, language: v.language })), voiceDurationsSeconds: outputs.map(o => Number(o.duration.toFixed(2))), generatedAt: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ status: 'success', title: plan.title, wordCount, voiceLabels: voices.map(v => v.label), durationsSeconds: outputs.map(o => Number(o.duration.toFixed(2))), preview: path.join(here, 'live-preview.html'), outputDirectory: runDir }, null, 2));
