# Changelog

All notable changes to Herald are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [0.7.0]

### Added
- Chat card companion — every trigger posts a chat message with the
  portrait, resolved message, and subtext (neither video nor audio
  autoplays in chat, confirmed against real behavior, so the portrait
  embeds as-is with no special handling needed). Posted exactly once,
  from the triggering client only — `showHeraldCard()` runs on every
  connected client via the socket broadcast, so posting from there
  would have created one duplicate chat message per player.
- `Post Chat Card` setting — world-scope checkbox, on by default,
  alongside Card Size in Foundry's native Configure Settings list.

## [0.6.2]

### Changed
- Card Size scale shifted up a tier: Small is now what was previously
  the default/Medium size (1.0×), Medium is what was previously Large
  (1.3×), and Large is a genuinely new, bigger top tier (1.6×).

## [0.6.1]

### Fixed
- Herald could be triggered by players, not just GMs — the Token HUD
  button (players can open Token HUD for their own owned tokens) and
  Actor Directory entry were both visible/clickable regardless of role.
  Both now hidden entirely for non-GMs (the directory entry via the
  standard `condition` property, rather than showing and failing
  silently on click), plus a second-layer check inside `triggerHerald()`
  itself and the Prototype Token override button.

## [0.6.0]

### Added
- Card Size setting (Small/Medium/Large) — world-scope, shared for
  everyone at the table rather than a personal preference, since
  Herald's card is broadcast and rendered identically for all connected
  clients (unlike Game Master Screen's GM-only popout preview, which a
  per-client preference suited). Applied via a `--herald-scale` CSS
  custom property inherited down to the portrait, all three backdrop
  aspect variants, and text sizing, so everything scales together.

## [0.5.2]

### Removed
- Custom removed as a selectable global Portrait Source (both PC and
  NPC templates) — a shared custom path for every actor of a type has
  the exact same one-path-for-everyone problem the per-actor Portrait
  Override exists to fix, so it just re-invited the anti-pattern.
  `PORTRAIT_SOURCES.CUSTOM` and the resolver's handling of it remain in
  code for a future macro/API user scripting a one-off trigger
  explicitly — only the Settings UI option was removed.

### Fixed
- Preview button sat flush against the "Preview using" dropdown above
  it — added spacing.

## [0.5.1]

### Fixed
- Per-actor portrait override now always wins outright, regardless of
  the global template's Portrait Source setting — previously it only
  applied when Portrait Source happened to be set to Custom, which
  meant overriding one specific NPC's art would've required breaking
  the global default for every other actor too.
- Portrait override dialog: shortened the label so it no longer wraps
  awkwardly, widened the dialog, and added a real Browse button next to
  the path field (wired via a temporary delegated click listener, since
  `DialogV2.prompt()`'s static helper doesn't expose easy access to its
  own rendered DOM the way a full Application instance's render hook
  would).

## [0.5.0]

### Added
- Per-actor Portrait Override — a small icon button injected into the
  Prototype Token config window's own title bar (confirmed against the
  actual rendered class, `PrototypeTokenConfigPF2e`, via
  `foundry.applications.instances`). Stores a per-actor override path as
  an actor flag, checked first by the resolver.
- Settings' Save button now closes the window after a successful save.

## [0.4.1]

### Fixed
- Settings form failed to render at all — ApplicationV2's PARTS system
  requires each part to render exactly one root HTML element, but the
  template produced four top-level siblings (nav, up to two tab
  sections, footer). Wrapped everything in one containing div.

## [0.4.0]

### Added
- Full Settings form (`HeraldSettingsApp`) — PC and NPC tabs, each with:
  Message/Subtext with a field-picker dropdown (inserts `{{path}}` at
  the cursor) plus a custom-path box, Portrait Source with conditional
  Custom-path field, Backdrop mode/color/image/shape, Animation,
  Position, Audio Track, Mute Audio, Duration, and a Preview section
  that resolves the current unsaved form values against a real sample
  actor and shows the result locally only.
- Registered a `heraldEq` Handlebars helper for radio/select
  selected-state checks in the template, avoiding the need to
  precompute a boolean per option server-side.

## [0.3.3]

### Added
- Backdrop Shape selector — Portrait / Landscape / Square — controls
  the overall frame's aspect ratio via explicit width + CSS
  `aspect-ratio` per mode, rather than one guessed padding percentage
  that only suited one particular source image's proportions.

