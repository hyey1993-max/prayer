import { PARAMS } from '../params'

export interface Theme {
  bg: string
  line: string
  lineDim: string
  lineWarm: string
  nodeFill: string
  pointFill: string
  blockedMark: string
  textDim: string
}

export function resolveTheme(prefersDark: boolean): Theme {
  const v = PARAMS.visual
  return prefersDark
    ? {
        bg: v.bgDark,
        line: v.lineDark,
        lineDim: v.lineDimDark,
        lineWarm: v.lineWarmDark,
        nodeFill: v.nodeFillDark,
        pointFill: v.pointFillDark,
        blockedMark: v.blockedMark,
        textDim: v.textDimDark,
      }
    : {
        bg: v.bg,
        line: v.lineBase,
        lineDim: v.lineDim,
        lineWarm: v.lineWarm,
        nodeFill: v.nodeFill,
        pointFill: v.pointFill,
        blockedMark: v.blockedMark,
        textDim: v.textDim,
      }
}
