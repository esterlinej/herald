import { MODULE_ID, debug } from "./const.js";

/**
 * Posts a static chat message companion to a live Herald trigger — the
 * portrait (image or video), resolved message, and subtext, so the
 * announcement persists in the chat log even if someone missed the
 * animated overlay. Neither video nor audio autoplays in a chat
 * message (confirmed against real behavior via the Chat Media module),
 * so the portrait can be embedded as-is with no special handling needed
 * to prevent it from playing unprompted — no `autoplay`/`muted` on the
 * video element here, unlike the live overlay's ambient-motion loop.
 *
 * Called once, only from the triggering client (trigger.js) — never
 * from overlay.js's showHeraldCard(), which runs on every connected
 * client via the socket broadcast. Posting from there would create one
 * duplicate ChatMessage per connected player instead of exactly one.
 */
export async function postHeraldChatCard(resolved, actor) {
  const content = await foundry.applications.handlebars.renderTemplate(
    `modules/${MODULE_ID}/templates/chat-card.hbs`,
    resolved
  );

  await ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor })
  });

  debug(`Posted chat card for "${actor?.name}"`);
}
