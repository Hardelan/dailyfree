// ==UserScript==
// @name         KeyDrop DailyCase Auto-Click (PL) - uproszczony
// @namespace    https://key-drop.com
// @version      1.7
// @description  Automatycznie klika pierwszy przycisk daily-case-level-card i kończy działanie.
// @match        https://key-drop.com/pl/daily-case/*
// @updateURL    https://raw.githubusercontent.com/Hardelan/dailyfree/main/dailyfree.user.js
// @downloadURL  https://raw.githubusercontent.com/Hardelan/dailyfree/main/dailyfree.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(async function () {
  'use strict';

  /************* SPRZĄTANIE UI *************/
  function cleanupUI() {
    // Twój oryginalny modal
    const specialCaseModal = document.querySelector('div[data-testid="special_case_modal"]');
    if (specialCaseModal) specialCaseModal.remove();

    // Kilka częstych nakładek, które mogą blokować kliknięcie
    const selectorsToRemove = [
      '[data-testid="modal_overlay"]',
      '[data-testid="global_modal"]',
      '[data-testid="special_case_overlay"]',
      '.ReactModal__Overlay',           // typowy overlay react-modal
      '.modal-backdrop',                // bootstrapowe backdropy
      '.cdk-overlay-container .cdk-overlay-backdrop' // angularowe
    ];

    selectorsToRemove.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        try { el.remove(); } catch {}
      });
    });
  }

  let mutationTimeout = null;
  const observer = new MutationObserver(() => {
    if (mutationTimeout) return;
    mutationTimeout = setTimeout(() => {
      cleanupUI();
      mutationTimeout = null;
    }, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  cleanupUI();

  /************* POMOCNICZE *************/
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function isDisabled(el) {
    if (!el) return true;
    const aria = el.getAttribute('aria-disabled');
    return el.disabled === true || aria === 'true' || el.classList.contains('disabled');
  }

  /************* SZUKANIE I KLIK PRZYCISKU *************/
  const MAX_WAIT_MS = 60_000; // maksymalnie 60s czekania
  const start = Date.now();
  let targetBtn = null;

  while (!targetBtn && (Date.now() - start) < MAX_WAIT_MS) {
    cleanupUI();
    const found = document.querySelector('button[data-testid="daily-case-page-lvl-open-btn"]');
    if (found) targetBtn = found;
    if (!targetBtn) await sleep(500);
  }

  if (!targetBtn) {
    observer.disconnect();
    return; // nie znaleziono przycisku
  }

  // Jeśli przycisk istnieje, ale jest chwilowo nieaktywny – poczekaj aż się odblokuje
  const enableStart = Date.now();
  while (isDisabled(targetBtn) && (Date.now() - enableStart) < 15_000) {
    await sleep(300);
  }

  // Scroll do przycisku + małe losowe opóźnienie dla „naturalności”
  try { targetBtn.scrollIntoView({ behavior: 'instant', block: 'center' }); } catch {}
  await sleep(400 + Math.floor(Math.random() * 600));

  // Ostateczne sprzątnięcie potencjalnych overlayów tuż przed kliknięciem
  cleanupUI();

  // Kliknięcie (z próbą „ręcznej” symulacji, jeśli .click() nie zadziała)
  try {
    targetBtn.click();
  } catch {
    try {
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      targetBtn.dispatchEvent(evt);
    } catch {}
  }

  // Sprzątamy i kończymy
  observer.disconnect();
  cleanupUI();
})();
