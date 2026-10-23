export const runtime = "nodejs";
export async function GET() {
  const male = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID_INDIAN_MALE);
  const female = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID_INDIAN_FEMALE);
  return Response.json({ voices: [{ id: "indian_male", label: "Indian English — Male", available: male }, { id: "indian_female", label: "Indian English — Female", available: female }], policy: "Only configured V1 voices are available. No silent voice substitution." }, { headers: { "Cache-Control": "no-store" } });
}
