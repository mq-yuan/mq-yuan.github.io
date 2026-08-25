// Candidate C: unwrapped panorama field. An equirectangular projection of a
// procedural sphere — graticule lines + star-like points — rotating
// imperceptibly; the pointer nudges the view direction.

precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;    // NDC [-1,1]
uniform vec3 uAccent;
uniform vec3 uNeutral;
uniform vec3 uBg;
uniform float uAlpha;

#define PI 3.14159265359

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Equirectangular mapping with slow rotation and pointer nudge.
  float lon = (uv.x * 2.0 - 1.0) * PI + uTime * 0.02 + uPointer.x * 0.18;
  float lat = (uv.y - 0.5) * PI * 0.9 + uPointer.y * 0.12;
  vec3 dir = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

  // Graticule: soft lines every 15 degrees, thicker every 45.
  float lonDeg = degrees(atan(dir.z, dir.x));
  float latDeg = degrees(asin(clamp(dir.y, -1.0, 1.0)));
  vec2 g15 = abs(fract(vec2(lonDeg, latDeg) / 15.0) - 0.5);
  vec2 g45 = abs(fract(vec2(lonDeg, latDeg) / 45.0) - 0.5);
  float latCompress = max(cos(lat), 0.15); // keep line width even near poles
  float lines = 0.0;
  lines += (1.0 - smoothstep(0.0, 0.02 / latCompress, g15.x)) * 0.35;
  lines += (1.0 - smoothstep(0.0, 0.02, g15.y)) * 0.35;
  lines += (1.0 - smoothstep(0.0, 0.028 / latCompress, g45.x)) * 0.5;
  lines += (1.0 - smoothstep(0.0, 0.028, g45.y)) * 0.5;
  lines = clamp(lines, 0.0, 1.0);

  // Star points: quantize direction, hash per cell, sharp falloff in-cell.
  vec3 cell = floor(dir * 14.0);
  float h = hash(cell);
  vec3 cellCenter = (cell + 0.5) / 14.0;
  float star = smoothstep(0.045, 0.0, distance(dir, normalize(cellCenter))) *
    step(0.82, h);

  // Horizon emphasis: brighten near equator band.
  float band = exp(-abs(lat) * 2.2) * 0.25;

  vec3 color = uNeutral * lines * 0.5 + uAccent * (star + band);
  float alpha = (lines * 0.45 + star * 0.9 + band) * uAlpha;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
