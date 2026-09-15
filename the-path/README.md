# The Path

An experimental, browser-based interactive piece — not a game, dashboard, or
portfolio page. You move a single point through a graph you can only ever
see one step of. Some edges that look efficient turn out to go nowhere.
Some edges that look like nothing open into everything. Near the end, the
view pulls back and shows the shape of where you've been.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. Click anywhere to begin, then click a
connected point to move toward it. Once the piece settles into its final
view, drag to pan and scroll to zoom.

## Structure

- `src/graph/` — graph types, a seeded PRNG, and `generate.ts`, which builds
  the entire graph once, up front. Nothing about its shape changes during
  play; only what has been *discovered* changes.
- `src/state/session.ts` — the interaction state machine (`entry` →
  `exploring` ⇄ `moving` ⇄ `blocked` → `reveal` → `retrospective`), plus
  discovery/visibility bookkeeping.
- `src/scene/` — the canvas renderer: camera easing, drawing, pointer
  interaction, and the final zoom-out.
- `src/params.ts` — every tunable constant (graph shape, timing, visuals) in
  one place.
