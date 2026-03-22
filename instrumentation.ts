export async function register() {
  const { ensureSearchIndexes } = await import("@/lib/search");
  await ensureSearchIndexes();

  // Simulation is driven by frontend polling POST /api/tick — no schedule needed
}
