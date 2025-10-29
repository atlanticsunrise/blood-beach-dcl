// vegetation-breeze.ts
// Gentle breeze animation for grasses, weeds, and ferns

import { engine, Transform, GltfContainer, Schemas } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

export type VegetationBreezeOptions = {
  maxEntities?: number
  minRotDeg?: number
  maxRotDeg?: number
  minPosAmp?: number
  maxPosAmp?: number
  minSpeed?: number
  maxSpeed?: number
  includeHints?: string[]
}

// Component to drive subtle breeze sway
const BreezeSway = engine.defineComponent('breeze-sway', {
  basePosition: Schemas.Vector3,
  baseRotation: Schemas.Quaternion,
  rotAmplitudeDeg: Schemas.Float,
  posAmplitude: Schemas.Float,
  speed: Schemas.Float,
  phase: Schemas.Float,
  axis: Schemas.Vector3,
  swayDirection: Schemas.Vector3
})

const defaultIncludeHints = [
  'beachgrass',
  'sand_weeds',
  'shoregrass',
  'beachgrass_fern',
  'fern',
  'weed',
  'grass',
  'jungleplant',
  'shrub',
  'bush',
  'java_fern'
]

type BreezeConfig = {
  maxEntities: number
  minRotDeg: number
  maxRotDeg: number
  minPosAmp: number
  maxPosAmp: number
  minSpeed: number
  maxSpeed: number
  includeHints: string[]
}

let config: BreezeConfig = {
  maxEntities: 180,
  minRotDeg: 2.8,
  maxRotDeg: 6.5,
  minPosAmp: 0.02,
  maxPosAmp: 0.08,
  minSpeed: 0.25,
  maxSpeed: 0.55,
  includeHints: defaultIncludeHints
}

let systemRegistered = false
let tGlobal = 0

export function setupVegetationBreeze(opts: VegetationBreezeOptions = {}) {
  config = {
    maxEntities: opts.maxEntities ?? config.maxEntities,
    minRotDeg: opts.minRotDeg ?? config.minRotDeg,
    maxRotDeg: opts.maxRotDeg ?? config.maxRotDeg,
    minPosAmp: opts.minPosAmp ?? config.minPosAmp,
    maxPosAmp: opts.maxPosAmp ?? config.maxPosAmp,
    minSpeed: opts.minSpeed ?? config.minSpeed,
    maxSpeed: opts.maxSpeed ?? config.maxSpeed,
    includeHints: (opts.includeHints ?? defaultIncludeHints).map(h => h.toLowerCase())
  }

  if (!systemRegistered) {
    engine.addSystem(breezeSystem)
    systemRegistered = true
  }

  populateBreezeTargets()
}

function populateBreezeTargets() {
  let currentCount = 0
  for (const [_entity] of engine.getEntitiesWith(BreezeSway)) {
    currentCount++
  }
  if (currentCount >= config.maxEntities) return

  for (const [e] of engine.getEntitiesWith(GltfContainer, Transform)) {
    if (BreezeSway.has(e)) continue
    if (currentCount >= config.maxEntities) break

    const src = GltfContainer.get(e).src
    if (!src) continue
    const srcLower = src.toLowerCase()
    if (!config.includeHints.some(h => srcLower.includes(h))) continue

    const tr = Transform.get(e)
    const basePos = Vector3.create(tr.position.x, tr.position.y, tr.position.z)
    const baseRot = tr.rotation

    // Randomized parameters per entity
    const rotAmp = lerp(config.minRotDeg, config.maxRotDeg, Math.random())
    const posAmp = lerp(config.minPosAmp, config.maxPosAmp, Math.random())
    const speed = lerp(config.minSpeed, config.maxSpeed, Math.random())
    const phase = Math.random() * Math.PI * 2
    const swayDirRaw = Vector3.create(Math.random() - 0.5, 0, Math.random() - 0.5)
    const swayDirLength = Math.hypot(swayDirRaw.x, swayDirRaw.y, swayDirRaw.z)
    const swayDirection =
      swayDirLength > 0.0001
        ? Vector3.scale(swayDirRaw, 1 / swayDirLength)
        : Vector3.create(0, 0, 1)
    // Axis chosen so the plant leans along swayDirection (side-to-side)
    let axis = Vector3.cross(Vector3.create(0, 1, 0), swayDirection)
    const axisLen = Math.hypot(axis.x, axis.y, axis.z)
    if (axisLen <= 0.0001) {
      axis = Vector3.create(1, 0, 0)
    } else {
      axis = Vector3.scale(axis, 1 / axisLen)
    }

    BreezeSway.create(e, {
      basePosition: basePos,
      baseRotation: baseRot,
      rotAmplitudeDeg: rotAmp,
      posAmplitude: posAmp,
      speed,
      phase,
      axis,
      swayDirection
    })

    currentCount++
  }
}

function breezeSystem(dt: number) {
  populateBreezeTargets()

  tGlobal += dt
  for (const [e] of engine.getEntitiesWith(BreezeSway, Transform)) {
    const d = BreezeSway.get(e)
    const tr = Transform.getMutable(e)

    // Time for this entity
    const t = tGlobal * d.speed + d.phase

    // Smooth sway factor [-1..1]
    const sway = Math.sin(t) * 0.8 + Math.sin(t * 0.37) * 0.2

    // Apply small rotation around axis
    const rotDeg = d.rotAmplitudeDeg * sway
    const swayRot = Quaternion.multiply(
      Quaternion.fromAngleAxis((rotDeg * Math.PI) / 180, d.axis),
      d.baseRotation
    )
    tr.rotation = swayRot

    // Side-to-side offset along swayDirection with a touch of vertical motion
    const swayOffset =
      (Math.sin(t) * 0.75 + Math.sin(t * 0.52 + 1.2) * 0.25) * d.posAmplitude
    const horizontal = Vector3.scale(d.swayDirection, swayOffset)
    const dy = Math.sin(t * 0.42 + 0.5) * d.posAmplitude * 0.12
    tr.position = Vector3.create(
      d.basePosition.x + horizontal.x,
      d.basePosition.y + dy,
      d.basePosition.z + horizontal.z
    )
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}


