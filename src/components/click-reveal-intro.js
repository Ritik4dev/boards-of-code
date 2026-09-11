/**
 * CLICK-TO-REVEAL CINEMATIC INTRO TRANSITION
 * 
 * Re-creates the experience of `hero-25-650.webm`:
 * 1. Full-screen black intro layer hiding the underlying website.
 * 2. Minimal centered "CLICK TO REVEAL" instruction.
 * 3. User clicks anywhere on the screen:
 *    - Click coordinates become the exact origin of the reveal.
 *    - Instruction vanishes immediately.
 *    - An energetic electric-blue organic WebGL boundary forms.
 *    - The interior opens up progressively, uncovering the real underlying website.
 *    - The procedural blue rim expands rapidly to and beyond all viewport corners.
 * 4. Once fully revealed:
 *    - The overlay is cleanly removed from the DOM.
 *    - Scroll is unlocked.
 *    - WebGL animation loop is stopped (0% GPU/CPU overhead).
 *    - Normal website interaction resumes.
 */

import gsap from 'gsap';

// =============================================================================
// EFFECT CONFIGURATION
// Easily tune all timing, geometry, noise, and color parameters
// =============================================================================
export const INTRO_CONFIG = {
  // Color & Appearance
  blueColor: '#001DFF',          // Highly-saturated electric blue (#001DFF / #1515FF)
  rimWidth: 55,                  // Thickness of electric blue organic rim in pixels
  rimCoreBrightness: 0.85,       // Luminous intensity of inner energy core
  
  // Geometry & Deformation
  initialRadius: 6,              // Microscopic starting nucleus at click point
  noiseStrength: 0.16,           // Amplitude of organic boundary distortion
  noiseFrequency: 4.8,           // Angular wave count around the perimeter
  deformationSpeed: 2.2,         // Speed of procedural surface-tension evolution
  
  // Timing & Physics
  revealDuration: 1.85,          // Total expansion duration in seconds (1.5–2.2s)
  revealEase: 'power2.inOut',    // Acceleration and energetic expansion curve
  reducedMotionDuration: 0.4,    // Fallback duration if prefers-reduced-motion is active
  
  // Performance & Lifecycle
  sessionPersist: false          // Set to true to store reveal state in sessionStorage
};

// Helper: Convert hex to normalized RGB array [0..1]
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

// Fragment Shader: Organic Electric-Blue Mask Reveal
const FRAG_SHADER_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_click;
uniform float u_radius;
uniform float u_time;
uniform vec3 u_blueColor;
uniform float u_rimWidth;
uniform float u_noiseStrength;
uniform float u_noiseFreq;

