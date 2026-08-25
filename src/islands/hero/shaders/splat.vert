// Instanced anisotropic Gaussian footprints ("splat cloud", the signature).
// Each instance STREAMS along the band's Bézier arc — deeper layers flow
// slower (parallax) — with gentle secondary drift on top. Near the pointer
// the field condenses and sharpens. Instances fade in/out at the arc ends.

attribute float iT0;      // initial curve parameter [0,1)
attribute float iOff;     // perpendicular offset, roughly N(0,1)
attribute vec2 iScale;    // ellipse radii (px)
attribute float iRotJitter; // rotation jitter around the tangent (rad)
attribute float iSeed;    // per-instance random seed
attribute float iKind;    // 0 accent-strong / 1 accent-faint / 2 neutral
attribute float iDepth;   // depth layer [0,1]; deep = slow, small drift

uniform float uTime;
uniform vec2 uPointer;    // world-space pointer (px)
uniform float uFocusRadius;
uniform vec2 uViewport;   // world size (px) matching the ortho camera

varying vec2 vQuad;
varying float vKind;
varying float vFocus;
varying float vSeed;
varying float vFade;

vec2 bezier(float t) {
  vec2 p0 = vec2(-0.55, -0.35);
  vec2 p1 = vec2(0.0, 0.05);
  vec2 p2 = vec2(0.55, 0.4);
  float u = 1.0 - t;
  return (u * u * p0 + 2.0 * u * t * p1 + t * t * p2) * uViewport;
}

void main() {
  vQuad = position.xy * 2.0;   // [-1,1] across the quad
  vKind = iKind;
  vSeed = iSeed;

  // Stream along the arc: slow, continuous, depth-dependent (parallax).
  float speed = 0.006 + 0.012 * iDepth;   // arc fraction per second
  float t = fract(iT0 + uTime * speed);

  vec2 c = bezier(t);
  vec2 tang = normalize(bezier(t + 0.02) - bezier(t - 0.02));
  vec2 nrm = vec2(-tang.y, tang.x);

  // Band widens mid-arc; offset is the instance's normalized spread.
  float spread = (0.10 + 0.10 * sin(t * 3.14159)) * uViewport.y;
  vec2 center = c + nrm * iOff * spread;

  // Gentle secondary drift so the stream breathes rather than slides rigidly.
  float tt = uTime * 0.15;
  center += vec2(
    sin(tt + iSeed * 6.2832) + 0.4 * sin(tt * 1.9 + iSeed * 12.0),
    cos(tt * 0.9 + iSeed * 9.42)
  ) * 9.0 * (0.35 + 0.65 * iDepth);

  // Fade in/out at the arc ends so respawn (fract wrap) never pops.
  vFade = smoothstep(0.0, 0.10, t) * (1.0 - smoothstep(0.90, 1.0, t));

  // Pointer focus: condense + slightly attract within the radius.
  float d = distance(center, uPointer);
  float focus = smoothstep(uFocusRadius, uFocusRadius * 0.25, d);
  vFocus = focus;
  center += (uPointer - center) * focus * 0.06;

  vec2 scale = iScale * mix(1.0, 0.62, focus);
  float rot = atan(tang.y, tang.x) + iRotJitter +
    sin(tt * 0.5 + iSeed * 6.2832) * 0.15;
  mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
  vec2 local = R * (position.xy * scale * 2.0);

  vec4 world = vec4(center + local, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * world;
}
