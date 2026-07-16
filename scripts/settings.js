import { MODULE_ID, SETTINGS, CARD_SIZES, defaultTemplate } from "./const.js";
import { HeraldSettingsApp } from "./settings-app.js";

/**
 * Called from the `init` hook in main.js. The two templates are
 * registered with config: false — they're structured objects (message,
 * subtext, portrait source, backdrop, animation, position, audio,
 * timer), not a single scalar value, so Foundry's default settings-list
 * checkbox/text-field rendering doesn't fit them. A custom Settings form
 * (built next) reads/writes these directly instead.
 */
export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.TEMPLATE_PC, {
    scope: "world",
    config: false,
    type: Object,
    default: defaultTemplate()
  });

  game.settings.register(MODULE_ID, SETTINGS.TEMPLATE_NPC, {
    scope: "world",
    config: false,
    type: Object,
    default: defaultTemplate()
  });

  // A simple scalar choice, unlike the two templates above — fits
  // Foundry's native settings-list rendering directly, no custom form
  // needed. World-scoped and shared deliberately: see CARD_SIZES in
  // const.js for why this isn't a per-client preference.
  game.settings.register(MODULE_ID, SETTINGS.CARD_SIZE, {
    name: "Card Size",
    hint: "How large Herald's announcement card renders for everyone at the table — shared for the whole world, not a personal preference, since everyone sees the same broadcast.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CARD_SIZES.SMALL]: "Small",
      [CARD_SIZES.MEDIUM]: "Medium",
      [CARD_SIZES.LARGE]: "Large"
    },
    default: CARD_SIZES.MEDIUM,
    restricted: true
  });

  game.settings.register(MODULE_ID, SETTINGS.CHAT_CARD_ENABLED, {
    name: "Post Chat Card",
    hint: "When Herald triggers, also post a chat message with the portrait, resolved name, and subtext — so the announcement persists even if someone missed the animated overlay itself.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true
  });

  game.settings.register(MODULE_ID, SETTINGS.DEBUG_LOGGING, {
    name: "Debug Logging",
    hint: "Shows extra console output for trigger and field-resolution steps — which template resolved, what each {{path}} token evaluated to, and why. Useful when a template isn't showing what you expect.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
}

/** Reachable from Foundry's core Configure Settings menu. */
export function registerSettingsMenu() {
  game.settings.registerMenu(MODULE_ID, "settingsMenu", {
    name: "Herald — Settings",
    label: "Herald — Settings",
    hint: "Configure the PC and NPC announcement templates — message/subtext, portrait, backdrop, animation, position, and audio.",
    icon: "fa-solid fa-bullhorn",
    type: HeraldSettingsApp,
    restricted: true
  });
}
