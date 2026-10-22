---
# Tokens are binding. Follows the Google Stitch DESIGN.md frontmatter shape, plus elan's `motion` and `direction` blocks.
name: "Noir Casefile"
direction:
  name: "Marked-up transcript"
  thesis: "The case is a stack of typed papers on a detective's desk; you solve it by reading statements closely and marking them with a highlighter whose colours mean something."
  signature: "A rough highlighter sweeps across a statement and the clue it contradicts pulls forward out of the clue stack."
colors:
  background: "#efe8d4"   # desk
  surface: "#fffcf0"      # paper
  sheet: "#ffffff"        # top sheet / transcript card
  ink: "#100f0f"
  muted: "#625d53"
  rule: "#e6dfcc"
  rule-strong: "#d9d0b8"
  accent: "#f19a8f"       # highlighter: contradiction (red)
  accent-ink: "#a3271b"   # red pen: text, stamps, notes
  motive: "#fed2ae"       # highlighter: motive (peach)
  success: "#dde2b1"      # highlighter: checks out (green)
  success-ink: "#4f5a1f"
  danger: "#a3271b"
  clip: "#8b8576"         # paper clip, disabled
typography:
  display: { family: "Source Serif 4", weight: 400, tracking: "-0.035em", opsz: 60, leading: 0.98 }
  body: { family: "Source Serif 4", weight: 400, size: "18px", leading: 1.6 }
  mono: { family: "JetBrains Mono", weight: 500, size: "12px", tracking: "0.04em", case: "uppercase" }
  scale: ["12px", "15px", "18px", "22px", "28px", "40px", "56px", "100px"]
rounded: { sm: "3px", md: "6px", lg: "10px", full: "999px" }
spacing: { unit: "4px", section: "112px", gutter: "24px", page-x: "clamp(16px, 4vw, 48px)" }
motion:
  intensity: immersive     # landing (site mode); the game screen runs `crisp`
  personality: "A marker on paper: strokes sweep left to right and stop; sheets slide and settle with weight. Nothing bounces, glows or floats."
  durations: { instant: "100ms", fast: "160ms", base: "240ms", slow: "400ms", scene: "600ms" }
  easing:
    out: "cubic-bezier(0.23, 1, 0.32, 1)"
    in-out: "cubic-bezier(0.65, 0, 0.35, 1)"   # highlighter sweep
  spring: { stiffness: 420, damping: 36 }      # sheets, tabs, clue pull-forward; no visible overshoot
  reduced: "marks appear at full width with a 160ms fade; sheets don't move; feedback stays"
components:
  highlight: "Inline mark. Colour on ::before (scaleX sweep from the left, rough edge via SVG feTurbulence+feDisplacementMap filter on ::before only, never on the text). One mark per word so phrases wrap. Colour from --c."
  sheet: "Paper card: surface or sheet colour, 1px rule-strong border, soft drop shadow (0 22px 40px -26px rgba(60,40,0,.35)), radius 0–sm. May sit rotated ±2.5deg on the landing; flat in the game."
  button-primary: "Ink background, paper text, mono 14px/600 uppercase, radius md, 44px min height. Press: translateY(1px), 100ms."
  button-quiet: "Transparent, 1px rule-strong border, mono label; hover darkens border to muted."
  label: "Mono, 12px, uppercase, muted."
  stamp: "Mono 600, accent-ink, 2px border, rotated -8deg, letter-spacing .12em; never a filled block."
  clue-card: "Sheet with a 4px left border in its highlighter colour (rule when unmarked). Pulls forward (translateX(-6px) + deeper shadow) when cited."
  tab: "Paper index tabs; the active tab is the sheet in front (surface, no bottom border)."
---

# Noir Casefile

## Direction
The case is paperwork. The landing page is a desk with a case file spread on it, and the interrogation room is the same desk at working size: statements on the left of your attention, clues stacked beside them, a pen in your hand. You win by reading closely, so the design rewards reading: serif prose at a comfortable measure, mono for anything that is a label or a record field, and a highlighter as the only loud thing on the page.

It is not a dark "noir" dashboard (no zinc, no amber glow, no skulls), and not a pulp cover. Tension comes from the red mark landing on a sentence, not from darkness.

## Colour
- Desk `background` behind everything; paper `surface` and white `sheet` for documents. Text is always `ink` or `muted` on paper.
- The three highlighter colours have fixed meanings and appear nowhere else: `success` green = checks out, `motive` peach = motive, `accent` red = contradiction. Red highlight is deepened enough to read as distinct from peach (pitfall from the source: red and orange at 75% over paper looked the same).
- `accent-ink` is the red pen: stamps, margin notes, errors, the questions-left count when low. Never a background fill bigger than a stamp.
- Colour is never the only signal: every mark also has a label (legend, aria-label, or margin note).

## Type
- Source Serif 4 for display (400, tracking −0.035em, optical size 60) and body (18px / 1.6, 45–70ch measure).
- JetBrains Mono 12px uppercase for labels, speaker tags, record fields, buttons. Nothing else.
- Numbers that change (questions left, counts) use `font-variant-numeric: tabular-nums`.
- No bold display, no italic display except quoted testimony.

## Layout
- Landing: page-x gutters, sections of 112px rhythm, two-column grids (copy | document) collapsing to one column under 900px. Paper sections alternate with desk sections.
- Game: three working columns at ≥ lg (lineup 18–20rem | transcript | clues 20–24rem), paper index tabs below lg. Flat sheets, no rotation, density over decoration.

## Imagery
Drawn in code: stacked paper sheets, lined statement paper (repeating linear-gradient at 32px), paper clips (bordered rounded rect), rubber stamps (bordered mono text), highlighter marks with an SVG turbulence edge. No photography, no icons standing in for illustration; lucide icons only as small functional glyphs.

## Motion
- Personality: marker on paper. The highlighter sweep (scaleX 0→1 from the left, 400–600ms, in-out) is the only expressive motion; everything else is crisp and settles without overshoot.
- Signature: when a statement is marked as a contradiction, its red highlight sweeps across and the clue it breaks pulls forward in the clue stack with a red margin note. On the landing this is the peak scene; in the game the player does it themselves.
- Landing scroll: hero papers fan apart on scroll (scrubbed, offsets kept within [0,1]); a pinned statement whose marks land as you scroll; counts tick.
- Game: suspect selection, tabs and sent questions are frequent, so ≤ 160ms. A new answer slides in as a typed line (≤ 240ms). Marking is the one moment allowed 500ms.
- Reduced motion: marks fade in at full width; nothing slides; scroll scenes become static stacks.

## Components
See the frontmatter. The highlight is the system's core part: colour on `::before`, filter on `::before` only (on the element it makes the glyphs wobble), one `<mark>` per word so a phrase can wrap, the whole thing recoloured through `--c`.
