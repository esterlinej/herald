import { MODULE_ID, debug } from "./const.js";
import { showHeraldCard } from "./overlay.js";

/**
 * Foundry requires module sockets to be namespaced as "module.<id>" —
 * a fixed, long-stable convention, not something that's shifted across
 * versions the way some of the ApplicationV2-era hooks have.
 */
const SOCKET_NAME = `module.${MODULE_ID}`;

/** Registered from the `ready` hook — listens for other clients' triggers and renders them locally. */
export function initSocketListener() {
  game.socket.on(SOCKET_NAME, (resolved) => {
    debug("Received broadcast trigger", resolved);
    showHeraldCard(resolved);
  });
}

/**
 * Sockets don't echo back to the sender — the triggering client renders
 * its own card locally (see trigger.js) and only needs this to notify
 * everyone else.
 */
export function broadcastTrigger(resolved) {
  game.socket.emit(SOCKET_NAME, resolved);
}
