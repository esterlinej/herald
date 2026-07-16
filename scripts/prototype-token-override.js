import { MODULE_ID, debug } from "./const.js";

/**
 * Adds a small icon-only button to the Prototype Token config window's
 * header — fixes a real gap in the global templates: Portrait Source
 * "Custom" is one shared path for every actor resolving to that
 * template, which defeats the point the moment two different NPCs each
 * need their own custom art. This lets one specific actor override just
 * that path, stored as an actor flag, without needing a whole per-actor
 * Inherit/Override system for every field.
 *
 * Icon-only by design — this window's header is real estate other
 * modules also add buttons to, so a labeled button would take more room
 * than it's worth for a single-field override.
 *
 * Registers both the plain core hook name and PF2e's subclassed one
 * (`renderPrototypeTokenConfigPF2e`, confirmed via
 * `[...foundry.applications.instances.values()].find(...).constructor.name`
 * against a live PF2e actor) — costs nothing to register a hook for a
 * class that may simply never render on a different system.
 */
export function registerPrototypeTokenOverrideButton() {
  Hooks.on("renderPrototypeTokenConfig", injectOverrideButton);
  Hooks.on("renderPrototypeTokenConfigPF2e", injectOverrideButton);
}

function injectOverrideButton(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  const header = root?.closest(".application")?.querySelector(".window-header") ?? root?.querySelector(".window-header");
  if (!header) {
    debug("Prototype Token Config: expected .window-header not found — skipping override button");
    return;
  }

  if (header.querySelector(".herald-portrait-override-button")) return; // already injected on a prior render

  const actor = app.token?.actor ?? app.document?.actor ?? app.actor;
  if (!actor) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("header-control", "icon", "fa-solid", "fa-image", "herald-portrait-override-button");
  button.dataset.tooltip = "Herald: Custom Portrait Override";
  button.setAttribute("aria-label", "Herald: Custom Portrait Override");
  button.addEventListener("click", () => openPortraitOverrideDialog(actor));

  // Inserted before the built-in window controls (toggle-controls/close)
  // rather than appended at the very end, matching the left-to-right
  // convention of module icons sitting before core controls.
  const toggleControls = header.querySelector('[data-action="toggleControls"]');
  if (toggleControls) {
    header.insertBefore(button, toggleControls);
  } else {
    header.appendChild(button);
  }
}

/**
 * Deliberately simple for v1's DialogV2.prompt() shape, but does include
 * a real Browse button — wired via a temporary document-level delegated
 * click listener rather than a direct render hook, since DialogV2.prompt()
 * (the static convenience helper) doesn't expose easy access to its own
 * rendered DOM the way a full ApplicationV2 instance's _onRender would.
 * This sidesteps needing to know that API's exact lifecycle hooks for
 * sure — the listener just watches for the button by class, regardless
 * of when the dialog actually renders, and is removed once the dialog
 * resolves either way.
 *
 * Uses foundry.applications.api.DialogV2 — the hook name for the
 * Prototype Token window itself was independently confirmed live: this
 * wasn't, so it's the one remaining unverified piece here.
 */
async function openPortraitOverrideDialog(actor) {
  const current = actor.getFlag(MODULE_ID, "customPortraitPath") ?? "";

  const onDocumentClick = (event) => {
    const button = event.target.closest(".herald-inline-browse");
    if (!button) return;
    const input = button.closest(".herald-field-row")?.querySelector('input[name="customPortraitPath"]');
    if (!input) return;
    const FP = foundry.applications.apps.FilePicker.implementation;
    new FP({
      type: "imagevideo",
      callback: (path) => { input.value = path; }
    }).render(true);
  };
  document.addEventListener("click", onDocumentClick);

  let result;
  try {
    result = await foundry.applications.api.DialogV2.prompt({
      window: { title: `Herald: Portrait Override — ${actor.name}` },
      position: { width: 480 },
      content: `
        <div class="form-group">
          <label>Portrait Path</label>
          <div class="herald-field-row">
            <input type="text" name="customPortraitPath" value="${current}" placeholder="path/to/image-or-video" class="herald-fullwidth" />
            <button type="button" class="herald-inline-browse"><i class="fa-solid fa-folder-open"></i></button>
          </div>
          <p class="hint">Overrides this actor's portrait regardless of the global template's Portrait Source setting. Leave blank to use the template's own configured source.</p>
        </div>
      `,
      ok: {
        label: "Save",
        callback: (_event, button) => button.form.elements.customPortraitPath.value
      }
    });
  } finally {
    document.removeEventListener("click", onDocumentClick);
  }

  if (result === undefined) return; // dialog was cancelled

  const path = result.trim();
  if (path) {
    await actor.setFlag(MODULE_ID, "customPortraitPath", path);
    debug(`Set portrait override for "${actor.name}"`, path);
  } else {
    await actor.unsetFlag(MODULE_ID, "customPortraitPath");
    debug(`Cleared portrait override for "${actor.name}"`);
  }
}
