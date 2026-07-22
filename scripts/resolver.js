import { MODULE_ID, PORTRAIT_SOURCES, debug } from "./const.js";

const TOKEN_PATTERN = /{{\s*([\w.]+)\s*}}/g;
const VIDEO_EXTENSIONS = new Set(["webm", "mp4", "m4v", "ogv"]);

/**
 * Resolves a template string containing {{path}} tokens (e.g.
 * "{{actor.name}} has entered the fray!") against a triggering
 * actor/token context.
 *
 * Every path must start with "actor." or "token." — the resolver splits
 * on the first dot to pick the root object, then walks the rest via
 * foundry.utils.getProperty(), Foundry's own safe nested-property reader
 * (doesn't throw on missing intermediate levels, just returns undefined).
 *
 * `token` is supplied by the caller, not decided here — Token HUD
 * triggers pass the real placed TokenDocument; Actor Directory triggers
 * (no scene placement) pass the actor's own `prototypeToken` instead, so
 * {{token.name}}-style paths still resolve sensibly either way.
 *
 * Resolution failures (missing path, undefined value) become an empty
 * string in the rendered text — silent in normal play, but logged via
 * debug() so a GM authoring a template with Debug Logging on can see
 * exactly which path didn't resolve, rather than just an unexplained gap.
 */
export function resolveTemplateText(text, { actor, token } = {}) {
  if (!text) return "";

  return text.replace(TOKEN_PATTERN, (match, path) => {
    const dotIndex = path.indexOf(".");
    if (dotIndex === -1) {
      debug(`Field path "${path}" has no root prefix (expected "actor." or "token.") — leaving unresolved`);
      return "";
    }

    const root = path.slice(0, dotIndex);
    const rest = path.slice(dotIndex + 1);
    const rootObject = root === "actor" ? actor : root === "token" ? token : null;

    if (!rootObject) {
      debug(`Field path "${path}" has unknown root "${root}" (expected "actor" or "token") — leaving unresolved`);
      return "";
    }

    const value = foundry.utils.getProperty(rootObject, rest);
    return stringifyFieldValue(value, path);
  });
}

/** Coerces a resolved field value into display text, handling the shapes actor/system data actually takes. */
function stringifyFieldValue(value, path) {
  if (value === undefined || value === null) {
    debug(`Field path "${path}" resolved to nothing — leaving blank`);
    return "";
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    debug(`Field path "${path}" resolved to an object, which can't be displayed directly — leaving blank. Point at a more specific path (e.g. add ".value" or ".name").`);
    return "";
  }
  return String(value);
}

/**
 * Resolves which file actually renders as the portrait/token visual,
 * per the template's chosen PORTRAIT_SOURCES. Returns null if nothing
 * resolves (e.g. TOKEN selected but the actor has no configured texture),
 * letting the caller decide how to handle an empty visual rather than
 * silently rendering a broken image.
 */
export function resolvePortraitPath(template, { actor, token } = {}) {
  // A per-actor override (set via the Prototype Token config window's
  // Herald button, Portrait Source section) always wins outright,
  // regardless of whatever the global template's Portrait Source is
  // set to. Only actors someone has actually opened that editor for and
  // saved carry this flag at all — most actors have none, and fall
  // through to whatever the global template says (typically Token),
  // with zero need to touch the global setting to get there.
  const portraitOverride = actor?.getFlag(MODULE_ID, "portraitOverride");
  if (portraitOverride?.source) {
    switch (portraitOverride.source) {
      case PORTRAIT_SOURCES.AVATAR:
        return actor?.img || null;
      case PORTRAIT_SOURCES.TOKEN:
        return token?.texture?.src || null;
      case PORTRAIT_SOURCES.CUSTOM:
        return portraitOverride.customPath || null;
    }
  }

  switch (template.portraitSource) {
    case PORTRAIT_SOURCES.AVATAR:
      return actor?.img || null;
    case PORTRAIT_SOURCES.TOKEN:
      return token?.texture?.src || null;
    case PORTRAIT_SOURCES.CUSTOM:
      return template.customPortraitPath || null;
    default:
      return null;
  }
}

/** Whether a resolved path is a video file, by extension — not a separately-set mode, since Portrait Source already determines the source and whatever file is actually there just plays as whatever it is. */
export function isVideoPath(path) {
  if (!path) return false;
  const extension = path.split(".").pop()?.toLowerCase();
  return VIDEO_EXTENSIONS.has(extension);
}

/**
 * Full render payload for one trigger: template's {{}} tokens resolved
 * against the actor/token context, portrait path resolved and typed
 * (image vs video), everything else (backdrop, animation, position,
 * audio, timer) passed through unchanged since those aren't templated.
 */
export function resolveTemplate(template, { actor, token } = {}) {
  const portraitPath = resolvePortraitPath(template, { actor, token });

  return {
    message: resolveTemplateText(template.message, { actor, token }),
    subtext: resolveTemplateText(template.subtext, { actor, token }),
    portraitPath,
    portraitIsVideo: isVideoPath(portraitPath),
    backdropMode: template.backdropMode,
    backdropColor: template.backdropColor,
    backdropImage: template.backdropImage,
    backdropAspect: template.backdropAspect,
    animation: template.animation,
    position: template.position,
    audioPath: template.audioPath || null,
    muteAudio: !!template.muteAudio,
    timer: Number(template.timer) || 0
  };
}
