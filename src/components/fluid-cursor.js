/**
 * FLUID CURSOR - DYNAMIC COLOR-INVERTING VISCOUS INK EFFECT
 * 
 * Re-creates the fluid interaction from `hover-14-650.webm`:
 * - NOT an opaque covering blob.
 * - Operates as an interactive color-inverting fluid lens (`mix-blend-mode: difference`).
 * - Swaps brand colors on contact: Red background turns Black, Black text turns Red.
 * - Completely dissolves and vanishes when the cursor is stationary.
 * - Sleek, refined stroke scale matching typography.
 * - Smooth, viscous follow dynamics with zero harsh acceleration.
 */

// =============================================================================
// EFFECT CONFIGURATION
// Easily tune all physics, shape, and visual parameters here
// =============================================================================
export const FLUID_CONFIG = {
  // Appearance & Size (Sleek, refined ribbon scale matching reference)
  fluidSize: 30,               // Base radius of fluid head in pixels
  invertKey: '#E8080A',        // Color inversion key (Red <-> Black brand palette flip)
  
  // Fluid Dynamics & Smooth Viscosity (Buttery smooth, heavy viscous ink feel)
  headFollow: 0.18,            // Smooth viscous follow factor for head
  jointFollow: 0.22,           // Smooth viscous follow factor along body
  jointDamping: 0.88,          // Viscous internal resistance (eliminates jerky acceleration)
  gravity: 0.03,               // Very subtle physical weight
  inertia: 0.82,               // Smooth momentum for sweeping trails & loops
  
  // Stretching & Trailing
  tailTaper: 0.20,             // Radius scaling at tail tip (20% of head size)
  deformationStrength: 0.06,   // Organic edge distortion amplitude
  
  // Motion-Life Transitions (Nothing appears when cursor is stationary)
  motionThreshold: 0.6,        // Minimum mouse speed to maintain fluid visibility
  growthSpeed: 0.24,           // Speed at which fluid blooms when motion starts
  decaySpeed: 0.82,            // Speed at which fluid dissolves when motion stops
  
  // Technical & Performance
  simulationResolution: 1.0,   // Canvas pixel ratio multiplier (clamped to max 2.0)
  nodeCount: 12,               // Number of physical spine joints
  renderBallCount: 30          // Number of interpolated metaballs evaluated in shader
};

// Helper: Convert hex to normalized RGB [0..1]
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255
  ];
}

// Vertex Shader: Full-screen quad
const VERT_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment Shader: 2D Metaball Field + Organic Edge Noise + Sub-pixel Antialiasing
const FRAG_SHADER_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

varying vec2 v_uv;

uniform vec3 u_balls[30];
uniform int u_count;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_alpha;
uniform float u_time;
uniform float u_deformation;

