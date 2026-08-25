// Production hero entry — dynamically imported by the gate script in
// index.astro AFTER capability checks pass (doc 06 §3). This module carries
// three.js; nothing above it in the page depends on it.

import { mountScene } from "./shell";
import { makeSplatScene } from "./scene/splat";

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
  const factory = makeSplatScene(reduced ? 1400 : 3200);
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
  return cleanup;
}
