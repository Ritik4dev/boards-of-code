import gsap from 'gsap';

/**
 * DIRECTORS ROSTER DATA
 * Data-driven list of 9 directors. Can be updated with new names or photos at any time.
 */
export const DIRECTORS_DATA = [
  { id: 1, name: 'MARCUS', image: '/directors/director_1.png' },
  { id: 2, name: 'ELENA', image: '/directors/director_2.png' },
  { id: 3, name: 'MALIK', image: '/directors/director_3.png' },
  { id: 4, name: 'GABRIEL', image: '/directors/director_4.png' },
  { id: 5, name: 'SPENCER', image: '/directors/director_5.png' },
  { id: 6, name: 'HANS', image: '/directors/director_6.png' },
  { id: 7, name: 'DAVID', image: '/directors/director_7.png' },
  { id: 8, name: 'THADDEUS', image: '/directors/director_8.png' },
  { id: 9, name: 'PEYTON', image: '/directors/director_9.png' }
];

const DEFAULT_TITLE = 'DIRECTORS';

export function initDirectorsRoster() {
  const section = document.getElementById('directors-roster');
  if (!section) return;

  const dock = section.querySelector('.directors-dock');
  const items = section.querySelectorAll('.roster-item');
  const ctaBubble = section.querySelector('.roster-cta-bubble');
  const headlineStage = section.querySelector('.roster-headline-stage');

  if (!dock || !headlineStage) return;

  // Dual-layer Wave-Bending Rolling Typography System
  const layerA = headlineStage.querySelector('.word-layer.layer-a');
  const layerB = headlineStage.querySelector('.word-layer.layer-b');

  let activeLayer = layerA;
  let inactiveLayer = layerB;
  let currentWord = DEFAULT_TITLE;
  let activeTimeline = null;
  let isBubbleVisible = false;

  /**
   * Populate individual character spans for organic wave bending & rolling physics
   */
  function populateLayerChars(layer, word, isDefault) {
    const charsWrap = layer.querySelector('.word-chars');
    if (!charsWrap) return;

    charsWrap.innerHTML = '';
    const letters = word.split('');
    letters.forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char-span';
      span.textContent = ch;
      charsWrap.appendChild(span);
    });

    if (isDefault) {
      layer.classList.remove('is-active-name');
      layer.classList.add('is-default-title');
    } else {
      layer.classList.remove('is-default-title');
      layer.classList.add('is-active-name');
    }

    headlineStage.setAttribute('aria-label', word);
  }

  // Initialize Layer A with default "DIRECTORS"
  populateLayerChars(layerA, DEFAULT_TITLE, true);
  gsap.set(layerA, { opacity: 1, visibility: 'visible' });
  gsap.set(layerB, { opacity: 0, visibility: 'hidden' });

  /**
   * Wave-Bending Vertical Rolling Transition:
   * - Outgoing word plunges DOWN with center dropping first (bending downward arch)
   * - Incoming word emerges UP from below with center rising first (bending upward arch)
   * - Fast, snappy, physical kinetics (~350ms) matching hover-18-650.webm
   */
  function triggerWaveTransition(newWord, isDefault) {
    if (newWord === currentWord) return;

    if (activeTimeline) {
      activeTimeline.kill();
    }

    const outgoing = activeLayer;
    const incoming = inactiveLayer;

    // Setup incoming layer content
    populateLayerChars(incoming, newWord, isDefault);

    const outChars = outgoing.querySelectorAll('.char-span');
    const inChars = incoming.querySelectorAll('.char-span');

    // Make incoming layer visible and position below stage
    gsap.set(incoming, { opacity: 1, visibility: 'visible', zIndex: 2 });
    gsap.set(outgoing, { opacity: 1, visibility: 'visible', zIndex: 1 });

    // Initial position for incoming letters: completely below stage with 0 opacity
    gsap.set(inChars, {
      yPercent: 220,
      opacity: 0,
      scaleY: 1.12,
      scaleX: 0.95
    });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(outgoing, { opacity: 0, visibility: 'hidden', zIndex: 1 });
        gsap.set(incoming, { zIndex: 2 });
        inactiveLayer = outgoing;
        activeLayer = incoming;
        currentWord = newWord;
        activeTimeline = null;
      }
    });

    // 1. Outgoing letters plunge completely DOWN past the stage boundary and fade out
    tl.to(outChars, {
      yPercent: 220,
      opacity: 0,
      scaleY: 1.08,
      scaleX: 0.96,
      duration: 0.32,
      ease: 'power3.in',
      stagger: {
        from: 'center',
        amount: 0.08
      },
      onComplete: () => {
        gsap.set(outgoing, { opacity: 0, visibility: 'hidden' });
      }
    }, 0);

    // 2. Incoming letters emerge UP with center rising first
    tl.to(inChars, {
      yPercent: 0,
      opacity: 1,
      scaleY: 1,
      scaleX: 1,
      duration: 0.38,
      ease: 'power3.out',
      stagger: {
        from: 'center',
        amount: 0.08
      }
    }, 0.12);

    activeTimeline = tl;
  }

  /**
   * Position and animate the red CTA bubble (↗) attached to hovered thumbnail
   */
  function updateCtaBubble(thumbItem) {
    if (!ctaBubble || !thumbItem) return;

    const dockRect = dock.getBoundingClientRect();
    const itemRect = thumbItem.getBoundingClientRect();

    // Compute center of hovered thumbnail relative to dock container
    const centerX = (itemRect.left + itemRect.width / 2) - dockRect.left;
    const centerY = (itemRect.top + itemRect.height / 2) - dockRect.top;

    // Position attached to bottom-right edge of the ~1.85x enlarged thumbnail
    const targetX = centerX + 34;
    const targetY = centerY + 34;

    if (!isBubbleVisible) {
      isBubbleVisible = true;
      gsap.killTweensOf(ctaBubble);
      gsap.set(ctaBubble, {
        x: targetX,
        y: targetY,
        scale: 0,
        opacity: 1
      });
      gsap.to(ctaBubble, {
        scale: 1,
        duration: 0.28,
        ease: 'back.out(2)'
      });
    } else {
      // Smooth glide between adjacent thumbnails
      gsap.to(ctaBubble, {
        x: targetX,
        y: targetY,
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  }

  function hideCtaBubble() {
    if (!ctaBubble || !isBubbleVisible) return;
    isBubbleVisible = false;
    gsap.to(ctaBubble, {
      scale: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(ctaBubble, { opacity: 0 });
      }
    });
  }

  // Bind hover interactions to thumbnails
  items.forEach((item) => {
    const directorName = item.dataset.name || DEFAULT_TITLE;

    const handleEnter = () => {
      // Scale and activate current item
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-hovered');
        }
      });
      item.classList.add('is-hovered');

      // Update CTA Bubble
      updateCtaBubble(item);

      // Trigger wave-bending name swap to director name (red)
      triggerWaveTransition(directorName, false);
    };

    item.addEventListener('mouseenter', handleEnter);
    item.addEventListener('focus', handleEnter);
  });

  // Dock mouse leave: revert to default "DIRECTORS"
  dock.addEventListener('mouseleave', () => {
    items.forEach(item => item.classList.remove('is-hovered'));
    hideCtaBubble();
    triggerWaveTransition(DEFAULT_TITLE, true);
  });

  // Handle window resize for dynamic CTA re-alignment
  window.addEventListener('resize', () => {
    const activeItem = dock.querySelector('.roster-item.is-hovered');
    if (activeItem && isBubbleVisible) {
      updateCtaBubble(activeItem);
    }
  }, { passive: true });
}
