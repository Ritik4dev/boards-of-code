import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * 3D FOLDED INFINITE SCROLLING TYPE WALL
 * Replaces the static manifesto paragraphs with a continuously-scrolling
 * 3D-perspective "folded" cylinder wall of massive display typography.
 */

// 6 repeating row template definitions
export const TYPEWALL_ROWS = [
  // 1. Bold modern serif (Didone)
  {
    type: 'row-serif',
    left: 'ANDREW',
    center: 'NEW YORK',
    right: 'ANDREW',
    centerAccent: false
  },
  // 2. Bold grotesk / sans
  {
    type: 'row-grotesk',
    left: 'SANDECA',
    center: 'BUDAPEST',
    right: 'SANDECA',
    centerAccent: false
  },
  // 3. 3D extruded block / halftone shadow
  {
    type: 'row-extruded',
    left: 'FRANKLIN',
    center: 'BERLIN',
    right: 'FRANKLIN',
    isExtruded: true,
    centerAccent: false
  },
  // 4. Bold condensed geometric sans + hairline serif
  {
    type: 'row-condensed',
    left: 'TOKYO',
    center: 'HOSHEN',
    right: 'TOKYO',
    centerAccent: false
  },
  // 5. Elegant thin serif + extended bold sans
  {
    type: 'row-extended',
    left: 'BOCELLI',
    center: 'BARCELONA',
    right: 'BOCELLI',
    centerAccent: false
  },
  // 6. Swiss brand signature row (Deadspace Lab)
  {
    type: 'row-deadspace',
    left: 'SYSTEM',
    center: 'DEADSPACE',
    right: 'CONTROL',
    centerAccent: true
  }
];

export function initTypeWallManifesto() {
  const section = document.getElementById('manifesto');
  if (!section) return;

  const stage = section.querySelector('.typewall-stage');
  const track = section.querySelector('.typewall-track');
  if (!stage || !track) return;

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    track.classList.add('is-reduced-motion');
    return;
  }

  // Generate 3 repeats of the 6-row template for a seamless 18-row infinite loop
  const TOTAL_SETS = 3;
  const rowsData = [];
  for (let s = 0; s < TOTAL_SETS; s++) {
    for (let r = 0; r < TYPEWALL_ROWS.length; r++) {
      rowsData.push({
        ...TYPEWALL_ROWS[r],
        uniqueId: `r_${s}_${r}`
      });
    }
  }

  // Populate rows into DOM
  track.innerHTML = '';
  const rowElements = [];

  rowsData.forEach((item) => {
    const rowEl = document.createElement('div');
    rowEl.className = `typewall-row ${item.type}`;
    if (item.centerAccent) rowEl.classList.add('has-accent');

    if (item.isExtruded) {
      // Row 3: 3D-extruded block typography with halftone dots
      rowEl.innerHTML = `
        <div class="row-inner">
          <span class="tw-part tw-extruded">${item.left}</span>
          <span class="tw-part tw-thin">${item.center}</span>
          <span class="tw-part tw-extruded">${item.right}</span>
          <span class="tw-part tw-extruded" aria-hidden="true">${item.left}</span>
          <span class="tw-part tw-thin" aria-hidden="true">${item.center}</span>
        </div>
      `;
    } else {
      // Standard multi-font rows
      rowEl.innerHTML = `
        <div class="row-inner">
          <span class="tw-part tw-outer">${item.left}</span>
          <span class="tw-part tw-center ${item.centerAccent ? 'tw-accent' : ''}">${item.center}</span>
          <span class="tw-part tw-outer">${item.right}</span>
          <span class="tw-part tw-outer" aria-hidden="true">${item.left}</span>
          <span class="tw-part tw-center ${item.centerAccent ? 'tw-accent' : ''}" aria-hidden="true">${item.center}</span>
        </div>
      `;
    }

    track.appendChild(rowEl);
    rowElements.push(rowEl);
  });

  // Kinetic state
  let stageHeight = stage.clientHeight || window.innerHeight;
  let stageCenter = stageHeight / 2;
  let rowHeight = Math.max(78, Math.min(125, stageHeight * 0.13));
  const singleCycleHeight = TYPEWALL_ROWS.length * rowHeight;
  const totalTrackHeight = rowsData.length * rowHeight;

  let currentY = 0;
  const baseSpeed = 1.1; // pixels per frame
  let scrollInfluence = 0;
  let isSectionVisible = true;

  function updateDimensions() {
    stageHeight = stage.clientHeight || window.innerHeight;
    stageCenter = stageHeight / 2;
    rowHeight = Math.max(78, Math.min(125, stageHeight * 0.13));
  }

  window.addEventListener('resize', updateDimensions, { passive: true });

  // Monitor visibility to sleep RAF when out of view
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onEnter: () => { isSectionVisible = true; },
    onLeave: () => { isSectionVisible = false; },
    onEnterBack: () => { isSectionVisible = true; },
    onLeaveBack: () => { isSectionVisible = false; },
    onUpdate: (self) => {
      // Add subtle acceleration on user scrolling
      scrollInfluence = self.getVelocity() * 0.015;
    }
  });

  let lastTime = performance.now();

  function render(time) {
    requestAnimationFrame(render);

    if (!isSectionVisible) {
      lastTime = time;
      return;
    }

    const dt = Math.min(2.5, (time - lastTime) / 16.666);
    lastTime = time;

    // Decay user scroll influence smoothly
    scrollInfluence *= 0.92;

    // Advance vertical position upwards
    currentY += (baseSpeed - scrollInfluence) * dt;

    // Modulo wrap-around for seamless infinite continuity
    if (currentY >= singleCycleHeight) {
      currentY -= singleCycleHeight;
    } else if (currentY < 0) {
      currentY += singleCycleHeight;
    }

    const halfStage = stageHeight / 2;

    // Apply 3D Cylinder Fold to each row
    for (let i = 0; i < rowElements.length; i++) {
      const row = rowElements[i];
      let rawY = (i * rowHeight - currentY);

      // Wrap individual row into visible + buffer range
      while (rawY < -rowHeight * 2) {
        rawY += totalTrackHeight;
      }
      while (rawY > totalTrackHeight - rowHeight * 2) {
        rawY -= totalTrackHeight;
      }

      // If well outside the cylinder viewport, hide it
      if (rawY < -rowHeight * 2 || rawY > stageHeight + rowHeight * 1.5) {
        row.style.visibility = 'hidden';
        continue;
      }

      row.style.visibility = 'visible';

      const rowCenter = rawY + rowHeight / 2;
      const normDist = (rowCenter - stageCenter) / halfStage;
      const absDist = Math.abs(normDist);

      // 3D Cylinder Mathematics:
      // Rows at center (normDist = 0) are flat (angle = 0, scaleY = 1, z = 0).
      // Rows curving away above/below rotate along X axis up to ~70 degrees.
      const angle = -normDist * 68;
      const foreshorten = Math.max(0.18, Math.cos(Math.min(1.25, absDist) * 1.15));
      const zDepth = -Math.pow(Math.min(1.5, absDist), 1.4) * 160;
      const shear = -normDist * 5.5; // subtle raking perspective
      const opacity = Math.max(0.15, 1 - Math.pow(Math.min(1.4, absDist), 3.2) * 0.55);

      row.style.transform = `translate3d(0, ${rawY.toFixed(1)}px, ${zDepth.toFixed(1)}px) rotateX(${angle.toFixed(1)}deg) scaleY(${foreshorten.toFixed(3)}) skewX(${shear.toFixed(1)}deg)`;
      row.style.opacity = opacity.toFixed(2);
    }
  }

  requestAnimationFrame(render);
}
