export const MODULE_ID = "herald";

export function debug(...args) {
  if (game.settings.get(MODULE_ID, SETTINGS.DEBUG_LOGGING)) {
    console.log(`${MODULE_ID} |`, ...args);
  }
}

/**
 * Animation presets for how the card enters (and, symmetrically, exits).
 */
export const ANIMATIONS = {
  SLIDE_LEFT: "slideLeft",
  SLIDE_RIGHT: "slideRight",
  DROP_IN: "dropIn",
  FADE: "fade"
};

/**
 * Where the card sits on screen. Offset from full-screen by design — this
 * is an announcement overlay, not a scene-blocking one like Game Master
 * Screen.
 */
export const POSITIONS = {
  CENTER: "center",
  TOP_LEFT: "topLeft",
  TOP_RIGHT: "topRight",
  BOTTOM_LEFT: "bottomLeft",
  BOTTOM_RIGHT: "bottomRight"
};

export const BACKDROP_MODES = {
  NONE: "none",
  COLOR: "color",
  IMAGE: "image"
};

/**
 * Controls the overall shape of the frame around the portrait when a
 * backdrop is set — landscape suits wide archway/banner-style art (like
 * the ornate column-and-trumpet backdrops being tested), portrait suits
 * a tall bordered-card look, square keeps the frame close to the
 * portrait's own proportions.
 */
export const BACKDROP_ASPECTS = {
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
  SQUARE: "square"
};

/**
 * What visual actually renders. Not every table uses the token slot for
 * an actual token image — some repurpose it for an animated video loop
 * instead of a traditional top-down token. AVATAR and TOKEN read from
 * the actor/token's own configured image/video field; CUSTOM lets a
 * template point at any file directly, independent of either. File type
 * (image vs video) is detected from the resolved path's extension at
 * render time, not set separately — whichever file is actually there
 * just plays as whatever it is.
 */
export const PORTRAIT_SOURCES = {
  AVATAR: "avatar",  // actor.img — the sheet portrait
  TOKEN: "token",     // token's own texture.src — image or video, whatever's actually configured there
  CUSTOM: "custom"    // explicit file path, independent of the actor/token
};

/**
 * Actor types a universal template can target. PF2e's "npc" covers both
 * NPCs and Creatures (Creature is just an NPC with the "Creature" trait
 * bundle, not a distinct actor.type) — kept as a single key rather than
 * splitting them, since they share the same data shape (Blurb, etc.).
 */
export const ACTOR_KINDS = {
  PC: "character",
  NPC: "npc"
};

/**
 * Field-picker / templating system
 * ---------------------------------
 * Message and subtext fields are plain text inputs that can contain
 * {{path}} tokens — e.g. "{{actor.name}} has entered the fray!" — resolved
 * against the triggering actor/token at render time. Same spirit as
 * boss-splash's {{actor.name}}/{{token.name}}, extended to arbitrary
 * dot-paths.
 *
 * CORE_FIELDS work identically for PCs and NPCs, no special-casing.
 * SYSTEM_FIELDS is keyed first by game.system.id, then by ACTOR_KINDS —
 * PF2e's NPC Blurb and PC Personality fields (Attitude/Beliefs/Likes/
 * Dislikes/Catchphrases) only exist on one actor type each, so a flat
 * list would offer fields that don't apply to whichever actor triggered
 * it. Ships with PF2e as the reference implementation; adding another
 * system later means adding a new top-level key here.
 *
 * Anything neither list anticipates is reachable via a live actor-data
 * browser in the picker — walks the triggering/preview actor's actual
 * data, not a hardcoded guess at schema paths, which also self-guards
 * against "garbage in, garbage out" since the GM sees the real value
 * (and its real length) before picking it.
 *
 * Edicts/Anathema are arrays in PF2e, not plain strings — left out of
 * the curated list for now since the resolver would need array-join
 * support most other fields don't; revisit if wanted.
 */
export const CORE_FIELDS = [
  { label: "Actor Name", path: "actor.name" },
  { label: "Token Name", path: "token.name" }
];

export const SYSTEM_FIELDS = {
  pf2e: {
    [ACTOR_KINDS.NPC]: [
      { label: "Blurb (subtitle)", path: "actor.system.details.blurb" },
      { label: "Level", path: "actor.system.details.level.value" },
      { label: "HP (current)", path: "actor.system.attributes.hp.value" },
      { label: "HP (max)", path: "actor.system.attributes.hp.max" }
    ],
    [ACTOR_KINDS.PC]: [
      { label: "Level", path: "actor.system.details.level.value" },
      { label: "Ancestry", path: "actor.system.details.ancestry.name" },
      { label: "Class", path: "actor.system.details.class.name" },
      { label: "Attitude", path: "actor.system.details.biography.attitude" },
      { label: "Beliefs", path: "actor.system.details.biography.beliefs" },
      { label: "Likes", path: "actor.system.details.biography.likes" },
      { label: "Dislikes", path: "actor.system.details.biography.dislikes" },
      { label: "Catchphrases", path: "actor.system.details.biography.catchphrases" }
    ]
  }
};

/**
 * Shape of one universal template (PC or NPC). Both are stored under
 * SETTINGS.TEMPLATE_PC / SETTINGS.TEMPLATE_NPC as a single JSON object
 * each — clicking Herald on a token resolves the matching template with
 * zero per-actor setup required. Per-Actor Override (Inherit/Override,
 * same shape as GMS's Scene Config) is a later addition, not v1.
 */
export function defaultTemplate() {
  return {
    message: "{{actor.name}}",
    subtext: "",
    portraitSource: PORTRAIT_SOURCES.TOKEN,
    customPortraitPath: "",
    backdropMode: BACKDROP_MODES.NONE,
    backdropColor: "#000000",
    backdropImage: "",
    backdropAspect: BACKDROP_ASPECTS.LANDSCAPE,
    animation: ANIMATIONS.SLIDE_LEFT,
    position: POSITIONS.CENTER,
    audioPath: "",
    muteAudio: false,
    timer: 5000
  };
}

export const SETTINGS = {
  TEMPLATE_PC: "templatePc",
  TEMPLATE_NPC: "templateNpc",
  DEBUG_LOGGING: "debugLogging"
};
