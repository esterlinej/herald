import { debug } from "./const.js";

/**
 * Post-render enhancements for Herald's chat card companion (see
 * chat-card.js for the posting side, which is where content is
 * actually generated — this module only ever wires up behavior on
 * whatever HTML a client is about to display, never writes anything
 * back to the ChatMessage document itself).
 *
 * Both features below act on the same `.herald-chat-portrait-wrap`
 * element and are wired through one renderChatMessageHTML hook — the
 * modern HTMLElement-based hook, not the deprecated jQuery
 * renderChatMessage hook it replaces — so a chat log with many Herald
 * cards in it pays for one DOM query per render, not two, for what's
 * really a single concern (the portrait's click/crop behavior):
 *
 * 1. Click-to-pop-out — opens Foundry's own ImagePopout, which is
 *    local-only by nature: it renders only for whoever clicked, and
 *    has its own separate "share" button if that viewer wants to push
 *    it to the rest of the table. Herald never calls that share path
 *    itself, so this is always a for-the-clicker-only view — distinct
 *    from the live overlay card, which broadcasts to everyone via
 *    socket the moment it's triggered.
 * 2. Compact view (opt-in via the "Compact Chat Image" world setting,
 *    baked into the card's HTML at post time — see chat-card.js) —
 *    crops the portrait down to a band roughly 40% of its own height,
 *    centered on the image's vertical midpoint. Done with a CSS
 *    aspect-ratio computed from the image's natural dimensions plus a
 *    static -30% transform (half of the 60% cropped away), rather
 *    than measuring rendered pixel geometry in JS — that would break
 *    if this renders while the Chat sidebar tab isn't the active one
 *    (clientWidth reads 0 behind a display:none ancestor) and would
 *    need a resize listener to stay correct if the sidebar is ever
 *    resized after render. Percentage-based CSS sidesteps both.
 *    Clicking the band reuses the exact same pop-out as #1 — the
 *    natural way back to seeing the whole image.
 *
 * Video portraits are left out of both — they already carry native
 * `controls` in the chat card (see chat-card.hbs), and layering a
 * click-to-pop-out over that would fight clicks meant for the video's
 * own play button and scrubber.
 */
export function registerChatCardInteractions() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const wrap = html.querySelector(".herald-chat-portrait-wrap");
    if (!wrap) return;

    const portrait = wrap.querySelector(".herald-chat-portrait");
    if (!portrait) return;

    if (wrap.classList.contains("herald-chat-portrait-compact")) {
      applyCompactBand(wrap, portrait);
    }

    wirePopout(wrap, portrait, message);
  });
}

/** Sizes the compact wrap's aspect-ratio to a 40%-tall band once the image's real dimensions are known. */
function applyCompactBand(wrap, portrait) {
  const setAspect = () => {
    const { naturalWidth, naturalHeight } = portrait;
    if (!naturalWidth || !naturalHeight) return;
    wrap.style.aspectRatio = `${naturalWidth} / ${naturalHeight * 0.4}`;
  };

  if (portrait.complete) setAspect();
  else portrait.addEventListener("load", setAspect, { once: true });
}

/** Makes the portrait wrap clickable, opening a local-only full-size ImagePopout. */
function wirePopout(wrap, portrait, message) {
  wrap.classList.add("herald-chat-portrait-clickable");
  wrap.addEventListener("click", () => {
    const src = portrait.currentSrc || portrait.getAttribute("src");
    if (!src) return;

    // Explicit position, from the image's own natural dimensions,
    // rather than leaving ImagePopout to pick its own window size —
    // by default it fits/shrinks the image down to whatever it
    // decides looks reasonable on screen, which is exactly the
    // "resized" look that shouldn't happen here: the point of popping
    // out is to see the actual image, at the size it actually is.
    // ImagePopout's window is resizable, so a portrait too tall for
    // the screen is still fully reachable by dragging/resizing rather
    // than being scaled down unasked.
    const position =
      portrait.naturalWidth && portrait.naturalHeight
        ? { width: portrait.naturalWidth, height: portrait.naturalHeight }
        : undefined;

    new foundry.applications.apps.ImagePopout({
      src,
      window: { title: message.speaker?.alias || "" },
      position
    }).render(true);

    debug(`Opened chat card pop-out for "${message.speaker?.alias}"`, position);
  });
}
