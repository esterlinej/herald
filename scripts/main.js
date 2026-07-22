import { MODULE_ID } from "./const.js";
import { resolveTemplateText, resolvePortraitPath, resolveTemplate, isVideoPath } from "./resolver.js";
import { registerSettings, registerSettingsMenu } from "./settings.js";
import { registerTokenHudButton } from "./token-hud.js";
import { registerActorDirectoryContextMenu } from "./actor-directory.js";
import { registerActorTemplateOverrideButton } from "./actor-template-override.js";
import { initSocketListener } from "./socket.js";
import { showHeraldCard } from "./overlay.js";
import { triggerHerald } from "./trigger.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);

  // Used throughout settings.hbs for radio/select selected-state checks
  // — {{#if (heraldEq animation "slideLeft")}}checked{{/if}} — instead of
  // precomputing a boolean per radio option server-side. Same safe,
  // proven pattern as Game Master Screen's own custom-helper approach.
  Handlebars.registerHelper("heraldEq", (a, b) => a === b);

  registerSettings();
  registerSettingsMenu();
  registerTokenHudButton();
  registerActorDirectoryContextMenu();
  registerActorTemplateOverrideButton();

  // Exposed for console testing while there's no full config UI yet —
  // not the final public API surface. Try:
  //   const api = game.modules.get("herald").api;
  //   api.triggerHerald({ actor: canvas.tokens.controlled[0]?.actor, token: canvas.tokens.controlled[0]?.document })
  game.modules.get(MODULE_ID).api = {
    resolveTemplateText,
    resolvePortraitPath,
    resolveTemplate,
    isVideoPath,
    showHeraldCard,
    triggerHerald
  };
});

Hooks.once("ready", () => {
  initSocketListener();
});
