/**
 * DeadSpace Lab - Rotating Radial Text Ring Component
 *
 * Compact Swiss typographic seal with 20 radial spokes around a solid red circle.
 * Features 10 distinct typefaces, pure white editorial typography, and undulating
 * sinusoidal character waves along each word's radial baseline.
 *
 * Reference: text-2-650.webm & deadspace-circle-text-ring-prompt.md
 */

const WORDS_CONFIG = [
  { text: 'Denouement', styleClass: 'spoke-font-0' }, // Bodoni Moda High-Fashion Italic
  { text: 'Demure',     styleClass: 'spoke-font-1' }, // Cabinet Grotesk Wide Geometric
  { text: 'Chatoyant',  styleClass: 'spoke-font-2' }, // Anton Ultra-Bold Grotesk
  { text: 'Bungalow',   styleClass: 'spoke-font-3' }, // Space Mono Tech Monospace
  { text: 'Aurora',     styleClass: 'spoke-font-4' }, // Bodoni Moda 900 Heavy Roman
  { text: 'Lullaby',    styleClass: 'spoke-font-5' }, // Cormorant Garamond Delicate Serif Italic
  { text: 'Lagoon',     styleClass: 'spoke-font-6' }, // Syne Expressive Art Sans
  { text: 'Labyrinth',  styleClass: 'spoke-font-7' }, // Archivo Black Industrial Heavy
  { text: 'Idyllic',    styleClass: 'spoke-font-8' }, // JetBrains Mono Clean Tabular
  { text: 'Felicity',   styleClass: 'spoke-font-9' }  // Space Grotesk Swiss Brutalist
];

export function initCircleTextRing(parentContainer, discElement) {
  if (!parentContainer) return null;

  // Prevent duplicate instances
  const existingWrap = parentContainer.querySelector('.wipe-text-ring-wrap');
  if (existingWrap) existingWrap.remove();

  // Create outer wrap (scaled, rotated, and faded by GSAP ScrollTrigger)
  const ringWrap = document.createElement('div');
  ringWrap.className = 'wipe-text-ring-wrap';
  ringWrap.id = 'wipe-text-ring-wrap';
  ringWrap.setAttribute('aria-hidden', 'true');

  // Create inner spinner container
  const spinner = document.createElement('div');
  spinner.className = 'text-ring-spinner';
  spinner.id = 'text-ring-spinner';

  // 20 spokes: 10 unique words repeated twice for an even 360° ring (18° spacing)
  const spokes = [...WORDS_CONFIG, ...WORDS_CONFIG];
  const totalSpokes = spokes.length;
  const angleStep = 360 / totalSpokes;

  // Calculate compact radial distance (circle edge + 9px breathing space)
  const getRadius = () => {
    if (discElement && discElement.offsetWidth > 0) {
      return (discElement.offsetWidth / 2) + 9;
    }
    return 104; // Fallback: 95px disc radius + 9px gap
  };

  let currentRadius = getRadius();
  const spokeElements = [];

  spokes.forEach((item, index) => {
    const angle = index * angleStep;
    const spoke = document.createElement('div');
    spoke.className = `text-ring-spoke ${item.styleClass}`;
    spoke.dataset.angle = angle;
    spoke.style.transform = `rotate(${angle}deg) translate(${currentRadius}px, -50%)`;

    // Split text into individual characters for liquid wavy baseline animation
    Array.from(item.text).forEach((char, charIdx) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'ring-char';
      charSpan.textContent = char;
      // Stagger wave delay across both spoke index and character position
      const waveDelay = ((index * 0.14) + (charIdx * 0.08)).toFixed(3);
      charSpan.style.animationDelay = `${waveDelay}s`;
      spoke.appendChild(charSpan);
    });

    spinner.appendChild(spoke);
    spokeElements.push(spoke);
  });

  ringWrap.appendChild(spinner);
  parentContainer.appendChild(ringWrap);

  // Resize handler to maintain exact contact with disc perimeter on window resize
  const handleResize = () => {
    const newRadius = getRadius();
    if (Math.abs(newRadius - currentRadius) > 0.5) {
      currentRadius = newRadius;
      spokeElements.forEach((spoke) => {
        const angle = spoke.dataset.angle;
        spoke.style.transform = `rotate(${angle}deg) translate(${currentRadius}px, -50%)`;
      });
    }
  };

  window.addEventListener('resize', handleResize, { passive: true });

  // IntersectionObserver to pause wavy animation when offscreen (0% idle CPU/GPU consumption)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const chars = ringWrap.querySelectorAll('.ring-char');
      if (entry.isIntersecting) {
        chars.forEach((c) => { c.style.animationPlayState = 'running'; });
      } else {
        chars.forEach((c) => { c.style.animationPlayState = 'paused'; });
      }
    });
  }, { threshold: 0.05 });

  const wipeSection = document.getElementById('wipe-section');
  if (wipeSection) {
    observer.observe(wipeSection);
  }

  return {
    ringWrap,
    spinner,
    destroy() {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      ringWrap.remove();
    }
  };
}
