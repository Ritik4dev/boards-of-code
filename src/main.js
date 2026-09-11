import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { WebGLHero } from './components/webgl-hero.js';
import { initRadialWipe } from './components/radial-wipe.js';
import { initChrome } from './components/chrome.js';
import { initDirectorsRoster } from './components/directors-roster.js';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.1,
    touchMultiplier: 2
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // 2. Initialize HUD Chrome & Interactive Systems
  initChrome();

  // 3. Initialize Directors Roster Hover-Reveal Section
  initDirectorsRoster();

  // 3. Initialize WebGL Hero 3D Halftone Scene
  const canvasContainer = document.getElementById('webgl-canvas-container');
  let webglHero = null;
  if (canvasContainer) {
    webglHero = new WebGLHero(canvasContainer);
  }

  // 4. Initialize Signature Radial Wipe Transition
  initRadialWipe();

  // 5. Scroll Reveals for Manifesto
  gsap.from('.manifesto-text.p1', {
    scrollTrigger: {
      trigger: '.manifesto-text.p1',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 50,
    duration: 1.2,
    ease: 'power3.out'
  });

  gsap.from('.manifesto-text.p2', {
    scrollTrigger: {
      trigger: '.manifesto-text.p2',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 50,
    duration: 1.2,
    ease: 'power3.out'
  });

  // 6. Pin LAB OVERVIEW (Left Column) stationary while Stats Cards (Right Column) scroll
  ScrollTrigger.create({
    trigger: '.stats-overview-grid',
    start: 'top 16%',
    end: 'bottom bottom-=100',
    pin: '.overview-sticky',
    pinSpacing: false
  });

  // 7. Scroll Reveals for Stats Cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      x: 40,
      duration: 1.0,
      ease: 'power2.out'
    });
  });

  // 7. Parallax linkage between scroll and 3D hero
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      if (webglHero) {
        webglHero.updateOnScroll(self.progress);
      }
    }
  });

  // Refresh ScrollTrigger after assets load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});
