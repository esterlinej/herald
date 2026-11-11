/**
 * DOM helpers for Herald overlay media — release decoder buffers on
 * dismiss/switch so repeated triggers do not retain detached video nodes.
 */

/** Drop media element references so the browser can reclaim decode buffers. */
export function releaseMediaElement(el) {
  if (!el) return;
  if (el instanceof HTMLMediaElement) {
    try {
      el.pause();
    } catch (_err) {
      /* already torn down */
    }
    el.removeAttribute("src");
    el.load();
  } else if (el instanceof HTMLImageElement) {
    el.removeAttribute("src");
  }
}

/** Release portrait video/img and any other media under a card root. */
export function releaseMediaInRoot(root) {
  if (!root) return;
  root.querySelectorAll("video, audio, img.herald-portrait").forEach(releaseMediaElement);
}

/** Tear down a detached `Audio()` instance created for announcement audio. */
export function releaseAudioInstance(audio) {
  if (!audio) return;
  try {
    audio.pause();
  } catch (_err) {
    /* already torn down */
  }
  audio.src = "";
  audio.load?.();
}
