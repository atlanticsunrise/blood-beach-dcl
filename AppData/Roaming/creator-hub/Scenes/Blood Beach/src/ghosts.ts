import {
  engine,
  Transform,
  GltfContainer,
  Schemas,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

export type GhostHauntOptions = {
  // Match GLB src substrings to consider as ghosts
  matchSrc?: string[]
  // Movement tuning
  minRadius?: number
  maxRadius?: number
  minBob?: number
  maxBob?: number
  minSpeed?: number // radians per second
  maxSpeed?: number
}

// Component used to mark and animate ghosts
export const GhostHaunt = engine.defineComponent('ghost-haunt', {
  origin: Schemas.Vector3,
  radius: Schemas.Float,
  bob: Schemas.Float,
  speed: Schemas.Float,
  phase: Schemas.Float
})

let initialized = false
let globalTime = 0

export function setupGhostHaunting(opts: GhostHauntOptions = {}) {
  const matchSrc = opts.matchSrc ?? [
    'assets/asset-packs/ghost_01/',
    'assets/asset-packs/ghost_02/',
    'assets/asset-packs/ghost_03/'
  ]
  const minRadius = opts.minRadius ?? 2.2
  const maxRadius = opts.maxRadius ?? 5.0
  const minBob = opts.minBob ?? 0.35
  const maxBob = opts.maxBob ?? 0.9
  const minSpeed = opts.minSpeed ?? 0.05
  const maxSpeed = opts.maxSpeed ?? 0.12

  if (!initialized) {
    // Scan existing entities for ghosts and attach haunt component
    for (const [entity] of engine.getEntitiesWith(GltfContainer, Transform)) {
      const src = GltfContainer.get(entity).src
      if (!src) continue
      if (!matchSrc.some((m) => src.includes(m))) continue

      const t = Transform.get(entity)
      const radius = randRange(minRadius, maxRadius)
      const bob = randRange(minBob, maxBob)
      const speed = randRange(minSpeed, maxSpeed)
      const phase = Math.random() * Math.PI * 2

      GhostHaunt.create(entity, {
        origin: Vector3.create(t.position.x, t.position.y, t.position.z),
        radius,
        bob,
        speed,
        phase
      })
    }

    engine.addSystem(ghostHauntSystem)
    initialized = true
  }
}

function ghostHauntSystem(dt: number) {
  globalTime += dt
  for (const [entity] of engine.getEntitiesWith(GhostHaunt, Transform)) {
    const data = GhostHaunt.get(entity)
    const t = Transform.getMutable(entity)

    const theta = data.phase + data.speed * globalTime
    const x = data.origin.x + Math.cos(theta) * data.radius
    const z = data.origin.z + Math.sin(theta) * data.radius
    const y = data.origin.y + Math.sin(theta * 0.8) * data.bob

    t.position = Vector3.create(x, y, z)
  }
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}


