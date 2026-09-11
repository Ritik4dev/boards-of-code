import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initRadialWipe() {
  const wipeSection = document.getElementById('wipe-section');
  const wipeDisc = document.getElementById('wipe-disc');
  const textOverlay = document.getElementById('wipe-text-overlay');
  const wordIdeas = document.getElementById('word-ideas');
  const wordEmerge = document.getElementById('word-emerge');
  const wordExperimentation = document.getElementById('word-experimentation');

  if (!wipeSection || !wipeDisc || !textOverlay) return;

  // Initial states: words are hidden, disc starts at 0deg sweep
  const sweepProxy = { deg: 0 };
  gsap.set([wordIdeas, wordEmerge, wordExperimentation], { opacity: 0, y: 15 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wipeSection,
      start: 'top top',
      end: '+=120%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1
    }
  });

  // -------------------------------------------------------------
  // Phase 1: Clockwise sweep from 0deg to 360deg (black background)
  // -------------------------------------------------------------
  tl.to(sweepProxy, {
    deg: 360,
    duration: 1.0,
    ease: 'power1.inOut',
    onUpdate: () => {
      wipeDisc.style.setProperty('--sweep-deg', `${sweepProxy.deg}deg`);
    }
  });

  // -------------------------------------------------------------
  // Phase 2: Circle expands to fill the viewport
  // CRITICAL: The text does NOT expand with the circle!
  // The text remains fixed at its normal font size and appears sequentially.
  // Once expanded, background is pure red and text remains 100% opaque.
  // -------------------------------------------------------------
  const stage = wipeSection.querySelector('.wipe-sticky-stage');

  tl.to(wipeDisc, {
    scale: 18,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: function() {
      if (this.progress() > 0.35) {
        wipeSection.style.backgroundColor = 'var(--color-red)';
        if (stage) stage.style.backgroundColor = 'var(--color-red)';
        wipeSection.classList.add('is-red-bg');
      } else {
        wipeSection.style.backgroundColor = 'var(--color-black)';
        if (stage) stage.style.backgroundColor = 'var(--color-black)';
        wipeSection.classList.remove('is-red-bg');
      }
    }
  });

  // "IDEAS" appears as the circle starts expanding
  tl.to(wordIdeas, {
    opacity: 1,
    y: 0,
    duration: 0.35,
    ease: 'power2.out'
  }, '<+=0.15');

  // "EMERGE THROUGH CONTROLLED" appears as the circle expands further
  tl.to(wordEmerge, {
    opacity: 1,
    y: 0,
    duration: 0.35,
    ease: 'power2.out'
  }, '<+=0.25');

  // "EXPERIMENTATION." appears on line 2 as the circle completes full screen coverage
  tl.to(wordExperimentation, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: 'power2.out'
  }, '<+=0.25');

  // NO fade out! Text remains 100% visible and unpins immediately into the stats section.
  return tl;
}
