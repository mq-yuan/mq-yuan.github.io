// Shared lifecycle shell for hero scene candidates (doc 06 §5).
// Owns: renderer creation, DPR capping, resize, pointer smoothing, RAF loop,
// off-screen pause, theme-reactive palette, and disposal. Scenes plug in via
// the Scene interface and never touch lifecycle concerns.

import * as THREE from "three";

export interface Palette {
  bg: THREE.Color;
  accent: THREE.Color;
  neutral: THREE.Color;
  isDark: boolean;
}

export interface SceneHandle {
  /** Called every frame with elapsed/delta seconds and smoothed pointer in [-1,1]². */
  update(elapsed: number, delta: number, pointer: THREE.Vector2): void;
  /** Called when the palette (theme) changes. */
  setPalette(palette: Palette): void;
  /** Called after every size change with CSS size and device pixel ratio. */
  resize?(width: number, height: number, dpr: number): void;
  /** Optional custom render pass (e.g. composites with multiple cameras).
   * When present the shell calls this instead of its default render. */
  render?(renderer: THREE.WebGLRenderer): void;
  /** Dispose scene-owned GPU resources. */
  dispose(): void;
  scene: THREE.Scene;
  camera: THREE.Camera;
}

export interface SceneFactory {
  (viewport: { width: number; height: number }, palette: Palette): SceneHandle;
}

const cssColor = (name: string): THREE.Color => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new THREE.Color(raw);
};

export const readPalette = (): Palette => {
  const root = document.documentElement;
  const explicit = root.dataset.theme;
  const isDark =
    explicit === "dark" ||
    (!explicit && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return {
    bg: cssColor("--bg"),
    accent: cssColor("--accent"),
    neutral: cssColor("--text-mut"),
    isDark,
  };
};

export interface ShellOptions {
  maxDpr?: number;
  onFps?: (fps: number) => void;
  /** Enable the degradation ladder: sustained < 30fps → DPR 1; still
   * sustained < 24fps → give up (cleanup, placeholder stays). Thresholds
   * per doc 08 §3. */
  autoDegrade?: boolean;
  /** Called when the ladder gives up, just before cleanup. */
  onGiveUp?: () => void;
}

export function mountScene(
  container: HTMLElement,
  factory: SceneFactory,
  options: ShellOptions = {},
): () => void {
  const maxDpr = options.maxDpr ?? 2;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));

  let palette = readPalette();
  const size = () => ({
    width: container.clientWidth,
    height: container.clientHeight,
  });
  const handle = factory(size(), palette);

  const applySize = () => {
    const { width, height } = size();
    renderer.setSize(width, height, false);
    const cam = handle.camera;
    if (cam instanceof THREE.PerspectiveCamera) {
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
    } else if (cam instanceof THREE.OrthographicCamera) {
      cam.left = -width / 2;
      cam.right = width / 2;
      cam.top = height / 2;
      cam.bottom = -height / 2;
      cam.updateProjectionMatrix();
    }
    handle.resize?.(width, height, renderer.getPixelRatio());
  };
  applySize();

  const resizeObserver = new ResizeObserver(applySize);
  resizeObserver.observe(container);

  // Pointer, smoothed toward target each frame.
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointer = new THREE.Vector2(0, 0);
  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    pointerTarget.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // Theme changes: watch data-theme attribute and system preference.
  const refreshPalette = () => {
    palette = readPalette();
    handle.setPalette(palette);
  };
  const themeObserver = new MutationObserver(refreshPalette);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", refreshPalette);

  // RAF loop with off-screen pause.
  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;
  let frames = 0;
  let fpsTimer = 0;
  let slowSeconds = 0;
  let degradeStep = 0; // 0 = full, 1 = DPR dropped, 2 = given up

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    pointer.lerp(pointerTarget, 1 - Math.exp(-6 * delta));
    handle.update(elapsed, delta, pointer);
    if (handle.render) handle.render(renderer);
    else renderer.render(handle.scene, handle.camera);

    if (options.onFps || options.autoDegrade) {
      frames += 1;
      fpsTimer += delta;
      if (fpsTimer >= 0.5) {
        const fps = frames / fpsTimer;
        options.onFps?.(fps);
        if (options.autoDegrade) {
          const threshold = degradeStep === 0 ? 30 : 24;
          slowSeconds = fps < threshold ? slowSeconds + fpsTimer : 0;
          if (slowSeconds >= 3) {
            slowSeconds = 0;
            degradeStep += 1;
            if (degradeStep === 1) {
              renderer.setPixelRatio(1);
              applySize();
            } else {
              options.onGiveUp?.();
              cleanup();
              return;
            }
          }
        }
        frames = 0;
        fpsTimer = 0;
      }
    }
  };

  const start = () => {
    if (!raf && visible) {
      clock.getDelta();
      raf = requestAnimationFrame(loop);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) start();
    else stop();
  });
  intersection.observe(container);
  start();

  const onContextLost = (e: Event) => {
    e.preventDefault();
    cleanup();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    stop();
    intersection.disconnect();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    mq.removeEventListener("change", refreshPalette);
    window.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    handle.dispose();
    renderer.dispose();
    canvas.remove();
  };

  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}
