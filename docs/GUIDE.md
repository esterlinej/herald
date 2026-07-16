# Herald — Visual Guide

A screenshot walkthrough of every part of the module, companion to the
main [README](../README.md). Sections follow the same order as the
README's Usage section.

*Skeleton — drop screenshots into `assets/images/` using the suggested
filenames below (or your own naming, just update the paths here to
match), and fill in each section as you capture them.*

---

## Triggering

**Token HUD** — right-click a placed token, click the bullhorn icon.

![Token HUD trigger](../assets/images/guide/herald-token-hud.png)

**Actor Directory** — right-click an actor in the sidebar, click
"Herald" in the context menu.

![Actor Directory trigger](../assets/images/guide/herald-actor-directory.png)

**The result** — the animated card itself, showing the portrait,
message, and subtext.

![Herald card example](../assets/images/guide/herald-card-example.png)

**Chat Card** — the same card and text is added to the chat, enabled by default this feature can be disabled within the foundry settings.

![Herald card example](../assets/images/guide/herald-chat-card-example.png)

---

## Settings — Message & Subtext

The field-picker dropdown inserts a `{{path}}` token at the cursor
position in whichever text field it's next to — static text and live
actor data mix freely in one message.

![Message and subtext fields with field-picker](../assets/images/guide/herald-template-settings-message.png)

![Portrait Source options](../assets/images/guide/herald-template-settings-message-options.png)

---

## Settings — Portrait Source

Avatar, Token, or Custom — Token reads whatever's actually configured in
the token's texture slot, image or video, whichever it is.

![Portrait Source options](../assets/images/guide/herald-template-settings-portrait-source.png)

---

## Settings — Backdrop

None, Color, or Image, plus a shape selector (Portrait / Landscape /
Square) once a backdrop is set.

![Backdrop mode and shape options](../assets/images/guide/herald-template-settings-backdrop.png)

---

## Settings — Animation & Position

![Animation and position options](../assets/images/guide/herald-template-settings-animation-position.png)

---

## Settings — Audio & Timing

An independent audio track, a Mute Audio override that always wins
regardless of source, and a duration (0 = manual close).

![Audio and timing options](../assets/images/guide/herald-template-settings-audio-timing.png)

---

## Settings — Preview

Pick a sample actor and see exactly what triggering would produce,
without saving or broadcasting to anyone else.

![Preview showing a resolved template](../assets/images/guide/herald-template-settings-preview.png)

![Preview showing a resolved template](../assets/images/guide/herald-template-settings-preview-example.png)

---

## Per-Actor Portrait Override

A small icon button on the Prototype Token config window's own title
bar — overrides just that actor's portrait, independent of whatever the
global template's Portrait Source is set to.

![Prototype Token config window with the Herald override button](../assets/images/guide/herald-character-prototype-token-button.png)

![Portrait override dialog](../assets/images/guide/herald-character-portrait-override-dialog.png)

![Portrait override dialog](../assets/images/guide/herald-character-custom-portrait-override-example.png)

---

*Screenshots may lag slightly behind the latest UI copy/wording as the
module evolves — the [README](../README.md) is the source of truth for
current behavior if the two ever disagree.*