// Fast procedural pseudo-noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
  for (int i = 0; i < 3; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 delta = pixel - u_click;
  float dist = length(delta);
  float angle = atan(delta.y, delta.x);

  // Organic angle-based and surface-based liquid deformation
  vec2 noiseCoord1 = vec2(cos(angle) * u_noiseFreq, sin(angle) * u_noiseFreq) + vec2(u_time * 1.6, u_time * 1.2);
  vec2 noiseCoord2 = pixel * 0.007 + vec2(u_time * 0.9, -u_time * 0.7);

  float n1 = fbm(noiseCoord1);
  float n2 = fbm(noiseCoord2);

  // Boundary offset combines radial waves and fluid tendrils
  float organicOffset = ((n1 * 0.65 + n2 * 0.35) - 0.5) * (u_radius * u_noiseStrength + 20.0);
  float effectiveDist = dist - organicOffset;

  float innerR = u_radius;
  float outerR = u_radius + u_rimWidth;

  // 1. Center: Opened area (transparent to reveal website underneath)
  if (effectiveDist < innerR) {
    float innerEdge = smoothstep(innerR - 4.0, innerR, effectiveDist);
    gl_FragColor = vec4(u_blueColor * innerEdge, innerEdge);
    return;
  }

  // 2. Electric Blue Organic Rim: High-energy boundary with bright plasma core
  if (effectiveDist < outerR) {
    float rimPos = (effectiveDist - innerR) / max(u_rimWidth, 1.0);
    float intensity = sin(rimPos * 3.14159265);
    float blueAlpha = smoothstep(outerR, outerR - 4.0, effectiveDist);

    // Deep luminous electric blue with luminous core highlight
    vec3 col = mix(u_blueColor, vec3(0.0), rimPos * 0.55);
    col += vec3(0.35, 0.55, 1.0) * pow(intensity, 2.2) * 0.85;

    gl_FragColor = vec4(col, blueAlpha);
    return;
  }

  // 3. Outside: Pure black overlay hiding the website
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export function initClickRevealIntro(lenisInstance = null) {
  // Session check if persistence is desired
  if (INTRO_CONFIG.sessionPersist && sessionStorage.getItem('deadspace_intro_revealed')) {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) overlay.remove();
    return;
  }

  const overlay = document.getElementById('intro-overlay');
  const canvas = document.getElementById('intro-canvas');
  const prompt = document.getElementById('intro-prompt');

  if (!overlay || !canvas) return;

  // -------------------------------------------------------------
  // 1. Lock document scrolling & pause Lenis while intro is active
  // -------------------------------------------------------------
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  if (lenisInstance) {
    lenisInstance.stop();
  }

  // -------------------------------------------------------------
  // 2. Initialize WebGL Context
  // -------------------------------------------------------------
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });

  if (!gl) {
    console.warn('[IntroReveal] WebGL unavailable, falling back to CSS fade.');
    overlay.addEventListener('click', () => {
      overlay.style.transition = 'opacity 0.8s ease';
      overlay.style.opacity = '0';
      setTimeout(cleanup, 800);
    });
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

  // Full-screen quad buffer
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
  const uResLoc = gl.getUniformLocation(program, 'u_resolution');
  const uClickLoc = gl.getUniformLocation(program, 'u_click');
  const uRadiusLoc = gl.getUniformLocation(program, 'u_radius');
  const uTimeLoc = gl.getUniformLocation(program, 'u_time');
  const uBlueColorLoc = gl.getUniformLocation(program, 'u_blueColor');
  const uRimWidthLoc = gl.getUniformLocation(program, 'u_rimWidth');
  const uNoiseStrengthLoc = gl.getUniformLocation(program, 'u_noiseStrength');
  const uNoiseFreqLoc = gl.getUniformLocation(program, 'u_noiseFreq');

  // State
  let dpr = Math.min(window.devicePixelRatio || 1, 2.0);
  let isRevealing = false;
  let isComplete = false;
  let currentRadius = 0;
  let clickX = window.innerWidth * 0.5;
  let clickY = window.innerHeight * 0.5;
  let animFrameId = null;
  const startTime = performance.now();

  const blueRgb = hexToRgb(INTRO_CONFIG.blueColor);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Initial draw: Pure black screen
  function drawFrame(timeNow) {
    const elapsedSec = (timeNow - startTime) * 0.001;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Convert click coordinates to WebGL pixel coordinates (0 at bottom)
    const glClickX = clickX * dpr;
    const glClickY = (window.innerHeight - clickY) * dpr;
    const glRadius = currentRadius * dpr;
    const glRimWidth = INTRO_CONFIG.rimWidth * dpr;

    gl.uniform2f(uResLoc, canvas.width, canvas.height);
    gl.uniform2f(uClickLoc, glClickX, glClickY);
    gl.uniform1f(uRadiusLoc, glRadius);
    gl.uniform1f(uTimeLoc, elapsedSec * INTRO_CONFIG.deformationSpeed);
    gl.uniform3fv(uBlueColorLoc, blueRgb);
    gl.uniform1f(uRimWidthLoc, glRimWidth);
    gl.uniform1f(uNoiseStrengthLoc, INTRO_CONFIG.noiseStrength);
    gl.uniform1f(uNoiseFreqLoc, INTRO_CONFIG.noiseFrequency);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!isComplete) {
      animFrameId = requestAnimationFrame(drawFrame);
    }
  }

  // Start render loop
  animFrameId = requestAnimationFrame(drawFrame);

  // -------------------------------------------------------------
  // 3. Clean Final State Cleanup (Section 36)
  // -------------------------------------------------------------
  function cleanup() {
    isComplete = true;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }

    // Unlock document scrolling & resume Lenis
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (lenisInstance) {
      lenisInstance.start();
    }

    // Completely remove intro elements from DOM
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    if (INTRO_CONFIG.sessionPersist) {
      sessionStorage.setItem('deadspace_intro_revealed', 'true');
    }
  }

  // -------------------------------------------------------------
  // 4. Trigger Reveal from Click Position (Section 3 & 4)
  // -------------------------------------------------------------
  function triggerReveal(x, y) {
    if (isRevealing || isComplete) return;
    isRevealing = true;

    clickX = x;
    clickY = y;

    // Immediately hide "CLICK TO REVEAL" instruction (Section 27)
    if (prompt) {
      prompt.classList.add('is-hidden');
    }

    // Calculate maximum distance to the furthest viewport corner (Section 20)
    const maxCornerDist = Math.hypot(
      Math.max(clickX, window.innerWidth - clickX),
      Math.max(clickY, window.innerHeight - clickY)
    );
    // Add extra padding to guarantee all organic tendrils clear the screen
    const targetMaxRadius = maxCornerDist + INTRO_CONFIG.rimWidth + 80;

    // Check prefers-reduced-motion (Section 32)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? INTRO_CONFIG.reducedMotionDuration : INTRO_CONFIG.revealDuration;

    currentRadius = INTRO_CONFIG.initialRadius;

    // Animate expansion energetically
    gsap.to({ r: INTRO_CONFIG.initialRadius }, {
      r: targetMaxRadius,
      duration: duration,
      ease: prefersReducedMotion ? 'power1.out' : INTRO_CONFIG.revealEase,
      onUpdate: function() {
        currentRadius = this.targets()[0].r;
      },
      onComplete: () => {
        cleanup();
      }
    });
  }

  // Click & Touch listeners
  overlay.addEventListener('click', (e) => {
    triggerReveal(e.clientX, e.clientY);
  });

  overlay.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      triggerReveal(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Keyboard accessibility (Enter or Space triggers from center)
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerReveal(window.innerWidth * 0.5, window.innerHeight * 0.5);
      window.removeEventListener('keydown', handleKeyDown);
    }
  }
  window.addEventListener('keydown', handleKeyDown);
}
