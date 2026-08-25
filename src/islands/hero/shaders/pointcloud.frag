precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vSeed;

void main() {
  float r = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.22, r) * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha * (0.7 + 0.3 * fract(vSeed * 5.7)));
}
