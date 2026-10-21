import { CONFIG } from '../config/constants'

export interface GlyphAtlas {
  canvas: HTMLCanvasElement
  cellW: number
  cellH: number
}

/** Digits 0–9 rendered once, so each frame draws images instead of text. */
export function createGlyphAtlas(): GlyphAtlas {
  const px = CONFIG.glyph.atlasPx
  const cellW = Math.ceil(px * 0.66)
  const cellH = Math.ceil(px * 1.1)
  const canvas = document.createElement('canvas')
  canvas.width = cellW * 10
  canvas.height = cellH
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = CONFIG.visual.ink
  ctx.font = `400 ${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let d = 0; d < 10; d++) ctx.fillText(String(d), d * cellW + cellW / 2, cellH / 2)
  return { canvas, cellW, cellH }
}
