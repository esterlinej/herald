/**
 * Re-focus an existing ApplicationV2 instance (same static id) instead of
 * constructing a new one — avoids duplicate DOM listeners when the control
 * is clicked while a window is already open.
 */
export function renderOrFocusApp(AppClass, options = undefined) {
  const id = AppClass.DEFAULT_OPTIONS?.id;
  const existing = id ? foundry.applications.instances.get(id) : null;
  if (existing instanceof AppClass) {
    existing.render(true);
    return existing;
  }
  return new AppClass(options).render(true);
}

/**
 * Actor override shares one static app id — focus if same actor, replace
 * if a different actor's override is requested.
 */
export function renderOrFocusActorOverrideApp(AppClass, { actor }) {
  const id = AppClass.DEFAULT_OPTIONS?.id;
  const existing = id ? foundry.applications.instances.get(id) : null;
  if (existing instanceof AppClass) {
    if (existing.actor?.id === actor?.id) {
      existing.render(true);
      return existing;
    }
    existing.close();
  }
  return new AppClass({ actor }).render(true);
}
