import {
  MODULE_ID,
  SETTINGS,
  ACTOR_KINDS,
  CORE_FIELDS,
  SYSTEM_FIELDS,
  ANIMATIONS,
  POSITIONS,
  BACKDROP_MODES,
  BACKDROP_ASPECTS,
  defaultTemplate,
  debug
} from "./const.js";
import { resolveTemplate, resolveTemplateText } from "./resolver.js";
import { showHeraldCard } from "./overlay.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Single per-actor override editor — one button, one flag family, two
 * independently-savable concerns:
 *
 * 1. Portrait Source (top of the form, always live) — its own actor
 *    flag ("portraitOverride"), saved regardless of whether the rest of
 *    the template is overridden. This replaced an earlier, separate
 *    single-field Portrait Override button/dialog that lived on its own
 *    icon; that dialog is gone (delete prototype-token-override.js —
 *    it's no longer registered or imported) in favor of exactly this
 *    section, so there's one icon and one place to look, not two.
 *
 * 2. The rest of the template (message, subtext, backdrop, animation,
 *    position, audio, timer) — gated by the "Override for <actor>"
 *    checkbox, stored as actor flag "templateOverride". Deliberately
 *    does NOT include portrait fields at all anymore; portrait is
 *    resolved from the flag above (or global template, if that flag is
 *    absent/Inherit), regardless of whether this second flag exists.
 *
 * trigger.js merges "templateOverride" over the global template
 * (rather than swapping it in wholesale) precisely because it's now a
 * partial object — portraitSource/customPortraitPath are never part of
 * it, so the merge naturally falls through to the global template's
 * values for those two keys, and resolvePortraitPath's own
 * portraitOverride-flag check (see resolver.js) takes it from there.
 */
export function registerActorTemplateOverrideButton() {
  Hooks.on("renderPrototypeTokenConfig", injectTemplateOverrideButton);
  Hooks.on("renderPrototypeTokenConfigPF2e", injectTemplateOverrideButton);
}

function injectTemplateOverrideButton(app, html) {
  if (!game.user.isGM) return;

  const root = html instanceof HTMLElement ? html : html?.[0];
  const header = root?.closest(".application")?.querySelector(".window-header") ?? root?.querySelector(".window-header");
  if (!header) {
    debug("Prototype Token Config: expected .window-header not found — skipping template override button");
    return;
  }

  if (header.querySelector(".herald-template-override-button")) return; // already injected on a prior render

  const actor = app.token?.actor ?? app.document?.actor ?? app.actor;
  if (!actor) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("header-control", "icon", "fa-solid", "fa-clapperboard", "herald-template-override-button");
  button.dataset.tooltip = "Herald: Template Override";
  button.setAttribute("aria-label", "Herald: Template Override");
  button.addEventListener("click", () => new ActorTemplateOverrideApp({ actor }).render(true));

  const toggleControls = header.querySelector('[data-action="toggleControls"]');
  if (toggleControls) {
    header.insertBefore(button, toggleControls);
  } else {
    header.appendChild(button);
  }
}

class ActorTemplateOverrideApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor }, options = {}) {
    super(options);
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    id: "herald-actor-template-override",
    tag: "form",
    classes: ["herald-settings-app", "herald-actor-override-app"],
    window: {
      icon: "fa-solid fa-clapperboard",
      resizable: true
    },
    position: { width: 560, height: 720 },
    actions: {
      save: ActorTemplateOverrideApp._onSave,
      preview: ActorTemplateOverrideApp._onPreview
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/actor-template-override.hbs`
    }
  };

  get title() {
    return `Herald: Template Override — ${this.actor.name}`;
  }

  async _prepareContext() {
    const kind = this.actor.type === ACTOR_KINDS.PC ? ACTOR_KINDS.PC : ACTOR_KINDS.NPC;
    const globalSettingKey = kind === ACTOR_KINDS.PC ? SETTINGS.TEMPLATE_PC : SETTINGS.TEMPLATE_NPC;
    const globalTemplate = game.settings.get(MODULE_ID, globalSettingKey) ?? defaultTemplate();

    const portraitOverride = this.actor.getFlag(MODULE_ID, "portraitOverride");
    // No more "inherit" state — pre-select whatever this actor currently
    // resolves to, so opening this for the first time shows the truth
    // (usually the global template's own Portrait Source) rather than a
    // blank/arbitrary default. Saving without touching it just pins that
    // same value explicitly, which produces the same visual result today
    // and is a one-click change back if the global template ever moves.
    const effectivePortraitSource = portraitOverride?.source ?? globalTemplate.portraitSource;
    const effectiveCustomPath = portraitOverride?.customPath ?? globalTemplate.customPortraitPath ?? "";

    const existingTemplateOverride = this.actor.getFlag(MODULE_ID, "templateOverride");
    const overrideEnabled = !!existingTemplateOverride;

    // Prefilled from the existing override if one's already set, otherwise
    // from the actor's own resolved global template — opening this for
    // the first time and just checking "Enable Override" reproduces
    // exactly what the global template already does.
    const values = existingTemplateOverride ?? globalTemplate;

    const systemFieldMap = SYSTEM_FIELDS[game.system.id] ?? {};
    const fieldOptions = [...CORE_FIELDS, ...(systemFieldMap[kind] ?? [])];

    return {
      actorName: this.actor.name,
      portraitSource: effectivePortraitSource,
      customPortraitPath: effectiveCustomPath,
      overrideEnabled,
      fieldOptions,
      ...values
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#wireFieldPickers();
    this.#wireCustomFieldInsert();
    this.#wireBrowseButtons();
    this.#wireConditionalSections();
    this.#wireEnableToggle();
  }

  #wireFieldPickers() {
    this.element.querySelectorAll(".herald-field-picker").forEach((select) => {
      select.addEventListener("change", () => {
        const path = select.value;
        if (!path) return;
        const targetName = select.dataset.target;
        const input = this.element.querySelector(`[name="${CSS.escape(targetName)}"]`);
        if (input) insertAtCursor(input, `{{${path}}}`);
        select.value = "";
      });
    });
  }

  #wireCustomFieldInsert() {
    this.element.querySelectorAll(".herald-custom-field-insert").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest(".herald-field-row");
        const customInput = row?.querySelector(".herald-custom-field-path");
        const targetName = button.dataset.target;
        const input = this.element.querySelector(`[name="${CSS.escape(targetName)}"]`);
        const path = customInput?.value?.trim();
        if (input && path) {
          insertAtCursor(input, `{{${path}}}`);
          customInput.value = "";
        }
      });
    });
  }

  #wireBrowseButtons() {
    const FP = foundry.applications.apps.FilePicker.implementation;
    this.element.querySelectorAll(".herald-browse").forEach((button) => {
      button.addEventListener("click", () => {
        const targetName = button.dataset.target;
        const pickerType = button.dataset.type ?? "image";
        new FP({
          type: pickerType,
          callback: (path) => {
            const field = this.element.querySelector(`[name="${CSS.escape(targetName)}"]`);
            if (field) field.value = path;
          }
        }).render(true);
      });
    });
  }

  #wireConditionalSections() {
    this.element.querySelectorAll('input[type="radio"][data-conditional-group]').forEach((radio) => {
      radio.addEventListener("change", () => this.#applyConditionalVisibility(radio));
      if (radio.checked) this.#applyConditionalVisibility(radio);
    });
  }

  #applyConditionalVisibility(radio) {
    const group = radio.dataset.conditionalGroup;
    this.element.querySelectorAll(`[data-conditional-for="${CSS.escape(group)}"]`).forEach((section) => {
      section.classList.toggle("herald-hidden", section.dataset.conditionalValue !== radio.value);
    });
  }

  /**
   * Enable Override checkbox dims/disables only ".herald-override-fields"
   * — the Portrait Source fieldset lives outside that container entirely
   * now, specifically so it stays live and editable no matter what this
   * checkbox is set to.
   */
  #wireEnableToggle() {
    const checkbox = this.element.querySelector('input[name="overrideEnabled"]');
    if (!checkbox) return;
    const applyState = () => {
      this.element.querySelectorAll(".herald-override-fields fieldset input, .herald-override-fields fieldset select, .herald-override-fields fieldset button")
        .forEach((el) => { el.disabled = !checkbox.checked; });
      this.element.querySelector(".herald-override-fields")?.classList.toggle("herald-override-disabled", !checkbox.checked);
    };
    checkbox.addEventListener("change", applyState);
    applyState();
  }

  static async _onSave() {
    // Portrait Source is independent of the Enable Override checkbox —
    // always read and saved regardless of it. Always persisted now (no
    // "Inherit" state to fall back to) — a simple three-way selector
    // that's cheap for a GM to revisit later beats an extra radio option
    // whose only job was avoiding writing a flag most GMs would set
    // deliberately anyway.
    const portraitSource = this.element.querySelector('input[name="portraitSource"]:checked')?.value ?? "token";
    const customPortraitPath = this.element.querySelector('[name="customPortraitPath"]')?.value ?? "";
    await this.actor.setFlag(MODULE_ID, "portraitOverride", { source: portraitSource, customPath: customPortraitPath });

    const enabled = !!this.element.querySelector('input[name="overrideEnabled"]')?.checked;
    if (!enabled) {
      await this.actor.unsetFlag(MODULE_ID, "templateOverride");
      debug(`Cleared full template override for "${this.actor.name}" (portrait source: ${portraitSource})`);
    } else {
      const template = readTemplateFromForm(this.element);
      await this.actor.setFlag(MODULE_ID, "templateOverride", template);
      debug(`Saved full template override for "${this.actor.name}"`, template);
    }

    ui.notifications.info(`Herald: saved for "${this.actor.name}".`);
    this.close();
  }

  /**
   * Resolves the CURRENT form state — including the Portrait Source
   * section, whose saved flag might not match what's selected right now
   * — against this actor's own token, showing the result only on this
   * screen. Portrait is resolved directly from the radio selection
   * here rather than via resolvePortraitPath's flag lookup, specifically
   * so an unsaved Portrait Source change previews correctly too.
   */
  static async _onPreview() {
    const template = readTemplateFromForm(this.element);
    const token = this.actor.prototypeToken;

    const portraitSource = this.element.querySelector('input[name="portraitSource"]:checked')?.value ?? "token";
    const customPortraitPath = this.element.querySelector('[name="customPortraitPath"]')?.value ?? "";

    let portraitPath;
    switch (portraitSource) {
      case "avatar": portraitPath = this.actor.img || null; break;
      case "custom": portraitPath = customPortraitPath || null; break;
      default: portraitPath = token?.texture?.src || null; // "token"
    }

    const videoExtensions = new Set(["webm", "mp4", "m4v", "ogv"]);
    const isVideo = !!portraitPath && videoExtensions.has(portraitPath.split(".").pop()?.toLowerCase());

    const resolved = {
      message: resolveTemplateText(template.message, { actor: this.actor, token }),
      subtext: resolveTemplateText(template.subtext, { actor: this.actor, token }),
      portraitPath,
      portraitIsVideo: isVideo,
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

    debug(`Previewing template override for "${this.actor.name}"`, resolved);
    showHeraldCard(resolved);
  }
}

function insertAtCursor(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  const newCursor = start + text.length;
  input.focus();
  input.setSelectionRange(newCursor, newCursor);
}

/** Reads the message/subtext/backdrop/animation/position/audio/timer fields — deliberately no portrait fields, those are handled separately in _onSave/_onPreview above. */
function readTemplateFromForm(root) {
  const get = (field) => root.querySelector(`[name="${field}"]`);
  const val = (field) => get(field)?.value ?? "";
  const checked = (field) => !!get(field)?.checked;
  const radioValue = (field) => root.querySelector(`input[name="${field}"]:checked`)?.value;

  return {
    message: val("message"),
    subtext: val("subtext"),
    backdropMode: radioValue("backdropMode") ?? BACKDROP_MODES.NONE,
    backdropColor: val("backdropColor") || "#000000",
    backdropImage: val("backdropImage"),
    backdropAspect: radioValue("backdropAspect") ?? BACKDROP_ASPECTS.LANDSCAPE,
    animation: radioValue("animation") ?? ANIMATIONS.SLIDE_LEFT,
    position: val("position") || POSITIONS.CENTER,
    audioPath: val("audioPath"),
    muteAudio: checked("muteAudio"),
    timer: Number(val("timer")) || 0
  };
}
