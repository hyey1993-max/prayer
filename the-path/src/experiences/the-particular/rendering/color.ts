export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha))
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${clamped})`)
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${clamped})`)
  }
  if (color.startsWith('#')) {
    const n = color.slice(1)
    const r = parseInt(n.slice(0, 2), 16)
    const g = parseInt(n.slice(2, 4), 16)
    const b = parseInt(n.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${clamped})`
  }
  return color
}
