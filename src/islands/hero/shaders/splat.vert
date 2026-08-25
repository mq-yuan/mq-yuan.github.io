// Instanced anisotropic Gaussian footprints ("splat cloud", candidate A).
// Each instance drifts slowly; near the pointer the field condenses and
// sharpens, as if coming into focus.

attribute vec3 iCenter;   // world-space center (px), z = depth layer [0,1]
attribute vec2 iScale;    // ellipse radii (px)
attribute float iRot;     // base rotation (rad)
attribute float iSeed;    // per-instance random seed
attribute float iKind;    // 0 accent-strong / 1 accent-faint / 2 neutral

uniform float uTime;
uniform vec2 uPointer;    // world-space pointer (px)
uniform float uFocusRadius;

varying vec2 vQuad;
varying float vKind;
varying float vFocus;
varying float vSeed;

void main() {
  vQuad = position.xy * 2.0;   // [-1,1] across the quad
  vKind = iKind;
  vSeed = iSeed;

  // Slow organic drift, deeper layers move less (parallax feel).
  float t = uTime * 0.12;
  float depth = 0.35 + 0.65 * iCenter.z;
  vec2 drift = vec2(
    sin(t + iSeed * 6.2832) + 0.5 * sin(t * 1.7 + iSeed * 12.0),
    cos(t * 0.8 + iSeed * 9.42) + 0.5 * sin(t * 1.3 + iSeed * 4.7)
  ) * 14.0 * depth;

  vec2 center = iCenter.xy + drift;

  // Pointer focus: condense + slightly attract within the radius.
  float d = distance(center, uPointer);
  float focus = smoothstep(uFocusRadius, uFocusRadius * 0.25, d);
  vFocus = focus;
  center += (uPointer - center) * focus * 0.06;

  vec2 scale = iScale * mix(1.0, 0.62, focus);
  float rot = iRot + sin(t * 0.5 + iSeed * 6.2832) * 0.15;
  mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
  vec2 local = R * (position.xy * scale * 2.0);

  vec4 world = vec4(center + local, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * world;
}
