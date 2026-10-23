export async function synthesizeNarration(text: string, preset: "indian_male" | "indian_female") {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = preset === "indian_male" ? process.env.ELEVENLABS_VOICE_ID_INDIAN_MALE : process.env.ELEVENLABS_VOICE_ID_INDIAN_FEMALE;
  if (!apiKey || !voiceId) throw new Error(`The selected ${preset === "indian_male" ? "Indian English male" : "Indian English female"} voice is not configured.`);
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`, {
    method: "POST", headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }), signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Narration provider unavailable (HTTP ${response.status}). Check voice access and account configuration.`);
  const result = await response.json();
  if (typeof result.audio_base64 !== "string" || !result.alignment) throw new Error("Narration provider returned no validated word alignment.");
  return { audioBase64: result.audio_base64 as string, alignment: result.alignment };
}
