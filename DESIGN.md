# DESIGN.md - آموزشگاه موسیقی آنیما

Design direction for this site. Read together with the antislop filter: this file
gives the soul (identity, palette, type, mood), antislop removes the slop.

Owner: a small classical studio. Right now it is three people: the founder (piano)
and two violinists. More teachers and instruments are expected later.

---

## 1. What this is

A Persian (RTL) site with two real offers:

1. Teaching piano and violin, to beginners and to people returning to an instrument.
2. Sending a musician (piano or violin) to an event or a gathering.

The one action we want: the visitor sends a message on Telegram.

Public routes: خانه `/`, استادها `/teachers`, سازها `/instruments`, تماس `/contact`,
وبلاگ `/blog` and `/blog/<slug>`. The home page is the overview. The other pages
each carry one job: introduce the three teachers, explain the two instruments,
answer "how do I start" without scrolling, and let the studio publish what it
knows. Every route still ends in the same Telegram action.

Owner routes: `/admin` behind a login, with a post editor, media library,
taxonomy and settings. It is a workshop, not a showcase — same wood palette,
denser spacing, no marketing motion.

## 2. Design Read

> Reading this as: a multi-page Persian site for a small classical music studio,
> for Persian-speaking families and adult learners on mobile, in a warm
> "instrument workshop after dark" visual language, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

## 3. Dials and how they show up

- **ENERGY 2 (warm, not loud).** The page says hello with warmth, not with a shout.
  Big type only on the hero; the rest is calm.
- **RHYTHM 2 (consistent with real breaks).** Sections do not repeat one template.
  Hero is asymmetric, the teachers are an ensemble row, the instruments are two
  large blocks, the contact is quiet and centered.
- **MOTION 2 (a few deliberate moves).** Hover and focus feedback on every
  control, a short page-entry rise, a scroll reveal for below-fold blocks, and
  two slow instrument loops (metronome, equalizer). No carousel,
  no video, no parallax. A classical studio does not need a light show.

Levers used:
- **One focal point per screen:** the hero headline is the loudest thing on the
  page; every section has its own single lead line.
