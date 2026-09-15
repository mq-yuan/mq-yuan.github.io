// Point-cloud reconstruction: morph between scattered positions (in
// `position`) and text-sampled targets happens entirely on the GPU; the CPU
// only advances a handful of uniforms per frame.

attribute vec3 aTarget;
attribute float aPhase;

uniform float uMorph;     // 0 scattered .. 1 formed
uniform float uTime;
uniform vec2 uPointer;    // local-space pointer (offset already removed)
uniform float uScale;     // drawingBufferHeight * 0.5 (point-size projection)
uniform float uSize;      // point size in world units

varying float vSeed;

void main() {
  float jitter = 0.04 * sin(uTime * 0.7 + aPhase);
  vec3 p = mix(position, aTarget, uMorph);
  p.x += jitter;
  p.y += jitter * 0.7;

  // Pointer repulsion (matches the former CPU implementation).
  vec2 d = p.xy - uPointer;
  float d2 = dot(d, d);
  if (d2 < 1.0) {
    p.xy += d * (1.0 - d2) * 0.4;
  }

  vSeed = aPhase;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Formed glyphs read crisper than the drifting dust: points grow as the
  // cloud converges.
  gl_PointSize = uSize * (1.0 + 0.4 * uMorph) * uScale / max(-mv.z, 0.1);
}
