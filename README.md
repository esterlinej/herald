# Herald

Foundry VTT module for animated actor/NPC intro announcements. Slide,
drop, or fade a token's portrait onto every player's screen with custom
text and live actor data pulled straight from the actor sheet.

📸 **[Visual Guide](docs/GUIDE.md)** — screenshots of every part of the
module, if you'd rather look than read.

---

## Features

**Trigger from Token HUD or the Actor Directory** — right-click a token
to open its HUD, or right-click an actor in the sidebar directory. No
macro knowledge required for the common case. Directory triggers use
the actor's own `prototypeToken`, since there's no placed token in that
path — for an unlinked NPC customized on a specific placement (a common
pattern: five placed "Goblin" tokens each with their own HP/notes),
trigger from that specific token's own Token HUD button instead, since
the directory always resolves against the shared base actor.

**Two universal templates** — one for PCs, one for NPCs/Creatures, each
configured once in Settings. Clicking Herald on any token resolves the
matching template with zero per-actor setup required.

**Animated entrance** — Slide Left, Slide Right, Drop In, or Fade, at
Center or any of four corners. The card is offset, not full-screen —
an announcement, not a blocking overlay.

**Optional backdrop** — a secondary panel behind the portrait/video,
solid color or a second image, in Portrait, Landscape, or Square
proportions, for real ornate-frame-style art rather than a same-size
panel peeking out from behind.

**Live actor data in your text** — message and subtext fields accept
`{{path}}` tokens resolved against the triggering actor/token at render
time (e.g. `{{actor.name}} has entered the fray!`, mixed freely with
static text). A field-picker dropdown offers common fields for any
system plus a per-system field map (PF2e shipped as the reference
implementation, split by PC vs NPC since fields like Blurb and
Personality only exist on one actor type each), plus a custom-path box
for anything neither anticipates.

**Portrait Source** — Avatar (the sheet portrait) or Token (whatever's
actually configured in the token's texture slot — image or video,
detected automatically by file extension, no separate mode toggle
needed). No global Custom option — a shared custom path for every actor
of a type has the same problem the per-actor override below exists to
fix, so Custom is only available per-actor.

**Per-actor portrait override** — a small icon button on the Prototype
Token config window's own header lets one specific actor override just
its portrait, regardless of what the global template's Portrait Source
is set to. Most actors need nothing set here at all; only the ones a GM
explicitly overrides carry any extra data.

**Audio and timing** — an independent audio track, a Mute Audio override
that always wins regardless of source, and a duration (0 = close
manually by clicking the card). With no audio track set, a voiced
portrait video is free to play its own embedded sound.

**Live preview** — Settings includes a Preview button that resolves the
current (unsaved) form values against a real sample actor and shows it
only on your own screen, using the exact same render pipeline a live
trigger uses.

**Chat card companion** (on by default, toggleable) — every trigger also
posts a chat message with the portrait (image or video — neither
autoplays in chat, so it embeds as-is), resolved name, and subtext, so
the announcement persists even if someone missed the animated overlay.

**Card Size** (Small / Medium / Large) — a shared, world-level setting.
Herald's card is broadcast to and rendered identically for everyone at
the table, not a personal preview pane, so this scales the whole card
(portrait, backdrop, text) the same for everyone rather than being a
per-person preference.

**GM-only, by design and in practice** — the Token HUD button and Actor
Directory entry are both hidden from players outright (not just
disabled), and the trigger function itself checks GM status as a second
layer.

---

## Requirements

Requires Foundry VTT V14. Compatibility capped at V14 until explicitly
verified against other major versions.

---

## Installation

Install via the module manifest URL in Foundry's Add-on Modules browser,
or download and extract into your `Data/modules` folder.

---

## Usage

**Scene Controls** aren't used — Herald triggers from two existing
Foundry surfaces instead:
- **Token HUD** — right-click a placed token, click the bullhorn icon.
- **Actor Directory** — right-click an actor in the sidebar, click
  "Herald" in the context menu.

**Settings** (Foundry's core Configure Settings menu → "Herald —
Settings") configures the PC and NPC templates, each with its own tab:
- **Message / Subtext** — text fields with `{{path}}` templating; the
  field-picker dropdown beside each inserts a token at the cursor
  position, so static text and live data mix freely.
- **Portrait Source** — Avatar or Token.
- **Backdrop** — None / Color / Image, plus a shape selector (Portrait /
  Landscape / Square) when a backdrop is set.
- **Animation** and **Position**.
- **Audio Track**, **Mute Audio**, and **Duration**.
- **Preview** — pick a sample actor of the matching type and see
  exactly what triggering would produce, without saving or broadcasting
  to anyone else.

**Per-Actor Portrait Override** — open an actor's Prototype Token
config window (via the actor sheet's own "Prototype Token" button), and
click the small image icon in that window's title bar. Set a file path
to override just that actor's portrait, independent of the global
template's Portrait Source — leave blank to use the template's own
configured source.

**Foundry's core Configure Settings list** also has two directly-editable
options for Herald, alongside the "Herald — Settings" menu button:
- **Card Size** — Small / Medium / Large, applies to everyone.
- **Post Chat Card** — checkbox, on by default; disable if you'd rather
  triggers stay purely visual with nothing added to the chat log.

---

## Roadmap

- Stabilized macro/scripting API — `game.modules.get("herald").api`
  currently exists for internal testing during development and works,
  but hasn't been treated as a committed public surface (names/shapes
  could still change); a documented, stable version of this is planned
  but not yet finalized
- Per-Actor full template override (message/subtext/backdrop/etc., not
  just portrait) — deferred in favor of shipping the universal
  templates first; the portrait-only override above covers the most
  common real need without the overhead of a full per-actor system
- D&D 5e field map — `SYSTEM_FIELDS` currently only has a PF2e entry;
  the core resolver/render pipeline is system-agnostic, but the
  field-picker's convenience dropdown needs real D&D 5e actor data
  verified the same rigorous way PF2e's was, not guessed paths
- Optional foreground overlay image — a third layer (portrait sits
  behind it, not in front) for depth/framing effects beyond what the
  backdrop alone gives — e.g. a vignette or frame flourish that
  slightly occludes the portrait's edges. Purely additive: empty by
  default (nothing changes), populated only by GMs willing to design a
  webp with alpha transparency matching the backdrop's own dimensions.
  No forced pairing system — alignment is the GM's own responsibility
  when they opt in, same spirit as the existing backdrop image field.
  Once built, the Visual Guide should call out matching the backdrop's
  canvas dimensions as the practical way to get this to align.

---

## License

MIT
