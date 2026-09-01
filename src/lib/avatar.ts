/** Deterministic avatar identity, kept out of the component file so fast
 *  refresh keeps working and so tests can reach these directly. */

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Two analogous hues around the brand indigo, kept out of the red and green
 *  bands so an avatar is never mistaken for a status colour. */
export function avatarColors(name: string): { bg: string; fg: string } {
  const hue = 200 + (hashName(name) % 90); // 200deg (cyan) → 290deg (violet)
  return { bg: `hsl(${hue} 62% 42%)`, fg: `hsl(${hue} 70% 94%)` };
}
