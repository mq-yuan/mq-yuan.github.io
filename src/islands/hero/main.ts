// Production hero entry — dynamically imported by the gate script in
// index.astro AFTER capability checks pass (doc 06 §3). This module carries
// three.js; nothing above it in the page depends on it.

import { mountScene } from "./shell";
import { makeCombinedScene } from "./scene/combined";

export interface HeroOptions {
  /** Reduced tier for small viewports / low-end signals (doc 08 §4). */
  reduced: boolean;
}

/** Mounts the signature scene into the hero. Resolves once the first frame
 * is committed so the caller can fade the canvas in over the placeholder.
 * Returns a cleanup function. */
export function mountHero(
  container: HTMLElement,
  { reduced }: HeroOptions,
): () => void {
  const factory = makeCombinedScene({
    splatCount: reduced ? 1400 : 3200,
    pointCount: reduced ? 6000 : 15000,
    // On narrow screens the mask already fades the left edge; keep the text
    // cloud closer to center so it stays on-canvas.
    textOffsetX: reduced ? 0.6 : 1.6,
  });
  const cleanup = mountScene(container, factory, {
    maxDpr: reduced ? 1 : 2,
    autoDegrade: true,
    onGiveUp: () => container.classList.remove("is-live"),
  });
  // First frame is rendered synchronously by mountScene's started loop on the
  // next RAF; fade in shortly after to avoid a flash of empty canvas.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => container.classList.add("is-live"));
  });
  // The shell disposes the canvas on pagehide. If the page later comes back
  // from the back-forward cache, the placeholder must be visible again until
  // the gate script remounts the scene on pageshow (index.astro).
  window.addEventListener(
    "pagehide",
    () => container.classList.remove("is-live"),
    { once: true },
  );
  return cleanup;
}
