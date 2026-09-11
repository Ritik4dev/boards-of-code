import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCircleTextRing } from './circle-text-ring.js';

gsap.registerPlugin(ScrollTrigger);

export function initRadialWipe() {
  const wipeSection = document.getElementById('wipe-section');
  const wipeDisc = document.getElementById('wipe-disc');
  const textOverlay = document.getElementById('wipe-text-overlay');
  const wordIdeas = document.getElementById('word-ideas');
  const wordEmerge = document.getElementById('word-emerge');
  const wordExperimentation = document.getElementById('word-experimentation');

  if (!wipeSection || !wipeDisc || !textOverlay) return;

  const elementWrap = wipeSection.querySelector('.wipe-element-wrap');
  const textRing = initCircleTextRing(elementWrap, wipeDisc);

  // Initial states
  gsap.set([wordIdeas, wordEmerge, wordExperimentation], { opacity: 0, y: 15 });
  gsap.set(wipeDisc, { scale: 1, rotation: 0, transformOrigin: '50% 50%' });
  if (textRing && textRing.ringWrap) {
    gsap.set(textRing.ringWrap, { scale: 1, rotation: 0, opacity: 1, transformOrigin: '0 0' });
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wipeSection,
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1
    }
  });

  const rotTargets = textRing && textRing.ringWrap ? [wipeDisc, textRing.ringWrap] : [wipeDisc];

  // -------------------------------------------------------------
  // Phase 1: Rotate Clockwise on scroll scrub (+120deg)
  // -------------------------------------------------------------
  tl.to(rotTargets, {
    rotation: 120,
    duration: 1.0,
    ease: 'power1.inOut'
  });

  // -------------------------------------------------------------
  // Phase 2: Reverse and Rotate Anticlockwise on scroll scrub (-60deg)
  // -------------------------------------------------------------
  tl.to(rotTargets, {
    rotation: -60,
    duration: 1.0,
    ease: 'power1.inOut'
  });

  // -------------------------------------------------------------
  // Phase 3: Circle expands to fill the viewport & text ring fades
  // -------------------------------------------------------------
  const stage = wipeSection.querySelector('.wipe-sticky-stage');

  tl.to(wipeDisc, {
    scale: 28,
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

  // Text ring scales in exact lockstep with circle expansion
  if (textRing && textRing.ringWrap) {
    tl.to(textRing.ringWrap, {
      scale: 28,
      duration: 1.2,
      ease: 'power2.inOut'
    }, '<');

    // Text ring gracefully fades out before the IDEAS headline emerges
    tl.to(textRing.ringWrap, {
      opacity: 0,
      duration: 0.25,
      ease: 'power1.in'
    }, '<+=0.06');
  }

  // "IDEAS" appears as the circle expands
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
