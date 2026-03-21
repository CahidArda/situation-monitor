export async function register() {
  const { ensureSearchIndexes } = await import("@/lib/search");
  await ensureSearchIndexes();

  // TODO: create/verify QStash schedule here (Milestone 4)
}
