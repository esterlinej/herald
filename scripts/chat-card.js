import { MODULE_ID, SETTINGS, debug } from "./const.js";

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
 *
 * The rendered HTML string this produces is what gets saved onto the
 * ChatMessage document and synced to every client as-is — unlike the
 * live overlay, nothing here re-renders per viewing client. So
 * Compact Chat Image (a world setting, same scope as Post Chat Card
 * itself) is read once, right here at post time, and baked into the
 * HTML; the click-to-pop-out behavior for whatever the resulting
 * markup contains is wired separately, per viewing client, in
 * chat-card-interactions.js.
 */
export async function postHeraldChatCard(resolved, actor) {
  const content = await foundry.applications.handlebars.renderTemplate(
    `modules/${MODULE_ID}/templates/chat-card.hbs`,
    {
      ...resolved,
      chatCardCompact: game.settings.get(MODULE_ID, SETTINGS.CHAT_CARD_COMPACT)
    }
  );

  await ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor })
  });

  debug(`Posted chat card for "${actor?.name}"`);
}
