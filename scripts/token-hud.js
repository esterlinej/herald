import { MODULE_ID, debug } from "./const.js";
import { triggerHerald } from "./trigger.js";

/**
 * Injects a Herald button into the Token HUD (opened by right-clicking a
 * placed token). Resolves through the token's own `.actor` — Foundry
 * automatically merges any unlinked-token delta, so this correctly picks
 * up per-instance customized data (see README: confirmed against a real
 * unlinked NPC where the base Actor's field was blank but the placed
 * token's own data had real content).
 *
 * Uncertainty flag: TokenHUD's exact DOM structure (the `.col.right`
 * class specifically) is based on the long-standing, widely-used
 * convention other modules rely on, not verified against this specific
 * V14 build — first thing to check if the button doesn't appear.
 */
export function registerTokenHudButton() {
  Hooks.on("renderTokenHUD", (app, html) => {
    // Players can open Token HUD for their own owned tokens — without
    // this check, they'd see (and could click) the Herald button too.
    if (!game.user.isGM) return;

    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const rightCol = root.querySelector(".col.right");
    if (!rightCol) {
      debug("Token HUD: expected .col.right container not found — skipping button injection");
      return;
    }

    const button = document.createElement("div");
    button.classList.add("control-icon");
    button.dataset.action = "herald";
    button.title = "Herald";
    button.innerHTML = `<i class="fa-solid fa-bullhorn"></i>`;
    button.addEventListener("click", () => {
      const token = app.object; // TokenHUD's #object is the Token placeable
      triggerHerald({ actor: token?.actor, token: token?.document });
    });

    rightCol.appendChild(button);
  });
}
