export interface Camera {
  x: number
  y: number
  scale: number
}

export function lerpCamera(current: Camera, target: Camera, ease: number): Camera {
  return {
    x: current.x + (target.x - current.x) * ease,
    y: current.y + (target.y - current.y) * ease,
    scale: current.scale + (target.scale - current.scale) * ease,
  }
}

export function cameraSettled(current: Camera, target: Camera): boolean {
  return (
    Math.abs(current.x - target.x) < 0.5 &&
    Math.abs(current.y - target.y) < 0.5 &&
    Math.abs(current.scale - target.scale) < 0.002
  )
}

export function worldToScreen(
  wx: number,
  wy: number,
  camera: Camera,
  width: number,
  height: number,
) {
  return {
    x: width / 2 + (wx - camera.x) * camera.scale,
    y: height / 2 + (wy - camera.y) * camera.scale,
  }
}

export function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
  width: number,
  height: number,
) {
  return {
    x: camera.x + (sx - width / 2) / camera.scale,
    y: camera.y + (sy - height / 2) / camera.scale,
  }
}
