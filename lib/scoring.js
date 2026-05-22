/**
 * Returns points (0–3) for a tip against the real result.
 * Rules:
 *   3 – exact score
 *   2 – correct goal difference, but NOT a draw (0:0-style diff=0 already caught by exact above)
 *   1 – correct tendency (home win / draw / away win)
 *   0 – none of the above
 */
export function calcPoints(tip, result) {
  if (!tip || !result) return null;

  const tH = tip.h, tA = tip.a, rH = result.h, rA = result.a;

  if (tH === rH && tA === rA) return 3;

  const tDiff = tH - tA;
  const rDiff = rH - rA;
  if (rDiff !== 0 && tDiff === rDiff) return 2;

  const tendency = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  if (tendency(tDiff) === tendency(rDiff)) return 1;

  return 0;
}
