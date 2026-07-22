import { MODULE_ID, ACTOR_KINDS, SETTINGS, defaultTemplate, debug } from "./const.js";
import { resolveTemplate } from "./resolver.js";
import { showHeraldCard } from "./overlay.js";
import { broadcastTrigger } from "./socket.js";
import { postHeraldChatCard } from "./chat-card.js";

/**
 * Shared trigger path for both the Token HUD button and the Actor
 * Directory context menu entry. `token` should be the real placed
 * TokenDocument when available (Token HUD path — resolves through the
 * token's own possibly-unlinked actor), or the actor's own
 * `prototypeToken` when triggered with no scene placement (Actor
 * Directory path) — see README for the documented limitation this
 * implies for unlinked NPCs triggered from the directory.
 *
 * Renders locally immediately (no reason for the triggering GM to wait
 * on a socket round-trip to see their own action), then broadcasts to
 * every other connected client — sockets don't echo back to the sender,
 * so both steps are needed for everyone to actually see it.
 *
 * GM-only. The Token HUD and Actor Directory entry points already hide
 * the trigger UI from non-GMs, but this check exists here too as a
 * second layer, since anyone with a plain macro API function like this
 * exposed could otherwise call it directly.
 */
export function triggerHerald({ actor, token } = {}) {
  if (!game.user.isGM) {
    debug("triggerHerald called by a non-GM user — ignoring");
    return;
  }

  if (!actor) {
    ui.notifications.warn("Herald: no actor to announce.");
    return;
  }

  const templateKey = actor.type === ACTOR_KINDS.PC ? SETTINGS.TEMPLATE_PC : SETTINGS.TEMPLATE_NPC;
  const globalTemplate = game.settings.get(MODULE_ID, templateKey) ?? defaultTemplate();

  // A full per-actor override (set via the Prototype Token config
  // window's Herald button, "Override for <actor>" section) no longer
  // carries portrait fields at all — those are handled separately by
  // the "portraitOverride" flag, which resolvePortraitPath() checks on
  // its own regardless of whether this override exists. So this is
  // merged OVER the global template rather than substituted wholesale:
  // the override's own fields win, and portraitSource/customPortraitPath
  // (absent from the override object) naturally fall through to the
  // global template's values, which resolvePortraitPath uses only as
  // its own fallback anyway.
  const override = actor.getFlag(MODULE_ID, "templateOverride");
  const template = override ? { ...globalTemplate, ...override } : globalTemplate;

  const resolved = resolveTemplate(template, { actor, token });
  debug(`Triggered for "${actor.name}" (${actor.type})`, resolved);

  showHeraldCard(resolved);
  broadcastTrigger(resolved);

  if (game.settings.get(MODULE_ID, SETTINGS.CHAT_CARD_ENABLED)) {
    postHeraldChatCard(resolved, actor);
  }
}