## [0.3.2]

### Fixed
- Backdrop art was almost entirely hidden — the backdrop panel was
  sized identically to the portrait and offset by a fixed 16px, so
  ornate frame-style art had no room to actually show around the
  portrait. Restructured into a `.herald-frame` wrapper: the backdrop
  fills the frame completely, and the portrait centers within it via
  flexbox, with padding creating real breathing room.

## [0.3.1]

### Added
- `muteAudio` field — a hard override that silences everything
  regardless of source, matching Game Master Screen's own convention.
  Without it: an explicit Audio Track path plays as the real sound and
  mutes the portrait video's own audio (so the two don't compete); with
  no Audio Track at all, a voiced portrait video (e.g. an intro clip
  with a recorded line, not just silent ambient motion) is free to play
  its own sound.

## [0.3.0]

### Added
- Full render pipeline: socket broadcast (`module.herald` namespace)
  and the actual overlay renderer — positions (Center + 4 corners),
  4 animations (Slide Left/Right, Drop In, Fade), portrait (image or
  video, autoplaying muted as ambient motion unless it's the sole audio
  source), optional backdrop, message/subtext in a gradient scrim, and
  timer-based or click-to-dismiss closing.
- Triggering now renders locally immediately (no reason to wait on a
  socket round-trip to see your own action) and broadcasts to every
  other connected client, since sockets don't echo back to the sender.

## [0.2.1]

### Fixed
- Actor Directory context menu entry never appeared — the hook it used
  (`getActorDirectoryEntryContext`) doesn't exist in V13+; sidebar
  directories moved to ApplicationV2 and Foundry rationalized these
  into a generic `getDocumentContextOptions` pattern
  (`getActorContextOptions` for actors specifically), with a different
  signature too. Confirmed via Foundry's own V13 API docs after the
  original hook name silently did nothing in live testing.

## [0.2.0]

### Added
- Token HUD button (bullhorn icon in `.col.right`) and Actor Directory
  context menu entry ("Herald") as the two trigger entry points — both
  resolve through a shared `triggerHerald({ actor, token })` function.
  Token HUD resolves through the token's own `.actor` (correctly
  picking up unlinked-token deltas, confirmed against a real actor
  where the base Actor's data was blank but the placed token's own data
  had real content); Actor Directory falls back to the actor's own
  `prototypeToken` since no placed token exists in that path.
- `settings.js` registering the two template settings
  (`config: false` — structured objects, not scalar values a default
  checkbox/text-field fits) and a client-scope Debug Logging setting.
- No render/broadcast yet at this point — triggering logged the fully
  resolved payload to console, proving the resolver + trigger wiring
  before the render pipeline existed to consume it.

## [0.1.2]

### Fixed
- Removed Alignment from the NPC field list — confirmed via a real
  actor data dump that Pathfinder 2e removed Alignment from creature
  stat blocks in the Remaster; the field simply doesn't exist in
  current PF2e schema.

### Verified
- Blurb and Level paths confirmed correct against real actor data
  (initially looked wrong because the field was genuinely empty on the
  test actor, not because the path was broken).

## [0.1.1]

### Fixed
- Version wasn't bumped after adding the dev-testing API exposure to
  `main.js`, so Foundry served a cached copy that predated it — same
  caching lesson learned the hard way during Game Master Screen's
  development, repeated here before it was internalized as a habit.

## [0.1.0]

Initial scaffold.

### Added
- `module.json`, folder structure (`scripts/`, `styles/`, `templates/`,
  `lang/`).
- `const.js` — module id, `ANIMATIONS`, `POSITIONS`, `BACKDROP_MODES`,
  `PORTRAIT_SOURCES`, `ACTOR_KINDS`, `CORE_FIELDS`, `SYSTEM_FIELDS`
  (PF2e reference implementation, split by PC vs NPC after confirming
  Blurb and Personality fields each only exist on one actor type),
  `defaultTemplate()`.
- `resolver.js` — `resolveTemplateText()` ({{path}} token resolution via
  `foundry.utils.getProperty()`), `resolvePortraitPath()`,
  `isVideoPath()` (extension-based, no separate mode toggle needed),
  `resolveTemplate()`. Verified against a hand-mocked test harness
  before any live Foundry testing was possible.
- Dev-only API exposed on `game.modules.get("herald").api` for console
  testing before any UI existed.
