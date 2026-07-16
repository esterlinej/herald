import { MODULE_ID, SETTINGS, BACKDROP_MODES, CARD_SIZE_SCALES, debug } from "./const.js";

let activeCardEl = null;
let activeTimeoutId = null;
let activeAudio = null;

/**
 * Renders one Herald card. A new trigger replaces whatever's currently
 * showing (last-write-wins) rather than queuing — matches the
 * announcement use case, where a new intro superseding an old one is
 * the expected behavior, not something to prevent.
 */
export async function showHeraldCard(resolved) {
  removeActiveCard();

  const contentHtml = await foundry.applications.handlebars.renderTemplate(
    `modules/${MODULE_ID}/templates/herald-card.hbs`,
    buildTemplateContext(resolved)
  );

  const wrapper = document.createElement("div");
  wrapper.innerHTML = contentHtml;
  const cardEl = wrapper.firstElementChild;

  // Card Size is a shared world setting, not part of the resolved
  // payload — every client already has the same synced value locally
  // (it's world-scope), so reading it here at render time produces
  // identical results everywhere without needing to broadcast it too.
  const cardSize = game.settings.get(MODULE_ID, SETTINGS.CARD_SIZE);
  const scale = CARD_SIZE_SCALES[cardSize] ?? 1;
  cardEl.style.setProperty("--herald-scale", scale);

  document.body.appendChild(cardEl);
  activeCardEl = cardEl;

  // Force a layout pass before adding the animation-trigger class, so
  // the CSS transition actually plays from its starting state instead
  // of snapping straight to the end state (the browser would otherwise
  // batch both the initial styles and this class together into one
  // paint, skipping the transition entirely).
  void cardEl.offsetWidth;
  cardEl.classList.add("herald-visible");

  // muteAudio is a hard override — silences everything regardless of
  // what's configured, matching Game Master Screen's own convention.
  // Otherwise: an explicit audioPath plays as the announcement's actual
  // sound, and the portrait video's own embedded audio is muted so the
  // two don't compete — same as GMS's "forces a video's own audio off
  // when set" rule. With no audioPath at all, a voiced portrait video
  // (e.g. an intro clip with a recorded line, not just silent ambient
  // motion) is free to play its own audio.
  if (resolved.audioPath && !resolved.muteAudio) {
    activeAudio = new Audio(resolved.audioPath);
    activeAudio.play().catch((err) => debug("Audio playback blocked or failed", err));
  }

  if (resolved.timer > 0) {
    activeTimeoutId = setTimeout(() => removeActiveCard(), resolved.timer);
  } else {
    cardEl.classList.add("herald-dismissible");
    cardEl.addEventListener("click", () => removeActiveCard());
  }
}

function removeActiveCard() {
  if (activeTimeoutId) {
    clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (activeCardEl) {
    const el = activeCardEl;
    activeCardEl = null;
    el.classList.remove("herald-visible");
    // Let the exit transition actually play before removing the element,
    // rather than yanking it out of the DOM mid-animation.
    setTimeout(() => el.remove(), 400);
  }
}

function buildTemplateContext(resolved) {
  return {
    ...resolved,
    hasBackdrop: resolved.backdropMode !== BACKDROP_MODES.NONE,
    isColorBackdrop: resolved.backdropMode === BACKDROP_MODES.COLOR,
    isImageBackdrop: resolved.backdropMode === BACKDROP_MODES.IMAGE,
    hasText: Boolean(resolved.message || resolved.subtext),
    // Same rule as the audioPath playback logic above: muteAudio always
    // wins, an explicit audioPath mutes the portrait video to avoid two
    // audio sources at once, and with neither set a voiced portrait
    // video is free to play its own sound.
    portraitMuted: resolved.muteAudio || Boolean(resolved.audioPath)
  };
}
