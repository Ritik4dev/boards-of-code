export function initChrome() {
  const hudTop = document.getElementById('hud-top');
  const hudTimer = document.getElementById('hud-timer');
  const footerTime = document.getElementById('footer-time');
  const cueBtn = document.getElementById('cue-btn');

  // 1. Live ticking clock
  function updateClocks() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (hudTimer) {
      hudTimer.textContent = `${hours}:${minutes}`;
    }
    if (footerTime) {
      footerTime.textContent = `UTC // ${hours}:${minutes}:${seconds}`;
    }
  }

  updateClocks();
  setInterval(updateClocks, 1000);

  // 2. Dynamic HUD Color Inversion based on section background
  // Sections with RED background: #hero, #statement-stats, #client-network
  // Sections with BLACK background: #manifesto, #wipe-section, #connect-footer
  const redSections = ['hero', 'statement-stats', 'client-network'];

  function checkHudTheme() {
    if (!hudTop) return;
    const hudY = 32; // sampling point near top

    let isOverRed = false;

    for (const id of redSections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= hudY && rect.bottom >= hudY) {
          isOverRed = true;
          break;
        }
      }
    }

    if (!isOverRed) {
      const wipe = document.getElementById('wipe-section');
      if (wipe && wipe.classList.contains('is-red-bg')) {
        const rect = wipe.getBoundingClientRect();
        if (rect.top <= hudY && rect.bottom >= hudY) {
          isOverRed = true;
        }
      }
    }

    if (isOverRed) {
      hudTop.classList.add('theme-red-bg');
      hudTop.classList.remove('theme-black-bg');
    } else {
      hudTop.classList.add('theme-black-bg');
      hudTop.classList.remove('theme-red-bg');
    }
  }

  window.addEventListener('scroll', checkHudTheme, { passive: true });
  checkHudTheme();

  // 3. Pinned Bottom Cue Button interaction
  if (cueBtn) {
    cueBtn.addEventListener('click', () => {
      // Toggle back to top or next section
      if (window.scrollY > window.innerHeight * 1.5) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const manifesto = document.getElementById('manifesto');
        if (manifesto) {
          manifesto.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // 4. Populate Client Network Cloud
  const networkCloud = document.getElementById('network-cloud');
  if (networkCloud) {
    const clientEntries = [
      "SYNTHESIS PROTOCOL // ADVANCED SPATIAL RESEARCH",
      "DEPT-0848 HYPER-STRUCTURES / EXPERIMENTAL LABS",
      "VECTOR FIELD DYNAMICS // MATRIX INTERFACES",
      "FRAME PRODUCTION GROUP // OPTICAL SYSTEMS 04",
      "CONTINUOUS CONTROL LOGIC / COMPUTATION / STAGE 01",
      "EXP_KINETIC TYPOGRAPHY / ARCHIVE RESEARCH",
      "SYSTEM ALGO-00192 // DENSITY METRICS",
      "BALANCE REFINEMENT // QUANTUM INTERACTION",
      "OBSERVATION GROUP // STRUCTURAL INTERFACES",
      "SIGNAL ROUTING // CORE MEMORY ALLOCATION",
      "BALANCED KINETICS / ITERATION 01 / RESOLUTION TEST",
      "DISTRIBUTED LOGIC // RECORD IDENTIFIER 004",
      "SYSTEM RECONSTRUCTION // COHERENCE PROTOCOL",
      "CLEAR RESTRAINT // MEASURED RESPONSE LAB",
      "ARCHIVE RETRIEVAL // PRODUCTION TIMELINES ZERO",
      "MODULAR PROTOTYPE 11 // RUNTIME 08.48.291",
      "ALL SYSTEMS ACTIVE // CONTINUOUS SAMPLING"
    ];

    networkCloud.innerHTML = clientEntries
      .map(entry => `<div class="network-entry">${entry}</div>`)
      .join('\n');
  }
}
