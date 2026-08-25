// Candidate D: fbm domain-warped noise field (floor option). A slow,
// low-contrast monochrome flow — "a slice of a neural field". Algorithm
// follows the classic two-pass warp recipe (reimplemented from first
// principles; no external shader code).

precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform vec3 uAccent;
uniform vec3 uNeutral;
uniform float uAlpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(13.7, 7.3);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;
  float t = uTime * 0.03;

  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(
    fbm(p + 2.6 * q + vec2(1.7, 9.2) + uPointer * 0.25),
    fbm(p + 2.6 * q + vec2(8.3, 2.8))
  );
  float f = fbm(p + 2.4 * r);

  float shade = smoothstep(0.25, 0.9, f);
  vec3 color = mix(uNeutral, uAccent, smoothstep(0.4, 0.85, length(q)));
  float alpha = shade * uAlpha;
  gl_FragColor = vec4(color, alpha);
}