// Organic procedural 2D noise for viscous boundary
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  if (u_alpha <= 0.002) {
    discard;
  }

  vec2 pixelPos = v_uv * u_resolution;
  float field = 0.0;

  // Evaluate potential sum of all metaballs along the spine
  for (int i = 0; i < 30; i++) {
    if (i >= u_count) break;
    vec2 d = pixelPos - u_balls[i].xy;
    float r = u_balls[i].z;
    float distSq = dot(d, d);
    field += (r * r) / (distSq + 1.0);
  }

  // Subtle organic fluid surface-tension deformation
  vec2 nCoord = pixelPos * 0.006 + vec2(u_time * 0.10, u_time * 0.08);
  float n = (noise(nCoord) - 0.5) * u_deformation;
  float effectiveField = field + n;

  // Sub-pixel antialiased contour around threshold 1.0
  #ifdef GL_OES_standard_derivatives
    float delta = fwidth(effectiveField) * 1.5;
    delta = max(delta, 0.02);
  #else
    float delta = 0.025;
  #endif

  float shape = smoothstep(1.0 - delta, 1.0 + delta, effectiveField);

  if (shape <= 0.001) {
    discard;
  }

  // Output premultiplied alpha for flawless difference blending in compositor
  float finalAlpha = shape * u_alpha;
  gl_FragColor = vec4(u_color * finalAlpha, finalAlpha);
}
`;

export function initFluidCursor() {
  // Mobile / Coarse touch device check (Requirement 14)
  if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true
  });

  if (!gl) {
    console.warn('[FluidCursor] WebGL not supported on this context.');
    return;
  }

  gl.getExtension('OES_standard_derivatives');

  function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vertShader = createShader(gl.VERTEX_SHADER, VERT_SHADER_SOURCE);
  const fragShader = createShader(gl.FRAGMENT_SHADER, FRAG_SHADER_SOURCE);
  if (!vertShader || !fragShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Full-screen quad geometry
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]), gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations
  const uBallsLoc = gl.getUniformLocation(program, 'u_balls');
  const uCountLoc = gl.getUniformLocation(program, 'u_count');
  const uResLoc = gl.getUniformLocation(program, 'u_resolution');
  const uColorLoc = gl.getUniformLocation(program, 'u_color');
  const uAlphaLoc = gl.getUniformLocation(program, 'u_alpha');
  const uTimeLoc = gl.getUniformLocation(program, 'u_time');
  const uDefLoc = gl.getUniformLocation(program, 'u_deformation');

  // -------------------------------------------------------------
  // Physical Spine Node Model
  // -------------------------------------------------------------
  const nodeCount = FLUID_CONFIG.nodeCount;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      vx: 0,
      vy: 0
    });
  }

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let smoothMouseX = mouseX;
  let smoothMouseY = mouseY;
  let prevMouseX = mouseX;
  let prevMouseY = mouseY;
  let mouseSpeed = 0;

  let isHovering = false;
  let motionActivity = 0; // Strictly 0 when still, 1 when moving
  let currentAlpha = 0;
  let currentScale = 0;

  const invertColorRgb = hexToRgb(FLUID_CONFIG.invertKey);
  const ballsArray = new Float32Array(FLUID_CONFIG.renderBallCount * 3);

  // Viewport resize handling
  let dpr = Math.min(window.devicePixelRatio || 1, 2.0) * FLUID_CONFIG.simulationResolution;
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.0) * FLUID_CONFIG.simulationResolution;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Mouse event listeners
  window.addEventListener('mousemove', (e) => {
    if (!isHovering) {
      isHovering = true;
      smoothMouseX = e.clientX;
      smoothMouseY = e.clientY;
      for (let i = 0; i < nodeCount; i++) {
        nodes[i].x = e.clientX;
        nodes[i].y = e.clientY;
        nodes[i].vx = 0;
        nodes[i].vy = 0;
      }
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseenter', (e) => {
    isHovering = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    smoothMouseX = mouseX;
    smoothMouseY = mouseY;
  });

  window.addEventListener('mouseleave', () => {
    isHovering = false;
  });

  // Spline interpolation between physical joints for continuous smooth metaballs
  function getSplinePoint(t) {
    const p = t * (nodeCount - 1);
    const i = Math.min(Math.floor(p), nodeCount - 2);
    const localT = p - i;

    const p0 = nodes[Math.max(i - 1, 0)];
    const p1 = nodes[i];
    const p2 = nodes[i + 1];
    const p3 = nodes[Math.min(i + 2, nodeCount - 1)];

    const t2 = localT * localT;
    const t3 = t2 * localT;

    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    return { x, y };
  }

  // -------------------------------------------------------------
  // Main Animation & Physics Loop (60 FPS)
  // -------------------------------------------------------------
  function animate(now) {
    requestAnimationFrame(animate);

    // Filter raw mouse inputs to eliminate twitchy acceleration
    smoothMouseX += (mouseX - smoothMouseX) * 0.18;
    smoothMouseY += (mouseY - smoothMouseY) * 0.18;

    // Track mouse velocity
    const mdx = mouseX - prevMouseX;
    const mdy = mouseY - prevMouseY;
    const instantSpeed = Math.hypot(mdx, mdy);
    mouseSpeed += (instantSpeed - mouseSpeed) * 0.15;
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // -------------------------------------------------------------
    // Motion-Driven Life: Completely dissolves when still
    // -------------------------------------------------------------
    if (isHovering && instantSpeed > FLUID_CONFIG.motionThreshold) {
      // In motion: build activity smoothly
      const targetActivity = Math.min(instantSpeed / 8.0, 1.0);
      motionActivity += (targetActivity - motionActivity) * FLUID_CONFIG.growthSpeed;
    } else {
      // Still / stopped: decay rapidly to 0 so NOTHING appears when still
      motionActivity *= FLUID_CONFIG.decaySpeed;
      if (motionActivity < 0.004) motionActivity = 0;
    }

    const targetAlpha = isHovering ? motionActivity : 0;
    const targetScale = isHovering ? (0.3 + motionActivity * 0.7) : 0;

    currentAlpha += (targetAlpha - currentAlpha) * 0.20;
    currentScale += (targetScale - currentScale) * 0.20;

    // If completely dissolved, clear canvas and skip heavy shader calculation
    if (currentAlpha <= 0.003) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    // -------------------------------------------------------------
    // Physics Update: Head (Joint 0) - Viscous, smooth drag
    // -------------------------------------------------------------
    const head = nodes[0];
    head.vx = (head.vx * 0.80 + (smoothMouseX - head.x) * FLUID_CONFIG.headFollow) * 0.88;
    head.vy = (head.vy * 0.80 + (smoothMouseY - head.y) * FLUID_CONFIG.headFollow) * 0.88;
    head.x += head.vx;
    head.y += head.vy;

    // -------------------------------------------------------------
    // Physics Update: Body & Tail Joints (1 to N-1) - Heavy fluid lag
    // -------------------------------------------------------------
    for (let i = 1; i < nodeCount; i++) {
      const curr = nodes[i];
      const prev = nodes[i - 1];

      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;

      // Smooth viscous drag with inertia and subtle downward gravity
      curr.vx = (curr.vx * FLUID_CONFIG.inertia + dx * FLUID_CONFIG.jointFollow) * FLUID_CONFIG.jointDamping;
      curr.vy = (curr.vy * FLUID_CONFIG.inertia + dy * FLUID_CONFIG.jointFollow + FLUID_CONFIG.gravity) * FLUID_CONFIG.jointDamping;

      curr.x += curr.vx;
      curr.y += curr.vy;
    }

    // -------------------------------------------------------------
    // Generate Metaball Data along the Spline
    // -------------------------------------------------------------
    const renderCount = FLUID_CONFIG.renderBallCount;
    const baseRadius = FLUID_CONFIG.fluidSize * currentScale;
    const stretchRatio = Math.min(mouseSpeed / 25, 1.0);

    for (let k = 0; k < renderCount; k++) {
      const t = k / (renderCount - 1);
      const pt = getSplinePoint(t);

      // Tail radius tapering & dynamic speed elongation
      const taper = 1.0 - t * (1.0 - FLUID_CONFIG.tailTaper);
      const midThinning = 1.0 - Math.sin(t * Math.PI) * (stretchRatio * 0.25);
      const r = baseRadius * taper * midThinning;

      // WebGL coordinates (Y is inverted: 0 at bottom)
      const glX = pt.x * dpr;
      const glY = (window.innerHeight - pt.y) * dpr;
      const glR = r * dpr;

      const idx = k * 3;
      ballsArray[idx] = glX;
      ballsArray[idx + 1] = glY;
      ballsArray[idx + 2] = glR;
    }

    // -------------------------------------------------------------
    // Render Frame via WebGL with Color Inversion
    // -------------------------------------------------------------
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform3fv(uBallsLoc, ballsArray);
    gl.uniform1i(uCountLoc, renderCount);
    gl.uniform2f(uResLoc, canvas.width, canvas.height);
    gl.uniform3fv(uColorLoc, invertColorRgb);
    gl.uniform1f(uAlphaLoc, currentAlpha);
    gl.uniform1f(uTimeLoc, now * 0.001);
    gl.uniform1f(uDefLoc, FLUID_CONFIG.deformationStrength);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  requestAnimationFrame(animate);
}
