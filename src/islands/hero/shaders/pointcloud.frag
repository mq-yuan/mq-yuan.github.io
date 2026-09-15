precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uMorph;     // 0 scattered .. 1 formed

varying float vSeed;

void main() {
  float r = length(gl_PointCoord - 0.5);
  // Dust stays subtle; the formed text gets the full opacity.
  float alpha = smoothstep(0.5, 0.22, r) * uOpacity * mix(0.55, 1.0, uMorph);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha * (0.7 + 0.3 * fract(vSeed * 5.7)));
}
