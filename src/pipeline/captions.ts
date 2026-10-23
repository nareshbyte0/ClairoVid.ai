export type WordCue = { text: string; start: number; end: number };
type Alignment = { characters?: unknown; character_start_times_seconds?: unknown; character_end_times_seconds?: unknown };

export function alignmentToWordCues(value: unknown): WordCue[] {
  const alignment = value as Alignment;
  if (!Array.isArray(alignment?.characters) || !Array.isArray(alignment.character_start_times_seconds) || !Array.isArray(alignment.character_end_times_seconds)) {
    throw new Error("Speech alignment was missing required timing data.");
  }
  const characters = alignment.characters as unknown[];
  const starts = alignment.character_start_times_seconds as unknown[];
  const ends = alignment.character_end_times_seconds as unknown[];
  if (!characters.length || characters.length !== starts.length || characters.length !== ends.length || characters.length > 30000) {
    throw new Error("Speech alignment did not match the narration text.");
  }
  let text = "";
  let previous = 0;
  const spans: { start: number; end: number }[] = [];
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const start = starts[i];
    const end = ends[i];
    if (typeof character !== "string" || character.length > 8 || typeof start !== "number" || typeof end !== "number" || !Number.isFinite(start) || !Number.isFinite(end) || start < previous || end < start || end > 3600) {
      throw new Error("Speech timing was invalid; no guessed caption times were used.");
    }
    text += character;
    spans.push({ start, end });
    previous = start;
  }
  const words = [...text.matchAll(/\S+/gu)];
  if (!words.length) throw new Error("No caption text was returned with speech timing.");
  const cues: WordCue[] = [];
  for (let i = 0; i < words.length; i += 5) {
    const batch = words.slice(i, i + 5);
    const first = batch[0];
    const last = batch[batch.length - 1];
    const beginning = first.index ?? 0;
    const finish = beginning + last[0].length - 1;
    const start = spans[beginning]?.start;
    const end = spans[finish]?.end;
    if (start === undefined || end === undefined || end < start) throw new Error("Could not map caption words to speech timing.");
    cues.push({ text: batch.map(word => word[0]).join(" "), start, end });
  }
  return cues;
}

export function wordCuesToVtt(cues: WordCue[]) {
  const stamp = (seconds: number) => {
    const ms = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const wholeSeconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  };
  return `WEBVTT\n\n${cues.map((cue, index) => `${index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}`).join("\n\n")}\n`;
}
