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
  PORTRAIT_SOURCES,
  defaultTemplate,
  debug
} from "./const.js";
import { resolveTemplate } from "./resolver.js";
import { showHeraldCard } from "./overlay.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const TAB_META = [
  { kind: ACTOR_KINDS.PC, settingKey: SETTINGS.TEMPLATE_PC, label: "PC Template" },
  { kind: ACTOR_KINDS.NPC, settingKey: SETTINGS.TEMPLATE_NPC, label: "NPC Template" }
];

/**
 * Configures Herald's two universal templates (PC and NPC) — the config
 * every Token HUD / Actor Directory trigger resolves against with zero
 * per-actor setup. Both tabs' fields exist in the DOM simultaneously
 * (one hidden via CSS, not unmounted), so switching tabs never loses
 * unsaved edits on the other one before a single Save writes both.
 */
export class HeraldSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "herald-settings",
    tag: "form",
    classes: ["herald-settings-app"],
    window: {
      title: "Herald — Settings",
      icon: "fa-solid fa-bullhorn",
      resizable: true
    },
    position: { width: 560, height: 720 },
    actions: {
      switchTab: HeraldSettingsApp._onSwitchTab,
      save: HeraldSettingsApp._onSave,
      preview: HeraldSettingsApp._onPreview
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/settings.hbs`
    }
  };

  async _prepareContext() {
    const systemFieldMap = SYSTEM_FIELDS[game.system.id] ?? {};

    const tabs = TAB_META.map(({ kind, settingKey, label }, index) => {
      const template = game.settings.get(MODULE_ID, settingKey) ?? defaultTemplate();
      const fieldOptions = [...CORE_FIELDS, ...(systemFieldMap[kind] ?? [])];
      const sampleActors = game.actors.filter((a) => a.type === kind);

      return {
        kind,
        label,
        active: index === 0,
        fieldOptions,
        sampleActors,
        ...template
      };
    });

    return { tabs };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#wireFieldPickers();
    this.#wireCustomFieldInsert();
    this.#wireBrowseButtons();
    this.#wireConditionalSections();
  }

  /**
   * Field-picker <select> next to message/subtext: inserts the chosen
   * {{path}} at the target input's current cursor position (not just
   * appended to the end), so static text and dynamic fields can be
   * freely mixed in one message.
   */
  #wireFieldPickers() {
    this.element.querySelectorAll(".herald-field-picker").forEach((select) => {
      select.addEventListener("change", () => {
        const path = select.value;
        if (!path) return;
        const targetName = select.dataset.target;
        const input = this.element.querySelector(`[name="${CSS.escape(targetName)}"]`);
        if (input) insertAtCursor(input, `{{${path}}}`);
        select.value = ""; // reset to the placeholder so it can be used again
      });
    });
  }

  /** The raw custom-path box + Insert button beside each field-picker. */
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

  /** Portrait Source / Backdrop Mode radios show/hide their dependent fields. */
  #wireConditionalSections() {
    this.element.querySelectorAll('input[type="radio"][data-conditional-group]').forEach((radio) => {
      radio.addEventListener("change", () => this.#applyConditionalVisibility(radio));
      if (radio.checked) this.#applyConditionalVisibility(radio);
    });
  }

  #applyConditionalVisibility(radio) {
    const group = radio.dataset.conditionalGroup;
    const panel = radio.closest(".herald-tab-panel");
    panel?.querySelectorAll(`[data-conditional-for="${CSS.escape(group)}"]`).forEach((section) => {
      section.classList.toggle("herald-hidden", section.dataset.conditionalValue !== radio.value);
    });
  }

  static _onSwitchTab(_event, target) {
    const tabKind = target.dataset.tab;
    this.element.querySelectorAll(".herald-tab-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.tab === tabKind);
    });
    this.element.querySelectorAll(".herald-tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.tab === tabKind);
    });
  }

  static async _onSave() {
    for (const { kind, settingKey } of TAB_META) {
      const template = readTemplateFromForm(this.element, kind);
      await game.settings.set(MODULE_ID, settingKey, template);
    }
    ui.notifications.info("Herald templates saved.");
    this.close();
  }

  /**
   * Local-only, matching Game Master Screen's own Preview convention —
   * resolves the CURRENTLY ACTIVE tab's in-progress (not yet saved) form
   * values against whichever sample actor is selected, and shows it only
   * on this screen. Reuses the exact same resolveTemplate()/
   * showHeraldCard() pipeline a real trigger uses, so Preview shows
   * genuinely what triggering would produce, not an approximation.
   */
  static async _onPreview() {
    const activePanel = this.element.querySelector(".herald-tab-panel.active");
    const kind = activePanel?.dataset.tab;
    if (!kind) return;

    const template = readTemplateFromForm(this.element, kind);
    const sampleActorId = activePanel.querySelector(".herald-preview-actor")?.value;
    const actor = game.actors.get(sampleActorId);
    if (!actor) {
      ui.notifications.warn("Herald: pick a sample actor to preview against.");
      return;
    }

    const resolved = resolveTemplate(template, { actor, token: actor.prototypeToken });
    debug(`Previewing ${kind} template against "${actor.name}"`, resolved);
    showHeraldCard(resolved);
  }
}

/** Inserts text at an input/textarea's current cursor position, replacing any active selection. */
function insertAtCursor(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  const newCursor = start + text.length;
  input.focus();
  input.setSelectionRange(newCursor, newCursor);
}

/** Reads one tab's named fields (`${kind}-fieldName`) into a template object. */
function readTemplateFromForm(root, kind) {
  const get = (field) => root.querySelector(`[name="${kind}-${field}"]`);
  const val = (field) => get(field)?.value ?? "";
  const checked = (field) => !!get(field)?.checked;
  const radioValue = (field) => root.querySelector(`input[name="${kind}-${field}"]:checked`)?.value;

  return {
    message: val("message"),
    subtext: val("subtext"),
    portraitSource: radioValue("portraitSource") ?? PORTRAIT_SOURCES.TOKEN,
    customPortraitPath: val("customPortraitPath"),
    backdropMode: radioValue("backdropMode") ?? BACKDROP_MODES.NONE,
    backdropColor: val("backdropColor") || "#000000",
    backdropImage: val("backdropImage"),
    backdropAspect: radioValue("backdropAspect") ?? BACKDROP_ASPECTS.LANDSCAPE,
    animation: radioValue("animation") ?? ANIMATIONS.SLIDE_LEFT,
    position: radioValue("position") ?? POSITIONS.CENTER,
    audioPath: val("audioPath"),
    muteAudio: checked("muteAudio"),
    timer: Number(val("timer")) || 0
  };
}
