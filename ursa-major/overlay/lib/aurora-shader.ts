// The 3D aurora, as fragment-shader source. Shared by the dashboard's sky
// (components/AuroraSky.tsx) and the panel's glass (components/GlassCard.tsx).
//
// A camera on the ground looks up through a layer of sky where two thin
// glowing curtains hang. Each curtain is a wavy line on the ground plane
// extruded upward; for every pixel the ray climbs through the layer in 28
// steps and gathers the light it passes. Brightest at a curtain's lower
// edge and fading upward, green below and violet above, with rays along
// each curtain and an upward flicker like flame. The folds and depth come
// from the perspective, as they do in photographs.
//
// Designed in the Magic Patterns surfaces OS on 2026-11-19 and chosen by
// the owner over flat 2D versions (which read as mountains, strings or
// fingers). Uniforms:
//   u_res     canvas size in device pixels
//   u_t       sky time, seconds (the caller slows it at rest)
//   u_pulse   0..1, a substorm: brighter and faster
//   u_level   0..1, how revealed the light is
//   u_focus   0..1 in both axes, the spotlight's centre
//   u_radius  the spotlight's radius in device pixels (huge = everywhere)
// Pixels outside the spotlight skip the raymarch, so a pointer-sized
// reveal costs little.

export const AURORA_FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;
uniform float u_pulse;
uniform float u_level;
uniform vec2 u_focus;
uniform float u_radius;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 3; k++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

float footprint(vec2 xz, float off, float T) {
  float line = off
    + 0.9 * sin(xz.x * 0.55 + T * 0.04 + off)
    + 0.7 * (fbm3(vec2(xz.x * 0.35 + off, T * 0.025)) - 0.5) * 2.0;
  float d = xz.y - line;
  return exp(-d * d * 14.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float dd = length((uv - u_focus) * u_res) / u_radius;
  float spot = u_level * exp(-dd * dd);
  if (spot < 0.004) { gl_FragColor = vec4(0.0); return; }

  float aspect = u_res.x / u_res.y;
  float T = u_t;
  float surge = 1.0 + 0.9 * u_pulse;

  vec2 sc = (uv - 0.5) * vec2(aspect, 1.0);
  vec3 rd = normalize(vec3(sc.x, sc.y + 0.6, 1.1));

  vec3 green  = vec3(0.20, 1.00, 0.52);
  vec3 violet = vec3(0.55, 0.45, 1.00);
  vec3 col = vec3(0.0);

  float jitter = hash(gl_FragCoord.xy) * 0.9;
  const int STEPS = 28;
  for (int i = 0; i < STEPS; i++) {
    float h = (float(i) + jitter) / float(STEPS);
    float alt = 0.5 + h * 1.1;
    float tt = alt / max(rd.y, 0.05);
    vec3 pos = rd * tt;
    if (tt > 40.0) break;

    float curtain = footprint(pos.xz, 2.6, T) + footprint(pos.xz, 4.4, T + 30.0) * 0.6;
    if (curtain < 0.01) continue;

    float rays = pow(fbm3(vec2(pos.x * 3.0 + T * 0.03, T * 0.05)), 2.8) * 4.0;
    float flame = 0.55 + 0.7 * fbm3(vec2(pos.x * 0.5, h * 3.0 - T * 0.5 * surge));
    float profile = exp(-h * 3.2) * smoothstep(0.0, 0.04, h);
    vec3 c = mix(green, violet, smoothstep(0.25, 0.85, h));
    col += c * curtain * rays * flame * profile * exp(-tt * 0.08) * (6.0 / float(STEPS)) * surge;
  }

  col += mix(vec3(0.05, 0.08, 0.24), vec3(0.03, 0.04, 0.14), uv.y) * 0.8;

  vec2 cell = floor(gl_FragCoord.xy / 22.0);
  float hs = hash(cell);
  if (hs > 0.96) {
    vec2 sp = (cell + 0.2 + 0.6 * vec2(hash(cell + 7.1), hash(cell + 3.7))) * 22.0;
    float sr = length(gl_FragCoord.xy - sp);
    float size = 0.6 + 0.9 * hash(cell + 1.3);
    float tw = 0.65 + 0.35 * sin(T * 1.3 + hs * 60.0);
    col += vec3(0.85, 0.92, 1.0) * smoothstep(size + 0.8, 0.0, sr) * tw;
  }

  col *= spot;
  col = 1.0 - exp(-col * 2.2);
  float a = clamp(max(col.r, max(col.g, col.b)) * 1.1, 0.0, 0.95);
  gl_FragColor = vec4(col, a);
}`

export const AURORA_VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
