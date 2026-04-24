export function calculateRemaining(slot: {
  quota?: number | null;
  usedCount?: number | null;
  holdCount?: number | null;
}) {
  const quota = slot.quota ?? 0;
  const used = slot.usedCount ?? 0;
  const hold = slot.holdCount ?? 0;
  return quota - used - hold;
}
