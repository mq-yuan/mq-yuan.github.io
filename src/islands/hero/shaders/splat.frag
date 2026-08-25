precision highp float;

uniform vec3 uAccent;
uniform vec3 uNeutral;
uniform float uAlpha;     // global opacity scale (theme-tuned)

varying vec2 vQuad;
varying float vKind;
varying float vFocus;
varying float vSeed;

void main() {
  float r2 = dot(vQuad, vQuad);
  // Gaussian falloff; sharper when focused. A radial window takes the tail
  // smoothly to zero before the quad edge (no visible square clipping).
  float k = mix(3.5, 6.0, vFocus);
  float g = exp(-0.5 * r2 * k);
  g *= smoothstep(1.0, 0.72, length(vQuad));
  if (g < 0.004) discard;

  vec3 color = uAccent;
  float alpha = uAlpha;
  if (vKind > 1.5) {
    color = uNeutral;
    alpha *= 0.55;
  } else if (vKind > 0.5) {
    alpha *= 0.5;
  }

  alpha *= g * (0.75 + 0.5 * vFocus) * (0.7 + 0.3 * fract(vSeed * 7.13));
  gl_FragColor = vec4(color, alpha);
}
