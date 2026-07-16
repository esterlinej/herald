import { debug } from "./const.js";
import { triggerHerald } from "./trigger.js";

/**
 * Adds a "Herald" entry to the Actor Directory's right-click context
 * menu. No placed token exists in this path, so `token` is the actor's
 * own `prototypeToken` — a reasonable fallback for {{token.*}} paths,
 * but this always resolves against the BASE actor's data. For an
 * unlinked NPC customized on a specific placed token (a common pattern —
 * five placed "Goblin" tokens each with their own HP/notes), this will
 * use the shared base template, not whatever's on any one placement.
 * Trigger from that token's own Token HUD button instead when
 * per-instance data matters. Documented in the README, not a bug.
 *
 * `getActorDirectoryEntryContext` (the V1-era hook this originally used)
 * doesn't fire at all in V13+ — sidebar directories moved to
 * ApplicationV2, and Foundry rationalized these into a generic
 * `getDocumentContextOptions` pattern, substituting the document class
 * name: `getActorContextOptions`. Signature changed too — `(application,
 * menuItems)`, mutating `menuItems` directly, not the old
 * `(html, entryOptions)` shape. Confirmed via Foundry's own V13 API docs
 * after the original hook name silently did nothing in live testing.
 *
 * Remaining uncertainty: the entry-id attribute name on each directory
 * row (`data-entry-id` below) is the long-standing convention, checked
 * with a `data-document-id` fallback since sidebar internals moved
 * around enough in V13 that I don't have a confirmed source for this
 * specific attribute — first thing to check via console if the entry
 * shows up but resolves the wrong actor.
 */
export function registerActorDirectoryContextMenu() {
  Hooks.on("getActorContextOptions", (_application, menuItems) => {
    menuItems.push({
      name: "Herald",
      icon: '<i class="fa-solid fa-bullhorn"></i>',
      callback: (li) => {
        const entryElement = li instanceof HTMLElement ? li : li?.[0];
        const actorId = entryElement?.dataset?.entryId ?? entryElement?.dataset?.documentId;
        const actor = game.actors.get(actorId);
        if (!actor) {
          debug(`Actor Directory: couldn't resolve actor id from context menu target`, entryElement);
          return;
        }
        triggerHerald({ actor, token: actor.prototypeToken });
      }
    });
  });
}