- **One deliberate accent:** aged brass (#C08A3E), used on the wordmark, section
  rules, and the hero's "staff" motif. Nowhere else.
- **Identity motif:** the musical staff (پنج خط حامل), drawn as a thin SVG rule
  with one note, reused as the section divider and behind the hero. It is the
  product's own notation, so it reads as identity, not as decoration. The Ghalam
  handwriting is the second half of the motif: the studio's human voice.
- **Depth by surface, not by shadow:** the page is one warm near-black; the
  paths/contact band is a step darker, raised panels (portraits, instruments) a
  step lighter. No drop shadows, no glass, no gradients that do not come from wood.
- **Texture:** a fixed paper-grain overlay at very low opacity. It keeps the dark
  surface from reading as flat digital black.

## 4. Palette (warm dark + 1 accent)

These are the آبنوس base tokens. The other four themes (§8) override the same
token names with their own grounds and accents; the roles and contrast rules stay
identical across all five.

| Token | Hex | Role | Why |
|---|---|---|---|
| `--ink` | `#F1E7D7` | Text, headings | Warm paper-white, not pure white. ~14:1 on the page. |
| `--paper` | `#17120E` | Page background | Dark instrument wood, the color of a piano in a dim room. Not neutral black, so it stays warm. |
| `--paper-2` | `#221A14` | Raised surfaces (bars, buttons) | One step up from the page; enough to separate without borders everywhere. |
| `--oak` | `rgba(241,231,215,.22)` | Hairline rules, staff lines | The light-line counterpart of the wood body. |
| `--brass` | `#C08A3E` | Accent only | Aged brass fittings on a violin, brightened for dark ground. ~6:1 on the page. |
| `--wood` | `#0F0A07` | Paths/contact band, footer | The inside of a closed piano lid. The deepest surface, saved for the closing act. |

Reason for a brown-only palette: the request is a classic theme that matches
classical instruments, and wood/brass is what those instruments are made of. A
single hue family with one brass accent keeps it warm and specific. The dark
ground makes the warm paper of IranYekan read like light on a score.

The blog and admin keep that ground and add four sibling accents, each borrowed
from something already in the room: `--verdigris #7FA86B` (aged bow rosin),
`--copper #D05A3C` (wound string), `--steel #6F97B0` (tuning fork), `--velvet
#A2708F` (case lining). They are assigned per category and per post, so a reader
can tell topics apart at a glance, but brass stays the default and the only
accent on the four marketing routes. Every accent is mixed into the wood with
`color-mix` rather than used as a flat fill, so no chip or cover ever leaves the
palette.

## 5. Typography

Two faces, both supplied by the owner.

- **IranYekan** (Thin 100 to ExtraBlack 950): the working face. Headings, body,
  navigation, buttons. It is a modern, highly legible Persian sans, which is what
  a page read on a phone needs, and its cleanliness is the "modern" half of
  "modern classic".
- **Ghalam** (handwriting): the wordmark, the section eyebrows, and one short
  personal line. Handwriting is the human voice of a studio where a person teaches
  you, and using it only as an accent keeps the page readable. It never carries a
  paragraph.

Scale: hero clamp(2.4rem to 4.5rem), section title clamp(1.75rem to 2.6rem), body 1.0625rem with
1.9 line height (Persian needs the extra leading), small labels 0.8125rem.

## 6. Sections and why each one exists

1. **Header** - wordmark plus five routes with a brass active underline. Sticky,
   so the routes stay one tap away.
2. **Home / hero** - who we are and the one action (Telegram), over a full-bleed
   studio photograph (violin resting on a piano). A token-based scrim keeps the
   copy legible; the photo is the visual anchor.
3. **Home / استادها preview** - the ensemble: the founder on piano featured tall,
   the two violinists beside him. Portrait frames are the photo slots; until the
   real portraits arrive they hold a warm duotone panel with the instrument line
   art. A link leads to the full page.
4. **Home / سازها band** - piano and violin as two full-bleed panels with an
   oversized name. This is the home page's scale moment. "More coming" stays honest.
5. **Home / دو راه** - learn, or hire a musician. Two real paths, not a three-step
   template. Numbered ۰۱/۰۲.
6. **Home / تماس** - the Telegram action on the dark band.
7. **استادها page** - page hero with a monoline violin, profiles alternating
   sides, the class flow in three short steps, and the CTA band.
8. **سازها page** - page hero with keyboard line art, one detail row per
   instrument (alternating), the chooser quiz, the practice desk, and the CTA band.
9. **تماس page** - page hero with the metronome and equalizer, three steps to the
   first class, and an events note card.
10. **Footer** - name and year, same wood as the dark band so every route ends in ink.

Sections deliberately NOT included: testimonials, statistics, "trusted by",
pricing table, FAQ. There is no real data behind any of them yet, and a fabricated
one is worse than none.

**Mobile sticky CTA.** On phones the Telegram action stays pinned to the bottom
on every route. "Starting is easy" is the site's promise, so the action should
never be more than one tap away. Desktop keeps the in-flow CTAs.

## 7. Copy voice

Persian, plain, first person plural, warm but not gushing. Says what the studio
does and how to reach it. No buzzwords, no em dash, no invented numbers, names,
or reviews. Anything the owner has not supplied yet (brand name, teacher names,
teacher bios, Telegram handle) appears as an honest, visible placeholder.

## 8. Theme

Five Persian-named themes, all shipped and all verified to WCAG AA. The visitor
picks one from the navbar (the half-circle icon beside the sound toggle); the
choice persists in `localStorage` (`anima:theme`) and an inline `<head>` script
applies it before first paint, so there is no flash of the wrong theme. آبنوس is
the default.

| Theme | Meaning | Ground | Accent | Why it exists |
| --- | --- | --- | --- | --- |
| آبنوس (abnus) | ebony | warm dark wood `#17120e` | brass `#c08a3e` | The original room: a studio at night, warm text like light on a score. |
| لاجورد (lajvard) | lapis lazuli | deep blue `#101425` | gold `#d4a94e` | The lapis-and-gold pair of Persian illuminated manuscripts. |
| ارغوان (arghavan) | redbud blossom | plum dark `#1b101b` | blossom pink `#d678a0` | Spring blossom against dusk; a softer night for the romantic repertoire. |
| فیروزه (firuzeh) | turquoise | tile teal `#0c1b1b` | turquoise `#52c0b0` | The turquoise tile of Iranian craft; cool and calm for focused practice. |
| سحرگاه (sahargah) | dawn | morning paper `#f5ede0` | deep brass `#965222` | A light room for daytime reading; the same instruments lit by morning sun. |

Architecture: `:root` holds آبنوس; `html[data-theme="…"]` overrides the same token
set (`--paper`, `--ink`, `--brass`, the stage tones, the glows). Every surface and
text color reads from tokens, so a theme repaints the whole room without touching
layout. Derived tints use `color-mix` on the tokens, not hard-coded rgba, so they
follow the theme too.

**Repaint the room, not the instruments.** Depicted objects keep their real
material colors in every theme: ivory/ebony piano keys, the dark-wood violin
fingerboard and metronome case, the Telegram-preview bubble. These fills are
opaque (no paper bleeds through) and their text colors are scoped locally, so they
read correctly on both light and dark grounds.

Accessibility: every theme passes AA (4.5:1 body, 3:1 large text) on every public
and admin route, verified by computed-style contrast scans. Secondary text uses a
higher ink alpha on light grounds; accent-on-tint labels (callout titles, table
captions, band kickers) mix the tone with `--ink` so they stay legible in both
directions; selected/running copper controls use a deep-copper fill so light text
passes in every theme.

## 8a. Artwork and photography

The hero carries a real studio photograph (`public/hero.png`, served as WebP).
Everything else is hand-built inline SVG line art: a score on the blog, piano
keys and a violin in the photo slots, a metronome and an equalizer on the
contact page. It is original, local, and needs no licence.
When the studio photos arrive they replace the art in place, same frames, no
layout change:

- Teacher portraits: 4/5 or 3/4, warm duotone (ink shadows, brass highlights,
  reduced saturation). The treatment is what makes mixed phone photos read as one
  set on the dark ground.
- Home instrument bands: one large instrument detail per panel, same treatment,
  name set over the image. The light image should carry the panel, not the gradient.
- Page heroes: one instrument detail on the same duotone ground as the frames.

## 8b. Motion

- **Entry:** each route fades and rises 10px once. The home hero copy rises in a
  short stagger.
- **Scroll reveal:** `[data-reveal]` uses CSS scroll-driven animation
  (`animation-timeline: view()`). No JS and no hydration mutation; browsers
  without support show the content at rest.
- **Loops:** the metronome arm swings, the equalizer bars
  pulse. Small amplitude, slow, out of the reading path.
- **Feedback:** nav underline, button lift, portrait zoom, instrument art on hover.
- **Reduced motion:** every animation and transition is cut to 0.01ms under
  `prefers-reduced-motion: reduce`.

## 9. Placeholders (replace before launch)

- `[نام استاد]` - teacher names.
- `[یک خط دربارهی این استاد]` - teacher bios.
- Telegram handle - button currently points at `https://t.me/` with a visible
  "بهزودی" note.

- Photo slots - teacher portraits and instrument bands. Until the owner supplies
  photos they show a warm duotone panel, never a broken image or an empty box.
- Instrument artwork - inline SVG line art (score, staff, piano, violin,
  metronome, equalizer). It is a placeholder for photographs and can stay if the
  owner prefers it.

## 10. Non-goals

No booking/payment, no reader accounts or comments, no third-party analytics, no
fake social proof. The only account is the owner's admin login. Add the rest only
when there is real content to back them.

## 11. One-line reasons (R-31)

- Brown-only palette: it is what classical instruments are made of.
- Default dark ground (آبنوس): a music room at night, and the warm text reads like light on a score.
- Five themes from one token set: the visitor chooses their room, and each is a finished AA-verified theme, not a half-built toggle.
- Theme names from Persian materials and hours (ebony, lapis, redbud, turquoise, dawn): the palette carries the identity, so the names do too.
- Real-object colors stay fixed: the instruments keep their materials, so the room can change without the objects lying.
- Pre-paint theme script: the stored choice applies before first paint, so there is no flash of the wrong room.
- Depth by surface: three tones of wood give hierarchy without shadows.
- Warm duotone photos: mixed phone photos become one deliberate set.
- Sticky mobile CTA: the one action should be one tap away at all times.
- IranYekan for body: legible Persian sans for small phone screens.
- Ghalam as accent only: handwriting signals the human teacher, but hurts body readability.
- Staff motif: the product's own notation, so it is identity, not filler.
- Four public routes plus a blog: each has one job, and the home page still works as the overview.
- Motion: a few slow loops and one scroll reveal; alive, not a light show.
- Inline line art: honest, local, licence-free, and replaceable by real photos.
- Telegram as the only CTA: it is the channel the owner actually uses.
- TEACHER section before INSTRUMENTS: people are the reason to trust a small studio.
- Flat surfaces, no shadows: elevation is not needed on a wood-feeling page.
