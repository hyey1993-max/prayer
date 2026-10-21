# The Path · The Particular · The I That Emerges · Oscillation

Four experimental, browser-based interactive pieces in one app, switched
from the small tabs in the top-left corner. None of them is a game,
dashboard, or portfolio page.

- **The Path** — you move a single point through a graph you can only ever
  see one step of. Near the end, the view pulls back and shows the shape of
  where you've been.
- **The Particular** — a system classifies a population and tries, again and
  again, to predict one person. The model genuinely improves; the person
  genuinely keeps exceeding it.
- **The I That Emerges** — after Martin Buber's *I and Thou*. One object,
  met twice: first by measuring it, then without being able to. When it
  returns, the same object meets a different relation, and the I on screen
  (your cursor) takes its form from that relation.
- **Oscillation** — a self-running piece: one grid of digits deformed by six
  oscillating patterns (twist, tunnel, barrel, interference, flow, lines).
  It needs no input. Its own choreography moves each pattern's center, swells
  and settles the amplitude, drifts the frequency, sends ripples that flip
  bits, and morphs from one pattern to the next every few seconds.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Structure

- `src/App.tsx` — the tab shell. Only the active piece is mounted, so each
  piece's animation loop and timers stop when you switch away.
- `src/shared/` — camera math, seeded PRNG, and theme/motion hooks shared by
  the pieces.
- `src/experiences/the-path/` — graph generation, session state machine,
  canvas scene. Tunables in `params.ts`.
- `src/experiences/the-particular/` — k-means classification, prediction with
  an irreducible residual, experience state machine. Tunables in
  `config/constants.ts`.
- `src/experiences/the-i-that-emerges/` — the object's own life, measurement,
  presence, encounter, session memory and the returning relation. State
  machine `OBSERVE → CLASSIFY → WAIT → ENCOUNTER → RETURN`, then back to the
  first question. Tunables in `config/constants.ts`.
- `src/experiences/oscillation/` — the six pattern mappings
  (`core/patterns.ts`), the choreography that drives them (`core/director.ts`),
  and a pre-rendered digit atlas.
  Tunables in `config/constants.ts`.
